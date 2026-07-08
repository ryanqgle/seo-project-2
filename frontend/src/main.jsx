import { StrictMode, useState, React, useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { createRoot } from 'react-dom/client'
import './css/index.css'
import { supabase } from './dbConnection'
import Header from './components/header.jsx'
import Footer from './components/footer.jsx'
import Login from './components/login.jsx'
import App from './components/App.jsx'
import TripsFeed from './components/TripsFeed.jsx'

function Root() {
  const [showLogin, setShowLogin] = useState(false)
  const [session, setSession] = useState(null)

  useEffect(() => {
    // Restore an existing session on load so a logged-in user goes straight
    // to the feed without logging in again.
    supabase.auth.getSession().then(({ data }) => setSession(data.session))

    // updates on sign-in (including after the Google redirect), sign-out, and
    // token refresh — keeps our view in sync with the auth state.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      // Only .edu accounts are allowed; reject anything else.
      if (next && !next.user.email?.endsWith('.edu')) {
        alert('Please log in with a valid .edu email.')
        supabase.auth.signOut()
        return
      }
      setSession(next)
      if (next) setShowLogin(false)
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    // After sign-in, make sure the user exists in our `users` table.
    if (!session) return
    fetch('/api/auth', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    }).catch(() => {})
  }, [session])

  const isLoggedIn = !!session

  const handleLogout = () => {
    supabase.auth.signOut()
  }

  return (
    <BrowserRouter>
      <Header
        isLoggedIn={isLoggedIn}
        onNavigate={(page) => setShowLogin(page === 'login')}
        onLogout={handleLogout}
      />
      {isLoggedIn ? <TripsFeed /> : <App />}
      <Footer />
      {showLogin && <Login onClose={() => setShowLogin(false)} />}
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
