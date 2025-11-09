// src/utils/tokenUtils.ts

export interface TokenData {
  token: string
}

// 🔹 Get token from sessionStorage (or fallback localStorage)
export const getToken = (): TokenData | null => {
  const sessionToken = sessionStorage.getItem('authToken')
  const token = sessionToken 
  if (!token) return null

  return JSON.parse(token)
}

// 🔹 Save token (optionally choose storage type)
export const setToken = (token: string, rememberMe = false) => {
  const tokenData = JSON.stringify({ token })

  if (rememberMe) {
    // ✅ store in localStorage (persistent)
    localStorage.setItem('authToken', tokenData)
  } else {
    // ✅ store in sessionStorage (clears on tab close)
    sessionStorage.setItem('authToken', tokenData)
  }
}

// 🔹 Remove token from both
export const removeToken = () => {
  sessionStorage.removeItem('authToken')
  localStorage.removeItem('authToken')
}
