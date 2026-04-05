import React, { useState, useRef, useEffect, useCallback } from 'react'
import YouTube from 'react-youtube'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize2, X, Plus, Users } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useAppContext } from '../../context/AppContext'

export function WatchPlayer({ session, viewers, updateSession, addToQueue, removeFromQueue, playNextInQueue, onDisconnect }) {
  const { user } = useAuth()
  const { setActiveWidgetId } = useAppContext()
  const playerRef = useRef(null)
  
  const [player, setPlayer] = useState(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(100)
  const [isMuted, setIsMuted] = useState(false)
  const [isMini, setIsMini] = useState(false)
  
  const [videoData, setVideoData] = useState(null)
  const [queueInput, setQueueInput] = useState('')

  const viewerCount = viewers?.length || 0
  const isDJ = session?.updated_by === user?.id || viewerCount <= 1

  // Extract ID from URL helper
  const extractVideoId = (url) => {
    const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/)
    return (match && match[2].length === 11) ? match[2] : null
  }

  // Fetch metadata on video change
  useEffect(() => {
    if (!session?.yt_video_id) return
    let isMounted = true
    
    // reset local data
    setVideoData(null)
    
    const fetchData = async () => {
      try {
        const res = await fetch(`https://www.youtube.com/oembed?url=https://youtube.com/watch?v=${session.yt_video_id}&format=json`)
        const data = await res.json()
        if (isMounted) {
          setVideoData({
            title: data.title,
            channel: data.author_name,
            thumbnail: data.thumbnail_url
          })
        }
      } catch (err) {
        console.error("Failed to fetch YT metadata", err)
      }
    }
    fetchData()
    return () => { isMounted = false }
  }, [session?.yt_video_id])

  // Progress Tracker Loop
  useEffect(() => {
    if (!player || !session?.is_playing) return
    const interval = setInterval(async () => {
      try {
        const time = await player.getCurrentTime()
        if (typeof time === 'number') setCurrentTime(time)
      } catch (err) {
        // Ignore iframe initialization errors
      }
    }, 500)
    return () => clearInterval(interval)
  }, [player, session?.is_playing])

  // Handle Video End
  const handleVideoEnd = () => {
    if (isDJ) {
      if (session?.queue?.length > 0) {
        playNextInQueue()
      } else {
        updateSession({ is_playing: false, current_time: 0 })
      }
    }
  }

  // Core Sync Actions (DJ)
  const handlePlayToggle = async () => {
    if (!isDJ) return alert("Only the host can control playback.") // Or standard toast notification
    if (session?.is_playing) {
      const time = await player.getCurrentTime()
      player.pauseVideo()
      await updateSession({ is_playing: false, current_time: time })
    } else {
      const time = await player.getCurrentTime()
      player.playVideo()
      await updateSession({ is_playing: true, current_time: time })
    }
  }

  const handleSeek = async (seconds) => {
    if (!isDJ || !player) return alert("Only the host can control playback.")
    const newTime = Math.max(0, Math.min(currentTime + seconds, duration))
    player.seekTo(newTime, true)
    setCurrentTime(newTime)
    
    const state = await player.getPlayerState()
    await updateSession({ 
      current_time: newTime,
      is_playing: state === 1 || session?.is_playing
    })
  }

  const handleProgressBarClick = async (e) => {
    if (!isDJ || !player) return
    const track = e.currentTarget
    const rect = track.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    const newTime = percent * duration
    
    player.seekTo(newTime, true)
    setCurrentTime(newTime)
    
    await updateSession({ 
      current_time: newTime,
      is_playing: session?.is_playing
    })
  }

  // Auto-sync incoming state changes
  useEffect(() => {
    if (!session || !player) return
    // Don't auto-correct if we are the one who just updated (prevent echo jumps)
    if (session.updated_by === user?.id) return

    const syncPlayer = async () => {
      try {
        const localTime = await player.getCurrentTime()
        if (Math.abs(localTime - session.current_time) > 2) {
          player.seekTo(session.current_time, true)
          setCurrentTime(session.current_time)
        }

        const playerState = await player.getPlayerState()
        if (session.is_playing && playerState !== 1) { // 1 = PLAYING
          player.playVideo()
        } else if (!session.is_playing && playerState === 1) {
          player.pauseVideo()
        }
      } catch (err) {
        // Player not fully initialized yet, ignore
      }
    }
    syncPlayer()
  }, [session, player, user?.id])

  // Volume
  useEffect(() => {
    if (!player) return
    try {
      if (isMuted) {
        player.setVolume(0)
      } else {
        player.setVolume(volume)
      }
    } catch (err) { }
  }, [volume, isMuted, player])

  const formatTime = (sec) => {
    if (!sec || isNaN(sec)) return "0:00"
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  // Queue Submit
  const handleQueueSubmit = async (e) => {
    e.preventDefault()
    const id = extractVideoId(queueInput)
    if (!id) return alert("Invalid YouTube URL")
    
    try {
      const res = await fetch(`https://www.youtube.com/oembed?url=https://youtube.com/watch?v=${id}&format=json`)
      const data = await res.json()
      
      await addToQueue({
        id: id,
        title: data.title,
        thumbnail: data.thumbnail_url,
        added_by: user?.user_metadata?.username || user?.email?.split('@')[0] || "User"
      })
      setQueueInput('')
    } catch (err) {
      alert("Could not load video data. Is it private?")
    }
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  // -------------------------
  // MINI MODE RENDER
  // -------------------------
  if (isMini) {
    return (
      <motion.div
        layoutId="watch-player"
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.2}
        className="fixed z-[999]"
        style={{
          bottom: '80px',
          right: '16px',
          width: '280px',
          borderRadius: '14px',
          background: 'rgba(22,22,58,0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(139,92,246,0.4)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(139,92,246,0.2)',
          overflow: 'hidden',
          cursor: 'grab'
        }}
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <div className="relative w-full aspect-video bg-black group" onClick={() => setIsMini(false)}>
          {/* Keep youtube running invisibly while mini to maintain logic simply, or swap player. 
              Actually, hiding the embed and showing a thumbnail is better for UI. */}
          {videoData && (
            <div className="absolute inset-0">
              <img src={videoData.thumbnail} alt="thumb" className="w-full h-full object-cover opacity-80" />
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity cursor-pointer">
            <Maximize2 className="w-8 h-8 text-white drop-shadow-md" />
          </div>
          <div className="absolute inset-0 pointer-events-none opacity-0">
            <YouTube
              videoId={session.yt_video_id}
              opts={{ playerVars: { autoplay: 1, controls: 0 } }}
              onReady={e => {
                setPlayer(e.target)
                playerRef.current = e.target
              }}
              onStateChange={e => {
                if (e.data === 1 && !duration) setDuration(e.target.getDuration())
              }}
              onEnd={handleVideoEnd}
            />
          </div>
        </div>
        <div className="p-3">
          <p className="text-white text-sm font-bold truncate">{videoData?.title || "Video Loading..."}</p>
          <div className="flex items-center justify-between mt-2">
            <button
              onClick={(e) => { e.stopPropagation(); handlePlayToggle() }}
              className="w-8 h-8 rounded-full bg-[rgba(139,92,246,0.2)] text-violet-400 flex items-center justify-center hover:bg-violet-500 hover:text-white transition-colors"
              disabled={!isDJ}
              title={!isDJ ? "Only host can control" : "Play/Pause"}
            >
              {session?.is_playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDisconnect() }} className="text-red-400 hover:text-red-300">
               <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  // -------------------------
  // FULL RENDER
  // -------------------------
  return (
    <motion.div layoutId="watch-player" className="flex flex-col w-full h-full bg-[#0a0a18] rounded-xl overflow-y-auto scrollbar-hide border border-[rgba(139,92,246,0.18)] shadow-2xl">
      {/* HEADER */}
      <div className="flex items-center justify-between p-4 border-b border-[rgba(255,255,255,0.05)] bg-[rgba(22,22,58,0.5)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[rgba(139,92,246,0.1)] border border-[rgba(139,92,246,0.2)] flex items-center justify-center">
            <Play className="w-4 h-4 text-violet-400" />
          </div>
          <h2 className="text-white font-bold tracking-wide">Watch Together</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsMini(true)} className="px-3 py-1.5 rounded-lg bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-[13px] text-white/70 transition-colors flex items-center gap-2">
            <Maximize2 className="w-3.5 h-3.5" /> Mini
          </button>
          <button onClick={onDisconnect} className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[13px] transition-colors flex items-center gap-2">
            <X className="w-3.5 h-3.5" /> Stop
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-4">
        {/* PLAYER AREA */}
        <div className="w-full max-w-4xl mx-auto">
          <div className="youtube-embed relative group shadow-[0_0_40px_rgba(139,92,246,0.1)]">
            <YouTube
              videoId={session.yt_video_id}
              opts={{
                width: '100%',
                height: '100%',
                playerVars: { autoplay: 1, controls: 0, modestbranding: 1, rel: 0 }
              }}
              onReady={(e) => {
                setPlayer(e.target)
                playerRef.current = e.target
              }}
              onStateChange={(e) => {
                if (e.data === 1 && duration === 0) {
                   setDuration(e.target.getDuration())
                }
              }}
              onEnd={handleVideoEnd}
              className="absolute inset-0"
            />
            {/* Overlay to block default interaction if we want purely custom controls */}
            <div className="absolute inset-0 z-10 hidden" />
          </div>
          
          <div className="mt-4">
            {/* TITLE & CHANNEL */}
            <h3 className="text-lg font-bold text-white mb-1 truncate">
              {videoData ? videoData.title : "Loading..."}
            </h3>
            <p className="text-[13px] text-white/50 mb-4">{videoData ? videoData.channel : ""}</p>
            
            {/* PROGRESS BAR */}
            <div className="flex items-center gap-3 mb-4 text-[12px] text-violet-300 font-mono">
              <span>{formatTime(currentTime)}</span>
              <div className="progress-track" onClick={handleProgressBarClick}>
                <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
                <div className="progress-thumb" style={{ left: `${progressPercent}%` }} />
              </div>
              <span>{formatTime(duration)}</span>
            </div>

            {/* LOWER CONTROLS */}
            <div className="flex justify-between items-center bg-[rgba(22,22,58,0.4)] p-3 rounded-2xl border border-[rgba(255,255,255,0.03)]">
              {/* STATUS LOG */}
              <div className="flex items-center gap-3 w-[150px]">
                 <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.05)] text-[12px] text-white/60">
                    <Users className="w-3.5 h-3.5" />
                    <span>{viewerCount}</span>
                    {isDJ && <span className="ml-1 text-violet-400 font-bold" title="You are the DJ">👑 Set</span>}
                 </div>
                 {!isDJ && <span className="text-[11px] text-orange-300">Host controls ON</span>}
                 {isDJ && <span className="text-[11px] text-violet-400">DJ Sync Active</span>}
              </div>

              {/* MEDIA CONTROLS */}
              <div className="flex items-center justify-center gap-4 flex-1">
                <button
                  onClick={() => handleSeek(-10)}
                  disabled={!isDJ}
                  className="ctrl-btn"
                  title="Backward 10s"
                >
                  <SkipBack className="w-4 h-4 ml-[-2px]" />
                </button>
                
                <button
                  onClick={handlePlayToggle}
                  disabled={!isDJ}
                  className="ctrl-btn primary"
                >
                  <AnimatePresence mode="popLayout">
                    {session?.is_playing ? (
                      <motion.div key="pause" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: 'spring' }}>
                        <Pause className="w-5 h-5 fill-current" />
                      </motion.div>
                    ) : (
                      <motion.div key="play" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: 'spring' }}>
                        <Play className="w-5 h-5 fill-current ml-1" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>

                <button
                  onClick={() => handleSeek(10)}
                  disabled={!isDJ}
                  className="ctrl-btn"
                  title="Forward 10s"
                >
                  <SkipForward className="w-4 h-4 ml-[2px]" />
                </button>
              </div>

              {/* VOLUME */}
              <div className="flex items-center justify-end gap-2 w-[150px]">
                <button onClick={() => setIsMuted(!isMuted)} className="text-white/50 hover:text-white transition-colors">
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min="0" max="100"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => { setVolume(Number(e.target.value)); setIsMuted(false); }}
                  className="w-20 h-1 bg-[rgba(255,255,255,0.1)] rounded-full appearance-none cursor-pointer"
                  style={{ backgroundImage: `linear-gradient(to right, #a78bfa ${volume}%, transparent ${volume}%)` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* VIDEOS QUEUE SECTION */}
        <div className="w-full max-w-4xl mx-auto mt-8 flex flex-col gap-4">
           <form onSubmit={handleQueueSubmit} className="flex gap-3 px-1">
             <input
               type="text"
               value={queueInput}
               onChange={e => setQueueInput(e.target.value)}
               placeholder="Paste YouTube link to queue..."
               className="flex-1 bg-[rgba(22,22,58,0.5)] border border-[rgba(139,92,246,0.2)] rounded-xl px-4 py-3 text-[13px] text-white focus:outline-none focus:border-violet-500 transition-colors"
             />
             <button type="submit" className="bg-violet-600 hover:bg-violet-500 text-white px-5 rounded-xl font-medium text-[13px] transition-colors flex items-center gap-2">
               <Plus className="w-4 h-4" /> Queue
             </button>
           </form>

           {session?.queue?.length > 0 && (
             <div className="mt-2 text-left">
               <h4 className="text-[12px] font-bold text-white/50 uppercase tracking-widest pl-2 mb-3">Up Next ({session.queue.length})</h4>
               <div className="flex flex-col gap-2">
                 {session.queue.map((item, idx) => (
                   <div key={`${item.id}-${idx}`} className="flex items-center gap-4 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-xl p-2 hover:bg-[rgba(255,255,255,0.05)] transition-colors pr-4">
                     <img src={item.thumbnail} alt={item.title} className="w-[48px] h-[27px] object-cover rounded shadow ring-1 ring-[rgba(255,255,255,0.1)]" />
                     <div className="flex-1 overflow-hidden">
                       <p className="text-[13px] text-white font-medium truncate leading-tight">{item.title}</p>
                       <p className="text-[11px] text-violet-400 mt-0.5 truncate">Added by {item.added_by}</p>
                     </div>
                     <button onClick={() => removeFromQueue(idx)} className="text-white/20 hover:text-red-400 p-1 transition-colors">
                       <X className="w-4 h-4" />
                     </button>
                   </div>
                 ))}
               </div>
             </div>
           )}
        </div>
      </div>
    </motion.div>
  )
}
