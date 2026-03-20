import {apiClient} from './client'
import {setUserName} from '$lib/utils/auth'
import {goto} from '$app/navigation'
import type {ApiResponse, PaginatedResponse} from '$lib/types/api'
import type {Permission, Role, User} from '$lib/types/domain'

export async function login(email: string, password: string): Promise<{ user: User }> {
    const res = await fetch('/auth/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email, password}),
    })

    if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.message ?? `Error ${res.status}`)
    }

    const data = await res.json()
    if (data.user?.name) setUserName(data.user.name)
    return data
}

export async function logout(): Promise<void> {
    await fetch('/auth/logout', {method: 'POST'})
    await goto('/masuk')
}

export async function getUsers(params?: { page?: number; page_size?: number }): Promise<PaginatedResponse<User>> {
  const res = await apiClient.get('/api/v1/auth/users', { params })
  return res.data
}

export async function getUser(id: string): Promise<User> {
  const res = await apiClient.get<ApiResponse<User>>(`/api/v1/auth/users/${id}`)
  return res.data.data
}

export async function createUser(body: { name: string; email: string; password: string; role_id: string }): Promise<User> {
  const res = await apiClient.post<ApiResponse<User>>('/api/v1/auth/users', body)
  return res.data.data
}

export async function updateUser(id: string, body: { name?: string; email?: string; role_id?: string }): Promise<User> {
  const res = await apiClient.put<ApiResponse<User>>(`/api/v1/auth/users/${id}`, body)
  return res.data.data
}

export async function changePassword(id: string, body: { old_password: string; new_password: string }): Promise<void> {
  await apiClient.put(`/api/v1/auth/users/${id}/password`, body)
}

export async function getRoles(): Promise<Role[]> {
  const res = await apiClient.get<ApiResponse<Role[]>>('/api/v1/auth/roles')
  return res.data.data
}

export async function getPermissions(): Promise<Permission[]> {
  const res = await apiClient.get<ApiResponse<Permission[]>>('/api/v1/auth/permissions')
  return res.data.data
}

export async function assignPermission(roleId: string, permissionId: string): Promise<void> {
  await apiClient.post(`/api/v1/auth/roles/${roleId}/permissions`, { permission_id: permissionId })
}

export async function revokePermission(roleId: string, permissionId: string): Promise<void> {
  await apiClient.delete(`/api/v1/auth/roles/${roleId}/permissions`, { data: { permission_id: permissionId } })
}
