import { api } from './client'
import type { ApiResponse } from '$lib/types/api'

export interface FeeTierItem {
  tier_order: number
  duration_minutes: number
  fee_amount: number
  is_last_tier: boolean
}

export interface FeeConfigItem {
  base_fee: number
  grace_period_minutes: number
  additional_fee: number
  tiers: FeeTierItem[]
}

export interface VehicleTypeTariff {
  id: string
  name: string
  minimum_fee: number
  description: string
  fee_config: FeeConfigItem | null
}

export async function getKioskTariff(): Promise<VehicleTypeTariff[]> {
  const res = await api.get<ApiResponse<VehicleTypeTariff[]>>('/api/v1/kiosk/tariff')
  return res.data.data
}
