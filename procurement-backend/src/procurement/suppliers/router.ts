import { Elysia, t } from 'elysia'
import { SuppliersService } from './service.js'

export const suppliersRouter = new Elysia({ prefix: '/suppliers' })
  .get('/', async () => await SuppliersService.list(), {
    detail: { tags: ['suppliers'], summary: 'Listar proveedores' },
  })
  .get(
    '/:id',
    async ({ params }) => await SuppliersService.getById(Number(params.id)),
    { params: t.Object({ id: t.Numeric() }), detail: { tags: ['suppliers'], summary: 'Obtener proveedor por ID' } }
  )
  .post(
    '/',
    async ({ body }) => await SuppliersService.create(body),
    {
      body: t.Object({
        name: t.String(),
        email: t.Optional(t.String()),
        phone: t.Optional(t.String()),
        address: t.Optional(t.String()),
      }),
      detail: { tags: ['suppliers'], summary: 'Crear proveedor' },
    }
  )
  .put(
    '/:id',
    async ({ params, body }) => await SuppliersService.update(Number(params.id), body),
    {
      params: t.Object({ id: t.Numeric() }),
      body: t.Object({
        name: t.Optional(t.String()),
        email: t.Optional(t.String()),
        phone: t.Optional(t.String()),
        address: t.Optional(t.String()),
      }),
      detail: { tags: ['suppliers'], summary: 'Actualizar proveedor' },
    }
  )
  .delete(
    '/:id',
    async ({ params }) => ({ message: 'Eliminado', supplier: await SuppliersService.remove(Number(params.id)) }),
    { params: t.Object({ id: t.Numeric() }), detail: { tags: ['suppliers'], summary: 'Eliminar proveedor' } }
  )


