import React, { createContext, useContext, useState, useEffect } from 'react'

interface UserPayload {
  _id: string | null
  name: string | null
}

interface UserContextType {
  userPayload: UserPayload
  setUserPayload: React.Dispatch<React.SetStateAction<UserPayload>>
  logoutUser: () => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [userPayload, setUserPayload] = useState<UserPayload>({
    _id: null,
    name: null
  })

  // ✅ Load from sessionStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('userPayload')
    if (stored) {
      try {
        setUserPayload(JSON.parse(stored))
      } catch {
        localStorage.removeItem('userPayload')
      }
    }
  }, [])

  // ✅ Persist to sessionStorage whenever payload changes
  useEffect(() => {
    if (userPayload._id != null && userPayload.name != null) {
      localStorage.setItem('userPayload', JSON.stringify(userPayload))
    }
  }, [userPayload])

  const logoutUser = () => {
    setUserPayload({ _id: null, name: null })
    localStorage.removeItem('userPayload')
  }

  return (
    <UserContext.Provider value={{ userPayload, setUserPayload, logoutUser }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) throw new Error('useUser must be used inside UserProvider')
  return context
}
