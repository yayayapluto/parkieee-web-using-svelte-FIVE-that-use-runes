import { apiClient } from './client'
import type { ApiResponse, PaginatedResponse } from '$lib/types/api'
import type { Vehicle, VehicleType } from '$lib/types/domain'

export async function getVehicleTypes(): Promise<VehicleType[]> {
  const res = await apiClient.get<ApiResponse<VehicleType[]>>('/api/v1/vehicles/types')
  return res.data.data
}

export async function createVehicleType(body: {
  name: string
  minimum_fee?: number
  description?: string
}): Promise<VehicleType> {
  const res = await apiClient.post<ApiResponse<VehicleType>>('/api/v1/vehicles/types', body)
  return res.data.data
}

export async function updateVehicleType(id: string, body: {
  name?: string
  minimum_fee?: number
  description?: string
}): Promise<VehicleType> {
  const res = await apiClient.put<ApiResponse<VehicleType>>(`/api/v1/vehicles/types/${id}`, body)
  return res.data.data
}

export async function getVehicles(params?: { page?: number; page_size?: number; plate_number?: string }): Promise<PaginatedResponse<Vehicle>> {
  const res = await apiClient.get('/api/v1/vehicles', { params })
  return res.data
}

export async function upsertVehicle(body: {
  plate_number: string
  vehicle_type_id: string
  source: 'ocr' | 'manual_override'
  notes?: string
}): Promise<Vehicle> {
  const res = await apiClient.post<ApiResponse<Vehicle>>('/api/v1/vehicles', body)
  return res.data.data
}

export async function updateVehicle(id: string, body: {
  vehicle_type_id?: string
  notes?: string
}): Promise<Vehicle> {
  const res = await apiClient.put<ApiResponse<Vehicle>>(`/api/v1/vehicles/${id}`, body)
  return res.data.data
}
