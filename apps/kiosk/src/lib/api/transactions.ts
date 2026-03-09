import { api } from './client'
import type { ApiResponse } from '$lib/types/api'
import type { Transaction } from '$lib/types/domain'

// Content-Type tidak di-set manual untuk FormData — biarkan browser set boundary otomatis.
// Authorization header sudah di-inject oleh interceptor di client.ts.

export async function recordEntry(form: FormData): Promise<Transaction> {
  const res = await api.post<ApiResponse<Transaction>>('/api/v1/gate/transactions/entry', form)
  return res.data.data
}

export async function getTransactionByCode(code: string): Promise<Transaction> {
  const res = await api.get<ApiResponse<Transaction>>(`/api/v1/gate/transactions/code/${code}`)
  return res.data.data
}

export async function getTransaction(id: string): Promise<Transaction> {
  const res = await api.get<ApiResponse<Transaction>>(`/api/v1/gate/transactions/${id}`)
  return res.data.data
}

export async function getTransactionByRFID(uid: string): Promise<Transaction> {
  const res = await api.get<ApiResponse<Transaction>>(`/api/v1/gate/transactions/rfid/${uid}`)
  return res.data.data
}

export async function recordExit(id: string, form: FormData): Promise<Transaction> {
  const res = await api.post<ApiResponse<Transaction>>(`/api/v1/gate/transactions/${id}/exit`, form)
  return res.data.data
}
