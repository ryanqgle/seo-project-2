import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Box,
    Card,
    CardBody,
    Heading,
    Text,
    VStack,
    Flex,
    Badge,
    Button,
    Divider,
    Center,
    Spinner,
    Drawer,
    DrawerBody,
    DrawerOverlay,
    DrawerContent,
    DrawerCloseButton,
    useDisclosure,
    SimpleGrid,
    HStack
} from '@chakra-ui/react'
import { useAuth } from '../auth.jsx'
import { apiUrl } from '../api'
import TripChat from './TripChat.jsx'
import RouteModalButton from './RouteModalButton.jsx'

{/*
    This component acts as the Activity tab for users who are riders (passengers).
    It fetches and displays the status of all trips the rider has requested to join.
  */}

function formatDeparture(value) {
  if (!value) return 'Time TBD'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleString(undefined,  {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatCost(value) {
  if (!value) return 'Free'
  return `$${value}`
}

export default function RiderActivity() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [activeTripChat, setActiveTripChat] = useState(null)
  const [activeTripTitle, setActiveTripTitle] = useState('')

  useEffect(() => {
    if (!token) return

    fetch(apiUrl('/api/rider/activity'), {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setRequests(data)
        setLoading(false)
      })
      .catch(err => {
        console.error("Failed to load rider activity", err)
        setLoading(false)
      })
  }, [token])

  const handleCancelRequest = async (requestId) => {
    if (!window.confirm("Are you sure you want to cancel this ride?")) return;

    try {
      await fetch(apiUrl(`/api/requests/${requestId}`), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (err) {
      console.error("Failed to cancel request", err);
    }
  };

  if (loading) {
    return <Center mt={10}><Spinner size="lg" color="blue.500" /></Center>
  }

  const upcomingTrips = requests.filter(req => req.status === 'accepted')
  const pendingTrips = requests.filter(req => req.status === 'pending')
  const awaitingPaymentTrips = requests.filter(req => req.status === 'awaiting_payment')
  const passengerCardProps = {
    colorScheme: 'blue',
    borderColor: 'blue.200',
    borderRadius: 'xl',
  }

  return (
    <Box py={6} px={4} maxW="full">

      {/* upcoming rides */}
<Heading size="md" mb={4} color="gray.800">Upcoming Rides</Heading>
      {upcomingTrips.length === 0 ? (
        <Text color="gray.500" mb={6}>No upcoming rides yet.</Text>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5} w="full" mb={8}>
          {upcomingTrips.map(req => (
            <Card key={req.id} {...passengerCardProps}>
              <CardBody>
                <Flex justify="space-between" align="flex-start" mb={3}>
                  <Box>
                    <Heading size="sm" mb={1}>{req.trips.title}</Heading>
                    <Text fontSize="sm" color="gray.600">
                      Driver: {req.trips.users?.first_name || 'Unknown'}
                    </Text>
                  </Box>

                  <Badge colorScheme="green" borderRadius="full" px={3} py={1}>
                    Paid
                  </Badge>
                </Flex>

                <VStack align="stretch" spacing={3} mb={4}>
                  <Box>
                    <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase">
                      Destination
                    </Text>
                    <Text fontSize="sm">{req.trips.destination || 'Not listed'}</Text>
                  </Box>

                  <Box>
                    <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase">
                      Departure
                    </Text>
                    <Text fontSize="sm">{formatDeparture(req.trips.departure_time)}</Text>
                  </Box>

                  {req.pickup_address && (
                    <Box>
                      <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase">
                        Pickup
                      </Text>
                      <Text fontSize="sm">{req.pickup_address}</Text>
                    </Box>
                  )}

                  <Flex justify="space-between">
                    <Text fontWeight="bold">{formatCost(req.trips.cost)}</Text>
                    <Text fontSize="sm" color="gray.500">
                      Seat confirmed
                    </Text>
                  </Flex>
                </VStack>

                <HStack spacing={2}>
                  <Button
                    size="sm"
                    borderRadius="full"
                    onClick={() => {
                      setActiveTripChat(req.trips.id)
                      setActiveTripTitle(req.trips.title)
                      onOpen()
                    }}
                  >
                    Chat
                  </Button>

                  <RouteModalButton
                    tripId={req.trips.id}
                    size="sm"
                    variant="neutralSoft"
                    borderRadius="full"
                  >
                    View Route
                  </RouteModalButton>

                  <Button
                    size="sm"
                    colorScheme="red"
                    variant="dangerSoft"
                    borderRadius="full"
                    onClick={() => handleCancelRequest(req.id)}
                  >
                    Leave
                  </Button>
                </HStack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      )}

      <Divider mb={6} borderColor="gray.200" />

      {/* Awaiting payment */}
      <Heading size="md" mb={4} color="gray.800">Awaiting Payment</Heading>
      {awaitingPaymentTrips.length === 0 ? (
        <Text color="gray.500" mb={6}>No rides waiting for payment</Text>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5} w="full" mb={8}>
          {awaitingPaymentTrips.map(req => (
            <Card key={req.id} {...passengerCardProps}>
              <CardBody>
                <Flex justify="space-between" align="flex-start" mb={3}>
                  <Box>
                    <Heading size="sm" mb={1}>{req.trips.title}</Heading>
                    <Text fontSize="sm" color="gray.600">
                      Driver: {req.trips.users?.first_name || 'Unknown'}
                    </Text>
                  </Box>

                  <Badge colorScheme="blue" borderRadius="full" px={3} py={1}>
                    Awaiting Pay
                  </Badge>
                </Flex>

                <VStack align="stretch" spacing={3} mb={4}>
                  <Box>
                    <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase">
                      Destination
                    </Text>
                    <Text fontSize="sm">{req.trips.destination || 'Not listed'}</Text>
                  </Box>

                  <Box>
                    <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase">
                      Departure
                    </Text>
                    <Text fontSize="sm">{formatDeparture(req.trips.departure_time)}</Text>
                  </Box>

                  <Flex justify="space-between">
                    <Text fontWeight="bold">{formatCost(req.trips.cost)}</Text>
                    <Text fontSize="sm" color="gray.500">
                      Pay to confirm your seat
                    </Text>
                  </Flex>
                </VStack>

                <Button
                  size="sm"
                  borderRadius="full"
                  w="full"
                  colorScheme="blue"
                  onClick={() => navigate(`/payment/${req.id}`)}
                >
                  Pay Now
                </Button>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      )}

      <Divider mb={6} borderColor="gray.200" />

      {/* pending req */}
      <Heading size="md" mb={4} color="gray.800">Pending Requests</Heading>
      {pendingTrips.length === 0 ? (
        <Text color="gray.500">No pending requests</Text>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5} w="full">
          {pendingTrips.map(req => (
            <Card key={req.id} {...passengerCardProps}>
              <CardBody>
                <Flex justify="space-between" align="flex-start" mb={3}>
                  <Box>
                    <Heading size="sm" mb={1}>{req.trips.title}</Heading>
                    <Text fontSize="sm" color="gray.600">
                      Driver: {req.trips.users?.first_name || 'Unknown'}
                    </Text>
                  </Box>

                  <Badge colorScheme="yellow" borderRadius="full" px={3} py={1}>
                    Pending
                  </Badge>
                </Flex>

                <VStack align="stretch" spacing={3} mb={4}>
                  <Box>
                    <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase">
                      Destination
                    </Text>
                    <Text fontSize="sm">{req.trips.destination || 'Not listed'}</Text>
                  </Box>

                  <Box>
                    <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase">
                      Departure
                    </Text>
                    <Text fontSize="sm">{formatDeparture(req.trips.departure_time)}</Text>
                  </Box>

                  <Text fontSize="sm" color="gray.500">
                    Waiting for the driver to accept
                  </Text>
                </VStack>

                <Button
                  size="sm"
                  colorScheme="red"
                  variant="dangerSoft"
                  borderRadius="full"
                  w="full"
                  onClick={() => handleCancelRequest(req.id)}
                >
                  Cancel Request
                </Button>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      )}

        {/* chat pop-up */}
      <Drawer placement="bottom" onClose={onClose} isOpen={isOpen} size="md">
        <DrawerOverlay />
        <DrawerContent borderTopRadius="2xl" h="80vh">
          <DrawerCloseButton zIndex={20} bg="white" borderRadius="full"/>
          <DrawerBody p={0} display="flex" flexDir="column">

            {activeTripChat && (
              <Box flex="1" overflow="hidden">
                 <TripChat tripId={activeTripChat} currUserId={requests[0]?.passenger_id} tripTitle={activeTripTitle} />
              </Box>
            )}

          </DrawerBody>
        </DrawerContent>
      </Drawer>

    </Box>
  )
}