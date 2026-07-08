import '../css/header.css'
import { Link } from 'react-router-dom'

function Header({ onNavigate }) {
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
        <Link to="/profile" >Profile</Link>
        <Link to="/about" >About</Link>
        <Link to="/login" >Login</Link>
      </nav>
    </header>
  )
}

export default Header
