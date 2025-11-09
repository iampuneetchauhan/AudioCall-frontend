// src/context/SocketContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback
} from 'react'
import { io, Socket } from 'socket.io-client'

type SocketContextType = {
  socket: Socket | null
  isConnected: boolean
  registerUser: (userId: string) => void
  callUser: (from: string, to: string) => void
  sendSignal: (to: string, data: any) => void
  hangup: (from: string) => void
  onIncomingCall: (handler: (from: string) => void) => void
  onCallResponse: (
    handler: (data: { from: string; accepted: boolean }) => void
  ) => void
  onSignal: (handler: (data: { from: string; data: any }) => void) => void
  onHangup: (handler: () => void) => void
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  registerUser: () => {},
  callUser: () => {},
  sendSignal: () => {},
  hangup: () => {},
  onIncomingCall: () => {},
  onCallResponse: () => {},
  onSignal: () => {},
  onHangup: () => {}
})

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const socket = io(
      import.meta.env.VITE_BACKEND_URL ||
        'https://call-service-dipu.onrender.com',
      {
        transports: ['websocket']
      }
    )

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('🟢 Socket connected:', socket.id)
      setIsConnected(true)
    })

    socket.on('disconnect', () => {
      console.log('🔴 Socket disconnected')
      setIsConnected(false)
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  const registerUser = useCallback(
    (userId: string) => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit('register-user', { userId })
        console.log(`🪪 User registered: ${userId}`)
      }
    },
    [isConnected]
  )

  const callUser = useCallback((from: string, to: string) => {
    if (socketRef.current) {
      socketRef.current.emit('call-user', { from, to })
      console.log(`📞 Calling ${to} from ${from}`)
    }
  }, [])

  const sendSignal = useCallback((to: string, data: any) => {
    socketRef.current?.emit('signal', { to, data })
  }, [])

  const hangup = useCallback((from: string) => {
    socketRef.current?.emit('hangup', { from })
  }, [])

  const onIncomingCall = useCallback((handler: (from: string) => void) => {
    socketRef.current?.on('incoming-call', ({ from }) => {
      console.log('📲 Incoming call from:', from)
      handler(from)
    })
  }, [])

  const onCallResponse = useCallback(
    (handler: (data: { from: string; accepted: boolean }) => void) => {
      socketRef.current?.on('call-response', handler)
    },
    []
  )

  const onSignal = useCallback(
    (handler: (data: { from: string; data: any }) => void) => {
      socketRef.current?.on('signal', handler)
    },
    []
  )

  const onHangup = useCallback((handler: () => void) => {
    socketRef.current?.on('hangup', handler)
  }, [])

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        registerUser,
        callUser,
        sendSignal,
        hangup,
        onIncomingCall,
        onCallResponse,
        onSignal,
        onHangup
      }}
    >
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)
