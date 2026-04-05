import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const signUp = async ({ email, username, password, avatar_color }) => {
    const escord_id = Math.floor(1000 + Math.random() * 9000).toString()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          escord_id,
          avatar_color
        }
      }
    })

    // Notice: Due to RLS or triggers, inserting into 'profiles' might be better handled via a Supabase Trigger.
    // However, since we don't have a backend trigger mapped in the prompt, we insert the profile manually here.
    if (data.user && !error) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        username,
        email,
        escord_id,
        avatar_color
      })
    }
    return { data, error }
  }

  const signIn = async ({ identifier, password }) => {
    let loginEmail = identifier

    if (!identifier.includes('@')) {
      const { data, error } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', identifier)
        .single()
      
      if (error || !data?.email) {
        throw new Error('Username not found. Try logging in with your email.')
      }
      loginEmail = data.email
    }

    return supabase.auth.signInWithPassword({
      email: loginEmail,
      password
    })
  }

  const signOut = async () => {
    return supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ session, user, profile, signUp, signIn, signOut, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
