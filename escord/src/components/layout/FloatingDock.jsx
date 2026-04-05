import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserPlus, Settings, MessageSquare, LogOut, Mic, MicOff, Headphones, PhoneOff, MonitorUp, MonitorOff, Bot } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useAppContext } from '../../context/AppContext'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/utils'
import { AddFriendModal } from '../social/AddFriendModal'
import { FriendRequests } from '../social/FriendRequests'
import { StreamSettingsModal } from '../voice/StreamSettingsModal'
import { ProfileCard } from '../social/ProfileCard'

export function FloatingDock() {
  const { user, profile, signOut } = useAuth()
  const { 
    currentChannel, 
    setCurrentChannel,
    connectedVoiceChannel,
    handleJoinVoice,
    handleLeaveVoice,
    voiceState,
    currentGroup,
    setCurrentGroup
  } = useAppContext()
  const navigate = useNavigate()
  const [friends, setFriends] = useState([])
  const [requests, setRequests] = useState([])
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false)
  const [isRequestsOpen, setIsRequestsOpen] = useState(false)
  const [isStreamModalOpen, setIsStreamModalOpen] = useState(false)
  const [isMyProfileOpen, setIsMyProfileOpen] = useState(false)
  
  // Hardware States
  // Now derived directly from the global voiceEngine
  const micMuted = voiceState?.isMuted || false;
  const isScreenSharing = voiceState?.isScreenSharing || false;
  const deafened = false; // Add global deafen tracking later if needed

  useEffect(() => {
    if (!user) return

    const fetchFriends = async () => {
      const { data: pending } = await supabase
        .from('friendships')
        .select('*, profiles!requester_id(*)')
        .eq('receiver_id', user.id)
        .eq('status', 'pending')
      if (pending) setRequests(pending)
      
      const { data: accepted1 } = await supabase
        .from('friendships')
        .select('*, profiles!receiver_id(*)')
        .eq('requester_id', user.id)
        .eq('status', 'accepted')
        
      const { data: accepted2 } = await supabase
        .from('friendships')
        .select('*, profiles!requester_id(*)')
        .eq('receiver_id', user.id)
        .eq('status', 'accepted')

      const formatted1 = (accepted1 || []).map(f => ({ ...f, profile: f.profiles }))
      const formatted2 = (accepted2 || []).map(f => ({ ...f, profile: f.profiles }))
      
      setFriends([...formatted1, ...formatted2])
    }
    
    fetchFriends()
  }, [user])

  const acceptRequest = async (id) => {
    await supabase.from('friendships').update({ status: 'accepted' }).eq('id', id)
    setRequests(p => p.filter(r => r.id !== id))
    // Refetch or optimistically update friends list
  }

  const declineRequest = async (id) => {
    await supabase.from('friendships').delete().eq('id', id)
    setRequests(p => p.filter(r => r.id !== id))
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  if (!user) return null

  return (
    <>
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.2 }}
        className="fixed bottom-12 left-6 right-6 z-50 flex items-center justify-between px-4 py-3 bg-[rgba(10,10,24,0.8)] backdrop-blur-xl border border-[rgba(139,92,246,0.3)] rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.6)]"
      >
        
        {/* Left Side: Account Management Group */}
        <div className="flex items-center gap-3 pr-4 md:border-r border-white/10">
          <button 
            onClick={() => setIsMyProfileOpen(true)}
            className="w-10 h-10 rounded-full flex-shrink-0 border border-white/20 shadow-md cursor-pointer hover:border-white/50 transition-colors" 
            style={{ backgroundColor: profile?.avatar_color || '#10b981' }} 
            title="My Profile"
          >
             <span className="font-bold text-white uppercase">{profile?.username?.charAt(0) || 'U'}</span>
          </button>
          
          <div className="flex flex-col min-w-0 pr-2 hidden md:flex">
            <span className="text-sm font-bold text-white truncate leading-none mb-1">
              {profile?.username || 'User'}
            </span>
            <span className="text-[11px] text-white/40 truncate leading-none font-medium">
              #{profile?.escord_id || '0000'}
            </span>
          </div>
          
          <button 
            onClick={() => alert("Settings Page: To be implemented!")}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition-colors cursor-pointer relative z-50" 
            title="Settings"
          >
            <Settings className="w-4 h-4 relative pointer-events-none" />
          </button>
          
          <button 
            onClick={handleSignOut}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-red-500/50 hover:bg-red-500/20 hover:text-red-400 transition-colors" 
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-white/10 mx-2 hidden md:block" />
          
          <button 
            onClick={() => setIsAddFriendOpen(true)}
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all hover:scale-110 relative"
            title="Add Friend"
          >
            <UserPlus className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => {
              setCurrentGroup(null)
              setIsRequestsOpen(!isRequestsOpen)
            }}
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110 relative",
              !currentGroup ? "bg-[#8b5cf6] text-white shadow-[0_0_15px_rgba(139,92,246,0.4)]" : "bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"
            )}
            title="Direct Messages"
          >
            <MessageSquare className="w-5 h-5" />
            {requests.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold flex items-center justify-center text-white">
                {requests.length}
              </span>
            )}
          </button>
          
        </div>

        {/* Center/Actions Group */}
        <div className="flex items-center flex-1 justify-center gap-2 px-2">

        {/* Voice Hardware Controls (Persistent across tabs) */}
        <AnimatePresence mode="wait">
          {connectedVoiceChannel && voiceState?.inRoom ? (
              <motion.div 
              key="active-voice"
              initial={{ width: 0, opacity: 0, padding: 0 }}
              animate={{ width: 'auto', opacity: 1, padding: '0 4px' }}
              exit={{ width: 0, opacity: 0, padding: 0 }}
              className="flex items-center gap-1.5 overflow-hidden mx-auto"
            >
              <div className="flex flex-col pr-4 hidden md:flex min-w-0 max-w-[120px]">
                <span className="text-xs text-[#10b981] font-bold leading-tight flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" /> 
                  Voice Connected
                </span>
                <span className="text-[10px] text-white/40 truncate font-medium">#{connectedVoiceChannel.name}</span>
              </div>

              <div className="flex items-center gap-1 bg-black/40 border border-white/5 p-1 rounded-full shadow-inner">
                <button 
                  onClick={() => voiceState.toggleMute()}
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center transition-all",
                    micMuted ? "bg-red-500/10 text-red-400 hover:bg-red-500/20" : "text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                  title={micMuted ? "Unmute" : "Mute"}
                >
                  <motion.div whileTap={{ scale: 0.9 }}>
                    {micMuted ? <MicOff className="w-[18px] h-[18px]" /> : <Mic className="w-[18px] h-[18px]" />}
                  </motion.div>
                </button>

                <button 
                  onClick={() => {}} // Deafen toggle
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center transition-all",
                    deafened ? "bg-red-500/10 text-red-400 hover:bg-red-500/20" : "text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                  title={deafened ? "Undeafen" : "Deafen"}
                >
                  <motion.div whileTap={{ scale: 0.9 }}>
                    <Headphones className="w-[18px] h-[18px]" />
                  </motion.div>
                </button>

                <button 
                  onClick={() => {
                    if (isScreenSharing) {
                      voiceState.toggleScreenShare()
                    } else {
                      setIsStreamModalOpen(true)
                    }
                  }}
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center transition-all",
                    isScreenSharing ? "bg-violet-500 text-white shadow-[0_0_12px_rgba(139,92,246,0.6)]" : "text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                  title={isScreenSharing ? "Stop Screen Share" : "Share Screen"}
                >
                  <motion.div whileTap={{ scale: 0.9 }}>
                    {isScreenSharing ? <MonitorOff className="w-[18px] h-[18px]" /> : <MonitorUp className="w-[18px] h-[18px]" />}
                  </motion.div>
                </button>

                <div className="w-px h-5 bg-white/10 mx-0.5" />

                <button 
                  onClick={handleLeaveVoice}
                  className="w-9 h-9 rounded-full flex items-center justify-center bg-red-500 hover:bg-red-600 text-white transition-all shadow-[0_4px_12px_rgba(239,68,68,0.3)] ml-0.5"
                  title="Disconnect"
                >
                  <motion.div whileTap={{ scale: 0.9 }}>
                    <PhoneOff className="w-[18px] h-[18px]" />
                  </motion.div>
                </button>
              </div>
            </motion.div>

          ) : currentChannel?.type === 'voice' ? (
            <motion.div 
              key="pending-voice"
              initial={{ width: 0, opacity: 0, padding: 0 }}
              animate={{ width: 'auto', opacity: 1, padding: '0 8px' }}
              exit={{ width: 0, opacity: 0, padding: 0 }}
              className="flex items-center gap-2 mx-auto"
            >
              <button 
                onClick={() => {
                  handleJoinVoice(currentChannel);
                  // Allow state to settle before requesting hardware stream, passing explicit ID!
                  setTimeout(() => voiceState?.joinRoom(currentChannel.id), 50);
                }}
                className="bg-[#10b981] hover:bg-[#059669] text-white px-6 py-2 rounded-xl font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all overflow-hidden flex items-center gap-2 group flex-shrink-0"
              >
                <PhoneOff className="w-4 h-4 group-hover:-rotate-12 transition-transform" />
                <span className="whitespace-nowrap">Join #{currentChannel.name}</span>
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
        </div>

        {/* Right Side: Friends Map */}
        <div className="flex items-center justify-end gap-2 pr-2 md:border-l border-white/10 pl-4">
          {friends.length === 0 && <span className="text-sm text-white/30 px-2 italic">No active friends</span>}
          
          {friends.map(friend => {
            // Determine light based on status. For now, mock random status if needed, or default green
            const statusColor = '#22c55e' // Green online
            const name = friend.profile?.username || 'Unknown'
            
            return (
              <motion.button
                key={friend.id}
                whileHover={{ scale: 1.15, y: -4 }}
                whileTap={{ scale: 0.95 }}
                className="relative group w-12 h-12 rounded-full overflow-hidden border-2 border-transparent hover:border-[#8b5cf6] transition-all"
                style={{ 
                  boxShadow: `0 4px 12px ${statusColor}40`, // Lighting effect
                  backgroundColor: friend.profile?.avatar_color || '#8b5cf6'
                }}
                title={name}
              >
                <span className="font-bold text-white uppercase">{name.charAt(0)}</span>
                
                {/* Lighting Status Indicator */}
                <div 
                  className="absolute bottom-0 left-0 right-0 h-1/2 opacity-60 blur-md pointer-events-none"
                  style={{ background: `linear-gradient(to top, ${statusColor}, transparent)` }}
                />
              </motion.button>
            )
          })}
        </div>

      </motion.div>

      {/* Menus mounted above dock */}
      <AnimatePresence>
        {isRequestsOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-28 left-1/2 -translate-x-1/2 z-40 w-80 glass-card p-4"
          >
            <div className="flex items-center justify-between mb-3 ml-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/40">Friend Requests</h3>
              <button onClick={() => setIsRequestsOpen(false)} className="text-white/40 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <FriendRequests requests={requests} onAccept={acceptRequest} onDecline={declineRequest} />
          </motion.div>
        )}
      </AnimatePresence>
      <ProfileCard 
        profile={profile} 
        isOpen={isMyProfileOpen} 
        onClose={() => setIsMyProfileOpen(false)} 
      />
      
      <StreamSettingsModal 
        isOpen={isStreamModalOpen} 
        onClose={() => setIsStreamModalOpen(false)} 
      />

      <AddFriendModal isOpen={isAddFriendOpen} onClose={() => setIsAddFriendOpen(false)} />
      
      <StreamSettingsModal 
        isOpen={isStreamModalOpen} 
        onClose={() => setIsStreamModalOpen(false)} 
        onGoLive={(config) => voiceState?.toggleScreenShare(config)}
      />
    </>
  )
}
