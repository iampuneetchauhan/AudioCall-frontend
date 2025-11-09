import { useEffect, useRef, useState, useCallback } from 'react'
import { Socket } from 'socket.io-client'

interface IncomingCall {
  from: string
  name?: string
}

export const useWebRTCAudio = (socket: Socket | null, userId: string) => {
  const localAudioRef = useRef<HTMLAudioElement | null>(null)
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)

  const [inCall, setInCall] = useState(false)
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null)
  const [isCaller, setIsCaller] = useState(false)
  const [remoteUser, setRemoteUser] = useState<string | null>(null)

  const rtcConfig: RTCConfiguration = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  }

  // 🧹 Cleanup
  const cleanup = useCallback(() => {
    console.log('🧹 Cleaning up call')
    try {
      pcRef.current?.close()
    } catch {}
    pcRef.current = null

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop())
      localStreamRef.current = null
    }

    if (localAudioRef.current) localAudioRef.current.srcObject = null
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null

    setInCall(false)
    setIncomingCall(null)
    setIsCaller(false)
    setRemoteUser(null)
  }, [])

  // 🔧 Create PeerConnection
  const createPeerConnection = useCallback(
    (remoteId: string) => {
      const pc = new RTCPeerConnection(rtcConfig)

      pc.onicecandidate = event => {
        if (event.candidate && socket) {
          socket.emit('signal', {
            to: remoteId,
            data: { candidate: event.candidate }
          })
        }
      }

      pc.ontrack = event => {
        console.log('🎧 Remote track received')
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0]
          remoteAudioRef.current
            .play()
            .catch(() => console.warn('Autoplay blocked'))
        }
      }

      pc.onconnectionstatechange = () => {
        const state = pc.connectionState
        console.log('Peer connection state:', state)
        if (['disconnected', 'failed', 'closed'].includes(state)) {
          cleanup()
        }
      }

      return pc
    },
    [socket, cleanup]
  )

  // 🎙️ Local stream
  const setupLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      localStreamRef.current = stream

      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream
        localAudioRef.current.muted = true
        await localAudioRef.current.play().catch(() => {})
      }

      return stream
    } catch (err) {
      console.error('Microphone access error:', err)
      throw err
    }
  }, [])

  // 📞 Caller initiates
  const callUser = useCallback(
    async (targetId: string) => {
      if (!socket || !targetId || targetId === userId) return

      cleanup()
      setIsCaller(true)
      setInCall(true)
      setRemoteUser(targetId)

      const pc = createPeerConnection(targetId)
      pcRef.current = pc

      const stream = await setupLocalStream()
      stream.getTracks().forEach(t => pc.addTrack(t, stream))

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      pc.onnegotiationneeded = async () => {
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        socket.emit('signal', { to: targetId, data: { sdp: offer } })
      }
      socket.emit('call-user', { from: userId, to: targetId })
      socket.emit('signal', { to: targetId, data: { sdp: offer } })
    },
    [socket, userId, createPeerConnection, setupLocalStream, cleanup]
  )

  // ✅ Receiver accepts
  const acceptCall = useCallback(async () => {
    if (!incomingCall || !socket) return
    const { from } = incomingCall

    setIncomingCall(null)
    setInCall(true)
    setRemoteUser(from)

    const pc = createPeerConnection(from)
    pcRef.current = pc

    const stream = await setupLocalStream()
    stream.getTracks().forEach(t => pc.addTrack(t, stream))

    socket.emit('call-response', { from, to: userId, accepted: true })
  }, [incomingCall, socket, userId, createPeerConnection, setupLocalStream])

  // ❌ Decline
  const declineCall = useCallback(() => {
    if (incomingCall && socket) {
      socket.emit('call-response', {
        from: incomingCall.from,
        to: userId,
        accepted: false
      })
    }
    setIncomingCall(null)
  }, [incomingCall, socket, userId])

  // 🔚 End call
  const endCall = useCallback(() => {
    if (socket && remoteUser) {
      socket.emit('hangup', { from: userId })
    }
    cleanup()
  }, [socket, cleanup, userId, remoteUser])

  // 🧠 Socket events
  useEffect(() => {
    if (!socket) return

    socket.emit('register-user', { userId })

    const handleIncomingCall = ({ from, name }: IncomingCall) => {
      console.log('📥 Incoming call from', from)
      setIncomingCall({ from, name })
    }

    const handleCallResponse = async ({
      from,
      accepted
    }: {
      from: string
      accepted: boolean
    }) => {
      if (!accepted) {
        console.warn('❌ Call declined')
        cleanup()
        return
      }

      console.log('✅ Call accepted by', from)

      // 👇 Caller completes the connection by creating answer on accepted
      if (isCaller && pcRef.current?.localDescription) {
        // Wait for answer via "signal" event instead of re-offering
        console.log('📡 Waiting for remote SDP answer...')
      }
    }

    const handleSignal = async ({
      from,
      data
    }: {
      from: string
      data: any
    }) => {
      if (!pcRef.current) {
        pcRef.current = createPeerConnection(from)
      }

      const pc = pcRef.current!

      // 👇 Ensure local stream is added first
      if (!localStreamRef.current) {
        const stream = await setupLocalStream()
        stream.getTracks().forEach(t => pc.addTrack(t, stream))
      }

      if (data.sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp))

        if (data.sdp.type === 'offer' && !isCaller) {
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          socket.emit('signal', { to: from, data: { sdp: answer } })
        }
      } else if (data.candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate))
        } catch (err) {
          console.warn('addIceCandidate failed:', err)
        }
      }
    }

    const handleHangup = () => {
      console.log('📴 Remote ended call')
      cleanup()
    }

    socket.on('incoming-call', handleIncomingCall)
    socket.on('call-response', handleCallResponse)
    socket.on('signal', handleSignal)
    socket.on('hangup', handleHangup)

    return () => {
      socket.off('incoming-call', handleIncomingCall)
      socket.off('call-response', handleCallResponse)
      socket.off('signal', handleSignal)
      socket.off('hangup', handleHangup)
    }
  }, [socket, userId, cleanup, createPeerConnection, isCaller])

  return {
    localAudioRef,
    remoteAudioRef,
    callUser,
    acceptCall,
    declineCall,
    endCall,
    inCall,
    incomingCall,
    isCaller
  }
}
