import { useState, useEffect, useRef, useCallback } from 'react'
import Peer from 'peerjs'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export function useVoice(channelId) {
  const { user, profile } = useAuth()
  const [inRoom, setInRoom] = useState(false)
  const [participants, setParticipants] = useState([])
  const [isMuted, setIsMuted] = useState(false)
  const [isDeafened, setIsDeafened] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [localStream, setLocalStream] = useState(null)
  const [screenStream, setScreenStream] = useState(null)
  
  const peerRef = useRef(null)
  const callsRef = useRef({})
  const channelRef = useRef(null)
  const deafenRef = useRef(false)

  const joinRoom = useCallback(async (explicitChannelId) => {
    const targetChannel = explicitChannelId || channelId;
    if (!targetChannel) return
        // Fallback UI Simulation if authentication fails
    const currentUser = user || { id: 'mock-user' };
    try {
      const savedInput = localStorage.getItem('escord_audio_in')
      
      const audioConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        ...(savedInput && savedInput !== 'default' ? { deviceId: { exact: savedInput } } : {})
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: audioConstraints, 
        video: false 
      })
      setLocalStream(stream)

      // Initialize Peer
      const peer = new Peer(currentUser.id, {
        host: '0.peerjs.com',
        port: 443,
        secure: true
      })
      peerRef.current = peer

      peer.on('open', (id) => {
        // Setup presence to broadcast join
        const room = supabase.channel(`voice:${targetChannel}`, {
          config: { presence: { key: currentUser.id } }
        })

        room
          .on('presence', { event: 'sync' }, () => {
             const state = room.presenceState()
             const currentParticipants = []
             
             for (const [id, presences] of Object.entries(state)) {
                currentParticipants.push(presences[0])
                // Call new participants we haven't connected to yet
                if (id !== currentUser.id && !callsRef.current[id]) {
                  const call = peer.call(id, stream)
                  callsRef.current[id] = call
                  setupCallEvents(call, id)
                }
             }
             setParticipants(currentParticipants)
          })
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              await room.track({ id: currentUser.id, username: profile?.username || 'You', avatar: profile?.avatar_color })
            }
          })
        
        channelRef.current = room
        setInRoom(true)
      })

      peer.on('call', (call) => {
        call.answer(stream)
        callsRef.current[call.peer] = call
        setupCallEvents(call, call.peer)
      })

    } catch (err) {
      console.error('Failed to join voice:', err)
      // MOCK FALLBACK for UI testing if user has no microphone or Supabase fails
      setInRoom(true)
      try {
        const stream = new MediaStream()
        setLocalStream(stream)
      } catch (e) {
        // Extremely restrictive environments
      }
      setParticipants([])
    }
  }, [user, channelId, profile])

  const setupCallEvents = (call, peerId) => {
    call.on('stream', (remoteStream) => {
      // Forcefully mute incoming if we are deafened right now
      if (deafenRef.current) {
        remoteStream.getAudioTracks().forEach(t => t.enabled = false)
      }
      // Attach the stream directly to the call object for global access
      call.remoteStream = remoteStream
      setParticipants(prev => prev.map(p => 
        p.id === peerId ? { ...p, stream: remoteStream } : p
      ))
    })

    // Listen for tracks added MID-CALL (like Screen Sharing video tracks)
    if (call.peerConnection) {
      call.peerConnection.addEventListener('track', (event) => {
        if (event.track.kind === 'video' && call.remoteStream) {
          call.remoteStream.addTrack(event.track)
          // Clone stream object to force React to re-render the ParticipantTile and VoiceRoom grid
          const enhancedStream = new MediaStream(call.remoteStream.getTracks())
          call.remoteStream = enhancedStream
          setParticipants(prev => prev.map(p => 
            p.id === peerId ? { ...p, stream: enhancedStream } : p
          ))
        }
      })
    }

    call.on('close', () => {
      delete callsRef.current[peerId]
      setParticipants(prev => prev.map(p => 
        p.id === peerId ? { ...p, stream: null } : p
      ))
    })
  }

  const leaveRoom = useCallback(() => {
    if (localStream) localStream.getTracks().forEach(t => t.stop())
    if (screenStream) screenStream.getTracks().forEach(t => t.stop())
    if (channelRef.current) supabase.removeChannel(channelRef.current)
    if (peerRef.current) peerRef.current.destroy()
    
    setLocalStream(null)
    setScreenStream(null)
    setInRoom(false)
    setParticipants([])
    callsRef.current = {}
  }, [localStream, screenStream])

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsMuted(!audioTrack.enabled)
      }
    }
  }

  const toggleDeafen = () => {
    const newState = !isDeafened
    setIsDeafened(newState)
    deafenRef.current = newState
    
    // Automatically mute mic as well (Discord logic) when deafening
    if (newState && !isMuted) {
      toggleMute()
    }
    
    // Ensure all current incoming audio streams are disabled
    Object.values(callsRef.current).forEach(call => {
      if (call.remoteStream) {
        call.remoteStream.getAudioTracks().forEach(t => {
          t.enabled = !newState
        })
      }
    })
  }

  const toggleScreenShare = async (config = null) => {
    if (isScreenSharing) {
      screenStream?.getTracks().forEach(t => t.stop())
      setScreenStream(null)
      setIsScreenSharing(false)
      
      // Revert tracks
      Object.values(callsRef.current).forEach(call => {
        if (call.peerConnection && localStream) {
           const sender = call.peerConnection.getSenders().find(s => s.track?.kind === 'video')
           if (sender) call.peerConnection.removeTrack(sender)
        }
      })
    } else {
      try {
        const targetFps = config?.fps || 60;
        const targetRes = config?.resolution || '1080p'; // Can use this logic later for canvas scaling if implemented
        
        const stream = await navigator.mediaDevices.getDisplayMedia({ 
          video: { frameRate: { ideal: targetFps, max: targetFps } }, 
          audio: true 
        })
        setScreenStream(stream)
        setIsScreenSharing(true)

        stream.getVideoTracks()[0].onended = () => {
          toggleScreenShare()
        }

        // Add video track to all calls
        Object.values(callsRef.current).forEach(call => {
          if (call.peerConnection) {
            stream.getTracks().forEach(track => {
               call.peerConnection.addTrack(track, stream)
            })
          }
        })
      } catch (err) {
        console.error('Screen sharing failed', err)
      }
    }
  }

  return {
    inRoom, joinRoom, leaveRoom, participants, 
    isMuted, toggleMute, 
    isDeafened, toggleDeafen,
    isScreenSharing, toggleScreenShare,
    localStream, screenStream
  }
}
