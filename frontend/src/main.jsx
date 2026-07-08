import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './css/index.css'
import Header from './components/header.jsx'
import Footer from './components/footer.jsx'
import Login from './components/login.jsx'
import App from './components/App.jsx'

function Root() {
  const [showLogin, setShowLogin] = useState(false)

  return (
    <>
      <Header onNavigate={(page) => setShowLogin(page === 'login')} />
      <App />
      <Footer />
      {showLogin && <Login onClose={() => setShowLogin(false)} />}
    </>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
