import { Elysia, t } from 'elysia'
import { ReceiptsService } from './service.js'

export const receiptsRouter = new Elysia({ prefix: '/receipts' })
  .get(
    '/',
    async ({ query }) => {
      const supplierId = (query as any)?.supplierId ? Number((query as any).supplierId) : undefined
      const purchaseOrderId = (query as any)?.purchaseOrderId ? Number((query as any).purchaseOrderId) : undefined
      return await ReceiptsService.list({ supplierId, purchaseOrderId })
    },
    {
      query: t.Object({
        supplierId: t.Optional(t.String()),
        purchaseOrderId: t.Optional(t.String()),
      }),
      detail: { tags: ['receipts'], summary: 'Listar receipts' },
    }
  )
  .get(
    '/:id',
    async ({ params }) => await ReceiptsService.getById(Number(params.id)),
    { params: t.Object({ id: t.Numeric() }), detail: { tags: ['receipts'], summary: 'Obtener receipt por ID' } }
  )
  .post(
    '/',
    async ({ body }) => await ReceiptsService.create(body),
    {
      body: t.Object({
        supplierId: t.Number(),
        purchaseOrderId: t.Optional(t.Number()),
        warehouseId: t.Number(),
        reference: t.Optional(t.String()),
        apInvoice: t.Optional(t.Object({
          invoiceNumber: t.Optional(t.String()),
          amount: t.Number(),
          currency: t.Optional(t.String()),
          dueDate: t.Optional(t.String()),
          notes: t.Optional(t.String()),
        })),
        items: t.Array(t.Object({
          externalProductId: t.Number(),
          skuSnapshot: t.Optional(t.String()),
          nameSnapshot: t.Optional(t.String()),
          quantityReceived: t.Number(),
        })),
      }),
      detail: { tags: ['receipts'], summary: 'Crear receipt (y ajustar stock en Inventory)' },
    }
  )


