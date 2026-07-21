import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { ChakraProvider, Box } from '@chakra-ui/react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './css/index.css'
import { AuthProvider, useAuth } from './auth.jsx'
import Header from './components/header.jsx'
import Footer from './components/footer.jsx'
import Login from './components/login.jsx'
import Home from './components/Home.jsx'
import TripsFeed from './components/TripsFeed.jsx'
import UserProfile from './components/UserProfile.jsx'
import DriverRequests from './components/DriverRequests.jsx'
import { supabase } from './dbConnection'
import { apiUrl } from './api'
import ProfileView from './components/ProfileView.jsx'
import CreateRideForm from './components/CreateRideForm.jsx'
import Dashboard from './components/Dashboard.jsx'
import Payment from './components/Payment.jsx'
import PaymentReturn from './components/PaymentReturn.jsx'
import theme from './components/theme.jsx'

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
  const [isDriver, setIsDriver] = useState(false)

  // Close the login modal automatically once the user is logged in.
  useEffect(() => {
    if (isLoggedIn) setShowLogin(false)

    const fetchRole = async () => {
      if (!isLoggedIn) {
        setIsDriver(false)
        return
      }
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      try {
        const res = await fetch(apiUrl('/api/edit-profile'), {
          headers: { Authorization: `Bearer ${session.access_token}` }
        })
        const data = await res.json()
        if (data.status === 'success') {
          console.log('User role:', data.profile.role)
          setIsDriver(data.profile.role === 'driver')
        }
      } catch (e) {
         console.error('Error fetching role:', e)
      }
    }

    fetchRole()
  }, [isLoggedIn])

  return (
    <ChakraProvider theme={theme}>
      <Box display="flex" flexDirection="column" minH="100vh">
      <Header
        isLoggedIn={isLoggedIn}
        isDriver={isDriver}
        onLogin={() => setShowLogin(true)}
        onLogout={logout}
      />
      <Box as="main" flex="1" minH="0" w="100%" display="flex" flexDirection="column">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/feed"
          element={
            <ProtectedRoute>
              <Dashboard />
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
          path="/dashboard" 
          element={
            <ProtectedRoute>
              {isDriver ? <DriverRequests /> : <Dashboard />}
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
        <Route
          path="/payment/:tripRequestId"
          element={
            // <ProtectedRoute>
              <Payment />
            // </ProtectedRoute>
          }
        />
        <Route
          path="/payment-return"
          element={
            // <ProtectedRoute>
              <PaymentReturn />
            // </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
      </Box>
      </Box>
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
