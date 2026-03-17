import { apiClient } from './client'
import type { ApiResponse, PaginatedResponse } from '$lib/types/api'
import type { Zone, ZoneCapacity, Gate } from '$lib/types/domain'

export async function getZones(params?: { active?: boolean; page?: number; page_size?: number }): Promise<PaginatedResponse<Zone>> {
  const res = await apiClient.get('/api/v1/zones', { params })
  return res.data
}

export async function getZone(id: string): Promise<Zone> {
  const res = await apiClient.get<ApiResponse<Zone>>(`/api/v1/zones/${id}`)
  return res.data.data
}

export async function createZone(body: {
  name: string
  description?: string
  capacity: number
  additional_fee?: number
  for_vehicle_type_id?: string
}): Promise<Zone> {
  const res = await apiClient.post<ApiResponse<Zone>>('/api/v1/zones', body)
  return res.data.data
}

export async function updateZone(id: string, body: {
  name?: string
  description?: string
  capacity?: number
  additional_fee?: number
  for_vehicle_type_id?: string
  is_active?: boolean
}): Promise<Zone> {
  const res = await apiClient.put<ApiResponse<Zone>>(`/api/v1/zones/${id}`, body)
  return res.data.data
}

export async function getZoneCapacity(id: string): Promise<ZoneCapacity> {
  const res = await apiClient.get<ApiResponse<ZoneCapacity>>(`/api/v1/zones/${id}/capacity`)
  return res.data.data
}

export async function listGates(params?: {
  zone_id?: string
  gate_type?: 'entry' | 'exit'
  active?: boolean
  page?: number
  page_size?: number
}): Promise<PaginatedResponse<Gate>> {
  const res = await apiClient.get('/api/v1/gates', { params })
  return res.data
}

export async function getZoneGates(zoneId: string): Promise<Gate[]> {
  const res = await apiClient.get<ApiResponse<Gate[]>>(`/api/v1/zones/${zoneId}/gates`)
  return res.data.data
}

export async function createGate(body: {
  zone_id: string
  name: string
  gate_type: 'entry' | 'exit'
  location_desc?: string
}): Promise<Gate> {
  const res = await apiClient.post<ApiResponse<Gate>>('/api/v1/zones/gates', body)
  return res.data.data
}

export async function updateGate(zoneId: string, gateId: string, body: {
  name?: string
  gate_type?: 'entry' | 'exit'
  location_desc?: string
  is_active?: boolean
}): Promise<Gate> {
  const res = await apiClient.patch<ApiResponse<Gate>>(`/api/v1/zones/${zoneId}/gates/${gateId}`, body)
  return res.data.data
}
