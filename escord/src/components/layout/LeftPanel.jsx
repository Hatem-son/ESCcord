import React, { useState, useEffect } from 'react'
import { Hash, Volume2, Search, Plus, MessageCircleMore, User } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAppContext } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

export function LeftPanel() {
  const { currentGroup, groupChannels, currentChannel, setCurrentChannel, connectedVoiceChannel, voiceState } = useAppContext()
  const { profile, user } = useAuth() // Grab profile here for passing down if needed, but it's simpler to just let ChannelItem import useAuth
  const [isCreatingChannel, setIsCreatingChannel] = useState(false)
  const [newChannelName, setNewChannelName] = useState('')
  const [newChannelType, setNewChannelType] = useState('text')
  const [friends, setFriends] = useState([])

  useEffect(() => {
    if (!user || currentGroup) return

    const fetchFriends = async () => {
      const { data: accepted1 } = await supabase
        .from('friendships')
        .select('*, friend:profiles!receiver_id(*)')
        .eq('requester_id', user.id)
        .eq('status', 'accepted')
        
      const { data: accepted2 } = await supabase
        .from('friendships')
        .select('*, friend:profiles!requester_id(*)')
        .eq('receiver_id', user.id)
        .eq('status', 'accepted')

      setFriends([...(accepted1||[]), ...(accepted2||[])])
    }
    
    fetchFriends()
  }, [user, currentGroup])

  const handleCreateChannel = async (e) => {
    e.preventDefault()
    if (!newChannelName.trim() || !currentGroup) return
    
    await supabase.from('channels').insert({
      group_id: currentGroup.id,
      name: newChannelName.trim().toLowerCase().replace(/\s+/g, '-'),
      type: newChannelType
    })
    setIsCreatingChannel(false)
    setNewChannelName('')
  }

  const textChannels = groupChannels.filter(c => c.type === 'text')
  const voiceChannels = groupChannels.filter(c => c.type === 'voice')

  return (
    <div className="flex flex-col w-full h-full overflow-hidden relative">
      <div className="p-3 flex-1 overflow-y-auto">
        {!currentGroup ? (
          <div className="mt-4">
            <div className="flex items-center justify-between group mb-2 pl-2 pr-1">
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider">Direct Messages</h3>
            </div>
            {friends.length === 0 ? (
              <p className="text-xs text-white/30 text-center mt-6">Add friends to chat with them here.</p>
            ) : (
              <div className="space-y-0.5">
                {friends.map(f => {
                  const friendProfile = f.friend
                  if (!friendProfile) return null
                  const dmChannelId = [user?.id, friendProfile.id].sort().join('_')
                  
                  return (
                    <div 
                      key={dmChannelId}
                      onClick={() => setCurrentChannel({
                        id: dmChannelId,
                        name: friendProfile.username,
                        type: 'text',
                        is_dm: true,
                        friend_id: friendProfile.id,
                        friend_profile: friendProfile
                      })}
                      className={`flex items-center gap-3 px-2 py-2 rounded-md cursor-pointer transition-colors ${
                        currentChannel?.id === dmChannelId ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-[0_0_10px_rgba(0,0,0,0.2)] text-sm flex-shrink-0 relative" style={{ backgroundColor: friendProfile.avatar_color || '#8b5cf6' }}>
                        {friendProfile.username.charAt(0).toUpperCase()}
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-black" />
                      </div>
                      <span className="text-sm font-medium truncate leading-tight flex-1">{friendProfile.username}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className="flex items-center justify-between group mb-2 pr-1">
                <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider">Text Channels</h3>
                <button 
                  onClick={() => { setIsCreatingChannel(true); setNewChannelType('text'); }}
                  className="text-white/40 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-0.5">
                {textChannels.map(channel => (
                  <ChannelItem 
                    key={channel.id} 
                    type="text"
                    channel={channel} 
                    active={currentChannel?.id === channel.id} 
                    onClick={() => setCurrentChannel(channel)}
                  />
                ))}
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between group mb-2 pr-1">
                <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider">Voice Channels</h3>
                <button 
                  onClick={() => { setIsCreatingChannel(true); setNewChannelType('voice'); }}
                  className="text-white/40 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-0.5">
                {voiceChannels.map(channel => (
                  <ChannelItem 
                    key={channel.id} 
                    type="voice"
                    channel={channel} 
                    active={currentChannel?.id === channel.id} 
                    onClick={() => setCurrentChannel(channel)}
                    isConnectedVoice={connectedVoiceChannel?.id === channel.id}
                    liveVoiceState={connectedVoiceChannel?.id === channel.id ? voiceState : null}
                  />
                ))}
              </div>
            </div>

            {/* Quick Inline Create Channel Flow */}
            {isCreatingChannel && (
              <form onSubmit={handleCreateChannel} className="mt-2 bg-black/40 p-2 rounded-lg border border-white/10">
                <div className="flex gap-2">
                  <span className="text-white/40 text-sm py-1">{newChannelType === 'text' ? '#' : <Volume2 className="w-4 h-4 mt-0.5" />}</span>
                  <input 
                    autoFocus
                    type="text"
                    placeholder="channel-name"
                    value={newChannelName}
                    onChange={e => setNewChannelName(e.target.value)}
                    className="bg-transparent border-none text-sm text-white focus:outline-none w-full"
                  />
                </div>
                <div className="flex justify-end gap-2 mt-2">
                  <button type="button" onClick={() => setIsCreatingChannel(false)} className="text-xs text-white/40 hover:text-white">Cancel</button>
                  <button type="submit" className="text-xs text-[#10b981] font-bold">Create</button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function ChannelItem({ type, channel, active, onClick, isConnectedVoice, liveVoiceState }) {
  const { profile } = useAuth()
  // Visual Demonstrations for Voice Participants and Typing Indicators
  const isTyping = type === 'text' && channel.name === 'general';
  const isLounge = type === 'voice' && channel.name === 'lounge';

  let voiceUsers = [];
  
  if (isConnectedVoice && liveVoiceState) {
    // If we are actively connected to THIS channel, read the real state!
    const otherParticipants = liveVoiceState.participants.filter(p => p.id !== profile?.id)
    const baseParticipants = otherParticipants.map(p => ({ id: p.id, name: p.username, color: p.avatar || '#8b5cf6' }))
    
    // Push ourselves to the list if we're in the room!
    if (liveVoiceState.inRoom) {
      voiceUsers = [
        { id: 'local', name: profile?.username || 'You', color: profile?.avatar_color || '#3b82f6' },
        ...baseParticipants
      ]
    } else {
      voiceUsers = baseParticipants
    }
  }

  const hasVoiceParticipants = type === 'voice' && voiceUsers.length > 0;
  const typingUser = { name: 'Echo', color: '#8b5cf6' };

  return (
    <div className="group/channel mb-0.5">
      <div 
        onClick={onClick}
        className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
          active ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/5 hover:text-white'
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden flex-1">
          {type === 'text' && (
             <div className="relative flex-shrink-0">
               <Hash className="w-4 h-4 opacity-70" />
             </div>
          )}
          {type === 'voice' && <Volume2 className="w-4 h-4 opacity-70 flex-shrink-0" />}
          <span className="text-sm font-medium truncate leading-tight">{channel.name}</span>
        </div>
        
        {/* Right side quick count */}
        {hasVoiceParticipants && (
           <div className="flex -space-x-1 mt-0.5 flex-shrink-0">
             {voiceUsers.map((u, i) => (
               <div key={i} className="w-4 h-4 rounded-full border border-[#16163a] flex items-center justify-center text-[7px] font-bold text-white shadow-sm" style={{ backgroundColor: u.color, zIndex: 10 - i }}>
                 {u.name.charAt(0)}
               </div>
             ))}
           </div>
        )}
      </div>

      {/* Expanded Voice List */}
      {hasVoiceParticipants && (
        <div className="pl-6 pr-2 py-1 flex flex-col gap-1">
           {voiceUsers.map((u, i) => (
             <div key={i} className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-white/5 cursor-pointer group/user">
               <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm relative overflow-hidden" style={{ backgroundColor: u.color }}>
                 {u.name.charAt(0)}
               </div>
               <span className="text-xs text-white/50 group-hover/user:text-white/90 truncate">{u.name}</span>
             </div>
           ))}
        </div>
      )}
    </div>
  )
}
