import '../css/header.css'
function Header({ onNavigate, isLoggedIn, onLogout }) {
  return (
    <header className="site-header">
      <button
        type="button"
        className="site-header__brand"
        onClick={() => onNavigate('home')}
      >
        Hop In
      </button>
      <nav className="site-header__nav">
        <button type="button" onClick={() => onNavigate('home')}>
          Home
        </button>
        <button type="button" onClick={() => onNavigate('about')}>
          About
        </button>
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
