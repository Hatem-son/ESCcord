import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useMessages(channelId) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchMessages = useCallback(async () => {
    if (!channelId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        profiles:user_id(username, avatar_color, escord_id)
      `)
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true })
      .limit(50)

    if (!error && data) {
      setMessages(data)
    }
    setLoading(false)
  }, [channelId])

  useEffect(() => {
    fetchMessages()

    if (!channelId) return

    const channel = supabase
      .channel(`messages:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // Need to fetch user profile for the new message in real app,
            // or pass it via trigger. For simplicity, re-fetch or append.
            fetchMessages() 
          } else if (payload.eventType === 'UPDATE') {
            setMessages(prev => prev.map(m => m.id === payload.new.id ? { ...m, ...payload.new } : m))
          } else if (payload.eventType === 'DELETE') {
            setMessages(prev => prev.filter(m => m.id !== payload.old.id))
          }
        }
      )

      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [channelId, fetchMessages])

  const sendMessage = async (content, replyTo = null, file = null) => {
    if (!user || !channelId) return null
    let attachment_url = null
    let attachment_type = null

    if (file) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(fileName, file)

      if (!uploadError && uploadData?.path) {
        const { data } = supabase.storage
          .from('chat-media')
          .getPublicUrl(uploadData.path)
           
        attachment_url = data.publicUrl
        attachment_type = file.type
      } else {
        console.error("Upload error: ", uploadError)
      }
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        channel_id: channelId,
        user_id: user.id,
        content,
        reply_to: replyTo,
        attachment_url,
        attachment_type
      })
      .select()
      .single()
    
    return { data, error }
  }

  const addReaction = async (messageId, emoji) => {
    if (!user) return
    const message = messages.find(m => m.id === messageId)
    if (!message) return
    
    // We treat reactions as a JSONB array stored locally
    const currentReactions = Array.isArray(message.reactions) ? message.reactions : []
    const updatedReactions = [...currentReactions, { user_id: user.id, emoji }]
    
    await supabase.from('messages').update({ reactions: updatedReactions }).eq('id', messageId)
  }

  const removeReaction = async (messageId, emoji) => {
    if (!user) return
    const message = messages.find(m => m.id === messageId)
    if (!message) return
    
    const currentReactions = Array.isArray(message.reactions) ? message.reactions : []
    const updatedReactions = currentReactions.filter(r => !(r.user_id === user.id && r.emoji === emoji))
    
    await supabase.from('messages').update({ reactions: updatedReactions }).eq('id', messageId)
  }

  return { messages, loading, sendMessage, addReaction, removeReaction, refetch: fetchMessages }
}
