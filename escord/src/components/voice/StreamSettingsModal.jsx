import React, { useState } from 'react'
import { Modal } from '../ui/Modal'
import { MonitorUp, MonitorPlay, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

export function StreamSettingsModal({ isOpen, onClose, onGoLive }) {
  const [resolution, setResolution] = useState('1080p')
  const [fps, setFps] = useState(60)

  const handleGoLive = () => {
    // Map settings to config object for getUserMedia
    onGoLive({ resolution, fps })
    onClose()
  }

  const resolutions = [
    { id: '720p', label: '720p', desc: 'Standard' },
    { id: '1080p', label: '1080p', desc: 'HD Quality' },
    { id: 'source', label: 'Source', desc: 'Max Native' }
  ]

  const framerates = [
    { id: 15, label: '15 FPS', desc: 'Low Bandwidth' },
    { id: 30, label: '30 FPS', desc: 'Normal' },
    { id: 60, label: '60 FPS', desc: 'Extremely Smooth', icon: <Zap className="w-3 h-3 text-[#10b981] fill-[#10b981]" /> }
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Screen Share Settings">
      <div className="space-y-6">
        
        {/* Stream Quality Header */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-black/40 border border-white/5 shadow-inner">
          <div className="w-12 h-12 rounded-lg bg-violet-500/20 flex items-center justify-center border border-violet-500/30">
            <MonitorUp className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h3 className="text-white font-bold tracking-wide">Stream Quality</h3>
            <p className="text-xs text-white/40">Higher settings require more bandwidth.</p>
          </div>
        </div>

        {/* Resolution Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-white/50 uppercase tracking-widest pl-1">Resolution</label>
          <div className="grid grid-cols-3 gap-2">
            {resolutions.map(res => (
              <button
                key={res.id}
                onClick={() => setResolution(res.id)}
                className={cn(
                  "p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all",
                  resolution === res.id 
                    ? "bg-[#8b5cf6]/20 border-[#8b5cf6] shadow-[0_0_15px_rgba(139,92,246,0.3)]" 
                    : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                )}
              >
                <span className={cn("font-bold", resolution === res.id ? "text-[#8b5cf6]" : "text-white/80")}>
                  {res.label}
                </span>
                <span className="text-[10px] text-white/40 font-medium">{res.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Frame Rate Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-white/50 uppercase tracking-widest pl-1">Frame Rate</label>
          <div className="grid grid-cols-3 gap-2">
            {framerates.map(rate => (
              <button
                key={rate.id}
                onClick={() => setFps(rate.id)}
                className={cn(
                  "p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all relative overflow-hidden",
                  fps === rate.id 
                    ? "bg-[#10b981]/20 border-[#10b981] shadow-[0_0_15px_rgba(16,185,129,0.3)]" 
                    : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                )}
              >
                <div className="flex items-center gap-1">
                  <span className={cn("font-bold z-10", fps === rate.id ? "text-[#10b981]" : "text-white/80")}>
                    {rate.label}
                  </span>
                  {rate.icon && <span className="z-10">{rate.icon}</span>}
                </div>
                <span className="text-[10px] text-white/40 font-medium z-10">{rate.desc}</span>
                
                {/* Glow effect for 60fps selection */}
                {fps === rate.id && rate.id === 60 && (
                  <div className="absolute inset-0 bg-gradient-to-t from-[#10b981]/10 to-transparent pointer-events-none" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-bold text-white/50 hover:text-white hover:bg-white/5 transition-all text-sm"
          >
            Cancel
          </button>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleGoLive}
            className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.4)] font-bold flex items-center gap-2"
          >
            <MonitorPlay className="w-5 h-5" />
            Go Live
          </motion.button>
        </div>

      </div>
    </Modal>
  )
}
