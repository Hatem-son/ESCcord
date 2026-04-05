import React from 'react'
import { motion } from 'framer-motion'
import { Reply, SmilePlus, Edit2, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useAuth } from '../../context/AuthContext'

export function MessageItem({ message, onReply, onReact }) {
  const { user } = useAuth()
  const isOwn = user?.id === message.user_id

  // Hover action bar: Reply, React, Edit, Delete
  return (
    <motion.div 
      initial={{ opacity: 0, x: -8, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="message-row group relative"
    >
      {/* Avatar */}
      <div 
        className="msg-avatar"
        style={{ backgroundColor: message.profiles?.avatar_color || '#10b981' }}
      >
        {message.profiles?.username?.charAt(0).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline mb-0.5">
          <span className="msg-username cursor-pointer">
            {message.profiles?.username}
          </span>
          <span className="msg-time">
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
          </span>
        </div>

        {/* Reply preview placeholder block */}
        {message.reply_to && (
          <div className="text-xs text-[var(--color-text-muted)] border-l-2 border-white/20 pl-2 mb-1 flex items-center gap-2 cursor-pointer hover:text-white/70 transition-colors">
            <span className="truncate max-w-[200px]">Replying to a message...</span>
          </div>
        )}

        <div className="msg-text whitespace-pre-wrap break-words">
          {message.content}
        </div>

        {message.attachment_url && (
          <div className="mt-2">
            {message.attachment_type?.startsWith('image/') ? (
              <a href={message.attachment_url} target="_blank" rel="noopener noreferrer">
                <img 
                  src={message.attachment_url} 
                  alt="attachment" 
                  className="max-h-80 max-w-sm rounded-xl object-contain bg-black/20 border border-white/5 shadow-md hover:opacity-90 transition-opacity" 
                />
              </a>
            ) : (
              <a 
                href={message.attachment_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 p-3 rounded-xl transition-colors min-w-[200px] max-w-xs"
              >
                <div className="p-2 bg-[#8b5cf6]/20 rounded-lg text-[#8b5cf6]">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-white truncate hover:underline">Download Attachment</span>
                  <span className="text-xs text-white/50">{message.attachment_type || 'Unknown format'}</span>
                </div>
              </a>
            )}
          </div>
        )}

        {/* Reactions Row */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            <motion.button
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 15 }}
              className="bg-white/10 hover:bg-white/20 border border-white/5 rounded-full px-2 py-0.5 text-xs flex items-center gap-1 transition-colors"
            >
              <span>👍</span>
              <span className="font-semibold">{message.reactions.length}</span>
            </motion.button>
          </div>
        )}
      </div>

      {/* Hover Action Bar */}
      <div className="absolute right-4 -top-3 opacity-0 group-hover:opacity-100 transition-opacity bg-[#09090b] border border-white/10 rounded-lg shadow-lg flex items-center overflow-hidden">
        <ActionBarBtn icon={<SmilePlus />} onClick={() => onReact && onReact(message)} />
        <ActionBarBtn icon={<Reply />} onClick={() => onReply && onReply(message)} />
        {isOwn && (
          <>
            <ActionBarBtn icon={<Edit2 />} />
            <ActionBarBtn icon={<Trash2 />} className="text-red-400 hover:text-red-300 hover:bg-red-500/10" />
          </>
        )}
      </div>
    </motion.div>
  )
}

function ActionBarBtn({ icon, onClick, className }) {
  return (
    <button 
      onClick={onClick}
      className={`p-1.5 text-white/50 hover:text-white hover:bg-white/10 transition-colors ${className || ''}`}
    >
      {React.cloneElement(icon, { className: 'w-4 h-4' })}
    </button>
  )
}
