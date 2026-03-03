import { apiClient } from './client'
import type { ApiResponse } from '$lib/types/api'
import type { GateAuthResponse, PairingResponse, PairingInfoResponse, PairingConfirmResponse } from '$lib/types/domain'

export async function authenticateGate(gate_token: string): Promise<GateAuthResponse> {
  const res = await apiClient.post<ApiResponse<GateAuthResponse>>('/api/v1/gate/authenticate', { gate_token })
  return res.data.data
}

export async function requestPairing(): Promise<PairingResponse> {
  const res = await apiClient.post<ApiResponse<PairingResponse>>('/api/v1/gate/pairing/request')
  return res.data.data
}

export async function getPairingInfo(code: string): Promise<PairingInfoResponse> {
  const res = await apiClient.get<ApiResponse<PairingInfoResponse>>(`/api/v1/gate/pairing/${code}`)
  return res.data.data
}

export async function confirmPairing(code: string, gate_id: string): Promise<PairingConfirmResponse> {
  const res = await apiClient.post<ApiResponse<PairingConfirmResponse>>(`/api/v1/gate/pairing/${code}/confirm`, { gate_id })
  return res.data.data
}
