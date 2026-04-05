import React, { useState } from 'react'
import { Play, Link as LinkIcon } from 'lucide-react'
import { useWatch } from '../../hooks/useWatch'
import { useAppContext } from '../../context/AppContext'
import { WatchPlayer } from './WatchPlayer'

export function WatchWidget() {
  const { currentGroup, activeWidgetId } = useAppContext()
  // Watch State operates on a server-wide level
  const { session, viewers, updateSession, addToQueue, removeFromQueue, playNextInQueue } = useWatch(currentGroup?.id)
  const [urlInput, setUrlInput] = useState('')

  const isExpanded = activeWidgetId === 'widget-watch'

  const handleUrlSubmit = (e) => {
    e.preventDefault()
    // Extract YT ID
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = urlInput.match(regExp)
    if (match && match[2].length === 11) {
      updateSession({ yt_video_id: match[2], current_time: 0, is_playing: true })
      setUrlInput('')
    }
  }

  const handleDisconnect = () => {
    updateSession({ yt_video_id: null, is_playing: false, current_time: 0, queue: [] })
  }

  if (!currentGroup) {
    return (
      <div className="h-full flex flex-col bg-[#09090b]/40 backdrop-blur-sm items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-white/10 shadow-lg">
          <span className="text-2xl">📺</span>
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Theater Idle</h3>
        <p className="text-white/40 text-sm max-w-xs">Select a server to start watching videos together with friends.</p>
      </div>
    )
  }

  return (
    <div className={`watch-widget ${isExpanded ? 'flex-row' : ''}`}>
      <div className={`flex-1 flex flex-col ${isExpanded ? 'w-[70%] border-r border-white/10' : 'w-full'}`}>
        {!session?.yt_video_id ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-4 border border-red-500/20">
              <Play className="w-8 h-8 text-red-500 ml-1" />
            </div>
            <h3 className="text-lg font-bold mb-2">Watch Together</h3>
            <p className="text-white/50 text-sm mb-6">Paste a YouTube link to sync playback with the room.</p>
            
            <form onSubmit={handleUrlSubmit} className="w-full max-w-sm relative">
              <input 
                type="text" 
                placeholder="https://youtube.com/watch?v=..."
                className="glass-input w-full p-3 pl-10 text-sm"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
              />
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
            </form>
          </div>
        ) : (
          <WatchPlayer 
            session={session} 
            viewers={viewers} 
            updateSession={updateSession}
            addToQueue={addToQueue}
            removeFromQueue={removeFromQueue}
            playNextInQueue={playNextInQueue}
            onDisconnect={handleDisconnect}
          />
        )}
      </div>
      
      {isExpanded && (
        <div className="w-[30%] flex flex-col bg-black/20">
          <div className="p-4 border-b border-white/5">
            <h3 className="font-bold">Room Chat</h3>
          </div>
          <div className="flex-1 flex items-center justify-center text-white/20 text-sm">
            Chat goes here...
          </div>
        </div>
      )}
    </div>
  )
}
