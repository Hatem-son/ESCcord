import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useAppContext } from '../../context/AppContext'

const springProps = { type: "spring", stiffness: 300, damping: 35 }

export function FullScreenWrapper({ children, activeId }) {
  const { activeWidgetId, setActiveWidgetId } = useAppContext()

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && activeWidgetId) {
        setActiveWidgetId(null)
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [activeWidgetId, setActiveWidgetId])

  return (
    <AnimatePresence>
      {activeWidgetId === activeId && (
        <motion.div
          className="fixed inset-0 z-50 flex"
          // We don't blur the background since we want the glass card itself to be the focus
          // and other widgets fade out behind it
        >
          {/* We assume Sidebar is 64px, so we offset the expanded pane on desktop context */}
          <div className="w-[64px] hidden md:block flex-shrink-0" />
          
          <div className="flex-1 p-4 md:p-6 flex relative">
            <motion.div
              layoutId={activeId}
              transition={springProps}
              className="glass-card flex-1 flex flex-col overflow-hidden relative shadow-2xl"
            >
              <button 
                onClick={() => setActiveWidgetId(null)}
                className="absolute top-4 right-4 z-50 glass-button p-2 rounded-full hover:bg-red-500/20 hover:text-red-400 opacity-70 hover:opacity-100"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex-1 overflow-hidden relative">
                {children}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
