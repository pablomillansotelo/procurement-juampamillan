import { Elysia, t } from 'elysia'
import { PurchaseOrdersService } from './service.js'

export const purchaseOrdersRouter = new Elysia({ prefix: '/purchase-orders' })
  .get('/', async () => await PurchaseOrdersService.list(), {
    detail: { tags: ['purchase-orders'], summary: 'Listar purchase orders' },
  })
  .get(
    '/:id',
    async ({ params }) => await PurchaseOrdersService.getById(Number(params.id)),
    { params: t.Object({ id: t.Numeric() }), detail: { tags: ['purchase-orders'], summary: 'Obtener PO por ID' } }
  )
  .post(
    '/',
    async ({ body }) => await PurchaseOrdersService.create(body),
    {
      body: t.Object({
        supplierId: t.Number(),
        warehouseId: t.Number(),
        currency: t.Optional(t.String()),
        notes: t.Optional(t.String()),
        items: t.Array(t.Object({
          externalProductId: t.Number(),
          skuSnapshot: t.Optional(t.String()),
          nameSnapshot: t.Optional(t.String()),
          quantity: t.Number(),
          unitCost: t.Number(),
        })),
      }),
      detail: { tags: ['purchase-orders'], summary: 'Crear PO' },
    }
  )
  .put(
    '/:id',
    async ({ params, body }) => await PurchaseOrdersService.update(Number(params.id), body),
    {
      params: t.Object({ id: t.Numeric() }),
      body: t.Object({
        supplierId: t.Optional(t.Number()),
        status: t.Optional(t.Union([
          t.Literal('draft'),
          t.Literal('approved'),
          t.Literal('sent'),
          t.Literal('received'),
          t.Literal('closed'),
          t.Literal('cancelled'),
        ])),
        warehouseId: t.Optional(t.Number()),
        currency: t.Optional(t.String()),
        notes: t.Optional(t.String()),
      }),
      detail: { tags: ['purchase-orders'], summary: 'Actualizar PO' },
    }
  )
  .put(
    '/:id/status',
    async ({ params, body }) => await PurchaseOrdersService.setStatus(Number(params.id), body.toStatus, body.reason),
    {
      params: t.Object({ id: t.Numeric() }),
      body: t.Object({
        toStatus: t.Union([
          t.Literal('draft'),
          t.Literal('approved'),
          t.Literal('sent'),
          t.Literal('received'),
          t.Literal('closed'),
          t.Literal('cancelled'),
        ]),
        reason: t.Optional(t.String()),
      }),
      detail: { tags: ['purchase-orders'], summary: 'Cambiar status de PO' },
    }
  )
  .delete(
    '/:id',
    async ({ params }) => ({ message: 'Eliminado', purchaseOrder: await PurchaseOrdersService.remove(Number(params.id)) }),
    { params: t.Object({ id: t.Numeric() }), detail: { tags: ['purchase-orders'], summary: 'Eliminar PO' } }
  )


