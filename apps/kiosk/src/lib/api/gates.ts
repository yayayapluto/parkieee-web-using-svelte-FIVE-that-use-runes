import { api } from './client'
import type { ApiResponse } from '$lib/types/api'
import type { GateAuthResponse, PairingResponse } from '$lib/types/domain'

export async function authenticateGate(token: string): Promise<GateAuthResponse> {
  const res = await api.post<ApiResponse<GateAuthResponse>>('/api/v1/gate/authenticate', { gate_token: token })
  return res.data.data
}

export async function requestPairing(): Promise<PairingResponse> {
  const res = await api.post<ApiResponse<PairingResponse>>('/api/v1/gate/pairing/request')
  return res.data.data
}
