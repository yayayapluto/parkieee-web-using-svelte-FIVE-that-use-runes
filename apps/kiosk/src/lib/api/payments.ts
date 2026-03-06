import { api } from './client'
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
