import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PhoneOff, Phone } from 'lucide-react'
import { useAppContext } from '../../context/AppContext'
import { supabase } from '../../lib/supabase'

export function OutgoingCallModal() {
  const { outgoingCall, setOutgoingCall, setCurrentChannel, handleJoinVoice } = useAppContext()
  const audioRef = useRef(null)

  useEffect(() => {
    let channelSub = null;
    
    if (outgoingCall) {
      audioRef.current = new Audio('/sounds/outbound_ring.mp3')
      // Fallback in case outbound_ring doesn't exist – but usually it does. We won't block on this.
      audioRef.current.loop = true
      audioRef.current.volume = 0.5
      audioRef.current.play().catch(e => console.log('Audio auto-play prevented', e))

      channelSub = supabase
        .channel(`outgoing:${outgoingCall.signalId}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'call_signals',
          filter: `id=eq.${outgoingCall.signalId}`
        }, (payload) => {
          if (payload.new.status === 'accepted') {
            if (audioRef.current) audioRef.current.pause()
            
            // Success! We can join the voice room.
            setCurrentChannel(outgoingCall.callChannel)
            handleJoinVoice(outgoingCall.callChannel)
            
            setOutgoingCall(null)
          } else if (payload.new.status === 'declined') {
            if (audioRef.current) audioRef.current.pause()
            
            // Temporarily set status to declined for UI feedback
            setOutgoingCall(prev => prev ? { ...prev, declined: true } : null)
            
            setTimeout(() => {
              setOutgoingCall(null)
            }, 2000)
          }
        })
        .subscribe()
    }

    return () => {
      if (audioRef.current) audioRef.current.pause()
      if (channelSub) supabase.removeChannel(channelSub)
    }
  }, [outgoingCall?.signalId])

  const handleCancelCall = async () => {
    if (!outgoingCall) return
    
    await supabase.from('call_signals')
      .update({ status: 'ended' }) // Or declined by caller
      .eq('id', outgoingCall.signalId)
      
    if (audioRef.current) audioRef.current.pause()
    setOutgoingCall(null)
  }

  if (!outgoingCall) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.9 }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[999] w-[340px] bg-[rgba(16,16,38,0.95)] backdrop-blur-2xl rounded-2xl border border-emerald-500/30 shadow-[0_20px_50px_rgba(16,185,129,0.2)] overflow-hidden flex flex-col items-center pointer-events-auto"
      >
        {/* Pulsing ring animation */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 animate-pulse pointer-events-none" />
        
        <div className="w-full p-6 flex flex-col items-center relative z-10">
          <p className="text-white/60 text-xs font-semibold mb-6 flex items-center gap-1.5 uppercase tracking-widest relative z-10 bg-black/40 px-3 py-1 rounded-full border border-white/10">
            <Phone className="w-3.5 h-3.5 text-emerald-400" /> {outgoingCall.declined ? "Call Declined" : "Calling"}
          </p>
          
          {/* Callee Info */}
          <div className="flex flex-col items-center gap-2 relative z-10 w-full">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold border-2 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.3)] ${outgoingCall.friendProfile?.avatar_color || 'bg-[#8b5cf6]'}`}>
              {(outgoingCall.friendProfile?.username || 'U')[0].toUpperCase()}
            </div>
            <h3 className="text-white font-black text-2xl tracking-tight mt-2">{outgoingCall.friendProfile?.username || 'Unknown User'}</h3>
            <span className={`font-medium text-sm animate-pulse flex items-center gap-2 ${outgoingCall.declined ? "text-red-400" : "text-emerald-400"}`}>
              {outgoingCall.declined ? "Recipient declined" : "Waiting for answer..."}
            </span>
          </div>

          <div className="flex w-full justify-between gap-3 mt-8 relative z-10 pointer-events-auto">
            {!outgoingCall.declined && (
              <button 
                onClick={(e) => { e.stopPropagation(); handleCancelCall(); }}
                className="flex-1 py-3.5 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 rounded-xl transition-all flex justify-center items-center gap-2 font-bold cursor-pointer"
              >
                <PhoneOff className="w-5 h-5" /> Cancel Call
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
