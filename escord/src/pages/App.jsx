import React from 'react'
import { LeftPanel } from '../components/layout/LeftPanel'
import { BentoGrid } from '../components/layout/BentoGrid'
import { FullScreenWrapper } from '../components/ui/FullScreenWrapper'
import { FloatingDock } from '../components/layout/FloatingDock'
import { motion } from 'framer-motion'

// Import widgets for their fullscreen rendered versions
import { ChatWidget } from '../components/widgets/ChatWidget'
import { VoiceWidget } from '../components/widgets/VoiceWidget'
import { WatchWidget } from '../components/widgets/WatchWidget'
import { GroupsWidget } from '../components/widgets/GroupsWidget'
import { IncomingCallModal } from '../components/voice/IncomingCallModal'
import { OutgoingCallModal } from '../components/voice/OutgoingCallModal'

export default function EscordApp() {
  return (
    <div className="flex h-screen w-full overflow-hidden relative bg-[#0a0a18]">
      {/* Background Animated Lighting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Highly Dynamic Grid Background */}
        <div 
          className="absolute inset-0 z-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(139, 92, 246, 0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(139, 92, 246, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            animation: 'pan-grid 20s linear infinite'
          }}
        />

        {/* Dynamic Color Mesh */}
        <motion.div 
          animate={{ 
            scale: [1, 1.4, 1], 
            opacity: [0.3, 0.6, 0.3],
            x: ['-10%', '10%', '-10%'],
            y: ['-10%', '10%', '-10%']
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 left-0 w-[80vw] h-[80vw] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.2)_0%,transparent_50%)] blur-3xl mix-blend-screen"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.5, 1], 
            opacity: [0.3, 0.5, 0.3],
            x: ['10%', '-5%', '10%'],
            y: ['-5%', '10%', '-5%']
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-[20%] right-0 w-[50vw] h-[50vw] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.2)_0%,transparent_60%)] blur-3xl mix-blend-screen"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.6, 1], 
            opacity: [0.2, 0.4, 0.2],
            x: ['0%', '10%', '0%'],
            y: ['10%', '-5%', '10%']
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className="absolute bottom-[-10%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.15)_0%,transparent_60%)] blur-3xl mix-blend-screen"
        />
        {/* Deep ambient core */}
        <motion.div 
          animate={{ opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.05)_0%,transparent_70%)] blur-[100px] pointer-events-none"
        />
      </div>
      
      <IncomingCallModal />
      <OutgoingCallModal />

      <div className="flex flex-1 h-[calc(100vh-5rem)] overflow-hidden z-10 relative">
        <main className="flex-1 min-w-0 h-full relative">
          <BentoGrid />
        </main>
      </div>

      <FloatingDock />

      {/* Full-Screen Modes mapped at the root layer for layoutId continuity */}
      <FullScreenWrapper activeId="widget-chat">
        <ChatWidget />
      </FullScreenWrapper>
      <FullScreenWrapper activeId="widget-voice">
        <VoiceWidget />
      </FullScreenWrapper>
      <FullScreenWrapper activeId="widget-groups">
        <GroupsWidget />
      </FullScreenWrapper>
      <FullScreenWrapper activeId="widget-watch">
        <WatchWidget />
      </FullScreenWrapper>
    </div>
  )
}
