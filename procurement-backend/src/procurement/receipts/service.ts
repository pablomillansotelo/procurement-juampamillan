import { db } from '../../db.js'
import { receipts, receiptItems } from './schema.js'
import { suppliers } from '../suppliers/schema.js'
import { purchaseOrders } from '../purchase-orders/schema.js'
import { eq } from 'drizzle-orm'
import { emitPermitAuditLog } from '../../audit/permit-client.js'
import { inventoryAdjustStock } from '../../integrations/inventory-client.js'
import { financeCreateApInvoice } from '../../integrations/finance-client.js'
import { financeCreateApInvoice, financeCreateApPaymentSchedule } from '../../integrations/finance-client.js'

export interface CreateReceiptInput {
  supplierId: number
  purchaseOrderId?: number
  warehouseId: number
  reference?: string
  apInvoice?: {
    invoiceNumber?: string
    amount: number
    currency?: string
    dueDate?: string
    notes?: string
  }
  items: Array<{
    externalProductId: number
    skuSnapshot?: string
    nameSnapshot?: string
    quantityReceived: number
  }>
}

export class ReceiptsService {
  static async list(filters?: { supplierId?: number; purchaseOrderId?: number }) {
    if (filters?.supplierId) {
      return await db.select().from(receipts).where(eq(receipts.supplierId, filters.supplierId))
    }
    if (filters?.purchaseOrderId) {
      return await db.select().from(receipts).where(eq(receipts.purchaseOrderId, filters.purchaseOrderId))
    }
    return await db.select().from(receipts)
  }

  static async getById(id: number) {
    const rows = await db.select().from(receipts).where(eq(receipts.id, id))
    if (rows.length === 0) throw new Error(`Receipt con ID ${id} no encontrado`)
    const items = await db.select().from(receiptItems).where(eq(receiptItems.receiptId, id))
    return { ...rows[0]!, items }
  }

  static async create(data: CreateReceiptInput) {
    // validar supplier existe
    const sup = await db.select().from(suppliers).where(eq(suppliers.id, data.supplierId))
    if (sup.length === 0) throw new Error(`Proveedor con ID ${data.supplierId} no encontrado`)

    if (data.purchaseOrderId) {
      const po = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, data.purchaseOrderId))
      if (po.length === 0) throw new Error(`PO con ID ${data.purchaseOrderId} no encontrada`)
    }

    const header = await db.insert(receipts).values({
      supplierId: data.supplierId,
      purchaseOrderId: data.purchaseOrderId,
      warehouseId: data.warehouseId,
      reference: data.reference,
      receivedAt: new Date(),
    }).returning()

    const receiptId = header[0]!.id
    await db.insert(receiptItems).values(
      data.items.map((i) => ({
        receiptId,
        externalProductId: i.externalProductId,
        skuSnapshot: i.skuSnapshot,
        nameSnapshot: i.nameSnapshot,
        quantityReceived: i.quantityReceived,
      }))
    )

    // Integración best-effort: sumar onHand en Inventory
    for (const i of data.items) {
      await inventoryAdjustStock({
        warehouseId: data.warehouseId,
        externalProductId: i.externalProductId,
        deltaOnHand: i.quantityReceived,
        reason: `receipt:${receiptId}`,
      })
    }

    // Integración best-effort: crear AP invoice en Finance (idempotente)
    // MVP: solo si existe purchaseOrderId (para obtener total/currency).
    if (data.purchaseOrderId) {
      const poRows = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, data.purchaseOrderId))
      const po = poRows[0]
      if (po) {
        await financeCreateApInvoice({
          externalRef: `procurement:receipts:${receiptId}`,
          supplierId: data.supplierId,
          procurementReceiptId: receiptId,
          currency: po.currency,
          amount: Number(po.total),
          notes: `Auto desde receipt ${receiptId} (PO ${data.purchaseOrderId})`,
        })
      } else {
        console.warn(`⚠️ No se encontró PO ${data.purchaseOrderId}; saltando creación de AP invoice`)
      }
    }

    // Integración best-effort: crear AP invoice en Finance (si viene)
    if (data.apInvoice) {
      const createdInvoice = await financeCreateApInvoice({
        supplierId: data.supplierId,
        procurementReceiptId: receiptId,
        invoiceNumber: data.apInvoice.invoiceNumber,
        currency: data.apInvoice.currency || 'MXN',
        amount: data.apInvoice.amount,
        dueDate: data.apInvoice.dueDate,
        notes: data.apInvoice.notes,
      })

      if (createdInvoice && data.apInvoice.dueDate) {
        await financeCreateApPaymentSchedule({
          invoiceId: createdInvoice.id,
          dueDate: data.apInvoice.dueDate,
          amount: data.apInvoice.amount,
        })
      }
    }

    await emitPermitAuditLog({
      userId: null,
      action: 'create',
      entityType: 'receipts',
      entityId: receiptId,
      changes: { after: { ...header[0], items: data.items } },
      metadata: { source: 'procurement-backend' },
    })

    return await this.getById(receiptId)
  }
}


