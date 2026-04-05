import React from 'react'
import { VoiceRoom } from '../voice/VoiceRoom'
import { useVoice } from '../../hooks/useVoice'
import { useAppContext } from '../../context/AppContext'

export function VoiceWidget() {
  const { currentChannel, voiceState, connectedVoiceChannel } = useAppContext()
  
  // If we aren't connected to this channel AND we haven't joined yet, 
  // we render the view in a "preview" state where participants are visible,
  // but we remove the internal connect button (now handled by Dock).
  
  if (!currentChannel || currentChannel.type !== 'voice') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-white/10 shadow-lg">
          <span className="text-2xl">🎙️</span>
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Voice Lounge</h3>
        <p className="text-white/40 text-sm max-w-xs">Select a voice channel from the panel to connect.</p>
      </div>
    )
  }

  // Purely visual mapping of the voice room for the currently selected channel.
  // Note: If you select a DIFFERENT voice channel than the one you're connected to,
  // you will see the NEW channel's grid (which might be empty until you join).
  // If you are connected to the selected channel, this shows the active grid.

  return (
    <VoiceRoom 
      channelId={currentChannel.id}
      {...voiceState}
    />
  )
}
