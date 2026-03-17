// WARNING: ROUTE_ROLES dan hasRole() adalah UI guard untuk UX saja — bukan security.
// Kalau token dimanipulasi di localStorage, guard ini bisa di-bypass.
// Semua endpoint Go backend harus enforce role secara independen.

export const ROUTE_ROLES: Record<string, string[]> = {
  '/daftar-transaksi': ['operator', 'admin'],
  '/atur-gerbang':     ['operator', 'admin'],
  '/tindakan':         ['operator', 'admin'],
  '/kasir':            ['cashier', 'admin'],
  '/admin':            ['admin'],
  '/monitoring':       ['owner', 'admin'],
  '/engineer':         ['engineer', 'admin'],
  '/kiosk':            ['*'],
}

export const ROLE_REDIRECT: Record<string, string> = {
  operator: '/daftar-transaksi',
  admin:    '/admin/users',
  owner:    '/monitoring/dashboard',
  engineer: '/engineer/devices',
  cashier:  '/kasir',
}

export function hasRole(required: string[], userRole: string | null): boolean {
  if (required.includes('*')) return true
  if (!userRole) return false
  return required.includes(userRole)
}
