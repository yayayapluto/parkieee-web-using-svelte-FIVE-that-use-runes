import { apiClient } from './client'
import type { ApiResponse, PaginatedResponse } from '$lib/types/api'
import type { AuditLog } from '$lib/types/domain'

export async function getAuditLogs(params?: {
  actor_id?: string
  target_type?: string
  event_type?: string
  date_from?: string
  date_to?: string
  page?: number
  page_size?: number
}): Promise<PaginatedResponse<AuditLog>> {
  const res = await apiClient.get('/api/v1/audit', { params })
  return res.data
}
