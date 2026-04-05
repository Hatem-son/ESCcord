import React, { useState } from 'react'
import { Copy, Check, Link as LinkIcon } from 'lucide-react'

export function InviteLink({ code = 'escord.app/invite/ABCD123' }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-black/30 rounded-xl p-4 border border-white/5">
      <div className="flex items-center gap-2 mb-2">
        <LinkIcon className="w-4 h-4 text-white/50" />
        <h4 className="text-xs font-semibold text-white/50 uppercase tracking-widest">Invite Link</h4>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-sm font-mono-code text-[var(--color-accent-green)] truncate select-all">
          {code}
        </div>
        <button 
          onClick={handleCopy}
          className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-colors flex-shrink-0"
        >
          {copied ? <Check className="w-5 h-5 text-[#10b981]" /> : <Copy className="w-5 h-5 text-white/70" />}
        </button>
      </div>
      <div className="text-[10px] text-white/40 mt-2">
        This link never expires.
      </div>
    </div>
  )
}
