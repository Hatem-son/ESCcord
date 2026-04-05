import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useUnread() {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user) return

    // Simply tracking unread friend requests for the social Phase.
    // In a full app, this would also query message_reads comparing against total messages.
    const fetchUnread = async () => {
      const { count } = await supabase
        .from('friendships')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('status', 'pending')
      
      setUnreadCount(count || 0)
    }

    fetchUnread()

    const channel = supabase
      .channel('public:friendships')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'friendships', filter: `receiver_id=eq.${user.id}` },
        () => fetchUnread()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  return { unreadCount }
}
