import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { useVoice } from '../hooks/useVoice'

const AppContext = createContext()

export function AppProvider({ children }) {
  const { user } = useAuth()
  
  // Widget states
  const [activeWidgetId, setActiveWidgetId] = useState(null)
  
  // Navigation states
  const [currentChannel, setCurrentChannel] = useState(null)
  const [currentGroup, setCurrentGroup] = useState(null)
  
  // Data layer states
  const [userGroups, setUserGroups] = useState([])
  const [groupChannels, setGroupChannels] = useState([])
  const [loadingGroups, setLoadingGroups] = useState(true)

  // Voice engine states
  const [connectedVoiceChannel, setConnectedVoiceChannel] = useState(null)
  
  // Call dialing states
  const [outgoingCall, setOutgoingCall] = useState(null)
  
  // Global Presence State
  const [onlineUserIds, setOnlineUserIds] = useState([])
  
  // The global voice engine runs persistently!
  const voiceState = useVoice(connectedVoiceChannel?.id)

  const handleJoinVoice = (channel) => {
    setConnectedVoiceChannel(channel)
    // Give it a tiny delay to allow state to settle before joining, though useVoice internally
    // reacts to channelId changes. wait, useVoice connects instantly when joinRoom is called.
  }

  const handleLeaveVoice = () => {
    voiceState.leaveRoom()
    setConnectedVoiceChannel(null)
  }

  // Fetch groups and setup presence when user logs in
  useEffect(() => {
    if (!user) {
      setUserGroups([])
      setLoadingGroups(false)
      setOnlineUserIds([])
      return
    }

    // Global Presence Setup
    const presenceChannel = supabase.channel('global_presence', {
      config: { presence: { key: user.id } },
    })

    presenceChannel.on('presence', { event: 'sync' }, () => {
      const state = presenceChannel.presenceState()
      setOnlineUserIds(Object.keys(state))
    })

    presenceChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await presenceChannel.track({ online_at: new Date().toISOString() })
      }
    })

    const fetchGroups = async () => {
      setLoadingGroups(true)
      // Since user is in `group_members`, we join through it to get the group details
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          group_id,
          role,
          groups (*)
        `)
        .eq('user_id', user.id)

      let parsedGroups = [];
      if (!error && data) {
        parsedGroups = data.map(m => m.groups).filter(Boolean)
      }

      // Inject LocalStorage Mocks (Scoped to user!)
      try {
        const existingMocks = JSON.parse(localStorage.getItem(`es_mock_groups_${user.id}`) || '[]');
        if (existingMocks.length > 0) {
          parsedGroups = [...parsedGroups, ...existingMocks];
        }
      } catch (e) {}

      setUserGroups(parsedGroups)
      
      setLoadingGroups(false)
    }

    fetchGroups()
    
    // Subscribe to new group joins for this user
    const groupSub = supabase.channel('group_members_sub')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_members', filter: `user_id=eq.${user.id}` }, () => {
        fetchGroups() // Refresh groups on changes
      })
      .subscribe()

    return () => {
      supabase.removeChannel(groupSub)
      supabase.removeChannel(presenceChannel)
    }
  }, [user])

  // Fetch channels when group changes
  useEffect(() => {
    if (!currentGroup) {
      setGroupChannels([])
      // Only clear the channel if it's a server channel. Prevents killing DM channels
      // when we set currentGroup to null to enter the DM view.
      setCurrentChannel(prev => (prev?.is_dm ? prev : null))
      return
    }

    const fetchChannels = async () => {
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .eq('group_id', currentGroup.id)
        .order('created_at', { ascending: true })

      let finalChannels = [];
      if (!error && data && data.length > 0) {
        finalChannels = data;
      } else if (currentGroup.channels && currentGroup.channels.length > 0) {
        // Fallback for mock groups that have embedded channels
        finalChannels = currentGroup.channels;
      }

      setGroupChannels(finalChannels)
      if (finalChannels.length > 0) {
        const firstText = finalChannels.find(c => c.type === 'text')
        setCurrentChannel(firstText || finalChannels[0])
      } else {
        setCurrentChannel(null)
      }
    }

    fetchChannels()
    
    // Subscribe to channel changes for this specific group
    const channelSub = supabase.channel(`channels_sub:${currentGroup.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'channels', filter: `group_id=eq.${currentGroup.id}` }, () => {
        fetchChannels()
      })
      .subscribe()

    return () => supabase.removeChannel(channelSub)
  }, [currentGroup?.id])

  return (
    <AppContext.Provider value={{
      activeWidgetId,
      setActiveWidgetId,
      currentChannel,
      setCurrentChannel,
      currentGroup,
      setCurrentGroup,
      userGroups,
      setUserGroups, // Added for mock fallbacks
      groupChannels,
      setGroupChannels, // Added for mock fallbacks
      loadingGroups,
      connectedVoiceChannel,
      handleJoinVoice,
      handleLeaveVoice,
      voiceState,
      outgoingCall,
      setOutgoingCall,
      onlineUserIds
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useAppContext = () => useContext(AppContext)
