import React from 'react'
import { motion } from 'framer-motion'
import { Maximize2, Minimize2, X } from 'lucide-react'
import { useAppContext } from '../../context/AppContext'
import { cn } from '../../lib/utils'

export function WidgetWrapper({ id, title, icon, children, className, headerAction }) {
  const transitionSettings = { type: "spring", stiffness: 300, damping: 28 }

  const itemVariants = {
    initial: { opacity: 0, y: 10, scale: 0.97 },
    animate: { opacity: 1, y: 0, scale: 1, transition: transitionSettings }
  }

  return (
    <>
      <motion.div
        layoutId={id}
        variants={itemVariants}
        className={cn(
          "widget relative flex flex-col",
          className
        )}
      >
        <div className="widget-header group">
          <div className="widget-title select-none">
            <div className="widget-icon">{icon || "✨"}</div>
            {title}
          </div>
          <div className="flex items-center gap-2">
            {headerAction}
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden relative">
          {children}
        </div>
      </motion.div>
    </>
  )
}
