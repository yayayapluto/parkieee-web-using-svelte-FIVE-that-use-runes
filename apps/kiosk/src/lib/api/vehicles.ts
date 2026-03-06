import { api } from './client'
import type { ApiResponse } from '$lib/types/api'
import type { VehicleType } from '$lib/types/domain'

export async function getVehicleTypes(): Promise<VehicleType[]> {
  const res = await api.get<ApiResponse<VehicleType[]>>('/api/v1/vehicles/types')
  return res.data.data
}
