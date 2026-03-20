import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null)
  const [business, setBusiness] = useState(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchBusiness(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchBusiness(session.user.id)
      else { setBusiness(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchBusiness = async (userId) => {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
    if (error) console.error('[fetchBusiness] error:', error.message, error.code)
    setBusiness(data?.[0] ?? null)
    setLoading(false)
  }

  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    return data
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const signInWithGoogle = async () => {
    const redirectTo = `${window.location.origin}/register`
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const createBusiness = async (businessData) => {
    const { data, error } = await supabase
      .from('businesses')
      .insert({ ...businessData, user_id: user.id })
      .select()
      .single()
    if (error) throw error
    setBusiness(data)
    return data
  }

  const updateBusiness = async (updates) => {
    const { data, error } = await supabase
      .from('businesses')
      .update(updates)
      .eq('id', business.id)
      .select()
      .single()
    if (error) throw error
    setBusiness(data)
    return data
  }

  return (
    <AuthContext.Provider value={{ user, business, loading, signUp, signIn, signInWithGoogle, signOut, createBusiness, updateBusiness }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
