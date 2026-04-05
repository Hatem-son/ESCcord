import React from 'react'
import { motion } from 'framer-motion'
import { Play, Gamepad2, Mic, Map } from 'lucide-react'
import { useAppContext } from '../../context/AppContext'

export function ActivitiesLauncher() {
  const { setActiveWidgetId } = useAppContext()

  const activities = [
    {
      id: 'widget-watch',
      name: 'Watch YouTube',
      description: 'Sync videos perfectly with your friends',
      icon: <Play className="w-8 h-8 text-rose-500" />,
      color: 'from-rose-500/20 to-rose-600/5',
      borderColor: 'border-rose-500/30 w-[calc(100%-8px)]',
      glow: 'shadow-[0_0_20px_rgba(244,63,94,0.1)]'
    },
    {
      id: 'coming-soon-1',
      name: 'Tic Tac Toe',
      description: 'Classic game lobby (Updating)',
      icon: <Gamepad2 className="w-8 h-8 text-blue-500" />,
      color: 'from-blue-500/10 to-blue-600/5',
      borderColor: 'border-blue-500/10 opacity-50',
      glow: '',
      disabled: true
    },
    {
      id: 'coming-soon-2',
      name: 'Karaoke Night',
      description: 'Sing your heart out (Coming Soon)',
      icon: <Mic className="w-8 h-8 text-emerald-500" />,
      color: 'from-emerald-500/10 to-emerald-600/5',
      borderColor: 'border-emerald-500/10 opacity-50',
      glow: '',
      disabled: true
    }
  ]

  return (
    <div className="h-full flex flex-col p-3 overflow-y-auto scrollbar-hide gap-3">
      {activities.map((act) => (
        <motion.button
          key={act.id}
          whileHover={!act.disabled ? { scale: 1.02 } : {}}
          whileTap={!act.disabled ? { scale: 0.98 } : {}}
          onClick={() => !act.disabled && setActiveWidgetId(act.id)}
          className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all bg-gradient-to-b ${act.color} ${act.borderColor} ${act.glow} ${act.disabled ? 'cursor-not-allowed grayscale' : 'hover:border-rose-400 hover:shadow-[0_0_30px_rgba(244,63,94,0.2)]'}`}
        >
          <div className="w-16 h-16 rounded-2xl bg-black/40 flex items-center justify-center mb-3 border border-white/5 backdrop-blur-md">
            {act.icon}
          </div>
          <h3 className="font-bold text-white mb-1 tracking-wide">{act.name}</h3>
          <p className="text-xs text-white/40 leading-snug">{act.description}</p>
        </motion.button>
      ))}
    </div>
  )
}
