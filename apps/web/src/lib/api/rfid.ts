import { apiClient } from './client'
import type { ApiResponse, PaginatedResponse } from '$lib/types/api'
import type { RFIDCard } from '$lib/types/domain'

export async function registerOrGetCard(card_uid: string): Promise<RFIDCard> {
  const res = await apiClient.post<ApiResponse<RFIDCard>>('/api/v1/rfid/cards', { card_uid })
  return res.data.data
}

export async function getCards(params?: { page?: number; page_size?: number }): Promise<PaginatedResponse<RFIDCard>> {
  const res = await apiClient.get('/api/v1/rfid/cards', { params })
  return res.data
}

export async function getCard(id: string): Promise<RFIDCard> {
  const res = await apiClient.get<ApiResponse<RFIDCard>>(`/api/v1/rfid/cards/${id}`)
  return res.data.data
}

export async function linkVehicle(cardId: string, vehicle_id: string): Promise<RFIDCard> {
  const res = await apiClient.post<ApiResponse<RFIDCard>>(`/api/v1/rfid/cards/${cardId}/link`, { vehicle_id })
  return res.data.data
}

export async function deactivateCard(id: string): Promise<RFIDCard> {
  const res = await apiClient.post<ApiResponse<RFIDCard>>(`/api/v1/rfid/cards/${id}/deactivate`)
  return res.data.data
}
