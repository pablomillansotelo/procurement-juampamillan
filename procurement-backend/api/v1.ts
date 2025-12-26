import { Elysia } from 'elysia'
import { apiKeysRouter } from '../src/api-keys/router.js'
import { suppliersRouter } from '../src/procurement/suppliers/router.js'
import { purchaseOrdersRouter } from '../src/procurement/purchase-orders/router.js'
import { receiptsRouter } from '../src/procurement/receipts/router.js'

/**
 * API v1 - Procurement (compras)
 */
export const v1Routes = new Elysia({ prefix: '/v1' })
  .use(apiKeysRouter)
  .use(suppliersRouter)
  .use(purchaseOrdersRouter)
  .use(receiptsRouter)


