import axios from 'axios'
import type { loginUser, registerUser } from '../types/User.type'

export const registerUserApi = async (payload: registerUser) => {
  const url = 'https://call-service-dipu.onrender.com/api/registerUser'
  const response = await axios.post(url, payload)
  return response
}
export const loginUserApi = async (payload: loginUser) => {
  const url = 'https://call-service-dipu.onrender.com/api/login'
  const response = await axios.post(url, payload)
  return response
}
