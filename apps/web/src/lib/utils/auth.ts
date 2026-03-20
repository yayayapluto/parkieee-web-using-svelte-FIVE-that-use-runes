import {browser} from '$app/environment'

const USER_NAME_KEY = 'parkiye_user_name'
const GATE_TOKEN_KEY = 'parkiye_gate_token'
const GATE_INFO_KEY  = 'parkiye_gate_info'

// ─── Token stubs — token ada di HttpOnly cookie, tidak bisa dibaca client ─────

export function getToken(): null {
    return null
}

/** @deprecated Gunakan $page.data.user.role */
export function getRole(): string | null {
    return null
}

/** @deprecated Gunakan $page.data.user.id */
export function getUserID(): string | null {
    return null
}

/** @deprecated Gunakan $page.data.user.permissions.includes(...) */
export function can(_permission: string): boolean {
    return false
}

export async function clearToken(): Promise<void> {
    await fetch('/auth/logout', {method: 'POST'})
    if (browser) localStorage.removeItem(USER_NAME_KEY)
}

// ─── User name (localStorage — display only) ──────────────────────────────────

export function getUserName(): string | null {
    if (!browser) return null
    return localStorage.getItem(USER_NAME_KEY)
}

export function setUserName(name: string): void {
    if (!browser) return
    localStorage.setItem(USER_NAME_KEY, name)
}

export function clearUserName(): void {
    if (!browser) return
    localStorage.removeItem(USER_NAME_KEY)
}

// ─── Gate session (localStorage — kiosk only) ─────────────────────────────────

export interface GateInfo {
  id: string
  name: string
  gate_type: 'entry' | 'exit'
  zone_id: string
  zone_name: string
}

export function getGateToken(): string | null {
    if (!browser) return null
  return localStorage.getItem(GATE_TOKEN_KEY)
}

export function setGateToken(token: string): void {
    if (!browser) return
  localStorage.setItem(GATE_TOKEN_KEY, token)
}

export function getGateInfo(): GateInfo | null {
    if (!browser) return null
  const raw = localStorage.getItem(GATE_INFO_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

export function setGateInfo(info: GateInfo): void {
    if (!browser) return
  localStorage.setItem(GATE_INFO_KEY, JSON.stringify(info))
}

export function clearGateSession(): void {
    if (!browser) return
  localStorage.removeItem(GATE_TOKEN_KEY)
  localStorage.removeItem(GATE_INFO_KEY)
}
