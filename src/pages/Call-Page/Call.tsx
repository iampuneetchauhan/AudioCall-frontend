import { useMemo, useState } from "react";
import { useSocket } from "../../context/socket/SocketContext";
import { useWebRTCAudio } from "../../hooks/useWebrtc";
import { useUser } from "../../context/us/UserContext";
import { getAllUsers } from "../../api/User.api";
import { Loader2, Phone, PhoneOff, Search, User2 } from "lucide-react";

export default function CallPage() {
  const { socket } = useSocket();
  const { userPayload } = useUser();

  const [target, setTarget] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const userId = userPayload?._id || "";
  const socketId = useMemo(() => socket?.id ?? "connecting...", [socket]);

  const {
    localAudioRef,
    remoteAudioRef,
    callUser,
    endCall,
    inCall,
    acceptCall,
    declineCall,
    incomingCall,
  } = useWebRTCAudio(socket!, userId);

  // 🔍 SEARCH USERS
  const handleSearch = async () => {
    if (!target.trim()) return;
    setLoading(true);
    try {
      const response = await getAllUsers(target);
      setResults(response || []);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  };
  console.log(
    "current audio is,",
    localAudioRef,
    "remote audio is,",
    remoteAudioRef
  );
  return (
    <div className="min-h-screen flex flex-col items-center justify-start px-6 py-10 bg-gradient-to-br from-[#0A0A0A] via-[#101010] to-[#0A0A0A] text-gray-100">
      <div className="w-full max-w-2xl space-y-6">
        {/* HEADER */}
        <div className="flex flex-col items-center text-center">
          <h1 className="text-3xl font-bold text-indigo-400 tracking-tight">
            Audio Call Service 🎧
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            Logged in as{" "}
            <span className="text-indigo-300 font-medium">
              {userPayload?.name || "Unknown"}
            </span>
          </p>
        </div>

        {/* SOCKET INFO */}
        <div className="bg-[#111] border border-gray-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between shadow-sm">
          <div className="text-sm text-gray-400">
            <p>
              Your ID: <span className="text-gray-100 font-mono">{userId}</span>
            </p>
            <p>
              Socket:{" "}
              <span className="text-gray-100 font-mono">{socketId}</span>
            </p>
          </div>
          {inCall ? (
            <span className="text-green-400 text-sm font-medium mt-2 sm:mt-0">
              🟢 In Call
            </span>
          ) : (
            <span className="text-gray-500 text-sm mt-2 sm:mt-0">
              Not in call
            </span>
          )}
        </div>

        {/* SEARCH BAR */}
        <div className="relative">
          <div className="flex gap-2">
            <input
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              onBlur={() => setResults([])}
              placeholder="Search user by name or email..."
              className="w-full px-4 py-2 rounded-lg bg-[#111] border border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-100 placeholder-gray-500"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-500 flex items-center gap-2 font-medium disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin w-4 h-4" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Search
            </button>
          </div>
        </div>

        {/* SEARCH RESULTS */}
        {!incomingCall && results.length > 0 && (
          <div className="bg-[#111] border border-gray-800 rounded-xl p-3 space-y-2">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">
              Results
            </h3>
            {results.map((user) => (
              <div
                key={user._id}
                onClick={() => callUser(user._id)}
                className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#1a1a1a] cursor-pointer transition"
              >
                <div className="flex items-center gap-3">
                  <User2 className="text-indigo-400 w-5 h-5" />
                  <div>
                    <p className="text-gray-100 font-medium">{user.name}</p>
                    <p className="text-gray-500 text-sm">{user.email}</p>
                  </div>
                </div>
                <button className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm flex items-center gap-1">
                  <Phone className="w-4 h-4" /> Call
                </button>
              </div>
            ))}
          </div>
        )}

        {inCall && (
          <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-6 bg-[#111] border border-gray-800 rounded-2xl p-6 mt-6 shadow-lg transition">
            {/* LOCAL USER CARD */}
            <div className="flex flex-col items-center bg-[#1a1a1a] rounded-xl p-4 w-full sm:w-1/2 shadow-inner">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-3xl font-semibold text-white shadow-md">
                {userPayload?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <p className="mt-3 text-gray-200 font-medium text-lg">
                {userPayload?.name || "You"}
              </p>
              <p className="text-gray-500 text-sm">You (Local)</p>

              <audio ref={localAudioRef} muted autoPlay className="hidden" />
            </div>

            {/* CONNECTION STATUS */}
            <div className="flex flex-col items-center justify-center text-center text-gray-400 text-sm">
              <div className="animate-pulse text-indigo-400 text-lg mb-2">
                🔊 Connected
              </div>
              <div className="w-16 h-0.5 bg-indigo-500/50 rounded-full mb-2"></div>
              <div className="flex items-center gap-2 text-gray-400">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                Live Audio Link
              </div>
            </div>

            {/* REMOTE USER CARD */}
            <div className="flex flex-col items-center bg-[#1a1a1a] rounded-xl p-4 w-full sm:w-1/2 shadow-inner">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center text-3xl font-semibold text-white shadow-md">
                {incomingCall?.from?.charAt(0)?.toUpperCase() || "R"}
              </div>
              <p className="mt-3 text-gray-200 font-medium text-lg">
                {incomingCall?.from || "Remote User"}
              </p>
              <p className="text-gray-500 text-sm">Connected Peer</p>

              <audio
                ref={remoteAudioRef}
                controls
                autoPlay
                className="hidden"
              />
            </div>
          </div>
        )}

        {/* END CALL BUTTON BELOW CARDS */}
        {inCall && (
          <div className="flex justify-center mt-6">
            <button
              onClick={endCall}
              className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 px-6 py-2 rounded-full text-base font-medium shadow-lg transition"
            >
              <PhoneOff className="w-5 h-5" /> End Call
            </button>
          </div>
        )}

        {/* INCOMING CALL POPUP */}
        {incomingCall && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-[#111] border border-gray-800 rounded-2xl p-6 text-center shadow-lg max-w-sm w-full">
              <h3 className="text-xl font-semibold text-indigo-400 mb-2">
                Incoming Call
              </h3>
              <p className="text-gray-300">
                {incomingCall.from || "Unknown User"} is calling you 📞
              </p>
              <div className="flex justify-center gap-4 mt-4">
                <button
                  onClick={acceptCall}
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" /> Accept
                </button>
                <button
                  onClick={declineCall}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <PhoneOff className="w-4 h-4" /> Decline
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
