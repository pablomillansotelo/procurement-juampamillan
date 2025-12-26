/**
 * Integración best-effort con Finance (AP).
 * - Nunca rompe el flujo principal.
 * - Timeout + 1 retry (backoff).
 * - Idempotencia se logra con `externalRef` del lado de Finance.
 * - En falla final, registra `integration_failed` en Permit (audit logs).
 */

import { emitPermitAuditLog } from '../audit/permit-client.js'

const FINANCE_API_URL = process.env.FINANCE_API_URL || 'http://localhost:8000'
const FINANCE_API_KEY = process.env.FINANCE_API_KEY || ''

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
        'X-API-Key': FINANCE_API_KEY,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }
}

export async function financeCreateApInvoice(input: {
  externalRef: string
  supplierId: number
  procurementReceiptId?: number
  invoiceNumber?: string
  currency?: string
  amount: number
  dueDate?: string
  notes?: string
}): Promise<void> {
  try {
    if (!FINANCE_API_KEY) {
      console.warn('⚠️ FINANCE_API_KEY no configurada: saltando AP invoice')
      return
    }

    const url = `${FINANCE_API_URL}/v1/ap/invoices`
    const payload = {
      externalRef: input.externalRef,
      supplierId: input.supplierId,
      procurementReceiptId: input.procurementReceiptId,
      invoiceNumber: input.invoiceNumber,
      currency: input.currency || 'MXN',
      amount: input.amount,
      dueDate: input.dueDate,
      notes: input.notes,
    }

    let lastErr: any = null

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const res = await postJsonWithTimeout(url, payload, 3000)
        if (res.ok) return

        const data = await res.json().catch(() => ({}))
        lastErr = { status: res.status, data }
        console.warn('⚠️ Finance AP invoice falló:', res.status, data?.message || data)
      } catch (err) {
        lastErr = err
        console.warn(`⚠️ Error llamando Finance (AP) attempt ${attempt}:`, err)
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
          target: 'finance-backend',
          endpoint: '/v1/ap/invoices',
          method: 'POST',
          externalRef: input.externalRef,
          procurementReceiptId: input.procurementReceiptId,
          supplierId: input.supplierId,
        },
      },
      metadata: { error: lastErr },
    })
  } catch (err) {
    console.warn('⚠️ Error en financeCreateApInvoice (wrapper):', err)
  }
}


