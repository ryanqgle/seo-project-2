import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { apiUrl } from '../api'
import { Center, Spinner, VStack, Text } from '@chakra-ui/react'

export default function RequireProfile({ children }) {
  const { token } = useAuth()
  const [status, setStatus] = useState('checking') // checking, complete, incomplete

  useEffect(() => {
    if (!token) return

    fetch(apiUrl('/api/edit-profile'), {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        const profile = data.profile
        // check if they are missing critical information
        if (!profile?.first_name || !profile?.last_name || !profile?.role) {
          setStatus('incomplete')
        } else {
          setStatus('complete')
        }
      })
      .catch(() => setStatus('complete')) // fallback
  }, [token])

  if (status === 'checking') {
    return (
      <Center h="100vh">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text fontWeight="bold">Loading your dashboard...</Text>
        </VStack>
      </Center>
    )
  }

  // if their profile is missing data, force them to the profile page
  if (status === 'incomplete') {
    return <Navigate to="/edit-profile" replace />
  }

  // else let them into the page they were trying to visit
  return children
}