import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getToken, removeToken } from '../utils/tokenUtils'

export default function ProtectedRoute () {
  const location = useLocation()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = getToken()
        if (token) {
          setIsAuthenticated(true)
        } else {
          setIsAuthenticated(false)
          removeToken()
        }
      } catch (err) {
        console.error('❌ Failed to check auth', err)
        removeToken()
        setIsAuthenticated(false)
      }
    }

    checkAuth()
  }, [])

  // Still checking
  if (isAuthenticated === null) return null

  // Not logged in
  if (!isAuthenticated) {
    return <Navigate to='/' state={{ from: location }} replace />
  }

  // Logged in → allow route
  return <Outlet />
}
