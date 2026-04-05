import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  startRingtone,
  stopRingtone,
  playCallJoined,
  playCallDeclined
} from '../lib/sounds'

export function useIncomingCall(currentUserId) {
  const [incomingCall, setIncomingCall] = useState(null)

  useEffect(() => {
    if (!currentUserId) return

    const channel = supabase
      .channel(`call:${currentUserId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'call_signals',
        filter: `receiver_id=eq.${currentUserId}`
      }, async (payload) => {
        if (payload.new.status !== 'ringing') return
        
        // Try fetching profile gracefully (if available)
        let caller = { id: payload.new.caller_id, username: 'Bilinmeyen Kullanıcı' }
        try {
           const { data } = await supabase.from('profiles').select('*').eq('id', payload.new.caller_id).single()
           if (data) caller = data
        } catch (e) {
           console.log("Mock caller mode")
        }

        setIncomingCall({ caller, signalId: payload.new.id, channelId: payload.new.channel_id })
        startRingtone()
      })

      // Caller listens for acceptance or decline to trigger respective sounds
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'call_signals',
        filter: `caller_id=eq.${currentUserId}`
      }, (payload) => {
        if (payload.new.status === 'accepted') {
          playCallJoined()
        }
        if (payload.new.status === 'declined') {
          playCallDeclined()
        }
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [currentUserId])

  // Receiver actions
  const acceptCall = async () => {
    console.log("ACCEPT CALL TRIGGERED!", incomingCall)
    if (!incomingCall) {
      console.log("NO INCOMING CALL OBJECT, ABORTING!")
      return
    }
    console.log("Updating Supabase...", incomingCall.signalId)
    supabase.from('call_signals')
      .update({ status: 'accepted' })
      .eq('id', incomingCall.signalId)
      .then(() => console.log("Accept signal sent!"))
      .catch((e) => { console.error("Supabase Error Accept:", e) })

    console.log("Supabase Update returned, playing sound...")
    playCallJoined()
    const targetChannel = incomingCall.channelId
    console.log("Setting IncomingCall state to NULL...")
    setIncomingCall(null)
    return targetChannel
  }

  const declineCall = async () => {
    console.log("DECLINE CALL TRIGGERED!", incomingCall)
    if (!incomingCall) {
      console.log("NO INCOMING CALL OBJECT, ABORTING!")
      return
    }
    console.log("Updating Supabase Decline...", incomingCall.signalId)
    supabase.from('call_signals')
      .update({ status: 'declined' })
      .eq('id', incomingCall.signalId)
      .then(() => console.log("Decline signal sent!"))
      .catch((e) => { console.error("Supabase Error Decline:", e) })

    console.log("Supabase Update returned, playing sound...")
    stopRingtone()
    console.log("Setting IncomingCall state to NULL...")
    setIncomingCall(null)
  }

  return { incomingCall, acceptCall, declineCall }
}
