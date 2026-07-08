import { useState, useEffect } from 'react'
import '../css/login.css'
import { supabase } from '../dbConnection'

function Login({ onClose }) {
  const [email, setEmail] = useState('')
  const [step, setStep] = useState('email') // 'email' | 'signin' | 'signup'
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const handleCheckEmail = async (event) => {
    event.preventDefault()
    setError('')
    setChecking(true)
    try {
      const res = await fetch(
        `/api/users/exists?email=${encodeURIComponent(email)}`,
      )
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      const data = await res.json()
      setStep(data.exists ? 'signin' : 'signup')
    } catch {
      setError('Could not check that email.')
    } finally {
      setChecking(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    // Redirects to Google; on return the Supabase client restores the session
    // and Root shows the trips feed.
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (oauthError) setError(oauthError.message)
  }

  return (
    <div className="login-overlay" onClick={onClose}>
      <div
        className="login-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Log in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="login-modal__close"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>

        {step === 'email' && (
          <form className="login__form" onSubmit={handleCheckEmail}>
            <h1>Log in</h1>
            <p>Enter your .edu email to continue.</p>

            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@school.edu"
              required
            />

            <button type="submit" disabled={checking}>
              {checking ? 'Checking…' : 'Continue'}
            </button>
            {error && <p className="login__error">{error}</p>}
          </form>
        )}

        {step === 'signin' && (
          <div className="login__form">
            <h1>Welcome back</h1>
            <p>
              <strong>{email}</strong> already has an account. Sign in to
              continue.
            </p>
            <button type="button" onClick={handleGoogle}>
              Sign in with Google
            </button>
            <button
              type="button"
              className="login__link"
              onClick={() => setStep('email')}
            >
              Use a different email
            </button>
            {error && <p className="login__error">{error}</p>}
          </div>
        )}

        {step === 'signup' && (
          <div className="login__form">
            <h1>Create your account</h1>
            <p>
              No account found for <strong>{email}</strong>. Sign up with Google
              to get started.
            </p>
            <button type="button" onClick={handleGoogle}>
              Sign up with Google
            </button>
            <button
              type="button"
              className="login__link"
              onClick={() => setStep('email')}
            >
              Use a different email
            </button>
            {error && <p className="login__error">{error}</p>}
          </div>
        )}
      </div>
    </div>
  )
}

export default Login
