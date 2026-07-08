import '../css/header.css'
import { Link } from 'react-router-dom'

function Header({ onLogin, isLoggedIn, onLogout }) {
  return (
    <header className="site-header">
      <Link to="/" className="site-header__brand">
        Hop In
      </Link>
      <nav className="site-header__nav">
        <Link to="/">Home</Link>
        {isLoggedIn && <Link to="/feed">Trips</Link>}
        {isLoggedIn && <Link to="/profile">Profile</Link>}

        {isLoggedIn ? (
          <button type="button" onClick={onLogout}>
            Log out
          </button>
        ) : (
          <button type="button" onClick={onLogin}>
            Login
          </button>
        )}
      </nav>
    </header>
  )
}

export default Header
