import { Elysia } from 'elysia'
import { swagger } from '@elysiajs/swagger'
import { neon } from '@neondatabase/serverless'
import { checkRateLimit, getRateLimitHeaders } from '../src/middleware/rate-limit.js'
import { getCorsHeaders, getSecurityHeaders } from '../src/middleware/cors.js'
import { ApiKeysService } from '../src/api-keys/service.js'
import { v1Routes } from './v1.js'

const neonClient = neon(process.env.DATABASE_URL!)
const API_KEY = process.env.API_KEY || ''

const app = new Elysia()
  .onBeforeHandle(async ({ request, path, set }) => {
    const origin = request.headers.get('origin')

    const corsHeaders = getCorsHeaders(origin)
    Object.entries(corsHeaders).forEach(([key, value]) => {
      set.headers[key] = value
    })

    const isSwaggerPath = path.startsWith('/swagger') || path === '/swagger'
    const securityHeaders = getSecurityHeaders(isSwaggerPath)
    Object.entries(securityHeaders).forEach(([key, value]) => {
      set.headers[key] = value
    })

    if (request.method === 'OPTIONS') {
      set.status = 204
      return ''
    }

    const publicPaths = ['/', '/swagger', '/db']
    const isPublicPath = publicPaths.includes(path) || path.startsWith('/swagger') || path.startsWith('/api-keys')

    if (!isPublicPath) {
      const apiKeyHeader = request.headers.get('x-api-key')
      if (!apiKeyHeader) {
        set.status = 401
        return { error: 'No autorizado', message: 'API Key faltante. Incluye el header X-API-Key' }
      }

      const validation = await ApiKeysService.validateApiKey(apiKeyHeader)
      if (validation.valid && validation.apiKey) {
        const rateLimit = validation.apiKey.rateLimit || 100
        const rateLimitCheck = checkRateLimit(validation.apiKey.id, rateLimit)
        const rateLimitHeaders = getRateLimitHeaders(validation.apiKey.id, rateLimit)
        Object.entries(rateLimitHeaders).forEach(([key, value]) => {
          set.headers[key] = value
        })
        if (!rateLimitCheck.allowed) {
          set.status = 429
          return {
            error: 'Rate limit excedido',
            message: `Has excedido el límite de ${rateLimit} requests por minuto`,
            retryAfter: Math.ceil((rateLimitCheck.resetAt - Date.now()) / 1000),
          }
        }
        ;(set as any).apiKey = validation.apiKey
      } else if (apiKeyHeader === API_KEY && API_KEY) {
        // legacy
      } else {
        set.status = 401
        return { error: 'No autorizado', message: validation.error || 'API Key inválida' }
      }
    }

  })

app
  .get('/', () => ({
    message: 'Procurement Backend API',
    version: '1.0.0',
    endpoints: { v1: '/v1', docs: '/swagger' },
    note: 'Todas las rutas de la API están bajo el prefijo /v1',
  }))
  .get('/db', async () => {
    const result = await neonClient`SELECT NOW()`
    return { message: 'Conectado a Neon vía HTTP con Elysia.js', fecha: result![0]!.now }
  })
  .use(v1Routes)
  .use(
    swagger({
      documentation: {
        info: {
          title: 'Procurement Backend API',
          description: 'API para compras: suppliers, purchase orders y receipts (integra con Inventory)',
          version: '1.0.0',
        },
        tags: [
          { name: 'api-keys', description: 'Gestión de API keys' },
          { name: 'suppliers', description: 'Proveedores' },
          { name: 'purchase-orders', description: 'Órdenes de compra' },
          { name: 'receipts', description: 'Recepciones (entradas a stock)' },
        ],
        servers: [{ url: 'http://localhost:8000', description: 'Servidor de desarrollo' }],
      },
    })
  )
  .compile()

export default app


