import { api } from './client'
import { getGateToken } from '$lib/utils/auth'
import type { ApiResponse } from '$lib/types/api'
import type { Transaction } from '$lib/types/domain'

// Inject Authorization manual untuk multipart — interceptor bisa ter-skip saat
// per-request headers di-override. Jangan set Content-Type untuk FormData,
// biarkan browser set boundary otomatis.
function authHeader(): Record<string, string> {
  const token = getGateToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function recordEntry(form: FormData): Promise<Transaction> {
  const res = await api.post<ApiResponse<Transaction>>('/api/v1/gate/transactions/entry', form, {
    headers: { ...authHeader() },
  })
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
  const res = await api.post<ApiResponse<Transaction>>(`/api/v1/gate/transactions/${id}/exit`, form, {
    headers: { ...authHeader() },
  })
  return res.data.data
}
