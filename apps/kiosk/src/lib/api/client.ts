import axios from 'axios'
import { getGateToken } from '$lib/utils/auth'
import { PUBLIC_API_BASE_URL } from '$env/static/public'

export const api = axios.create({
  baseURL: PUBLIC_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = getGateToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.meta?.message ?? err.message
    return Promise.reject(new Error(message))
  }
)
