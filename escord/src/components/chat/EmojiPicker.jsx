import React, { useEffect, useRef } from 'react'
import { Smile } from 'lucide-react'

// Simple Hardcoded Emoji Library 
// (Bypasses heavy NPM packages for maximum performance)
const EMOJIS = [
  { icon: '👍', id: 'thumbsup' },
  { icon: '❤️', id: 'heart' },
  { icon: '😂', id: 'laugh' },
  { icon: '🔥', id: 'flame' },
  { icon: '🎉', id: 'party' },
  { icon: '👀', id: 'eyes' },
  { icon: '✨', id: 'sparkles' },
  { icon: '✅', id: 'check' },
  { icon: '❌', id: 'cross' },
  { icon: '🚀', id: 'rocket' },
  { icon: '😊', id: 'smile' },
  { icon: '💯', id: '100' },
  { icon: '💀', id: 'skull' },
  { icon: '😭', id: 'cry' },
  { icon: '😎', id: 'cool' },
  { icon: '🤡', id: 'clown' },
  { icon: '🤔', id: 'thinking' },
  { icon: '🙌', id: 'raised_hands' },
  { icon: '🙏', id: 'pray' },
  { icon: '🤔', id: 'hmm' }
]

export function EmojiPicker({ onSelect, onClose, position }) {
  const containerRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose()
      }
    }
    
    // Slight delay to prevent the initial click that opens it from instantly closing it
    setTimeout(() => {
      window.addEventListener('click', handleClickOutside)
    }, 10)
    
    return () => window.removeEventListener('click', handleClickOutside)
  }, [onClose])

  return (
    <div 
      ref={containerRef}
      className="absolute z-[100] w-64 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] p-3"
      style={{
        ...position, // Normally { right: 0, bottom: '100%' }
        marginBottom: '8px'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
        <Smile className="w-4 h-4 text-white/50" />
        <span className="text-xs font-bold text-white/50 uppercase tracking-wider">React</span>
      </div>
      
      <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji.id}
            onClick={() => onSelect(emoji.icon)}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl hover:bg-white/10 hover:scale-110 transition-all focus:outline-none"
            title={emoji.id}
          >
            {emoji.icon}
          </button>
        ))}
      </div>
    </div>
  )
}
