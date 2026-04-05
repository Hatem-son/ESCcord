import React from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { MessageSquare, UserPlus, Phone } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export function ProfileCard({ profile, isOpen, onClose, stylePosition }) {
  const { user } = useAuth()
  if (!profile) return null

  const statusColor = {
    online: 'bg-green-500',
    busy: 'bg-red-500',
    away: 'bg-yellow-500',
    offline: 'bg-gray-500'
  }[profile.status] || 'bg-gray-500'

  const handleCall = async () => {
    if (!user) return
    await supabase.from('call_signals').insert({
      caller_id: user.id,
      receiver_id: profile.id,
      channel_id: `dm_${profile.id}_${user.id}`,
      status: 'ringing'
    })
    onClose() // Custom addition to dismiss the profile card on call
  }

  // 3D Tilt Effect Logic
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 })
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 })

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"])
  
  const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ["100%", "0%"])
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ["100%", "0%"])

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const xPct = mouseX / width - 0.5
    const yPct = mouseY / height - 0.5
    x.set(xPct)
    y.set(yPct)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10, rotateX: 0, rotateY: 0 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10, rotateX: 0, rotateY: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            style={{ 
              ...stylePosition || { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
              rotateX,
              rotateY,
              transformStyle: "preserve-3d"
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="fixed z-[70] w-72 glass-card overflow-hidden shadow-[0_30px_60px_-12px_rgba(0,0,0,0.8)] border border-white/10 group"
          >
            {/* Glare Effect Overlay */}
            <motion.div 
              className="absolute inset-0 z-50 pointer-events-none rounded-xl"
              style={{
                background: "linear-gradient(105deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0) 100%)",
                backgroundSize: "200% 200%",
                backgroundPositionX: glareX,
                backgroundPositionY: glareY,
                mixBlendMode: "overlay"
              }}
            />
            
            {/* Inner Content wrapper with Z-translation for parallax */}
            <div style={{ transform: "translateZ(30px)" }} className="relative bg-[#09090b]/80 backdrop-blur-xl h-full w-full">
              {/* Banner */}
            <div className="h-20 w-full" style={{ backgroundColor: profile.avatar_color }} />
            
            {/* Avatar & Status */}
            <div className="relative px-4 pb-4">
              <div className="relative w-20 h-20 -mt-10 mb-3 rounded-full border-[6px] border-[#09090b] flex items-center justify-center text-2xl font-bold bg-white text-black overflow-hidden bg-cover bg-center" style={profile.avatar_url ? {} : { backgroundColor: profile.avatar_color || '#fff' }}>
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} className="w-full h-full object-cover" alt="Profile" />
                ) : (
                  profile.username.charAt(0).toUpperCase()
                )}
                <div className={`absolute bottom-0 right-0 w-5 h-5 ${statusColor} rounded-full border-4 border-[#09090b] z-10`} />
              </div>
              
              <div>
                <h3 className="font-bold text-xl leading-none flex items-center gap-2">
                  {profile.username}
                </h3>
                <p className="text-sm text-white/50 mb-4">#{profile.escord_id}</p>
                
                {profile.custom_status && (
                  <div className="bg-black/30 p-2 rounded-lg text-sm mb-4 border border-white/5">
                    {profile.custom_status}
                  </div>
                )}
                
                <div className="mb-4">
                  <h4 className="text-xs font-bold text-white/40 uppercase mb-1">About Me</h4>
                  <p className="text-sm text-white/80">{profile.bio || "This user hasn't set a bio yet."}</p>
                </div>

                <div className="mb-4 text-xs text-white/40">
                  Member since {new Date(profile.created_at).toLocaleDateString()}
                  <br />
                  Last seen {formatDistanceToNow(new Date(profile.last_seen_at), { addSuffix: true })}
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 glass-button bg-[#10b981] hover:bg-[#34d399] border-transparent text-white py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold transition-colors">
                    <MessageSquare className="w-4 h-4" /> Message
                  </button>
                  <button 
                    onClick={handleCall}
                    className="flex-1 glass-button bg-violet-600 hover:bg-violet-500 border-transparent text-white py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold transition-colors shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                    <Phone className="w-4 h-4 text-emerald-300" /> Call
                  </button>
                  <button className="glass-button p-2 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors hover:bg-white/10 border-transparent shadow-[0_0_10px_rgba(255,255,255,0.05)]">
                    <UserPlus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
