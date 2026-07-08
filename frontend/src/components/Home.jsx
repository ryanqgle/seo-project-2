import { useState, useEffect } from 'react'
import { supabase } from '../dbConnection'

function Home () {

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

    try {
        const res = await fetch('http://127.0.0.1:5000/api/test', {
         method: 'GET',
         headers: {
            'Authorization': `Bearer ${token}`
         }})

        const data = await res.json()
        alert(data.message)
    } catch (err) {
        console.error('Error testing backend connection:', err)
    }

  }

  return (
    <>
      <button onClick={loginWithGoogle}>Login with Google</button>
      <button onClick={logout}>Logout</button>
    </>
  )
}

export default Home
