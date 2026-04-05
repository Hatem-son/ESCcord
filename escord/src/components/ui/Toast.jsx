import React, { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

const ToastContext = createContext()

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info') => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev.slice(-2), { id, message, type }]) // Max 3 toasts
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 5000)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-6 right-6 z-[999] flex flex-col gap-3 pointer-events-none w-80 perspective-[1000px]">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -50, scale: 0.8, rotateX: -60 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: 100, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className={`glass-card p-4 shadow-[0_10px_40px_rgba(0,0,0,0.5)] pointer-events-auto border flex justify-between items-center rounded-2xl ${
                 t.type === 'error' ? 'border-red-500/50 bg-red-500/10' : 'border-[#8b5cf6]/30 bg-[#09090b]/80 backdrop-blur-xl'
              }`}
              style={{ transformOrigin: "top" }}
            >
              <div className="flex flex-col">
                <span className="text-white font-bold text-sm leading-tight">{t.type === 'error' ? 'Error' : 'Notification'}</span>
                <span className="text-sm font-medium text-white/70">{t.message}</span>
              </div>
              <button onClick={() => removeToast(t.id)} className="text-white/30 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
