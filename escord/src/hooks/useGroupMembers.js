import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useGroupMembers(groupId) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!groupId) {
      setMembers([])
      return
    }

    const fetchMembers = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          user_id,
          role,
          profiles (
            id,
            username,
            avatar_url,
            avatar_color,
            custom_status
          )
        `)
        .eq('group_id', groupId)

      if (!error && data) {
        // Format to a flatter structure
        const formatted = data.map(m => ({
          ...m.profiles,
          role: m.role
        }))
        setMembers(formatted)
      } else {
        setMembers([])
      }
      setLoading(false)
    }

    fetchMembers()

    // Real-time subscription for group member changes
    const channel = supabase.channel(`group_members_${groupId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'group_members', 
        filter: `group_id=eq.${groupId}` 
      }, () => {
        fetchMembers()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [groupId])

  return { members, loading }
}
