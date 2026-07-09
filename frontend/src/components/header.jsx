import '../css/header.css'
import { Link } from 'react-router-dom'
function Header({ onNavigate, isLoggedIn, onLogout }) {
  return (
    <header className="site-header">
      <Link
        to="/"
        className="site-header__brand"
      >
        Hop In
      </Link>
      <nav className="site-header__nav">
        <Link to="/" >Home</Link>
        <Link to="/edit-profile" >Profile</Link>
        <Link to="/about" >About</Link>

        {isLoggedIn ? (
          <button type="button" onClick={onLogout}>
            Log out
          </button>
        ) : (
          <button type="button" onClick={() => onNavigate('login')}>
            Login
          </button>
        )}

      </nav>
    </header>
  )
}

export default Header
