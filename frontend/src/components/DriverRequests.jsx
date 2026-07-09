import { useState, useEffect } from 'react'
import { supabase } from '../dbConnection'
import {
  Box,
  Button,
  Card,
  CardBody,
  Heading,
  Text,
  VStack,
  Flex,
  HStack,
  Avatar,
  Badge,
  Divider,
  SimpleGrid
} from '@chakra-ui/react'

function DriverRequests() {
  const [trips, setTrips] = useState([])
  const [requestsByTrip, setRequestsByTrip] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {

    const loadRequests = async () => {
      const response = await supabase.auth.getSession()
      const session = response?.data?.session
      
      if (!session) {
        setLoading(false)
        return
      }

      try {
        const profileRes = await fetch('/api/edit-profile', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        })
        const profileData = await profileRes.json()
        const myId = profileData.profile.id

        const tripsRes = await fetch('/api/trips')
        const allTrips = await tripsRes.json()
        const myTrips = allTrips.filter((trip) => trip.driver_id === myId)
        setTrips(myTrips)

        const requests = {}
        for (const trip of myTrips) {
          const res = await fetch(`/api/trips/${trip.id}/requests`)
          requests[trip.id] = await res.json()
          console.log(`Raw data for trip ${trip.id}:`, requests[trip.id])
        }
        setRequestsByTrip(requests)
      } catch (err) {
        console.error('Error loading requests:', err)
      } finally {
        setLoading(false)
      }
    }

    loadRequests()
  }, [])

  const handleDecision = async (tripId, requestId, status) => {
    const response = await supabase.auth.getSession()
    const session = response?.data?.session

    if (!session) return

    try {
      const res = await fetch(`/api/trips/${tripId}/requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      })
      const updated = await res.json()

      setRequestsByTrip((prev) => ({
        ...prev,
        [tripId]: prev[tripId].map((r) => (r.id === updated.id ? updated : r))
      }))
    } catch (err) {
      console.error('Error updating request:', err)
    }
  }

  if (loading) return <p>Loading requests...</p>

  return (
    <Box maxW="7xl" mx="auto" py={8} px={4}>
      <Heading size="xl" mb={6} color="gray.800">
        Driver Dashboard
      </Heading>

      {trips.length === 0 && (
        <Text color="gray.500" fontSize="lg" textAlign="center" mt={10}>
          You don't have any open trips right now.
        </Text>
      )}

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={6} w="full">
        {trips.map((trip) => (
          <Card key={trip.id} variant="outline" boxShadow="sm" borderRadius="xl">
            <CardBody>
              <Box mb={4}>
                <Heading size="md" color="gray.800">{trip.title}</Heading>
                <Text color="blue.600" fontWeight="bold">→ To {trip.destination}</Text>
              </Box>

              <Divider mb={4} />

              <Heading size="sm" mb={4} color="gray.600">Pending Requests</Heading>
              
              {(requestsByTrip[trip.id] || []).length === 0 && (
                <Text color="gray.500" fontSize="sm">No requests yet.</Text>
              )}

              <VStack spacing={3} align="stretch">
                {(requestsByTrip[trip.id] || []).map((request) => (
                  <Flex key={request.id} align="center" justify="space-between" bg="gray.50" p={3} borderRadius="md">
                   <Flex align="center">
                      <Avatar 
                        size="sm"
                        name={`${request.users?.first_name || 'Unknown'} ${request.users?.last_name || 'Rider'}`} 
                        src={request.users?.profile_picture}
                        mr={3} 
                      />
                      <Box>
                        <Text fontWeight="bold" fontSize="sm">
                          {request.users?.first_name || 'Unknown'} {request.users?.last_name || 'Rider'}
                        </Text>
                        <Badge colorScheme={request.status === 'pending' ? 'yellow' : request.status === 'accepted' ? 'green' : 'red'}>
                          {request.status}
                        </Badge>
                      </Box>
                    </Flex>

                    {request.status === 'pending' && (
                      <HStack>
                        <Button size="sm" colorScheme="green" onClick={() => handleDecision(trip.id, request.id, 'accepted')}>
                          Accept
                        </Button>
                        <Button size="sm" colorScheme="red" variant="outline" onClick={() => handleDecision(trip.id, request.id, 'declined')}>
                          Decline
                        </Button>
                      </HStack>
                    )}

                  </Flex>
                ))}
              </VStack>

            </CardBody>
          </Card>
        ))}
      </SimpleGrid>
    </Box>

  )
}

export default DriverRequests
