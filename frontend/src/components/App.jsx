import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { supabase } from '../dbConnection'
import UserProfile from './UserProfile'
import Home from './Home'
import '../css/App.css'

function App() {

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) =>{
      if (event === 'SIGNED_IN' && session){
        const email = session.user.email

        if (!email.endsWith('.edu')) {
          alert('Login with a valid .edu email')
          supabase.auth.signOut()
        } else {
          localStorage.setItem('supabaseToken', session.access_token)
          console.log("Successfully logged in")

          try {
            const res = fetch('/api/auth', {
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
