import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Compass, Gamepad2 } from 'lucide-react'
import { useAppContext } from '../../context/AppContext'
import { CreateGroupModal } from '../social/CreateGroupModal'
import { cn } from '../../lib/utils'

export function GroupsWidget({ iconsOnly = false }) {
  const { userGroups, currentGroup, setCurrentGroup } = useAppContext()
  const [isAddOpen, setIsAddOpen] = useState(false)

  return (
    <div className={cn("h-full flex flex-col overflow-y-auto scrollbar-hide", iconsOnly ? "p-2 items-center" : "p-4")}>
      
      {!iconsOnly && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="widget-title">Your Servers</h2>
          <button 
            onClick={() => setIsAddOpen(true)}
            className="text-[#10b981] hover:text-[#34d399] transition-colors p-1"
            title="Create Server"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      )}
      
      {iconsOnly && (
        <button 
          onClick={() => setIsAddOpen(true)}
          className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 hover:bg-[#10b981] text-[#10b981] hover:text-white transition-all hover:scale-110 mb-4"
          title="Create Server"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      <div className={cn("flex flex-col gap-3", iconsOnly ? "items-center w-full" : "")}>


        <AnimatePresence>
          {userGroups.map((group) => (
            <motion.div 
              key={group.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
                <GroupRow 
                  name={group.name} 
                  iconUrl={group.icon_url}
                  active={currentGroup?.id === group.id}
                  onClick={() => setCurrentGroup(group)}
                  iconsOnly={iconsOnly}
                />
            </motion.div>
          ))}
          {userGroups.length === 0 && (
            <div className={cn("text-center border border-dashed border-white/10", iconsOnly ? "p-2 rounded-2xl w-12 h-12 flex flex-col justify-center items-center opacity-50" : "p-4 rounded-xl")}>
              <Compass className={cn("text-white/30", iconsOnly ? "w-5 h-5" : "mx-auto mb-2 w-6 h-6")} />
              {!iconsOnly && <p className="text-xs text-white/50">You aren't in any servers yet. Create one or explore!</p>}
            </div>
          )}
        </AnimatePresence>
      </div>

      <CreateGroupModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
    </div>
  )
}

function GroupRow({ active, onClick, name, icon, iconUrl, iconsOnly }) {
  const [imgError, setImgError] = useState(false)
  
  return (
    <button 
      onClick={onClick}
      title={iconsOnly ? name : undefined}
      className={cn(
        "flex items-center gap-3 transition-all group relative",
        iconsOnly ? "justify-center w-12 h-12 rounded-2xl" : "w-full p-2 rounded-xl overflow-hidden hover:bg-white/5",
        active && !iconsOnly ? "bg-[#8b5cf6]/20" : ""
      )}
    >
      {/* Selection indicator */}
      {active && <motion.div layoutId="group-active-indicator" className="absolute -left-3 top-[10%] bottom-[10%] w-1.5 rounded-full bg-[#8b5cf6]" />}
      
      <div className={cn(
        "flex items-center justify-center font-bold shadow-lg transition-all relative overflow-hidden",
        iconsOnly ? "w-12 h-12 rounded-2xl hover:rounded-xl" : "w-10 h-10 rounded-xl",
        active ? "bg-[#8b5cf6] text-white rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.4)]" : "bg-black/40 text-white/70 group-hover:bg-[#8b5cf6]/50 group-hover:text-white"
      )}>
        {iconUrl && !imgError && iconUrl.trim() !== '' ? (
          <img src={iconUrl} alt={name} onError={() => setImgError(true)} className="w-full h-full object-cover" />
        ) : (
          icon || name.substring(0,2).toUpperCase()
        )}
      </div>
      
      {!iconsOnly && (
        <div className="flex-1 text-left min-w-0">
          <div className={cn(
            "font-semibold truncate text-sm transition-colors",
            active ? "text-white" : "text-white/80 group-hover:text-white"
          )}>
            {name}
          </div>
        </div>
      )}
    </button>
  )
}
