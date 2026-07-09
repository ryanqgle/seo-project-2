import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { ChakraProvider } from '@chakra-ui/react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './css/index.css'
import { AuthProvider, useAuth } from './auth.jsx'
import Header from './components/header.jsx'
import Footer from './components/footer.jsx'
import Login from './components/login.jsx'
import Home from './components/Home.jsx'
import TripsFeed from './components/TripsFeed.jsx'
import UserProfile from './components/UserProfile.jsx'
import ProfileView from './components/ProfileView.jsx'
import CreateRideForm from './components/createRideForm.jsx'

// Wraps routes that require a logged-in user. While the session is still
// loading we render nothing so we don't redirect prematurely; once loaded, an
// unauthenticated user is sent back to the home page.
function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useAuth()
  if (loading) return null
  if (!isLoggedIn) return <Navigate to="/" replace />
  return children
}

function Shell() {
  const { isLoggedIn, logout } = useAuth()
  const [showLogin, setShowLogin] = useState(false)

  // Close the login modal automatically once the user is logged in.
  useEffect(() => {
    if (isLoggedIn) setShowLogin(false)
  }, [isLoggedIn])

  return (
    <ChakraProvider>
      <Header
        isLoggedIn={isLoggedIn}
        onLogin={() => setShowLogin(true)}
        onLogout={logout}
      />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/feed"
          element={
            <ProtectedRoute>
              <TripsFeed />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfileView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-profile"
          element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-ride"
          element={
            <ProtectedRoute>
              <CreateRideForm />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
      {showLogin && <Login onClose={() => setShowLogin(false)} />}
    </ChakraProvider>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
