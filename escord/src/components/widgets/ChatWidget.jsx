import React, { useState } from 'react'
import { MessageList } from '../chat/MessageList'
import { MessageInput } from '../chat/MessageInput'
import { useMessages } from '../../hooks/useMessages'
import { useAppContext } from '../../context/AppContext'

export function ChatWidget() {
  const { currentChannel } = useAppContext()
  // Null pass-through will be safely handled by useMessages ignoring fetches when null
  const { messages, sendMessage, addReaction } = useMessages(currentChannel?.id)
  
  const [replyTo, setReplyTo] = useState(null)

  const handleSendMessage = async (content, file = null) => {
    await sendMessage(content, replyTo?.id, file)
    setReplyTo(null)
  }

  const handleReact = async (message) => {
    // Basic mock reaction add for UI demo. Real implementation would open emoji picker.
    await addReaction(message.id, '👍')
  }

  if (!currentChannel || currentChannel.type !== 'text') {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-6">
        <div className="w-16 h-16 bg-[rgba(139,92,246,0.15)] rounded-2xl flex items-center justify-center mb-4 border border-[var(--border)] shadow-[0_0_20px_rgba(139,92,246,0.2)]">
          <span className="text-2xl">💬</span>
        </div>
        <h3 className="text-[var(--text-primary)] font-bold mb-2">No Text Channel Selected</h3>
        <p className="text-[var(--text-muted)] text-sm max-w-xs">Create a server on the left, or select a text channel to start chatting.</p>
      </div>
    )
  }

  return (
    <div className="chat-widget relative">
      {/* Messages Window */}
      <MessageList 
        messages={messages} 
        channelId={currentChannel.id}
        onReply={(msg) => setReplyTo(msg)}
        onReact={handleReact}
      />

      {/* Input Area */}
      <div className="flex-shrink-0 bg-transparent relative pb-2 pt-1">
        <MessageInput 
          channelId={currentChannel.id}
          onSendMessage={handleSendMessage}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
        />
      </div>
    </div>
  )
}
