import React, { useState, useRef, useEffect } from 'react'
import { Smile, Paperclip, Send, X, Loader2, FileText, Image as ImageIcon } from 'lucide-react'
import EmojiPicker, { Theme } from 'emoji-picker-react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { usePresence } from '../../hooks/usePresence'

export function MessageInput({ channelId, onSendMessage, replyTo, onCancelReply }) {
  const [content, setContent] = useState('')
  const [attachment, setAttachment] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) setAttachment(file)
  }

  // Clear file helper
  const clearAttachment = () => {
    setAttachment(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Auto-resize logic
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 144) + 'px' // max ~6 lines
    }
  }, [content])



  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault()
      handleSubmit(e)
    }
    if (e.key === 'Escape' && replyTo) {
      onCancelReply()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim() && !attachment) return
    if (isUploading) return
    
    setIsUploading(true)
    await onSendMessage(content.trim(), attachment)
    
    setContent('')
    clearAttachment()
    setIsUploading(false)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    
    // Aesthetic send animation if it's not a reply!
    if (!replyTo) {
      confetti({
        particleCount: 50,
        spread: 45,
        origin: { y: 0.9, x: 0.8 },
        colors: ['#8b5cf6', '#6366f1', '#ec4899'],
        gravity: 1.5,
        ticks: 100
      })
    }
  }

  return (
    <div className="w-full relative px-4 pb-4 bg-transparent mt-2">
      <AnimatePresence>
        {replyTo && (
          <motion.div 
            key="reply-box"
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-between bg-white/[0.03] border-t border-x border-white/5 mx-2 px-3 py-2 rounded-t-lg -mb-2 z-0 relative"
          >
            <div className="text-xs text-white/50 truncate flex-1">
              Replying to <span className="font-bold text-white/80">{replyTo.profiles?.username}</span>
            </div>
            <button onClick={onCancelReply} className="text-white/40 hover:text-red-400 p-0.5 rounded-full hover:bg-white/10 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}

        {attachment && (
          <motion.div 
            key="attachment-preview"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="flex flex-col bg-[#1e1f2e] border border-white/10 rounded-t-xl mx-2 mb-[-8px] p-4 pb-6 z-0 relative shadow-2xl"
          >
            <div className="relative inline-flex w-fit">
              {attachment.type.startsWith('image/') ? (
                <img 
                  src={URL.createObjectURL(attachment)} 
                  alt="preview" 
                  className="max-h-48 rounded-lg object-contain bg-black/40 border border-white/5" 
                />
              ) : (
                <div className="flex items-center gap-3 bg-black/40 p-4 rounded-xl border border-white/5 pr-12 min-w-[200px]">
                  <FileText className="w-8 h-8 text-[#8b5cf6]" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-white font-medium text-sm truncate">{attachment.name}</span>
                    <span className="text-white/40 text-xs">{(attachment.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                </div>
              )}
              
              <button 
                type="button"
                onClick={clearAttachment} 
                disabled={isUploading}
                className="absolute -top-2 -right-2 bg-rose-500 hover:bg-rose-600 text-white p-1 rounded-full shadow-lg transition-transform hover:scale-110 disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form 
        onSubmit={handleSubmit}
        className="chat-input-bar w-full z-10 items-end"
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
          disabled={isUploading}
        />
        
        <button 
          type="button" 
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="p-2 mb-1 text-white/50 hover:text-white transition-colors rounded-lg hover:bg-white/10 flex-shrink-0 disabled:opacity-50"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <textarea
          ref={textareaRef}
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Message #${channelId ? 'channel' : '...'}`}
          className="chat-input resize-none overflow-hidden"
          rows={1}
          maxLength={2000}
        />

        <div className="flex items-center flex-shrink-0 mb-1 relative">
          {showEmojiPicker && (
            <div className="absolute bottom-12 right-0 shadow-[0_0_20px_rgba(0,0,0,0.5)] z-50 rounded-xl overflow-hidden border border-white/10">
              <EmojiPicker 
                theme={Theme.DARK} 
                onEmojiClick={(emojiData) => {
                  setContent(prev => prev + emojiData.emoji)
                  setShowEmojiPicker(false)
                }}
                previewConfig={{ showPreview: false }}
                autoFocusSearch={false}
              />
            </div>
          )}
          <button 
            type="button" 
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-white/50 hover:text-white transition-colors rounded-lg hover:bg-white/10"
          >
            <Smile className="w-5 h-5" />
          </button>
          <motion.button 
            type="submit" 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            disabled={(!content.trim() && !attachment) || isUploading}
            className="send-btn"
          >
            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
          </motion.button>
        </div>
      </form>
      <div className="absolute right-6 bottom-[-5px] text-[10px] text-white/30 font-medium tracking-wider">
        {content.length}/2000 &bull; Ctrl+Enter to send
      </div>
    </div>
  )
}
