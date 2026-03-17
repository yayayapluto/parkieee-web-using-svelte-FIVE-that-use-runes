import { apiClient } from './client'
import type { ApiResponse } from '$lib/types/api'
import type { Payment, Refund } from '$lib/types/domain'

export async function payCash(transaction_id: string, cash_tendered: number): Promise<Payment> {
  const res = await apiClient.post<ApiResponse<Payment>>('/api/v1/payments/cash', { transaction_id, cash_tendered })
  return res.data.data
}

export async function initiateQRIS(transaction_id: string): Promise<Payment> {
  const res = await apiClient.post<ApiResponse<Payment>>('/api/v1/payments/qris', { transaction_id })
  return res.data.data
}

export async function getPaymentsByTransaction(txId: string): Promise<Payment[]> {
  const res = await apiClient.get<ApiResponse<Payment[]>>(`/api/v1/payments/transaction/${txId}`)
  return res.data.data
}

export async function getPayment(id: string): Promise<Payment> {
  const res = await apiClient.get<ApiResponse<Payment>>(`/api/v1/payments/${id}`)
  return res.data.data
}

// simulatePay — sandbox only, kasir trigger Midtrans simulator
export async function simulateQRIS(qrisImageURL: string): Promise<void> {
  await apiClient.post('/api/v1/payments/sim-pay', { qris_image_url: qrisImageURL })
}

export async function requestRefund(body: {
  payment_id: string
  refund_amount: number
  reason: string
}): Promise<Refund> {
  const res = await apiClient.post<ApiResponse<Refund>>('/api/v1/payments/refunds', body)
  return res.data.data
}
