import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mic, Volume2, User, Key, Bell, Shield, Laptop, Upload } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

// LocalStorage Keys
export const AUDIO_INPUT_KEY = 'escord_audio_in'
export const AUDIO_OUTPUT_KEY = 'escord_audio_out'

export function SettingsModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('voice')
  // Voice settings state
  const [devices, setDevices] = useState({ audioinput: [], audiooutput: [] })
  const [selectedInput, setSelectedInput] = useState('default')
  const [selectedOutput, setSelectedOutput] = useState('default')
  const [isTesting, setIsTesting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  
  const { profile, updateProfile } = useAuth()
  
  // Local form states for Profile edit
  const [bio, setBio] = useState('')
  const [customStatus, setCustomStatus] = useState('')
  const [isSavingAccount, setIsSavingAccount] = useState(false)

  // Sync profile when opened
  useEffect(() => {
    if (isOpen && profile) {
      setBio(profile.bio || '')
      setCustomStatus(profile.custom_status || '')
    }
  }, [isOpen, profile])

  const volumeRef = useRef(0)
  const canvasRef = useRef(null)
  
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const streamRef = useRef(null)
  const requestRef = useRef(null)

  // 1. Fetch devices when modal opens
  useEffect(() => {
    if (!isOpen) return

    const getDevices = async () => {
      try {
        // Request basic permission first to get labels
        await navigator.mediaDevices.getUserMedia({ audio: true })
        
        const mediaDevices = await navigator.mediaDevices.enumerateDevices()
        const inputs = mediaDevices.filter(d => d.kind === 'audioinput')
        const outputs = mediaDevices.filter(d => d.kind === 'audiooutput')
        
        setDevices({ audioinput: inputs, audiooutput: outputs })
        
        // Restore preferences
        const savedIn = localStorage.getItem(AUDIO_INPUT_KEY)
        const savedOut = localStorage.getItem(AUDIO_OUTPUT_KEY)
        
        if (savedIn && inputs.some(d => d.deviceId === savedIn)) {
          setSelectedInput(savedIn)
        } else if (inputs.length > 0) {
          setSelectedInput(inputs[0].deviceId || 'default')
        }
        
        if (savedOut && outputs.some(d => d.deviceId === savedOut)) {
          setSelectedOutput(savedOut)
        } else if (outputs.length > 0) {
          setSelectedOutput(outputs[0].deviceId || 'default')
        }
      } catch (err) {
        console.error("Error accessing media devices.", err)
      }
    }
    
    getDevices()

    return () => {
      stopTest()
    }
  }, [isOpen])

  // Save changes
  const handleInputSelect = (id) => {
    setSelectedInput(id)
    localStorage.setItem(AUDIO_INPUT_KEY, id)
    // If testing currently, we should theoretically restart the test, but stopping it is safer to prevent leaks
    stopTest()
  }

  const handleOutputSelect = (id) => {
    setSelectedOutput(id)
    localStorage.setItem(AUDIO_OUTPUT_KEY, id)
  }

  // Visualizer Animation
  const animate = () => {
    if (!analyserRef.current || !canvasRef.current) return
    
    const analyser = analyserRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    analyser.getByteFrequencyData(dataArray)

    // Calculate volume based on frequency data
    let sum = 0
    for(let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i]
    }
    // Average volume percentage
    const avg = sum / dataArray.length
    const volumeSize = Math.min((avg / 128) * 100, 100) // normalize

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Draw empty background bar
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.beginPath()
    ctx.roundRect(0, canvas.height / 2 - 10, canvas.width, 20, 10)
    ctx.fill()

    // Draw active volume bar
    ctx.fillStyle = '#22c55e' // Green
    const rawWidth = (canvas.width * volumeSize) / 100
    // Keep it physically bounded
    const fillWidth = Math.max(10, Math.min(rawWidth, canvas.width))
    
    // Smooth trailing ease via clip
    ctx.save()
    ctx.beginPath()
    ctx.roundRect(0, canvas.height / 2 - 10, fillWidth, 20, 10)
    ctx.clip()
    
    // Optional gradient inside the green bar
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0)
    gradient.addColorStop(0, '#22c55e')
    gradient.addColorStop(1, '#8b5cf6')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, fillWidth, canvas.height)
    ctx.restore()

    requestRef.current = requestAnimationFrame(animate)
  }

  const startTest = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: selectedInput === 'default' ? undefined : { exact: selectedInput },
          echoCancellation: true,
          noiseSuppression: true
        }
      })
      
      streamRef.current = stream
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)
      
      setIsTesting(true)
      requestRef.current = requestAnimationFrame(animate)
    } catch (err) {
      console.error("Test failed", err)
      alert("Microphone permission denied or device error.")
    }
  }

  const stopTest = () => {
    if (requestRef.current) cancelAnimationFrame(requestRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(()=>{})
      audioContextRef.current = null
    }
    setIsTesting(false)
    
    if (canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }

  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        // Compress to 128x128 WebP
        const canvas = document.createElement('canvas')
        const MAX_SIZE = 128
        canvas.width = MAX_SIZE
        canvas.height = MAX_SIZE
        const ctx = canvas.getContext('2d')
        // Crop perfectly center
        const minDim = Math.min(img.width, img.height)
        const sx = (img.width - minDim) / 2
        const sy = (img.height - minDim) / 2
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, MAX_SIZE, MAX_SIZE)
        
        // Quality 0.7 to keep it extremely small (<15KB usually)
        const base64Avatar = canvas.toDataURL('image/webp', 0.7)
        
        // Push update to DB
        updateProfile({ avatar_url: base64Avatar }).then((res) => {
           setIsUploading(false)
           if (res.error) alert("Could not save avatar: " + res.error.message)
        })
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(file)
  }

  const handleSaveAccount = async () => {
    setIsSavingAccount(true)
    await updateProfile({
      bio, 
      custom_status: customStatus
    })
    setIsSavingAccount(false)
  }

  if (!isOpen) return null

  const tabs = [
    { id: 'account', label: 'My Account', icon: User },
    // { id: 'privacy', label: 'Privacy & Safety', icon: Shield },
    { id: 'voice', label: 'Voice & Video', icon: Mic },
    // { id: 'app', label: 'App Settings', icon: Laptop },
  ]

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-auto">
      {/* Dimmed Overlay */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-4xl h-[80vh] flex overflow-hidden glass-card rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10"
      >
        {/* Left Sidebar Menu */}
        <div className="w-1/3 max-w-[250px] bg-black/40 border-r border-white/10 flex flex-col py-6 pl-4 pr-2">
          <h2 className="text-white/40 text-xs font-bold uppercase tracking-widest pl-3 mb-2">User Settings</h2>
          <div className="space-y-1">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all font-medium text-sm ${
                    activeTab === tab.id 
                      ? 'bg-white/10 text-white' 
                      : 'text-white/50 hover:bg-white/5 hover:text-white/80'
                  }`}
                >
                  <Icon className="w-4 h-4" /> {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 bg-[rgba(15,15,30,0.6)] relative overflow-y-auto">
          {/* Close Button top right */}
          <div className="absolute top-6 right-6 z-10 hidden md:block">
            <button 
              onClick={onClose}
              className="group flex flex-col items-center gap-1"
            >
              <div className="w-9 h-9 rounded-full border-2 border-white/20 group-hover:border-red-500/50 flex items-center justify-center text-white/50 group-hover:text-red-400 group-hover:bg-red-500/10 transition-all cursor-pointer">
                <X className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-white/30 group-hover:text-red-400">ESC</span>
            </button>
          </div>

          <div className="p-8 max-w-2xl">
            {activeTab === 'voice' && (
              <div className="space-y-8 animate-fade-in">
                <h1 className="text-2xl font-black text-white mb-6">Voice & Video Settings</h1>
                
                {/* Voice Settings Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* INPUT DEVICE */}
                  <div>
                    <label className="text-xs font-bold text-white/50 uppercase tracking-wide mb-2 block">
                      Input Device
                    </label>
                    <div className="relative">
                      <select 
                        value={selectedInput}
                        onChange={(e) => handleInputSelect(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white appearance-none focus:outline-none focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6] cursor-pointer"
                      >
                        {devices.audioinput.length === 0 ? <option value="default">Default</option> : null}
                        {devices.audioinput.map(d => (
                          <option key={d.deviceId} value={d.deviceId}>
                            {d.label || `Microphone ${d.deviceId.substring(0,5)}...`}
                          </option>
                        ))}
                      </select>
                      <Mic className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                    </div>
                  </div>

                  {/* OUTPUT DEVICE */}
                  <div>
                    <label className="text-xs font-bold text-white/50 uppercase tracking-wide mb-2 block">
                      Output Device
                    </label>
                    <div className="relative">
                      <select 
                        value={selectedOutput}
                        onChange={(e) => handleOutputSelect(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white appearance-none focus:outline-none focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6] cursor-pointer"
                      >
                        {devices.audiooutput.length === 0 ? <option value="default">Default</option> : null}
                        {devices.audiooutput.map(d => (
                          <option key={d.deviceId} value={d.deviceId}>
                            {d.label || `Speaker ${d.deviceId.substring(0,5)}...`}
                          </option>
                        ))}
                      </select>
                      <Volume2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <hr className="border-t border-white/10" />

                {/* MIC TEST SECTION */}
                <div>
                  <h3 className="text-md font-bold text-white mb-2">Mic Test</h3>
                  <p className="text-sm text-white/40 mb-4">
                    Let's check if your microphone is working and picking up your voice properly.
                  </p>
                  
                  <div className="flex items-center gap-4 bg-black/20 p-4 rounded-xl border border-white/5">
                    <button 
                      onClick={isTesting ? stopTest : startTest}
                      className={`px-6 py-2.5 rounded-lg font-bold transition-all shadow-lg flex-shrink-0 border ${
                        isTesting 
                          ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20' 
                          : 'bg-[#8b5cf6] hover:bg-[#7c3aed] text-white border-[#8b5cf6]/50 shadow-[0_0_15px_rgba(139,92,246,0.3)]'
                      }`}
                    >
                      {isTesting ? 'Stop Testing' : "Let's Check"}
                    </button>
                    
                    {/* Visualizer Canvas */}
                    <div className="flex-1 h-10 relative">
                      <canvas 
                        ref={canvasRef} 
                        width={400} 
                        height={40} 
                        className="w-full h-full rounded-md opacity-90"
                      />
                      {!isTesting && (
                        <div className="absolute inset-0 flex items-center">
                           <div className="w-full h-[10px] bg-white/5 rounded-full" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {isTesting && (
                    <p className="text-xs text-green-400 mt-2 font-medium animate-pulse">
                      Speak now to test your mic volume...
                    </p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="space-y-6 animate-fade-in">
                <h1 className="text-2xl font-black text-white mb-2">My Account</h1>
                
                <div className="bg-black/20 border border-white/10 rounded-xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-8 relative overflow-hidden">
                  {/* Decorative backdrop */}
                  <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-[#8b5cf6]/20 to-[#10b981]/20 -z-10" />

                  {/* Avatar Upload Area */}
                  <div className="relative group flex-shrink-0 cursor-pointer">
                    <input 
                      type="file" 
                      accept="image/png, image/jpeg, image/gif, image/webp" 
                      className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer"
                      onChange={handleAvatarSelect}
                      disabled={isUploading}
                    />
                    <div 
                      className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold border-4 border-[#1c1c38] shadow-2xl relative overflow-hidden" 
                      style={{ backgroundColor: profile?.avatar_color || '#8b5cf6' }}
                    >
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white relative z-0">{profile?.username?.charAt(0).toUpperCase()}</span>
                      )}
                      
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        {isUploading ? (
                          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Upload className="w-6 h-6 text-white" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Profile Details */}
                  <div className="flex-1 space-y-4">
                    <div>
                       <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-1">Username</h3>
                       <p className="text-xl font-bold text-white tracking-tight">{profile?.username}</p>
                    </div>
                    <div>
                       <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-2">ESCcord ID</h3>
                       <p className="text-sm text-white/80 font-mono bg-white/5 inline-block px-3 py-1.5 rounded-md">#{profile?.escord_id}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-black/20 border border-white/10 rounded-xl p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-white/50 uppercase tracking-wider mb-2">Custom Status</label>
                    <input 
                      type="text" 
                      value={customStatus}
                      onChange={(e) => setCustomStatus(e.target.value)}
                      placeholder="e.g. Exploring the digital frontier"
                      className="w-full bg-[#09090b] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#10b981] transition-colors"
                      maxLength={60}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white/50 uppercase tracking-wider mb-2">About Me (Bio)</label>
                    <textarea 
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell everyone a little bit about yourself..."
                      className="w-full bg-[#09090b] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#10b981] transition-colors h-24 resize-none custom-scrollbar"
                      maxLength={200}
                    />
                  </div>
                  <div className="flex justify-end pt-2">
                    <button 
                      onClick={handleSaveAccount}
                      disabled={isSavingAccount || (bio === (profile?.bio || '') && customStatus === (profile?.custom_status || ''))}
                      className="px-6 py-2 bg-[#10b981] hover:bg-[#059669] text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isSavingAccount ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                      Save Changes
                    </button>
                  </div>
                </div>

                <div className="text-xs text-white/30 text-center mt-4">
                  Profile pictures are heavily compressed to save space and sync globally.
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
