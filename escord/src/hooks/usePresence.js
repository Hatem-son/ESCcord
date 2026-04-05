import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function usePresence(channelId) {
  const { user, profile } = useAuth()
  const [typingUsers, setTypingUsers] = useState([])
  const [channel, setChannel] = useState(null)

  useEffect(() => {
    if (!channelId || !user) return

    const room = supabase.channel(`presence:${channelId}`, {
      config: { presence: { key: user.id } }
    })

    room
      .on('presence', { event: 'sync' }, () => {
        const state = room.presenceState()
        
        // Extract typing users from presence state
        const typing = []
        for (const [id, presences] of Object.entries(state)) {
          if (id !== user.id && presences[0]?.isTyping) {
            typing.push(presences[0])
          }
        }
        setTypingUsers(typing)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await room.track({ 
            id: user.id, 
            username: profile?.username, 
            isTyping: false 
          })
        }
      })

    setChannel(room)

    return () => {
      supabase.removeChannel(room)
    }
  }, [channelId, user, profile])

  const setTyping = useCallback(async (isTyping) => {
    if (channel && user) {
      await channel.track({ 
        id: user.id, 
        username: profile?.username, 
        isTyping 
      })
    }
  }, [channel, user, profile])

  return { typingUsers, setTyping }
}
