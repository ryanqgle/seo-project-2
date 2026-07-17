import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { supabase } from '../dbConnection'
import UserProfile from './UserProfile'
import Home from './Home'
import { apiUrl } from '../api'
import '../css/App.css'

// NOTE: This is an early version of the app and is no longer wired up. The app
// that actually runs is defined in `main.jsx` (the `Shell` component). The
// login/sign-up logic here now lives in `auth.jsx`. Kept for reference only.
function App() {

  // Runs once when the page loads. It listens for the user logging in, and when
  // that happens it makes sure the account uses a school (.edu) email and saves
  // the new user in our database.
  useEffect(() => {
    // `onAuthStateChange` calls us whenever the login state changes (for example,
    // right after someone signs in with Google).
    const { data } = supabase.auth.onAuthStateChange((event, session) =>{
      if (event === 'SIGNED_IN' && session){
        const email = session.user.email

        // Only school emails are allowed. If it's not one, sign them back out.
        if (!email.endsWith('.edu')) {
          alert('Login with a valid .edu email')
          supabase.auth.signOut()
        } else {
          // Remember the login token so later requests can prove who we are.
          localStorage.setItem('supabaseToken', session.access_token)
          console.log("Successfully logged in")

          // Tell our backend to create/record this user in the database.
          try {
            const res = fetch(apiUrl('/api/auth'), {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session.access_token}`
              }
            })
            const data = res.json()
            console.log("Database response: ", data)
          } catch (error) {
            console.error("Error registering user: ", error)
          }
        }
      }
    })
    // Stop listening for login changes when this screen is no longer shown, so
    // it doesn't keep running in the background.
    return () => data.subscription.unsubscribe()
  }, [])


  return (
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/edit-profile" element={<UserProfile />} />
      </Routes>
  )
}

export default App
