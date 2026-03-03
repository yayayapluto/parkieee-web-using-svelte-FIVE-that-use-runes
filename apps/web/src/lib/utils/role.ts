export const ROUTE_ROLES: Record<string, string[]> = {
  '/operator':   ['operator', 'admin'],
  '/admin':      ['admin'],
  '/monitoring': ['owner', 'admin'],
  '/engineer':   ['engineer', 'admin'],
  '/kiosk':      ['*'],
}

export const ROLE_REDIRECT: Record<string, string> = {
  operator: '/operator/transactions',
  admin:    '/admin/users',
  owner:    '/monitoring/dashboard',
  engineer: '/engineer/devices',
}

export function hasRole(required: string[], userRole: string | null): boolean {
  if (required.includes('*')) return true
  if (!userRole) return false
  return required.includes(userRole)
}
