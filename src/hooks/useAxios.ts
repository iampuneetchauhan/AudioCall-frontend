import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosResponse
} from 'axios'
import { useNavigate } from 'react-router-dom'

const API_MIN_DELAY_MS = 200 // optional smooth delay

export const useAxios = () => {
  const navigate = useNavigate()

  const axiosInstance: AxiosInstance = axios.create({
    baseURL: 'https://call-service-dipu.onrender.com',
    timeout: 15000 // 15s safety timeout
  })

  // ✅ REQUEST interceptor
  axiosInstance.interceptors.request.use(async config => {
    if (!config.headers) config.headers = {} as any
    ;(config.headers as any)['request-startTime'] = `${Date.now()}`

    // 🔹 Get token from sessionStorage
    const stored = sessionStorage.getItem('token-details')

    if (stored) {
      try {
        const { token } = JSON.parse(stored)
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
      } catch {
        console.error('❌ Failed to parse token from sessionStorage')
      }
    }

    return config
  })

  // ✅ RESPONSE interceptor
  axiosInstance.interceptors.response.use(
    async (response: AxiosResponse) => {
      const startTime = response.config.headers['request-startTime']
      if (startTime) {
        const elapsed = Date.now() - parseInt(startTime as string)
        const remaining = API_MIN_DELAY_MS - elapsed
        if (remaining > 0) await new Promise(res => setTimeout(res, remaining))
      }
      return response
    },
    async (error: AxiosError) => {
      const startTime = error.config?.headers?.['request-startTime']
      if (startTime) {
        const elapsed = Date.now() - parseInt(startTime as string)
        const remaining = API_MIN_DELAY_MS - elapsed
        if (remaining > 0) await new Promise(res => setTimeout(res, remaining))
      }

      // 🚫 If Unauthorized (401)
      if (error.response?.status === 401) {
        console.warn('🚫 Unauthorized — clearing session and redirecting...')
        sessionStorage.clear()
        localStorage.clear()
        navigate('/', { replace: true }) // redirect to root/login
      }

      return Promise.reject(error)
    }
  )

  return { axiosInstance }
}
