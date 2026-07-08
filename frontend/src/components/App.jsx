import { useState, useEffect } from 'react'
import { supabase } from './dbConnection'
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
            const res = fetch('http://127.0.0.1:5000/api/auth', {
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

  const loginWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
    })
  }

  const logout = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('supabaseToken')
    alert("Logged out successfully!")
  }

  const testBackendConn = async () => {
    const token = localStorage.getItem('supabaseToken')

    console.log("Token from localStorage: ", token)

    const res = await fetch('http://127.0.0.1:5000/api/test', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    const data = await res.json()
    console.log("Flask response: ", data)
    alert(data.message)
  }

  return (
    <>
      <button onClick={loginWithGoogle}>Login with Google</button>
      <button onClick={logout}>Logout</button>
      <button onClick={testBackendConn}>Test Flask Connection</button>
    </>
  )
}

export default App
