import React from 'react'
import { motion } from 'framer-motion'
import { useGroupMembers } from '../../hooks/useGroupMembers'
import { useAppContext } from '../../context/AppContext'
import { Crown } from 'lucide-react'

export function MemberList({ groupId, onClose }) {
  const { members, loading } = useGroupMembers(groupId)
  const { onlineUserIds } = useAppContext()

  if (!groupId) return null

  // Categorize members
  const onlineMembers = members.filter(m => onlineUserIds.includes(m.id))
  const offlineMembers = members.filter(m => !onlineUserIds.includes(m.id))

  const renderSection = (title, list) => {
    if (list.length === 0) return null

    return (
      <div className="mb-6">
        <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-4 mb-2">
          {title} — {list.length}
        </h3>
        <div className="space-y-[2px] px-2">
          {list.map(member => {
            const isOnline = title === 'Online'
            return (
              <div 
                key={member.id} 
                className="group flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
              >
                {/* Avatar with Status Badge */}
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-sm flex-shrink-0 relative overflow-hidden transition-all ${!isOnline ? 'opacity-50 group-hover:opacity-100' : ''}`}
                  style={{ backgroundColor: member.avatar_color || '#8b5cf6' }}
                >
                  {member.avatar_url ? (
                    <img src={member.avatar_url} className="w-full h-full object-cover" alt={member.username} />
                  ) : (
                    member.username?.charAt(0).toUpperCase()
                  )}
                  
                  {/* Status Indicator inside/overlay */}
                  {isOnline ? (
                    <motion.div 
                      animate={{ 
                        boxShadow: ['0 0 0px rgba(34,197,94,0)', '0 0 8px rgba(34,197,94,0.6)', '0 0 0px rgba(34,197,94,0)']
                      }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-[2px] border-[#16163a] z-10 bg-green-500"
                    />
                  ) : (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-[2px] border-[#16163a] z-10 bg-gray-500" />
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[13px] font-medium truncate ${isOnline ? 'text-white/90' : 'text-white/50 group-hover:text-white/80'}`}>
                      {member.username}
                    </span>
                    {member.role === 'owner' && (
                      <Crown className="w-3 h-3 text-amber-400 flex-shrink-0" />
                    )}
                  </div>
                  {member.custom_status && (
                    <p className="text-[10px] text-white/40 truncate mt-0.5 leading-none">
                      {member.custom_status}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div 
      className="h-full w-full bg-black/20 overflow-y-auto custom-scrollbar flex-shrink-0 flex flex-col py-4"
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center h-full opacity-50 space-y-4">
          <div className="w-6 h-6 border-2 border-[#8b5cf6] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {renderSection('Online', onlineMembers)}
          {renderSection('Offline', offlineMembers)}
        </>
      )}
    </div>
  )
}
