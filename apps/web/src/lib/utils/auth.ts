const TOKEN_KEY = 'parkiye_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem('parkiye_user_name')
}

export function getRole(): string | null {
  const token = getToken()
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.role ?? null
  } catch {
    return null
  }
}

export function getUserID(): string | null {
  const token = getToken()
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.sub ?? payload.user_id ?? null
  } catch {
    return null
  }
}

const GATE_TOKEN_KEY = 'parkiye_gate_token'
const GATE_INFO_KEY  = 'parkiye_gate_info'

export interface GateInfo {
  id: string
  name: string
  gate_type: 'entry' | 'exit'
  zone_id: string
  zone_name: string
}

export function getGateToken(): string | null {
  return localStorage.getItem(GATE_TOKEN_KEY)
}

export function setGateToken(token: string): void {
  localStorage.setItem(GATE_TOKEN_KEY, token)
}

export function getGateInfo(): GateInfo | null {
  const raw = localStorage.getItem(GATE_INFO_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

export function setGateInfo(info: GateInfo): void {
  localStorage.setItem(GATE_INFO_KEY, JSON.stringify(info))
}

export function clearGateSession(): void {
  localStorage.removeItem(GATE_TOKEN_KEY)
  localStorage.removeItem(GATE_INFO_KEY)
}

const USER_NAME_KEY = 'parkiye_user_name'

export function getUserName(): string | null {
  return localStorage.getItem(USER_NAME_KEY)
}

export function setUserName(name: string): void {
  localStorage.setItem(USER_NAME_KEY, name)
}

export function clearUserName(): void {
  localStorage.removeItem(USER_NAME_KEY)
}
