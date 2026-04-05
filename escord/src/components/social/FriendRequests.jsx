import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, X, UserX } from 'lucide-react'

export function FriendRequests({ requests = [], onAccept, onDecline }) {
  if (requests.length === 0) {
    return (
      <div className="p-8 text-center text-white/40 text-sm border-2 border-dashed border-white/5 rounded-xl">
        No pending friend requests.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {requests.map(req => (
        <motion.div 
          key={req.id}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-3 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
              style={{ backgroundColor: req.profiles.avatar_color }}
            >
              {req.profiles.username.charAt(0)}
            </div>
            <div>
              <div className="font-semibold text-sm">{req.profiles.username}</div>
              <div className="text-xs text-white/40">Incoming Friend Request</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onAccept(req.id)}
              className="w-8 h-8 rounded-full bg-[#10b981]/20 text-[#10b981] flex items-center justify-center hover:bg-[#10b981] hover:text-white transition-colors"
            >
              <Check className="w-4 h-4" />
            </button>
            <button 
              onClick={() => onDecline(req.id)}
              className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
