import axios from 'axios'
import { goto } from '$app/navigation'
import { getToken, clearToken, getGateToken } from '$lib/utils/auth'
import { PUBLIC_API_BASE_URL } from '$env/static/public'

export const apiClient = axios.create({
  baseURL: PUBLIC_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      clearToken()
      goto('/masuk')
    }
    const message = err.response?.data?.meta?.message ?? err.message
    return Promise.reject(new Error(message))
  }
)

// Client khusus kiosk — pakai gate token, 401 tidak redirect ke /login
export const kioskClient = axios.create({
  baseURL: PUBLIC_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

kioskClient.interceptors.request.use((config) => {
  const token = getGateToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

kioskClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.meta?.message ?? err.message
    return Promise.reject(new Error(message))
  }
)
