import axios from 'axios'

export const getAllUsers = async (search: string) => {
  const apiUrl = 'https://call-service-dipu.onrender.com/api/users'
  const response = await axios.get(apiUrl, {
    params: {
      search
    }
  })
  return response.data
}
