import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './css/index.css'
import Header from './components/header.jsx'
import Footer from './components/footer.jsx'
import Login from './components/login.jsx'
import App from './components/App.jsx'
import TripsFeed from './components/TripsFeed.jsx'

function Root() {
  const [showLogin, setShowLogin] = useState(false)
  // TODO: once auth is set up, initialize this from the current session
  // so a user who is already logged in lands straight on the trips feed.
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const handleLoginSuccess = () => {
    setIsLoggedIn(true)
    setShowLogin(false)
  }

  return (
    <>
      <Header onNavigate={(page) => setShowLogin(page === 'login')} />
      {isLoggedIn ? <TripsFeed /> : <App />}
      <Footer />
      {showLogin && (
        <Login
          onClose={() => setShowLogin(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
