import { useAuth } from '../../context/AuthContext'
import { useIncomingCall } from '../../hooks/useIncomingCall'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, PhoneOff } from 'lucide-react'
import { useAppContext } from '../../context/AppContext'

export function IncomingCallModal() {
  const { user } = useAuth()
  const { incomingCall, acceptCall, declineCall } = useIncomingCall(user?.id)
  const { setCurrentChannel, setCurrentGroup, handleJoinVoice, voiceState } = useAppContext()

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
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[999] w-[340px] bg-[rgba(16,16,38,0.95)] backdrop-blur-2xl rounded-2xl border border-rose-500/30 shadow-[0_20px_50px_rgba(244,63,94,0.3)] p-4 overflow-hidden flex flex-col items-center pointer-events-auto"
          >
          {/* Pulsing ring animation */}
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/20 to-purple-600/20 animate-pulse pointer-events-none" />
          
          <p className="text-white/60 text-xs font-semibold mb-2 uppercase tracking-widest relative z-10">
            Incoming Call
          </p>
          
          {/* Caller Info */}
          <div className="flex flex-col items-center gap-2 relative z-10 w-full">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold border-2 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.5)] ${incomingCall.caller?.avatar_color || 'bg-rose-500'}`}>
              {(incomingCall.caller?.username || 'U')[0].toUpperCase()}
            </div>
            <h3 className="text-white font-bold text-lg">{incomingCall.caller?.username || 'Unknown User'}</h3>
            <span className="text-rose-400 text-sm animate-pulse flex items-center gap-2">
              <Phone className="w-4 h-4" /> Ringing...
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex w-full justify-between gap-4 mt-6 relative z-10 px-2 pointer-events-auto">
            <button 
              onClick={(e) => { e.stopPropagation(); declineCall(); }}
              className="flex-1 py-3 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 rounded-xl transition-all flex justify-center items-center gap-2 font-bold cursor-pointer"
            >
              <PhoneOff className="w-5 h-5" /> Decline
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handleAccept(); }}
              className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.7)] transition-all flex justify-center items-center gap-2 font-bold transform hover:scale-105 cursor-pointer"
            >
              <Phone className="w-5 h-5" /> Accept
            </button>
          </div>
        </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
