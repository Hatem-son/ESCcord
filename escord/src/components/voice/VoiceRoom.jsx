import React from 'react'
import { ParticipantTile } from './ParticipantTile'
import { Mic, MicOff, MonitorUp, MonitorOff, PhoneOff, PhoneCall } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { sounds } from '../../lib/sounds'

export function VoiceRoom({ 
  channelId, 
  inRoom, 
  joinRoom, 
  leaveRoom, 
  participants, 
  isMuted, 
  toggleMute, 
  isScreenSharing, 
  toggleScreenShare,
  localStream,
  screenStream
}) {
  const { profile } = useAuth()

  const handleJoin = () => {
    sounds.voiceJoin()
    joinRoom()
  }

  const handleLeave = () => {
    sounds.voiceLeave()
    leaveRoom()
  }

  // Calculate layout grid cols
  const totalTiles = (inRoom ? 1 : 0) + participants.length + (isScreenSharing ? 1 : 0)
  const gridCols = totalTiles > 4 ? 'grid-cols-3' : totalTiles > 1 ? 'grid-cols-2' : 'grid-cols-1'

  // Filter out the local user from participants (if backend broadcasts us)
  const otherParticipants = participants.filter(p => p.id !== profile?.id)
  
  // Participants mapping
  const displayParticipants = otherParticipants

  return (
    <div className="h-full flex flex-col relative bg-transparent">
      {/* Video / Participant Interface */}
      <div className="flex-1 p-4 overflow-hidden flex flex-col justify-center">
        
        {isScreenSharing && screenStream ? (
          <div className="w-full h-full flex flex-col lg:flex-row gap-4">
            {/* Focal Screen Share Tile */}
            <div className="flex-[3] h-full rounded-2xl overflow-hidden shadow-2xl border border-violet-500/30">
              <ParticipantTile 
                 participant={{ username: `${profile?.username || 'You'} (Screen)`, avatar: profile?.avatar_color }} 
                 isLocal={true} 
                 localStream={screenStream} 
                 isScreenShare={true}
              />
            </div>
            
            {/* Shrunk Participant Rail */}
            <div className="flex-1 flex lg:flex-col gap-4 overflow-auto min-w-[200px] bg-black/20 p-2 rounded-2xl border border-white/5">
              {inRoom && (
                <div className="h-[150px] flex-shrink-0">
                  <ParticipantTile participant={{ username: profile?.username || 'You', avatar: profile?.avatar_color }} isLocal={true} localStream={localStream} />
                </div>
              )}
              {displayParticipants.map(p => (
                <div key={p.id} className="h-[150px] flex-shrink-0">
                  <ParticipantTile participant={p} isLocal={false} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Standard Grid Layout */
          <div className={`grid gap-4 w-full h-full ${displayParticipants.length + (inRoom ? 1 : 0) > 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
            
            {/* Local Participant (Only if truly in room) */}
            {inRoom && (
              <ParticipantTile 
                participant={{ username: profile?.username || 'You', avatar: profile?.avatar_color }} 
                isLocal={true} 
                localStream={localStream} 
              />
            )}
            
            {/* Other / Mock Participants */}
            {displayParticipants.map(p => (
              <ParticipantTile key={p.id} participant={p} isLocal={false} />
            ))}
          </div>
        )}
      </div>


      {/* Explicitly REMOVED the internal controls bar because the FloatingDock operates as the global remote now! */}
    </div>
  )
}
