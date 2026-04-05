import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { UserPlus, Loader2, Check } from 'lucide-react'
import { cn } from '../lib/utils'

const COLORS = [
  '#10b981', '#3b82f6', '#8b5cf6', '#ec4899',
  '#ef4444', '#f59e0b', '#14b8a6', '#6366f1'
]

export default function Register() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [avatarColor, setAvatarColor] = useState(COLORS[0])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const validatePassword = (pw) => {
    if (pw.length < 8) return "Password must be at least 8 characters"
    if (!/[A-Z]/.test(pw)) return "Password must contain an uppercase letter"
    if (!/[a-z]/.test(pw)) return "Password must contain a lowercase letter"
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (username.length < 3 || username.length > 20) {
      return setError("Username must be between 3 and 20 characters")
    }

    if (password !== confirmPassword) {
      return setError("Passwords do not match")
    }

    const pwError = validatePassword(password)
    if (pwError) {
      return setError(pwError)
    }

    setIsLoading(true)

    try {
      const { error } = await signUp({ email, username, password, avatar_color: avatarColor })
      if (error) throw error
      // If success, navigate to home (which will redirect to login or open directly if logged in)
      navigate('/app')
    } catch (err) {
      setError(err.message || 'Failed to register')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--color-accent-violet)] rounded-full blur-[120px] opacity-20 animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--color-accent-green)] rounded-full blur-[120px] opacity-20" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="glass-card w-full max-w-md p-8 relative z-10"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Create Account</h1>
          <p className="text-[var(--color-text-muted)]">Join the ESCORD network</p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-3 rounded-lg bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] text-[var(--color-accent-red)] text-sm text-center"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-[var(--color-text-muted)]">Email Address</label>
            <input 
              type="email" 
              required
              className="glass-input w-full p-3 text-[var(--color-text-primary)]"
              placeholder="you@domain.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-[var(--color-text-muted)]">Username</label>
            <input 
              type="text" 
              required
              className="glass-input w-full p-3 text-[var(--color-text-primary)]"
              placeholder="3-20 characters"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>

          <div className="pt-2 pb-2">
            <label className="block text-sm font-medium mb-2 text-[var(--color-text-muted)]">Choose Avatar Color</label>
            <div className="flex gap-2 flex-wrap justify-between">
              {COLORS.map(c => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setAvatarColor(c)}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer focus:outline-none",
                    avatarColor === c ? "ring-2 ring-offset-2 ring-offset-[#09090b] ring-white scale-110" : "hover:scale-110"
                  )}
                  style={{ backgroundColor: c }}
                >
                  {avatarColor === c && <Check className="w-4 h-4 text-white/90" />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-[var(--color-text-muted)]">Password</label>
            <input 
              type="password" 
              required
              className="glass-input w-full p-3 text-[var(--color-text-primary)]"
              placeholder="Min 8 chars, 1 uppercase, 1 lowercase"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-[var(--color-text-muted)]">Confirm Password</label>
            <input 
              type="password" 
              required
              className="glass-input w-full p-3 text-[var(--color-text-primary)]"
              placeholder="Repeat password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading}
            className="glass-button w-full p-3 rounded-xl font-medium text-white flex items-center justify-center space-x-2 mt-6 bg-[rgba(139,92,246,0.2)] hover:bg-[rgba(139,92,246,0.3)] border-[rgba(139,92,246,0.3)] transition-all"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                <span>Sign Up</span>
                <UserPlus className="w-4 h-4 ml-2" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
          Already have an account?{' '}
          <Link to="/login" className="text-[var(--color-accent-violet)] hover:text-[#a78bfa] transition-colors">
            Log in here
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
