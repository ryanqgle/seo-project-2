import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './dbConnection'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  // `loading` is true until we know whether a session exists. Guards wait on
  // this so a page refresh on a protected route doesn't bounce to home before
  // the persisted session has loaded.
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Restore any persisted session on load (this is what keeps you logged in
    // across refreshes and while navigating between pages).
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    // Fires on sign-in (including after the Google redirect), sign-out, and
    // token refresh.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      // Only .edu accounts are allowed.
      if (next && !next.user.email?.endsWith('.edu')) {
        alert('Please log in with a valid .edu email.')
        supabase.auth.signOut()
        return
      }
      setSession(next)
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  // Make sure the signed-in user exists in our `users` table.
  useEffect(() => {
    if (!session) return
    fetch('/api/auth', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    }).catch(() => {})
  }, [session])

  const value = {
    session,
    token: session?.access_token ?? null,
    isLoggedIn: !!session,
    loading,
    logout: () => supabase.auth.signOut(),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
