import type { GateInfo } from '$lib/types/domain'

const GATE_TOKEN_KEY = 'kiosk_gate_token'
const GATE_INFO_KEY  = 'kiosk_gate_info'

export function getGateToken(): string | null {
  return localStorage.getItem(GATE_TOKEN_KEY)
}

export function setGateToken(token: string): void {
  localStorage.setItem(GATE_TOKEN_KEY, token)
}

export function getGateInfo(): GateInfo | null {
  const raw = localStorage.getItem(GATE_INFO_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) as GateInfo } catch { return null }
}

export function setGateInfo(info: GateInfo): void {
  localStorage.setItem(GATE_INFO_KEY, JSON.stringify(info))
}

export function clearGateSession(): void {
  localStorage.removeItem(GATE_TOKEN_KEY)
  localStorage.removeItem(GATE_INFO_KEY)
}
