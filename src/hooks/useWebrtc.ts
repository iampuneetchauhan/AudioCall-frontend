import { useEffect, useRef, useState, useCallback } from "react";
import { Socket } from "socket.io-client";

interface IncomingCall {
  from: string;
  name?: string;
}

export const useWebRTCAudio = (socket: Socket | null, userId: string) => {
  const localAudioRef = useRef<HTMLAudioElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [inCall, setInCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [isCaller, setIsCaller] = useState(false);
  const [remoteUser, setRemoteUser] = useState<string | null>(null);

  const rtcConfig: RTCConfiguration = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

  // 🧹 Cleanup
  const cleanup = useCallback(() => {
    try {
      pcRef.current?.close();
    } catch {}
    pcRef.current = null;

    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;

    if (localAudioRef.current) localAudioRef.current.srcObject = null;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;

    setInCall(false);
    setIncomingCall(null);
    setIsCaller(false);
    setRemoteUser(null);
  }, []);

  // 🎧 Create RTCPeerConnection
  const createPeerConnection = useCallback(
    (remoteId: string) => {
      const pc = new RTCPeerConnection(rtcConfig);

      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit("signal", {
            to: remoteId,
            data: { candidate: event.candidate },
          });
        }
      };

      pc.ontrack = (event) => {
        console.log("🎧 Remote stream received", event.streams);
        const [stream] = event.streams;
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = stream;
          remoteAudioRef.current.autoplay = true;

          const tryPlay = async () => {
            try {
              await remoteAudioRef.current!.play();
            } catch {
              document.addEventListener("click", () => {
                remoteAudioRef.current!.play().catch(() => {});
              });
            }
          };
          tryPlay();
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") setInCall(true);
        if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
          cleanup();
        }
      };

      return pc;
    },
    [socket, cleanup]
  );

  // 🎙️ Local stream setup
  const setupLocalStream = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
    });
    localStreamRef.current = stream;

    if (localAudioRef.current) {
      localAudioRef.current.srcObject = stream;
      localAudioRef.current.muted = true;
      try {
        await localAudioRef.current.play();
      } catch {}
    }

    return stream;
  }, []);

  // 📞 Caller initiates call
  const callUser = useCallback(
    async (targetId: string) => {
      if (!socket || !targetId || targetId === userId) return;

      cleanup();
      setIsCaller(true);
      setInCall(true);
      setRemoteUser(targetId);

      const pc = createPeerConnection(targetId);
      pcRef.current = pc;

      // ✅ Attach local audio BEFORE offer
      const stream = await setupLocalStream();
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("call-user", { from: userId, to: targetId });
      socket.emit("signal", { to: targetId, data: { sdp: offer } });
      console.log("📤 Offer sent");
    },
    [socket, userId, createPeerConnection, setupLocalStream, cleanup]
  );

  // ✅ Receiver accepts call
  const acceptCall = useCallback(async () => {
    if (!incomingCall || !socket) return;
    const { from } = incomingCall;

    setIncomingCall(null);
    setInCall(true);
    setRemoteUser(from);

    const pc = createPeerConnection(from);
    pcRef.current = pc;

    // 🎙️ Attach local before telling accepted
    const stream = await setupLocalStream();
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    socket.emit("call-response", { from, to: userId, accepted: true });
    console.log("✅ Accepted call from", from);
  }, [incomingCall, socket, userId, createPeerConnection, setupLocalStream]);

  // ❌ Decline
  const declineCall = useCallback(() => {
    if (incomingCall && socket) {
      socket.emit("call-response", {
        from: incomingCall.from,
        to: userId,
        accepted: false,
      });
    }
    setIncomingCall(null);
  }, [incomingCall, socket, userId]);

  // 🔚 End call
  const endCall = useCallback(() => {
    if (socket && remoteUser) {
      socket.emit("hangup", { from: userId, to: remoteUser });
    }
    cleanup();
  }, [socket, cleanup, userId, remoteUser]);

  // ⚙️ Socket event handling
  useEffect(() => {
    if (!socket) return;

    socket.emit("register-user", { userId });

    const handleIncomingCall = ({ from, name }: IncomingCall) => {
      console.log("📥 Incoming call from", from);
      setIncomingCall({ from, name });
    };

    // call response handling
    const handleCallResponse = async ({ from, accepted }: any) => {
      if (!accepted) {
        cleanup();
        return;
      }
      console.log("✅ Call accepted by", from);

      // now actually start WebRTC offer
      const pc = createPeerConnection(from);
      pcRef.current = pc;

      const stream = await setupLocalStream();
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("signal", { to: from, data: { sdp: offer } });
      console.log("📤 Sent offer after acceptance");
    };

    const handleSignal = async ({ from, data }: any) => {
      if (!pcRef.current) pcRef.current = createPeerConnection(from);
      const pc = pcRef.current!;

      // Ensure local stream before handling SDP
      if (!localStreamRef.current) {
        const stream = await setupLocalStream();
        stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      }

      if (data.sdp) {
        const desc = new RTCSessionDescription(data.sdp);

        if (desc.type === "offer" && !isCaller) {
          console.log("📩 Got offer from", from);
          await pc.setRemoteDescription(desc);

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.emit("signal", { to: from, data: { sdp: answer } });
          console.log("📤 Sent answer to", from);
        } else if (desc.type === "answer" && isCaller) {
          console.log("📩 Got answer from", from);
          await pc.setRemoteDescription(desc);
        }
      } else if (data.candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
          console.warn("❄️ addIceCandidate failed:", err);
        }
      }
    };

    const handleHangup = ({ from }: any) => {
      console.log("📴 Call ended by", from);
      cleanup();
    };

    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-response", handleCallResponse);
    socket.on("signal", handleSignal);
    socket.on("hangup", handleHangup);

    return () => {
      socket.off("incoming-call", handleIncomingCall);
      socket.off("call-response", handleCallResponse);
      socket.off("signal", handleSignal);
      socket.off("hangup", handleHangup);
    };
  }, [
    socket,
    userId,
    cleanup,
    createPeerConnection,
    isCaller,
    setupLocalStream,
  ]);

  return {
    localAudioRef,
    remoteAudioRef,
    callUser,
    acceptCall,
    declineCall,
    endCall,
    inCall,
    incomingCall,
    isCaller,
  };
};
