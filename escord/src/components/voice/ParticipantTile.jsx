import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Mic, MicOff } from 'lucide-react'

export function ParticipantTile({ participant, isLocal, localStream, isScreenShare = false }) {
  const audioRef = useRef(null)
  const videoRef = useRef(null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const animationRef = useRef(null)

  const stream = isLocal ? localStream : participant.stream

  useEffect(() => {
    if (!stream) return

    if (audioRef.current && !isLocal) {
      audioRef.current.srcObject = stream
    }

    // Check for video tracks for screen share
    const hasVideo = stream.getVideoTracks().length > 0
    if (videoRef.current && hasVideo) {
      videoRef.current.srcObject = stream
    }

    // Track mute status
    const audioTrack = stream.getAudioTracks()[0]
    if (audioTrack) {
      const updateMute = () => setIsMuted(!audioTrack.enabled)
      updateMute() // initial state
      // Note: native 'mute'/'unmute' events on track often don't fire reliable for local manual toggle,
      // but they work for remote tracks or HW mutes.
      audioTrack.addEventListener('mute', updateMute)
      audioTrack.addEventListener('unmute', updateMute)
      
      // We also check periodically if it's local since we toggle it manually
      let i = setInterval(updateMute, 500)
      
      let source = null
      let animationFrameId = null
      let audioCtx = null
      
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)()
        const analyser = audioCtx.createAnalyser()
        source = audioCtx.createMediaStreamSource(stream)
        source.connect(analyser)
        analyser.fftSize = 256
        const dataArray = new Uint8Array(analyser.frequencyBinCount)

        const checkVolume = () => {
          analyser.getByteFrequencyData(dataArray)
          let sum = 0
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i]
          }
          const average = sum / dataArray.length
          setIsSpeaking(average > 15 && audioTrack.enabled)
          animationFrameId = requestAnimationFrame(checkVolume)
        }
        checkVolume()
      } catch (err) {
        console.warn("Audio analysis fallback triggered (likely mock stream)", err)
      }

      return () => {
        clearInterval(i)
        if (animationFrameId) cancelAnimationFrame(animationFrameId)
        audioTrack.removeEventListener('mute', updateMute)
        audioTrack.removeEventListener('unmute', updateMute)
        if (source) {
          try { source.disconnect() } catch(e){}
        }
        if (audioCtx && audioCtx.state !== 'closed') {
          audioCtx.close().catch(console.error)
        }
      }
    }
  }, [stream, isLocal])

  const hasVideo = stream && stream.getVideoTracks().length > 0

  return (
    <div 
      className={`relative w-full h-full min-h-[150px] rounded-2xl bg-[#0a0a18] border-2 overflow-hidden transition-all duration-300 flex items-center justify-center ${
        isSpeaking ? 'border-[#10b981] shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'border-white/10'
      }`}
    >
      {!isLocal && <audio ref={audioRef} autoPlay />}
      
      {hasVideo ? (
        <video ref={videoRef} autoPlay muted={isLocal} className={`w-full h-full ${isScreenShare ? 'object-contain bg-black' : 'object-cover'}`} />
      ) : (
        <div 
          className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-xl transition-all duration-300 ${isSpeaking ? 'scale-110 shadow-[0_0_30px_rgba(16,185,129,0.5)]' : ''}`}
          style={{ backgroundColor: participant?.avatar || '#8b5cf6' }}
        >
          {participant?.username?.charAt(0).toUpperCase() || '?'}
        </div>
      )}

      {/* Static Overlay Nameplate */}
      <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md flex items-center gap-2 max-w-[80%] border border-white/5">
        <div className="text-sm font-semibold text-white truncate">
          {participant?.username || 'Guest'}{isLocal && ' (You)'}
        </div>
        {isMuted && <MicOff className="w-3.5 h-3.5 text-red-500 shrink-0" />}
        {isSpeaking && !isMuted && <Mic className="w-3.5 h-3.5 text-[#10b981] shrink-0" />}
      </div>
    </div>
  )
}
