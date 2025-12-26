import { db } from '../../db.js'
import { suppliers } from './schema.js'
import { eq } from 'drizzle-orm'
import { emitPermitAuditLog } from '../../audit/permit-client.js'

export interface CreateSupplierInput {
  name: string
  email?: string
  phone?: string
  address?: string
}

export interface UpdateSupplierInput {
  name?: string
  email?: string
  phone?: string
  address?: string
}

export class SuppliersService {
  static async list() {
    return await db.select().from(suppliers)
  }

  static async getById(id: number) {
    const rows = await db.select().from(suppliers).where(eq(suppliers.id, id))
    if (rows.length === 0) throw new Error(`Proveedor con ID ${id} no encontrado`)
    return rows[0]!
  }

  static async create(data: CreateSupplierInput) {
    const result = await db.insert(suppliers).values({
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      updatedAt: new Date(),
    }).returning()

    await emitPermitAuditLog({
      userId: null,
      action: 'create',
      entityType: 'suppliers',
      entityId: result[0]!.id,
      changes: { after: result[0] },
      metadata: { source: 'procurement-backend' },
    })

    return result[0]!
  }

  static async update(id: number, data: UpdateSupplierInput) {
    const before = await this.getById(id)
    const updateData: any = { updatedAt: new Date() }
    if (data.name !== undefined) updateData.name = data.name
    if (data.email !== undefined) updateData.email = data.email
    if (data.phone !== undefined) updateData.phone = data.phone
    if (data.address !== undefined) updateData.address = data.address

    const result = await db.update(suppliers).set(updateData).where(eq(suppliers.id, id)).returning()

    await emitPermitAuditLog({
      userId: null,
      action: 'update',
      entityType: 'suppliers',
      entityId: id,
      changes: { before, after: result[0] },
      metadata: { source: 'procurement-backend' },
    })

    return result[0]!
  }

  static async remove(id: number) {
    const before = await this.getById(id)
    const result = await db.delete(suppliers).where(eq(suppliers.id, id)).returning()

    await emitPermitAuditLog({
      userId: null,
      action: 'delete',
      entityType: 'suppliers',
      entityId: id,
      changes: { before },
      metadata: { source: 'procurement-backend' },
    })

    return result[0]!
  }
}


