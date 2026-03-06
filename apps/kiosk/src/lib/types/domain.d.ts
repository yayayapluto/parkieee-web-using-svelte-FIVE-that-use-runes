export interface GateInfo {
  id: string
  name: string
  gate_type: 'entry' | 'exit'
  zone_id: string
  zone_name: string
}

export interface GateAuthResponse {
  token: string
  expires_at: string
  gate: GateInfo
}

export interface VehicleType {
  id: string
  name: string
  minimum_fee: number
  description: string
  created_at: string
}

export interface FeeTier {
  id: string
  tier_order: number
  duration_minutes: number
  fee_amount: number
  is_last_tier: boolean
}

export interface FeeConfig {
  id: string
  zone_id: string
  vehicle_type_id: string
  base_fee: number
  grace_period_minutes: number
  is_active: boolean
  effective_from: string
  effective_until: string | null
  tiers: FeeTier[]
}

export interface OCRPhotoSummary {
  photo_type: 'entry' | 'exit'
  ocr_detected_plate: string
  actual_plate: string
  is_match: boolean | null
  confidence: number
  output_image_url: string | null
  is_verified: boolean
}

export type TransactionStatus = 'open' | 'awaiting_payment' | 'paid' | 'exited' | 'overridden' | 'cancelled'

export interface Transaction {
  id: string
  transaction_code: string
  entry_gate_id: string
  entry_method: 'rfid' | 'qr'
  entry_qr_code: string | null
  entry_qr_code_image: string | null
  entry_at: string
  exit_gate_id: string | null
  exit_method: string | null
  exit_at: string | null
  calculated_fee: number | null
  status: TransactionStatus
  zone_id: string
  created_at: string
  updated_at: string
  ocr?: OCRPhotoSummary[]
}

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'expired' | 'refunded'

export interface Payment {
  id: string
  transaction_id: string
  method: 'cash' | 'qris'
  amount: number
  status: PaymentStatus
  cash_tendered: number | null
  cash_change: number | null
  qris_string: string | null
  qris_image_url: string | null
  qris_expires_at: string | null
  paid_at: string | null
  created_at: string
  updated_at: string
}
