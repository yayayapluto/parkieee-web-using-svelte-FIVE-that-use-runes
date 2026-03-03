import axios from 'axios'
import { goto } from '$app/navigation'
import { getToken, clearToken } from '$lib/utils/auth'

export const apiClient = axios.create({
  baseURL: import.meta.env.PUBLIC_API_BASE_URL,
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
      goto('/login')
    }
    const message = err.response?.data?.meta?.message ?? err.message
    return Promise.reject(new Error(message))
  }
)
