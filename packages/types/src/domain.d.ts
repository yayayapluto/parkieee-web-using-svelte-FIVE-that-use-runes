// Auth & User

export interface Permission {
  id: string
  node: string
  description: string
}

export interface Role {
  id: string
  name: string
  description: string
  permissions?: Permission[]
}

export interface User {
  id: string
  name: string
  email: string
  is_active: boolean
  role: Role
  created_at: string
  updated_at: string
}

export interface LoginResponse {
  token: string
  expires_at: string
  user: User
}

// Zone & Gate

export interface Zone {
  id: string
  name: string
  description: string
  capacity: number
  additional_fee: number
  for_vehicle_type_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ZoneCapacity {
  zone_id: string
  zone_name: string
  capacity: number
  occupied_count: number
  available_count: number
}

export interface Gate {
  id: string
  zone_id: string
  zone_name: string
  name: string
  gate_type: 'entry' | 'exit'
  location_desc: string
  gate_token: string
  token_last_used_at: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

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

export interface PairingResponse {
  code: string
  qr_content: string
  qr_base64: string
  expires_at: string
}

export interface PairingInfoResponse {
  code: string
  status: 'pending' | 'confirmed'
  is_expired: boolean
  expires_at: string
  created_at: string
  ip_address: string
  gate_id: string | null
  confirmed_by: string | null
  confirmed_at: string | null
}

export interface PairingConfirmResponse {
  gate_jwt: string
  expires_at: string
  gate: GateInfo
}

// Vehicle

export interface VehicleType {
  id: string
  name: string
  minimum_fee: number
  description: string
  created_at: string
}

export interface Vehicle {
  id: string
  plate_number: string
  vehicle_type: VehicleType
  source: 'ocr' | 'manual_override'
  notes: string
  created_at: string
  updated_at: string
}

// RFID

export interface RFIDCard {
  id: string
  card_uid: string
  vehicle_id: string | null
  is_active: boolean
  created_at: string
  deactivated_at: string | null
  deactivated_by: string | null
}

// Fee

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
  created_by: string | null
  created_at: string
  tiers: FeeTier[]
}

export interface HolidayRate {
  id: string
  name: string
  date_start: string
  date_end: string
  rate_type: 'multiplier' | 'override'
  multiplier: number | null
  override_fee: number | null
  applies_to_zone_id: string | null
  applies_to_vehicle_type_id: string | null
  created_by: string | null
  created_at: string
}

// Transaction

export type TransactionStatus =
  | 'open'
  | 'awaiting_payment'
  | 'paid'
  | 'exited'
  | 'overridden'
  | 'cancelled'

export type EntryMethod = 'rfid' | 'qr'
export type ExitMethod  = 'rfid' | 'qr' | 'override'

export interface OCRPhotoSummary {
  photo_type: 'entry' | 'exit'
  ocr_detected_plate: string
  actual_plate: string
  is_match: boolean | null
  confidence: number
  output_image_url: string | null
  output_image_path: string | null
  is_verified: boolean
}

export interface Transaction {
  id: string
  transaction_code: string
  entry_gate_id: string
  entry_method: EntryMethod
  rfid_card_id: string | null
  entry_qr_code: string | null
  entry_qr_code_image: string | null
  entry_at: string
  entry_photo_url: string | null
  entry_photo_path: string | null
  exit_photo_url: string | null
  exit_photo_path: string | null
  exit_gate_id: string | null
  exit_method: ExitMethod | null
  exit_at: string | null
  vehicle_id: string | null
  fee_config_id: string | null
  calculated_fee: number | null
  holiday_rate_id: string | null
  status: TransactionStatus
  receipt_printed: boolean
  zone_id: string
  created_at: string
  updated_at: string
  ocr?: OCRPhotoSummary[]
}

export interface TransactionLog {
  id: string
  transaction_id: string
  from_status: string | null
  to_status: string
  event: string
  triggered_by: 'system' | 'operator' | 'cashier' | 'webhook'
  triggered_by_user_id: string | null
  note: string
  created_at: string
}

export type FlagType = 'overnight' | 'multi_day' | 'suspicious_duration' | 'plate_mismatch'

export interface UnclosedTransactionFlag {
  id: string
  transaction_id: string
  flagged_at: string
  flag_type: FlagType
  flag_reason: string
  resolved: boolean
  resolved_at: string | null
  resolved_by: string | null
  resolution_note: string
}

// Payment
// PaymentStatus: 'paid' adalah status canonical dari backend.
// 'completed' adalah alias yang sempat dipakai di kiosk app — gunakan 'paid' untuk kode baru.

export type PaymentMethod = 'cash' | 'qris'
export type PaymentStatus = 'pending' | 'paid' | 'completed' | 'failed' | 'expired' | 'refunded'
export type RefundStatus  = 'pending' | 'approved' | 'processed' | 'rejected'

export interface Payment {
  id: string
  transaction_id: string
  method: PaymentMethod
  amount: number
  status: PaymentStatus
  handled_by_user_id: string | null
  cash_tendered: number | null
  cash_change: number | null
  midtrans_order_id: string | null
  midtrans_transaction_id: string | null
  qris_string: string | null
  qris_image_url: string | null
  qris_expires_at: string | null
  midtrans_status: string | null
  paid_at: string | null
  created_at: string
  updated_at: string
}

export interface Refund {
  id: string
  payment_id: string
  transaction_id: string
  refund_amount: number
  reason: string
  status: RefundStatus
  requested_by: string
  approved_by: string | null
  midtrans_refund_id: string | null
  processed_at: string | null
  created_at: string
  updated_at: string
}

// Override

export type OverrideType =
  | 'lost_card_exit'
  | 'no_qr_exit'
  | 'fee_waive'
  | 'fee_adjust'
  | 'force_open_gate'
  | 'manual_entry'

export interface OperatorOverride {
  id: string
  transaction_id: string
  operator_id: string
  override_type: OverrideType
  reason: string
  original_fee: number | null
  adjusted_fee: number | null
  approved_by: string
  created_at: string
}

// Audit

export interface AuditLog {
  id: string
  event_type: string
  actor_id: string
  actor_role: string
  target_type: string
  target_id: string | null
  before_state: Record<string, unknown> | null
  after_state: Record<string, unknown> | null
  ip_address: string
  user_agent: string
  created_at: string
}
