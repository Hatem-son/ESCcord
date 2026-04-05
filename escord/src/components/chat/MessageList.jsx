import React, { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageItem } from './MessageItem'
import { usePresence } from '../../hooks/usePresence'

export function MessageList({ messages, channelId, onReply, onReactClick }) {
  const bottomRef = useRef(null)
  const { typingUsers } = usePresence(channelId)

  // Auto-scroll on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typingUsers])

  const variants = {
    container: { staggerChildren: 0.04 },
    item: { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } }
  }

  return (
    <div className="flex-1 overflow-y-auto px-2 py-4 scrollbar-hide relative flex flex-col space-y-1">
      {messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-white/30 text-sm">
          No messages yet. Be the first to say hello!
        </div>
      ) : (
        <motion.div layout variants={variants.container} initial="initial" animate="animate" className="flex flex-col gap-1">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <MessageItem 
                key={msg.id} 
                message={msg} 
                onReply={onReply}
                onReactClick={onReactClick}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Typing Indicators */}
      <AnimatePresence>
        {typingUsers.length > 0 && (
          <motion.div 
            key="typing-indicator"
            initial={{ opacity: 0, y: 10, scale: 0.9 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 10, scale: 0.9, transition: { duration: 0.2 } }}
            className="flex items-end gap-3 mt-2 pl-4"
          >
            <div className="flex -space-x-2 pb-1">
              {typingUsers.map((u, i) => (
                <div key={u.id} className="w-7 h-7 rounded-full border-[3px] border-[#09090b] flex items-center justify-center text-[10px] font-bold text-white shadow-lg overflow-hidden bg-cover bg-center" style={u.avatar_url ? { backgroundImage: `url(${u.avatar_url})`, zIndex: 10 - i } : { backgroundColor: u.avatar_color || '#8b5cf6', zIndex: 10 - i }}>
                  {!u.avatar_url && u.username.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
            
            <div className="bg-[#1e1f2e] border border-white/5 rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-lg flex items-center gap-1.5 relative mb-1">
               <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut" }} className="w-1.5 h-1.5 bg-white/50 rounded-full" />
               <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut", delay: 0.2 }} className="w-1.5 h-1.5 bg-white/50 rounded-full" />
               <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut", delay: 0.4 }} className="w-1.5 h-1.5 bg-white/50 rounded-full" />
               
               {/* Tail of the bubble */}
               <div className="absolute -left-1.5 bottom-0 w-3 h-3 bg-[#1e1f2e] border-l border-b border-white/5" style={{ clipPath: 'polygon(100% 0, 0% 100%, 100% 100%)' }} />
            </div>
            <span className="text-[11px] text-white/30 font-medium pb-1 mb-0.5">
              {typingUsers.map(u => u.username).join(', ')} {typingUsers.length > 1 ? 'are' : 'is'} typing...
            </span>
          </motion.div>
        )}
      </AnimatePresence>
      <div ref={bottomRef} className="h-1" />
    </div>
  )
}
