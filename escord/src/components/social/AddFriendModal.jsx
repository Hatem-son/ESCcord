import React, { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { Search, UserPlus, Loader2, Check, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { motion } from 'framer-motion'

export function AddFriendModal({ isOpen, onClose }) {
  const { user } = useAuth()
  const [username, setUsername] = useState('')
  const [tag, setTag] = useState('')
  const [result, setResult] = useState(null)
  const [isSearching, setIsSearching] = useState(false)
  const [status, setStatus] = useState('')

  useEffect(() => {
    if (!username || tag.length < 4) {
      setResult(null)
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      setStatus('')
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .eq('escord_id', tag)
        .single()

      if (data && data.id !== user?.id) {
        setResult(data)
      } else {
        setResult(null)
      }
      setIsSearching(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [username, tag, user])

  const sendRequest = async () => {
    if (!result) return
    setStatus('sending')
    
    try {
      // Check if friendship already exists
      const { data: existingFriendships, error: checkError } = await supabase
        .from('friendships')
        .select('*')
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)

      if (checkError) throw checkError;

      const existing = existingFriendships?.find(f => 
        (f.requester_id === user.id && f.receiver_id === result.id) ||
        (f.requester_id === result.id && f.receiver_id === user.id)
      )

      if (existing) {
        setStatus('error')
        return
      }

      const { error } = await supabase.from('friendships').insert({
        requester_id: user.id,
        receiver_id: result.id,
        status: 'pending'
      })
      
      if (!error) {
        setStatus('sent')
      } else {
        console.error("Insert error:", error)
        setStatus('error')
      }
    } catch (e) {
      console.error("Add friend error:", e)
      setStatus('error')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Friend">
      <div className="space-y-4">
        <p className="text-sm text-white/60">
          You can add a friend with their ESCORD tag. It's capital sensitive!
        </p>

        <div className="flex gap-2 isolate">
          <div className="relative flex-1">
            <input
              type="text"
              className="glass-input w-full p-3 pl-10 bg-black/40 text-lg tracking-wide focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] rounded-l-xl rounded-r-none"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          </div>
          
          <div className="relative w-32 flex items-center bg-black/40 border border-white/10 rounded-r-xl focus-within:border-[#10b981] focus-within:ring-1 focus-within:ring-[#10b981] transition-all">
            <span className="text-white/40 font-bold px-3 select-none">#</span>
            <input
              type="text"
              maxLength={4}
              className="w-full bg-transparent text-lg tracking-wide border-none focus:ring-0 text-white/80 p-3 pl-0 placeholder-white/20"
              placeholder="0000"
              value={tag}
              onChange={e => {
                const val = e.target.value;
                if (val.length <= 4) setTag(val);
              }}
            />
          </div>
        </div>

        {isSearching && (
          <div className="flex justify-center p-4">
            <Loader2 className="w-6 h-6 animate-spin text-[#10b981]" />
          </div>
        )}

        {result && !isSearching && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl border border-white/10 bg-white/5 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-md text-sm"
                style={{ backgroundColor: result.avatar_color }}
              >
                {result.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold">{result.username}</div>
                <div className="text-xs text-white/40">#{result.escord_id}</div>
              </div>
            </div>

            {status === 'sent' ? (
              <button disabled className="glass-button bg-[#10b981]/20 border-[#10b981]/30 text-[#10b981] px-4 py-2 rounded-lg flex items-center gap-2">
                <Check className="w-4 h-4" /> Sent
              </button>
            ) : status === 'sending' ? (
              <button disabled className="glass-button px-4 py-2 rounded-lg">
                <Loader2 className="w-4 h-4 animate-spin text-[#10b981]" />
              </button>
            ) : status === 'error' ? (
              <button disabled className="glass-button bg-red-500/20 border-red-500/30 text-red-500 px-4 py-2 rounded-lg flex items-center gap-2">
                <X className="w-4 h-4" /> Error
              </button>
            ) : (
              <button 
                onClick={sendRequest}
                className="glass-button bg-[#10b981] hover:bg-[#34d399] border-none text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
              >
                <UserPlus className="w-4 h-4" /> Add
              </button>
            )}
          </motion.div>
        )}
      </div>
    </Modal>
  )
}
