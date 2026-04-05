import React from 'react'

export function RightPanel() {
  return (
    <div className="hidden xl:flex flex-col w-[240px] bg-white/[0.02] border-l border-white/5 h-screen overflow-hidden flex-shrink-0">
      <div className="p-4 border-b border-white/5">
        <h2 className="font-bold text-sm text-white/50 uppercase tracking-widest">Active Now</h2>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        <div className="space-y-4">
          <MemberItem name="Tceh" status="online" activity="Playing XOX Game" color="#10b981" />
          <MemberItem name="Shadow Weaver" status="online" color="#8b5cf6" />
          <MemberItem name="Echo" status="busy" color="#ef4444" />
        </div>
      </div>
    </div>
  )
}

function MemberItem({ name, status, activity, color }) {
  const statusColor = {
    online: 'bg-green-500',
    busy: 'bg-red-500',
    away: 'bg-yellow-500',
    offline: 'bg-gray-500'
  }[status] || 'bg-gray-500'

  return (
    <div className="flex items-center gap-3 cursor-pointer group">
      <div className="relative">
        <div 
          className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white border-2 border-transparent group-hover:border-white/20 transition-all"
          style={{ backgroundColor: color }}
        >
          {name.charAt(0)}
        </div>
        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${statusColor} rounded-full border-[2.5px] border-[#09090b]`} />
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="text-sm font-medium text-white/90 group-hover:text-white truncate">{name}</div>
        {activity && (
          <div className="text-[10px] text-white/40 truncate mt-0.5 max-w-[120px]">{activity}</div>
        )}
      </div>
    </div>
  )
}
