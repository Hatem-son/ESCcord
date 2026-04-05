import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogIn, Loader2 } from 'lucide-react'

export default function Login() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const { error } = await signIn({ identifier, password })
      if (error) throw error
      navigate('/app')
    } catch (err) {
      setError(err.message || 'Failed to login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--color-accent-violet)] rounded-full blur-[120px] opacity-20 animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--color-accent-green)] rounded-full blur-[120px] opacity-20" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="glass-card w-full max-w-md p-8 relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="w-16 h-16 bg-[rgba(255,255,255,0.1)] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[rgba(255,255,255,0.05)]"
          >
            <span className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-[#10b981] to-[#8b5cf6]">E</span>
          </motion.div>
          <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
          <p className="text-[var(--color-text-muted)]">Log in to enter the ESCORD</p>
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
            <label className="block text-sm font-medium mb-1 text-[var(--color-text-muted)]">Username or Email</label>
            <input 
              type="text" 
              required
              className="glass-input w-full p-3 text-[var(--color-text-primary)]"
              placeholder="e.g. shadow_weaver or john@doe.com"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-[var(--color-text-muted)]">Password</label>
            <input 
              type="password" 
              required
              className="glass-input w-full p-3 text-[var(--color-text-primary)]"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading}
            className="glass-button w-full p-3 rounded-xl font-medium text-white flex items-center justify-center space-x-2 mt-6 bg-[rgba(16,185,129,0.2)] hover:bg-[rgba(16,185,129,0.3)] border-[rgba(16,185,129,0.3)] transition-all"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                <span>Sign In</span>
                <LogIn className="w-4 h-4 ml-2" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
          Don't have an account?{' '}
          <Link to="/register" className="text-[var(--color-accent-green)] hover:text-[#34d399] transition-colors">
            Register here
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
