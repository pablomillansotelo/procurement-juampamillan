/**
 * Integración best-effort con Inventory para registrar entradas a stock.
 */

import { emitPermitAuditLog } from '../audit/permit-client.js'

const INVENTORY_API_URL = process.env.INVENTORY_API_URL || 'http://localhost:8000'
const INVENTORY_API_KEY = process.env.INVENTORY_API_KEY || ''

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function postJsonWithTimeout(url: string, body: any, timeoutMs: number) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': INVENTORY_API_KEY,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }
}

export async function inventoryAdjustStock(input: {
  warehouseId: number
  externalProductId: number
  deltaOnHand: number
  deltaReserved?: number
  reason?: string
}): Promise<void> {
  try {
    if (!INVENTORY_API_KEY) {
      console.warn('⚠️ INVENTORY_API_KEY no configurada: saltando ajuste de stock')
      return
    }

    const url = `${INVENTORY_API_URL}/v1/stock-levels/adjust`
    let lastErr: any = null

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const res = await postJsonWithTimeout(url, input, 3000)
        if (res.ok) return

        const data = await res.json().catch(() => ({}))
        lastErr = { status: res.status, data }
        console.warn('⚠️ Falló ajuste de stock en Inventory:', res.status, data?.message || data)
      } catch (err) {
        lastErr = err
        console.warn(`⚠️ Error llamando Inventory attempt ${attempt}:`, err)
      }

      if (attempt < 2) {
        await sleep(250)
      }
    }

    await emitPermitAuditLog({
      userId: null,
      action: 'integration_failed',
      entityType: 'integrations',
      entityId: null,
      changes: {
        after: {
          source: 'procurement-backend',
          target: 'inventory-backend',
          endpoint: '/v1/stock-levels/adjust',
          method: 'POST',
          reason: input.reason,
          warehouseId: input.warehouseId,
          externalProductId: input.externalProductId,
        },
      },
      metadata: { error: lastErr },
    })
  } catch (err) {
    console.warn('⚠️ Error llamando Inventory:', err)
  }
}


