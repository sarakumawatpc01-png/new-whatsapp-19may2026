import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor — add auth token
api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState()
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const { refreshToken, setAuth, clearAuth, user, tenant } = useAuthStore.getState()
      
      if (refreshToken) {
        try {
          const res = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/auth/refresh`,
            { refreshToken }
          )
          
          if (!res.data || !res.data.data) {
            throw new Error("Invalid refresh response");
          }
          const { accessToken: newAccess, refreshToken: newRefresh } = res.data.data
          
          // Update store (user and tenant remain same during refresh)
          if (user && tenant) {
            setAuth({ user, tenant, accessToken: newAccess, refreshToken: newRefresh })
          }
          
          originalRequest.headers.Authorization = `Bearer ${newAccess}`
          return axios(originalRequest)
        } catch (refreshError) {
          clearAuth()
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }
        }
      } else {
        clearAuth()
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error.response?.data || error)
  }
)

export default api
