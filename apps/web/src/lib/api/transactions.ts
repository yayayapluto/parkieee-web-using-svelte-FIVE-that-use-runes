import { apiClient } from './client'
import type { ApiResponse, PaginatedResponse } from '$lib/types/api'
import type { Transaction, TransactionLog, TransactionStatus, EntryMethod } from '$lib/types/domain'

export interface TransactionFilter {
  status?: TransactionStatus
  zone_id?: string
  entry_gate_id?: string
  entry_method?: EntryMethod
  date_from?: string
  date_to?: string
  page?: number
  page_size?: number
}

export async function getTransactions(params?: TransactionFilter): Promise<PaginatedResponse<Transaction>> {
  const res = await apiClient.get('/api/v1/transactions', { params })
  return res.data
}

export async function getTransaction(id: string): Promise<Transaction> {
  const res = await apiClient.get<ApiResponse<Transaction>>(`/api/v1/transactions/${id}`)
  return res.data.data
}

export async function getTransactionByCode(code: string): Promise<Transaction> {
  const res = await apiClient.get<ApiResponse<Transaction>>(`/api/v1/transactions/code/${code}`)
  return res.data.data
}


export async function getTransactionLogs(id: string): Promise<TransactionLog[]> {
  const res = await apiClient.get<ApiResponse<TransactionLog[]>>(`/api/v1/transactions/${id}/logs`)
  return res.data.data
}

export async function recordEntry(formData: FormData): Promise<Transaction> {
  const res = await apiClient.post<ApiResponse<Transaction>>('/api/v1/transactions/entry', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data.data
}

export async function recordExit(id: string, formData: FormData): Promise<Transaction> {
  const res = await apiClient.post<ApiResponse<Transaction>>(`/api/v1/transactions/${id}/exit`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data.data
}

export async function cancelTransaction(id: string, reason: string): Promise<Transaction> {
  const res = await apiClient.post<ApiResponse<Transaction>>(`/api/v1/transactions/${id}/cancel`, { reason })
  return res.data.data
}
