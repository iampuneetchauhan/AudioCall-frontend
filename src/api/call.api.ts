// src/api/api.ts
import axios from 'axios'

const BASE_URL = 'https://call-service-dipu.onrender.com/api'

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
})

// ✅ Create / Join Room (for testing or meeting feature)
export const joinRoom = async (roomId?: string) => {
  try {
    const res = await api.post('/join', { roomId })
    return res.data // { roomId }
  } catch (err: any) {
    console.error('❌ joinRoom error:', err.response?.data || err.message)
    throw err
  }
}

// ✅ Call Connect API (initiate call between two users)
export const connectUsers = async (fromUserId: string, toUserId: string) => {
  try {
    const res = await api.post('/connect', { fromUserId, toUserId })
    return res.data // { success: true, message: "Call request sent" }
  } catch (err: any) {
    console.error('❌ connectUsers error:', err.response?.data || err.message)
    throw err
  }
}

// ✅ Optional: Fetch user info (if your backend has auth routes)
export const getUserProfile = async (userId: string) => {
  try {
    const res = await api.get(`/users/${userId}`)
    return res.data
  } catch (err: any) {
    console.error('❌ getUserProfile error:', err.response?.data || err.message)
    throw err
  }
}

// ✅ Health check API
export const healthCheck = async () => {
  try {
    const res = await api.get('/')
    return res.data
  } catch (err: any) {
    console.error('❌ healthCheck error:', err.message)
    throw err
  }
}

export default api
