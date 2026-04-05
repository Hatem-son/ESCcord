import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useWatch(channelId) {
  const { user } = useAuth()
  const [session, setSession] = useState(null)
  const [viewers, setViewers] = useState([])

  useEffect(() => {
    if (!channelId || !user) return

    const fetchSession = async () => {
      let { data } = await supabase
        .from('watch_sessions')
        .select('*')
        .eq('channel_id', channelId)
        .limit(1)
        .maybeSingle()
      
      if (!data) {
        const { data: newSession } = await supabase
          .from('watch_sessions')
          .insert({ channel_id: channelId })
          .select()
          .limit(1)
          .maybeSingle()
        data = newSession
      }
      setSession(data)
    }
    
    fetchSession()

    const dbChannel = supabase
      .channel(`watch_db:${channelId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'watch_sessions', filter: `channel_id=eq.${channelId}` },
        (payload) => setSession(payload.new)
      )
      .subscribe()

    const presenceChannel = supabase.channel(`watch_presence:${channelId}`, {
      config: { presence: { key: user.id } }
    })

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState()
        const currentViewers = []
        for (const presences of Object.values(state)) {
          currentViewers.push(presences[0])
        }
        setViewers(currentViewers)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ id: user.id })
        }
      })

    return () => {
      supabase.removeChannel(dbChannel)
      supabase.removeChannel(presenceChannel)
    }
  }, [channelId, user])

  const updateSession = useCallback(async (updates) => {
    if (!session || !user) return
    
    // Optimistic update locally
    setSession(prev => ({ ...prev, ...updates, updated_by: user.id }))
    
    await supabase
      .from('watch_sessions')
      .update({ ...updates, updated_by: user.id, updated_at: new Date().toISOString() })
      .eq('id', session.id)
  }, [session, user])

  const addToQueue = useCallback(async (video) => {
    if (!session || !user) return
    const currentQueue = session.queue || []
    await updateSession({ queue: [...currentQueue, video] })
  }, [session, user, updateSession])

  const removeFromQueue = useCallback(async (index) => {
    if (!session || !user) return
    const currentQueue = session.queue || []
    await updateSession({ queue: currentQueue.filter((_, i) => i !== index) })
  }, [session, user, updateSession])

  const playNextInQueue = useCallback(async () => {
    if (!session || !user) return
    const currentQueue = session.queue || []
    if (currentQueue.length === 0) return
    
    const nextVideo = currentQueue[0]
    const remainingQueue = currentQueue.slice(1)
    
    await updateSession({ 
      yt_video_id: nextVideo.id, 
      current_time: 0, 
      is_playing: true,
      queue: remainingQueue 
    })
  }, [session, user, updateSession])

  return { session, viewers, updateSession, addToQueue, removeFromQueue, playNextInQueue }
}
