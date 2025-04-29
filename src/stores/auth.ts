import { create } from 'zustand'
import { supabase } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signInWithGithub: () => Promise<void>
  signInWithGoogle: () => Promise<void>
  signInWithFacebook: () => Promise<void>
  signInWithLinkedIn: () => Promise<void>
  signOut: () => Promise<void>
  loadProfile: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  signIn: async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    set({ user: data.user })
    await get().loadProfile()
  },
  signUp: async (email: string, password: string) => {
    const { error: signUpError, data } = await supabase.auth.signUp({
      email,
      password,
    })
    
    if (signUpError) {
      console.error('Supabase sign-up error:', signUpError.message);
      alert(`Sign-up failed: ${signUpError.message}`);
      throw signUpError;
    }

    if (data.user) {
      set({ user: data.user })
      await get().loadProfile()
    }
  },
  signInWithGithub: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/profile/setup`
      }
    })
    if (error) throw error
  },
  signInWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/profile/setup`
      }
    })
    if (error) throw error
  },
  signInWithFacebook: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: `${window.location.origin}/profile/setup`
      }
    })
    if (error) throw error
  },
  signInWithLinkedIn: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'linkedin',
      options: {
        redirectTo: `${window.location.origin}/profile/setup`
      }
    })
    if (error) throw error
  },
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    set({ user: null, profile: null })
  },
  loadProfile: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        set({ user: null, profile: null, loading: false })
        return
      }

      set({ user })

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error loading profile:', error)
        set({ loading: false })
        return
      }

      set({ profile, loading: false })
    } catch (error) {
      console.error('Error loading profile:', error)
      set({ loading: false })
    }
  },
  resetPassword: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?reset=true`,
    })
    if (error) throw error
  },
}))