import { api } from './client'
import { getGateToken } from '$lib/utils/auth'
import type { ApiResponse } from '$lib/types/api'
import type { Payment } from '$lib/types/domain'

export async function initiateQRIS(txId: string): Promise<Payment> {
  const res = await api.post<ApiResponse<Payment>>(`/api/v1/gate/payments/qris`, { transaction_id: txId })
  return res.data.data
}

export async function payCash(txId: string, cashTendered: number): Promise<Payment> {
  const res = await api.post<ApiResponse<Payment>>(`/api/v1/gate/payments/cash`, {
    transaction_id: txId,
    cash_tendered: cashTendered,
  })
  return res.data.data
}

export async function getPaymentsByTransaction(txId: string): Promise<Payment[]> {
  const res = await api.get<ApiResponse<Payment[]>>(`/api/v1/gate/payments/transaction/${txId}`)
  return res.data.data
}

export async function getPayment(paymentId: string): Promise<Payment> {
  const res = await api.get<ApiResponse<Payment>>(`/api/v1/gate/payments/${paymentId}`)
  return res.data.data
}

// Poll ke Midtrans langsung — update DB kalau sudah paid. Pakai ini di kiosk.
export async function pollPaymentStatus(paymentId: string): Promise<Payment> {
  const res = await api.get<ApiResponse<Payment>>(`/api/v1/gate/payments/${paymentId}/poll`)
  return res.data.data
}

export interface CashierNotifyPayload {
  type: 'cash' | 'qris_fail'
  transaction_id: string
  amount: number
  gate_name: string
  zone_name: string
}

export async function notifyCashier(payload: CashierNotifyPayload): Promise<void> {
  await api.post('/api/v1/gate/payments/cashier/notify', payload)
}

export function listenKioskSSE(
  baseURL: string,
  txId: string,
  onDone: () => void,
  onCancel: () => void,
): EventSource {
  const token = getGateToken() ?? ''
  const es = new EventSource(
    `${baseURL}/api/v1/gate/payments/cashier/listen/${txId}?token=${encodeURIComponent(token)}`
  )
  es.addEventListener('cashier_done', (e) => {
    try {
      const data = JSON.parse((e as MessageEvent).data)
      if (data.type === 'done') onDone()
      else if (data.type === 'cancel') onCancel()
    } catch { /* skip */ }
  })
  return es
}

// simulatePay — sandbox only, trigger Midtrans simulator untuk bayar QRIS
export async function simulatePay(paymentId: string): Promise<void> {
  await api.post(`/api/v1/gate/payments/${paymentId}/sim-pay`)
}

// Polling fallback — dipakai saat SSE tidak reliable (proxy/nginx timeout)
export function pollKioskCashier(
  txId: string,
  onDone: () => void,
  onCancel: () => void,
): ReturnType<typeof setInterval> {
  const timer = setInterval(async () => {
    try {
      const payments = await getPaymentsByTransaction(txId)
      const latest = payments[payments.length - 1]
      if (!latest) return
      if (latest.status === 'paid' || latest.status === 'completed') {
        clearInterval(timer)
        onDone()
      } else if (latest.status === 'failed' || latest.status === 'cancelled') {
        clearInterval(timer)
        onCancel()
      }
    } catch { /* skip */ }
  }, 2000)
  return timer
}
