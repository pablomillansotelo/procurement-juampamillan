import { db } from '../../db.js'
import { purchaseOrders, purchaseOrderItems } from './schema.js'
import { suppliers } from '../suppliers/schema.js'
import { and, eq } from 'drizzle-orm'
import { emitPermitAuditLog } from '../../audit/permit-client.js'

export type PurchaseOrderStatus = 'draft' | 'approved' | 'sent' | 'received' | 'closed' | 'cancelled'

export interface CreatePurchaseOrderInput {
  supplierId: number
  warehouseId: number
  currency?: string
  notes?: string
  items: Array<{
    externalProductId: number
    skuSnapshot?: string
    nameSnapshot?: string
    quantity: number
    unitCost: number
  }>
}

export interface UpdatePurchaseOrderInput {
  supplierId?: number
  status?: PurchaseOrderStatus
  warehouseId?: number
  currency?: string
  notes?: string
}

function computeTotals(items: CreatePurchaseOrderInput['items']) {
  const normalized = items.map((i) => {
    const lineTotal = i.quantity * i.unitCost
    return { ...i, lineTotal }
  })
  const total = normalized.reduce((acc, i) => acc + i.lineTotal, 0)
  return { normalized, total }
}

export class PurchaseOrdersService {
  static async list() {
    const rows = await db.select({
      id: purchaseOrders.id,
      supplierId: purchaseOrders.supplierId,
      supplierName: suppliers.name,
      status: purchaseOrders.status,
      warehouseId: purchaseOrders.warehouseId,
      currency: purchaseOrders.currency,
      total: purchaseOrders.total,
      createdAt: purchaseOrders.createdAt,
      updatedAt: purchaseOrders.updatedAt,
    }).from(purchaseOrders).leftJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))

    return rows.map((r) => ({ ...r, total: Number(r.total) }))
  }

  static async getById(id: number) {
    const rows = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id))
    if (rows.length === 0) throw new Error(`PO con ID ${id} no encontrada`)
    const items = await db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, id))
    return { ...rows[0]!, total: Number(rows[0]!.total), items: items.map((i) => ({ ...i, unitCost: Number(i.unitCost), lineTotal: Number(i.lineTotal) })) }
  }

  static async create(data: CreatePurchaseOrderInput) {
    // validar supplier existe
    const sup = await db.select().from(suppliers).where(eq(suppliers.id, data.supplierId))
    if (sup.length === 0) throw new Error(`Proveedor con ID ${data.supplierId} no encontrado`)

    const { normalized, total } = computeTotals(data.items)

    const header = await db.insert(purchaseOrders).values({
      supplierId: data.supplierId,
      status: 'draft',
      warehouseId: data.warehouseId,
      currency: data.currency || 'MXN',
      total: total.toString(),
      notes: data.notes,
      updatedAt: new Date(),
    }).returning()

    const poId = header[0]!.id
    await db.insert(purchaseOrderItems).values(
      normalized.map((i) => ({
        purchaseOrderId: poId,
        externalProductId: i.externalProductId,
        skuSnapshot: i.skuSnapshot,
        nameSnapshot: i.nameSnapshot,
        quantity: i.quantity,
        unitCost: i.unitCost.toString(),
        lineTotal: i.lineTotal.toString(),
      }))
    )

    await emitPermitAuditLog({
      userId: null,
      action: 'create',
      entityType: 'purchase_orders',
      entityId: poId,
      changes: { after: { ...header[0], items: normalized, total } },
      metadata: { source: 'procurement-backend' },
    })

    return await this.getById(poId)
  }

  static async update(id: number, data: UpdatePurchaseOrderInput) {
    const before = await this.getById(id)
    const updateData: any = { updatedAt: new Date() }
    if (data.supplierId !== undefined) updateData.supplierId = data.supplierId
    if (data.status !== undefined) updateData.status = data.status
    if (data.warehouseId !== undefined) updateData.warehouseId = data.warehouseId
    if (data.currency !== undefined) updateData.currency = data.currency
    if (data.notes !== undefined) updateData.notes = data.notes

    const result = await db.update(purchaseOrders).set(updateData).where(eq(purchaseOrders.id, id)).returning()
    if (result.length === 0) throw new Error('PO no encontrada')

    await emitPermitAuditLog({
      userId: null,
      action: 'update',
      entityType: 'purchase_orders',
      entityId: id,
      changes: { before, after: result[0] },
      metadata: { source: 'procurement-backend' },
    })

    return await this.getById(id)
  }

  static async remove(id: number) {
    const before = await this.getById(id)
    const result = await db.delete(purchaseOrders).where(eq(purchaseOrders.id, id)).returning()
    await emitPermitAuditLog({
      userId: null,
      action: 'delete',
      entityType: 'purchase_orders',
      entityId: id,
      changes: { before },
      metadata: { source: 'procurement-backend' },
    })
    return result[0]!
  }

  static async setStatus(id: number, toStatus: PurchaseOrderStatus, reason?: string) {
    const before = await this.getById(id)
    await db.update(purchaseOrders).set({ status: toStatus as any, updatedAt: new Date() }).where(eq(purchaseOrders.id, id))
    await emitPermitAuditLog({
      userId: null,
      action: 'status_change',
      entityType: 'purchase_orders',
      entityId: id,
      changes: { before: { status: before.status }, after: { status: toStatus } },
      metadata: { source: 'procurement-backend', reason },
    })
    return await this.getById(id)
  }
}


