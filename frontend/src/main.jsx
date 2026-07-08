import { StrictMode, useState, React } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { createRoot } from 'react-dom/client'
import './css/index.css'
import Header from './components/header.jsx'
import Footer from './components/footer.jsx'
import Login from './components/login.jsx'
import App from './components/App.jsx'

function Root() {
  const [showLogin, setShowLogin] = useState(false)

  return (
    <BrowserRouter>
      <Header onNavigate={(page) => setShowLogin(page === 'login')} />
      <App />
      <Footer />
      {showLogin && <Login onClose={() => setShowLogin(false)} />}
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
