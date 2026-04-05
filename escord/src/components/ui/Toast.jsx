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
      <div className="fixed bottom-4 right-4 z-[999] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, scale: 0.8, x: 50 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 50 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={`glass-card p-4 min-w-[250px] shadow-2xl pointer-events-auto border flex justify-between items-center ${
                 t.type === 'error' ? 'border-red-500/50 bg-red-500/10' : 'border-white/10'
              }`}
            >
              <span className="text-sm font-medium">{t.message}</span>
              <button onClick={() => removeToast(t.id)} className="text-white/50 hover:text-white p-1">
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
