import React, { useState, useEffect, useRef } from 'react'
import { WidgetWrapper } from '../widgets/WidgetWrapper'
import { ChatWidget } from '../widgets/ChatWidget'
import { VoiceWidget } from '../widgets/VoiceWidget'
import { ActivitiesLauncher } from '../widgets/ActivitiesLauncher'
import { GroupsWidget } from '../widgets/GroupsWidget'
import { LeftPanel } from './LeftPanel'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppContext } from '../../context/AppContext'

export function BentoGrid() {
  const { currentGroup, currentChannel } = useAppContext()
  const layoutRef = useRef(null)
  const isDragging = useRef(null)
  
  // Configurable Column Widths (Percentages)
  const [navWidth, setNavWidth] = useState(30)
  const [actWidth, setActWidth] = useState(18)

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging.current || !layoutRef.current) return;
      const rect = layoutRef.current.getBoundingClientRect();
      const containerWidth = rect.width;
      
      if (isDragging.current === 'nav') {
        let newW = ((e.clientX - rect.left) / containerWidth) * 100;
        if (newW < 15) newW = 15;
        if (newW > 50) newW = 50;
        setNavWidth(newW);
      } else if (isDragging.current === 'act') {
        let newW = ((rect.right - e.clientX) / containerWidth) * 100;
        if (newW < 10) newW = 10;
        if (newW > 40) newW = 40;
        setActWidth(newW);
      }
    };
    
    const handleMouseUp = () => {
      isDragging.current = null;
      document.body.style.cursor = 'default';
      // Restore user-select
      document.body.style.userSelect = 'auto';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
  }, []);

  const handleDragStart = (axis) => {
    isDragging.current = axis;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none'; // Prevent text highlighting while dragging
  };

  const containerVariants = {
    animate: { transition: { staggerChildren: 0.05 } }
  }

  return (
    <div className="p-3 pb-24 flex-1 h-full overflow-hidden flex flex-col">
      <motion.div 
        ref={layoutRef}
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="flex flex-col md:flex-row gap-2 h-full"
      >
        
        {/* COL 1: Unified Navigation */}
        <div style={{ width: `${navWidth}%` }} className="flex-shrink-0 h-full flex flex-col">
          <WidgetWrapper 
            id="widget-navigation" 
            title="Navigation" 
            icon="🧭"
            className="flex-1 p-0 overflow-hidden"
          >
            <div className="flex h-full w-full bg-black/10 relative">
              <div className="w-[88px] bg-black/40 border-r border-white/5 flex-shrink-0 pt-2 rounded-r-3xl shadow-[4px_0_24px_rgba(0,0,0,0.2)] z-10 transition-all">
                <GroupsWidget iconsOnly />
              </div>
              <div className="flex-1 min-w-0 z-0 h-full"> {/* Ensure h-full for content wrapper */}
                <LeftPanel inWidget />
              </div>
            </div>
          </WidgetWrapper>
        </div>

        {/* Resizer 1 */}
        <div 
          className="hidden md:flex w-2 group cursor-col-resize items-center justify-center flex-shrink-0 z-50"
          onMouseDown={() => handleDragStart('nav')}
        >
          <div className="w-0.5 h-16 bg-white/10 group-hover:bg-[#8b5cf6] rounded-full transition-colors" />
        </div>
        
        {/* COL 2: Dynamic Focal Stage */}
        <div className="flex-1 h-full relative flex flex-col min-w-0">
          <>
            {currentChannel?.type === 'voice' ? (
              <div 
                key="voice" 
                className="absolute inset-0 flex"
              >
                <WidgetWrapper 
                  id="widget-voice" 
                  title="Voice Lounge" 
                  icon="🎙️"
                  className="w-full h-full shadow-[0_0_40px_rgba(16,185,129,0.15)]"
                >
                  <VoiceWidget />
                </WidgetWrapper>
              </div>
            ) : (
              <div 
                key="chat"
                className="absolute inset-0 flex"
              >
                <WidgetWrapper 
                  id="widget-chat" 
                  title="Chat Stream" 
                  icon="💬"
                  className="w-full h-full shadow-[0_0_40px_rgba(139,92,246,0.1)]"
                >
                  <ChatWidget />
                </WidgetWrapper>
              </div>
            )}
          </>
        </div>

        {/* Resizer 2 */}
        <div 
          className="hidden md:flex w-2 group cursor-col-resize items-center justify-center flex-shrink-0 z-50"
          onMouseDown={() => handleDragStart('act')}
        >
          <div className="w-0.5 h-16 bg-white/10 group-hover:bg-[#8b5cf6] rounded-full transition-colors" />
        </div>

        {/* COL 3: Activities Launcher */}
        <div style={{ width: `${actWidth}%` }} className="flex-shrink-0 h-full flex flex-col">
          <WidgetWrapper 
            id="widget-activities" 
            title="Activities" 
            icon="🚀"
            className="flex-1"
          >
            <ActivitiesLauncher />
          </WidgetWrapper>
        </div>

      </motion.div>
    </div>
  )
}
