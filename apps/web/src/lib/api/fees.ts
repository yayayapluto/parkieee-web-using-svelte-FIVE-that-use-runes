import { apiClient } from './client'
import type { ApiResponse, PaginatedResponse } from '$lib/types/api'
import type { FeeConfig, HolidayRate } from '$lib/types/domain'

export async function getFeeConfigs(params?: { zone_id?: string; vehicle_type_id?: string; active?: boolean }): Promise<PaginatedResponse<FeeConfig>> {
  const res = await apiClient.get('/api/v1/fees', { params })
  return res.data
}

export async function getFeeConfig(id: string): Promise<FeeConfig> {
  const res = await apiClient.get<ApiResponse<FeeConfig>>(`/api/v1/fees/${id}`)
  return res.data.data
}

export async function createFeeConfig(body: {
  zone_id: string
  vehicle_type_id: string
  base_fee?: number
  grace_period_minutes?: number
  effective_from: string
  effective_until?: string
  tiers?: { tier_order: number; duration_minutes: number; fee_amount: number; is_last_tier?: boolean }[]
}): Promise<FeeConfig> {
  const res = await apiClient.post<ApiResponse<FeeConfig>>('/api/v1/fees', body)
  return res.data.data
}

export async function deactivateFeeConfig(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/fees/${id}`)
}

export async function getHolidayRates(params?: { page?: number; page_size?: number }): Promise<PaginatedResponse<HolidayRate>> {
  const res = await apiClient.get('/api/v1/fees/holidays', { params })
  return res.data
}

export async function createHolidayRate(body: {
  name: string
  date_start: string
  date_end: string
  rate_type: 'multiplier' | 'override'
  multiplier?: number
  override_fee?: number
  applies_to_zone_id?: string
  applies_to_vehicle_type_id?: string
}): Promise<HolidayRate> {
  const res = await apiClient.post<ApiResponse<HolidayRate>>('/api/v1/fees/holidays', body)
  return res.data.data
}

export async function updateHolidayRate(id: string, body: Partial<{
  name: string
  date_start: string
  date_end: string
  rate_type: 'multiplier' | 'override'
  multiplier: number
  override_fee: number
  applies_to_zone_id: string
  applies_to_vehicle_type_id: string
}>): Promise<HolidayRate> {
  const res = await apiClient.put<ApiResponse<HolidayRate>>(`/api/v1/fees/holidays/${id}`, body)
  return res.data.data
}

export async function deleteHolidayRate(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/fees/holidays/${id}`)
}
