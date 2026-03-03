import { apiClient } from './client'
import type { ApiResponse, PaginatedResponse } from '$lib/types/api'
import type { OperatorOverride, OverrideType } from '$lib/types/domain'

export async function getOverrides(params?: { transaction_id?: string; page?: number; page_size?: number }): Promise<PaginatedResponse<OperatorOverride>> {
  const res = await apiClient.get('/api/v1/overrides', { params })
  return res.data
}

export async function createOverride(body: {
  transaction_id: string
  override_type: OverrideType
  reason: string
  original_fee?: number
  adjusted_fee?: number
  approved_by: string
}): Promise<OperatorOverride> {
  const res = await apiClient.post<ApiResponse<OperatorOverride>>('/api/v1/overrides', body)
  return res.data.data
}
