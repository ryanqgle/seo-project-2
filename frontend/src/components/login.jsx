import { useState, useEffect } from 'react'
import '../css/login.css'
import { supabase } from '../dbConnection'
import { apiUrl } from '../api'

// The login pop-up (modal). It walks the user through two quick steps:
//   1. Enter an email. We check whether an account already exists for it.
//   2. Continue with Google — either to sign in (existing account) or sign up
//      (new account). Google itself handles the password/security.
// `onClose` is called to close the pop-up.
function Login({ onClose }) {
  const [email, setEmail] = useState('')
  // Which screen of the pop-up is showing right now.
  const [step, setStep] = useState('email') // 'email' | 'signin' | 'signup'
  // True while we're waiting on the "does this email exist?" check.
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')

  // Let the user press the Escape key to close the pop-up.
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    // Remove the key listener when the pop-up closes.
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  // Step 1: after the user types their email and hits Continue, ask the backend
  // whether that email already has an account. Based on the answer, show either
  // the "sign in" screen or the "sign up" screen.
  const handleCheckEmail = async (event) => {
    event.preventDefault()
    setError('')
    setChecking(true)
    try {
      const res = await fetch(
        apiUrl(`/api/users/exists?email=${encodeURIComponent(email)}`),
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

  // Step 2: send the user to Google to finish signing in. After they approve,
  // Google sends them back to the app already logged in, and the app
  // automatically shows the logged-in view.
  const handleGoogle = async () => {
    setError('')
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (oauthError) setError(oauthError.message)
  }

  const handleMicrosoft = async () => {
    setError('')
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: { 
        scopes: 'email',
        redirectTo: window.location.origin 
      },
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
            <button type="button" onClick={handleGoogle} style={{ marginBottom: '10px' }}>
              Sign in with Google
            </button>
            <button type="button" onClick={handleMicrosoft}>
              Sign in with Microsoft
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
            <button type="button" onClick={handleGoogle} style={{ marginBottom: '10px' }}>
              Sign up with Google
            </button>
            <button type="button" onClick={handleMicrosoft}>
              Sign up with Microsoft
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
