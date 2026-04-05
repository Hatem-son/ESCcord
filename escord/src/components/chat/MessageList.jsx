import React, { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageItem } from './MessageItem'
import { usePresence } from '../../hooks/usePresence'

export function MessageList({ messages, channelId, onReply, onReact }) {
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
        <motion.div variants={variants.container} initial="initial" animate="animate" className="flex flex-col gap-1">
          {messages.map((msg) => (
            <MessageItem 
              key={msg.id} 
              message={msg} 
              onReply={onReply}
              onReact={onReact}
            />
          ))}
        </motion.div>
      )}

      {/* Typing Indicators */}
      <AnimatePresence>
        {typingUsers.length > 0 && (
          <motion.div 
            key="typing-indicator"
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95 }}
            className="pl-16 text-xs text-white/50 italic flex items-center gap-1.5 mt-2"
          >
            <div className="flex gap-0.5">
              <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce delay-75" />
              <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce delay-150" />
              <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce delay-300" />
            </div>
            {typingUsers.map(u => u.username).join(', ')} {typingUsers.length > 1 ? 'are' : 'is'} typing...
          </motion.div>
        )}
      </AnimatePresence>
      <div ref={bottomRef} className="h-1" />
    </div>
  )
}
