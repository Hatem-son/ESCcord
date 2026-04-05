import React, { useState, useEffect } from 'react'
import { UserPlus, Users, Search } from 'lucide-react'
import { AddFriendModal } from '../social/AddFriendModal'
import { CreateGroupModal } from '../social/CreateGroupModal'
import { FriendRequests } from '../social/FriendRequests'
import { InviteLink } from '../social/InviteLink'
import { ProfileCard } from '../social/ProfileCard'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export function FriendsWidget() {
  const { user, profile } = useAuth()
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false)
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false)
  const [activeProfile, setActiveProfile] = useState(null)
  const [requests, setRequests] = useState([])
  const [friends, setFriends] = useState([])

  useEffect(() => {
    if (!user) return

    const fetchFriends = async () => {
      // Mocked up fetches for demo
      const { data: pending } = await supabase
        .from('friendships')
        .select('*, profiles!requester_id(*)')
        .eq('receiver_id', user.id)
        .eq('status', 'pending')
      if (pending) setRequests(pending)
      
      const { data: accepted1 } = await supabase
        .from('friendships')
        .select('*, friend:profiles!receiver_id(*)')
        .eq('requester_id', user.id)
        .eq('status', 'accepted')
        
      const { data: accepted2 } = await supabase
        .from('friendships')
        .select('*, friend:profiles!requester_id(*)')
        .eq('receiver_id', user.id)
        .eq('status', 'accepted')

      // Flatten arrays and map properly in a real setup
      setFriends([...(accepted1||[]), ...(accepted2||[])])
    }
    
    fetchFriends()
  }, [user])

  const acceptRequest = async (id) => {
    await supabase.from('friendships').update({ status: 'accepted' }).eq('id', id)
    setRequests(p => p.filter(r => r.id !== id))
  }

  const declineRequest = async (id) => {
    await supabase.from('friendships').delete().eq('id', id)
    setRequests(p => p.filter(r => r.id !== id))
  }

  return (
    <div className="h-full flex flex-col p-4 bg-transparent overflow-y-auto">
      
      <div className="friends-row mb-6">
        <button 
          onClick={() => setIsAddFriendOpen(true)}
          className="add-friend-btn"
          title="Add Friend"
        >
          <UserPlus className="w-5 h-5" />
        </button>
        
        <button 
          onClick={() => setIsCreateGroupOpen(true)}
          className="add-friend-btn"
          title="Create Group"
        >
          <Users className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-6">
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3 ml-1">
            Pending Requests — {requests.length}
          </h3>
          <FriendRequests requests={requests} onAccept={acceptRequest} onDecline={declineRequest} />
        </section>

        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3 ml-1">Share Server</h3>
          <InviteLink />
        </section>
        
        {/* Friend avatars logic display */}
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3 ml-1">
            Active Friends — {friends.length}
          </h3>
          <div className="friends-row">
            {friends.map(friendRow => {
              const profile = friendRow.friend;
              if (!profile) return null;
              return (
                <div 
                   key={friendRow.id} 
                   className="friend-avatar w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-md text-sm relative" 
                   style={{ backgroundColor: profile.avatar_color || '#8b5cf6' }}
                   title={profile.username}
                >
                   {profile.username.charAt(0).toUpperCase()}
                   <div className="friend-status absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#09090b]" />
                </div>
              );
            })}
            {friends.length === 0 && <span className="text-sm text-white/30 italic">No one online</span>}
          </div>
        </section>

        <section className="mt-8 pt-4 border-t border-[var(--border)]">
           <button 
             onClick={() => setActiveProfile(profile)}
             className="text-xs text-[#8b5cf6] hover:underline"
           >
             View My Profile Card
           </button>
        </section>
      </div>

      <AddFriendModal isOpen={isAddFriendOpen} onClose={() => setIsAddFriendOpen(false)} />
      <CreateGroupModal isOpen={isCreateGroupOpen} onClose={() => setIsCreateGroupOpen(false)} />
      <ProfileCard profile={activeProfile} isOpen={!!activeProfile} onClose={() => setActiveProfile(null)} />
    </div>
  )
}
