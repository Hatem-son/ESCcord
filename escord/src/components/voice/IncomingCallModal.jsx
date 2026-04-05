import { useAuth } from '../../context/AuthContext'
import { useIncomingCall } from '../../hooks/useIncomingCall'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, PhoneOff, Video } from 'lucide-react'
import { useAppContext } from '../../context/AppContext'
import { useEffect, useRef } from 'react'

export function IncomingCallModal() {
  const { user } = useAuth()
  const { incomingCall, acceptCall, declineCall } = useIncomingCall(user?.id)
  const { setCurrentChannel, setCurrentGroup, handleJoinVoice, voiceState } = useAppContext()
  const videoRef = useRef(null)

  useEffect(() => {
    let stream;
    if (incomingCall) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(s => {
          stream = s
          if (videoRef.current) {
            videoRef.current.srcObject = s
          }
        })
        .catch(err => console.log('Camera access denied or unavailable', err))
    }
    
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop())
    }
  }, [incomingCall])

  if (!incomingCall) return null

  const handleAccept = async () => {
    const targetChannel = { 
      id: incomingCall.channelId, 
      name: 'Private Call', 
      type: 'voice' 
    }
    await acceptCall()
    setCurrentGroup({ id: 'friends', name: 'Friends', is_dm: true })
    setCurrentChannel(targetChannel)
    handleJoinVoice(targetChannel)
    setTimeout(() => voiceState?.joinRoom(targetChannel.id), 50)
  }

  return (
    <AnimatePresence>
      {incomingCall && (
        <>
          {/* Full-screen blurred backdrop blocking interactions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[998] bg-black/50 backdrop-blur-md pointer-events-auto"
          />

          {/* Call Modal */}
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[999] w-[340px] bg-[rgba(16,16,38,0.95)] backdrop-blur-2xl rounded-2xl border border-[#8b5cf6]/30 shadow-[0_20px_50px_rgba(139,92,246,0.2)] overflow-hidden flex flex-col items-center pointer-events-auto"
          >
          {/* Background Camera Feed */}
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline 
            className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-screen"
          />
          {/* Dark gradient overlay so text remains readable */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/80" />

          {/* Pulsing ring animation */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#8b5cf6]/10 to-emerald-500/10 animate-pulse pointer-events-none" />
          
          <div className="w-full p-6 flex flex-col items-center relative z-10">
          <p className="text-white/60 text-xs font-semibold mb-6 flex items-center gap-1.5 uppercase tracking-widest relative z-10 bg-black/40 px-3 py-1 rounded-full border border-white/10">
            <Video className="w-3.5 h-3.5 text-emerald-400" /> Incoming Video Call
          </p>
          
          {/* Caller Info */}
          <div className="flex flex-col items-center gap-2 relative z-10 w-full">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold border-2 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.3)] ${incomingCall.caller?.avatar_color || 'bg-[#8b5cf6]'}`}>
              {(incomingCall.caller?.username || 'U')[0].toUpperCase()}
            </div>
            <h3 className="text-white font-black text-2xl tracking-tight mt-2">{incomingCall.caller?.username || 'Unknown User'}</h3>
            <span className="text-emerald-400 font-medium text-sm animate-pulse flex items-center gap-2">
              <Phone className="w-4 h-4" /> Sound Ringing...
            </span>
          </div>

          <div className="flex w-full justify-between gap-3 mt-8 relative z-10 pointer-events-auto">
            <button 
              onClick={(e) => { e.stopPropagation(); declineCall(); }}
              className="flex-1 py-3.5 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 rounded-xl transition-all flex justify-center items-center gap-2 font-bold cursor-pointer"
            >
              <PhoneOff className="w-5 h-5" /> Decline
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handleAccept(); }}
              className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.7)] transition-all flex justify-center items-center gap-2 font-bold transform hover:scale-105 cursor-pointer border border-emerald-400/50"
            >
              <Video className="w-5 h-5" /> Answer
            </button>
          </div>
          </div>
        </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
