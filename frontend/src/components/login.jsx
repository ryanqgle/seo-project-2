import { useState, useEffect } from 'react'
import '../css/login.css'

function Login({ onClose }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const handleSubmit = (event) => {
    event.preventDefault()
    // TODO: connect to .edu auth thing
    console.log('Logging in with', { email, password })
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
        <form className="login__form" onSubmit={handleSubmit}>
          <h1>Log in</h1>
          <p>Please sign in to continue.</p>

          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <button type="submit">Log in</button>
        </form>
      </div>
    </div>
  )
}

export default Login
