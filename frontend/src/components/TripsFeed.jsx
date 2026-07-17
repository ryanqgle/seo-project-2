import { useState, useEffect } from 'react'
import {
  Box, 
  Center, 
  Spinner, 
  Text, 
  VStack, 
  Heading, 
  Card, 
  CardBody, 
  Flex, 
  Badge, 
  Button,
  HStack,
  Avatar,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  useDisclosure,
  useToast
} from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth.jsx'
import { supabase } from '../dbConnection.js'
import { apiUrl } from '../api'

// Shortens long text and adds "..." on the end, so long addresses don't stretch
// or clutter the trip cards. For example, a 50-character address becomes the
// first 30 characters followed by "...".
function truncate(value, max = 30) {
  if (!value) return value
  return value.length > max ? `${value.slice(0, max)}...` : value
}

// Turns a stored departure time into a friendly, readable label like
// "Sat, Jul 13, 2:30 PM". Falls back gracefully if the time is missing or
// unreadable.
function formatDeparture(value) {
  if (!value) return 'Time TBD'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

// The main trips feed (shown at "/feed"). It lists every open trip as a card
// showing the driver, destination, time, seats, and price. From here a rider can
// request a seat, peek at the driver's profile, or see the destination on a map.
// Drivers also get a "Create Ride" button to post a new trip.
function TripsFeed() {
  // The list of open trips loaded from the backend.
  const [trips, setTrips] = useState([])
  // Where we are in loading the feed: still loading, failed, or ready to show.
  const [status, setStatus] = useState('loading') // 'loading' | 'error' | 'ready'
  // The driver whose profile pop-up is currently open (null when closed).
  const [selectedDriver, setSelectedDriver] = useState(null)
  // The destination shown in the map pop-up (null when closed).
  const [mapDestination, setMapDestination] = useState(null)
  // The signed-in user's role, used to decide whether to show driver-only tools.
  const [role, setRole] = useState(null)
  // The id of the trip we're currently sending a join request for (shows that
  // one button as loading). Null when no request is in progress.
  const [requesting, setRequesting] = useState(null)
  // Controls the driver-profile pop-up (open/close).
  const { isOpen, onOpen, onClose } = useDisclosure()
  // Controls the map pop-up (open/close), kept separate from the one above.
  const map = useDisclosure()
  const { token } = useAuth()
  const navigate = useNavigate()
  // Chakra's toast shows the small pop-up notifications (e.g. "Request sent!").
  const toast = useToast()

  // Opens the driver-profile pop-up for the given driver.
  const openDriver = (driver) => {
    setSelectedDriver(driver)
    onOpen()
  }

  // Sends a "request to join this trip" to the driver. Requires being logged in;
  // shows a success or error notification depending on how it goes.
  const handleRequestJoin = async (tripId) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      toast({ title: 'Please log in to request a seat.', status: 'warning', duration: 3000 })
      setRequesting(null)
      return
    }

    try {
      const res = await fetch(apiUrl(`/api/trips/${tripId}/requests`), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Failed to send request.')
      }

      toast({
        title: 'Request sent!',
        description: "We've notified the driver of your request.",
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (err) {
      toast({
        title: 'Could not send request.',
        description: err.message || 'Could not send request.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setRequesting(null)
    }
  }



  // Opens the map pop-up for the given destination.
  const openMap = (destination) => {
    setMapDestination(destination)
    map.onOpen()
  }

  // Look up the signed-in user's role once we have their login token. We use it
  // to decide whether to show the driver-only "Create Ride" button.
  // (The `active` flag lets us ignore the result if the user leaves this page
  // before it finishes loading.)
  useEffect(() => {
    if (!token) return
    let active = true

    fetch(apiUrl('/api/edit-profile'), {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data?.status === 'success') setRole(data.profile?.role ?? null)
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [token])

  // Load the list of open trips when the feed first opens.
  useEffect(() => {
    let active = true

    fetch(apiUrl('/api/trips'))
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (!active) return
        setTrips(Array.isArray(data) ? data : [])
        setStatus('ready')
      })
      .catch(() => {
        if (active) setStatus('error')
      })

    return () => {
      active = false
    }
  }, [])

  return (
    <Box maxW="2xl" w="full" mx="auto" py={8} px={4}>
      
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="xl" color="gray.800">
          Available Rides
        </Heading>
        {role === 'driver' && (
          <Button
            colorScheme="blue"
            borderRadius="full"
            onClick={() => navigate('/create-ride')}
          >
            + Create Ride
          </Button>
        )}
      </Flex>

      {status === 'loading' && (
        <Center mt={20}>
            <Spinner size="xl" color="blue.500" thickness="4px" />
        </Center>
      )}

      {status === 'error' && (
        <Center mt={10}>
            <Text color="red.500" fontSize="lg">Couldn't load trips. Please try again later.</Text>
        </Center>
      )}

      {status === 'ready' && trips.length === 0 && (
        <Center mt={10}>
            <Text color="gray.500" fontSize="lg">No trips posted yet. Check back soon!</Text>
        </Center>
      )}

      {status === 'ready' && trips.length > 0 && (
        <VStack spacing={3} w="full" align="stretch">
          {trips.map((trip) => (
            <Card key={trip.id} variant="outline" boxShadow="sm" borderRadius="xl" _hover={{ boxShadow: 'md' }}>
              <CardBody p={4}>
                <Flex
                  align="center"
                  mb={2}
                  cursor="pointer"
                  onClick={() => openDriver(trip.users)}
                  role="button"
                  borderRadius="md"
                  p={1}
                  m={-1}
                  _hover={{ bg: 'gray.50' }}
                >
                  <Avatar
                    size="sm"
                    name={`${trip.users?.first_name} ${trip.users?.last_name}`}
                    src={trip.users?.profile_picture}
                    mr={3}
                  />
                  <Text fontWeight="bold" color="gray.700">
                    Driver: {trip.users?.first_name || 'Unknown'} {trip.users?.last_name || 'Driver'}
                  </Text>
                </Flex>
                <Flex justify="space-between" align="flex-start" mb={2}>
                  <Heading size="md" color="gray.800">
                    {trip.title}
                  </Heading>
                  <Badge colorScheme={trip.cost ? "green" : "blue"} fontSize="sm" px={2} py={1} borderRadius="md">
                    {trip.cost ? `$${trip.cost}` : 'Free'}
                  </Badge>
                </Flex>

                <Text
                  textAlign="left"
                  fontSize="lg"
                  fontWeight="bold"
                  color="blue.600"
                  mb={2}
                  cursor="pointer"
                  onClick={() => openMap(trip.destination)}
                  _hover={{ textDecoration: 'underline' }}
                  title="View on map"
                >
                  → To {truncate(trip.destination)}
                </Text>

                <HStack spacing={2} color="gray.500" fontSize="sm" mb={4}>
                  <Text>{formatDeparture(trip.departure_time)}</Text>
                  <Text>•</Text>
                  <Text fontWeight="bold">{trip.available_seats} seat{trip.available_seats === 1 ? '' : 's'} left</Text>
                  {trip.category && (
                    <>
                      <Text>•</Text>
                      <Text>{trip.category}</Text>
                    </>
                  )}
                </HStack>

                {trip.description && (
                  <Text color="gray.600" mb={4}>
                    {trip.description}
                  </Text>
                )}

                <Button
                colorScheme="blue"
                width="x"
                variant="solid"
                borderRadius="full"
                size="sm"
                onClick={() => handleRequestJoin(trip.id)}
                isLoading={requesting === trip.id}
                loadingText="Requesting..."
                >
                  Request to Join
                </Button>

              </CardBody>
            </Card>

          ))}
        </VStack>
      )}

      {/* Pop-up showing the selected driver's profile (photo, name, role, school). */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent borderRadius="xl">
          <ModalHeader>Driver Profile</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <Avatar
                size="xl"
                name={`${selectedDriver?.first_name || ''} ${selectedDriver?.last_name || ''}`}
                src={selectedDriver?.profile_picture}
              />
              <Heading size="md" color="gray.800">
                {selectedDriver?.first_name || 'Unknown'} {selectedDriver?.last_name || 'Driver'}
              </Heading>
              {selectedDriver?.role && (
                <Badge colorScheme="blue" fontSize="sm" px={2} py={1} borderRadius="md">
                  {selectedDriver.role}
                </Badge>
              )}
              {selectedDriver?.school && (
                <Text color="gray.600">{selectedDriver.school}</Text>
              )}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Pop-up showing the trip's destination on an embedded Google Map. */}
      <Modal isOpen={map.isOpen} onClose={map.onClose} isCentered size="xl">
        <ModalOverlay />
        <ModalContent borderRadius="xl">
          <ModalHeader>Destination</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Text mb={3} color="gray.600">{mapDestination}</Text>
            {mapDestination && (
              <Box borderRadius="lg" overflow="hidden">
                <iframe
                  title="Destination map"
                  width="100%"
                  height="360"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps?q=${encodeURIComponent(mapDestination)}&output=embed`}
                />
              </Box>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  )
}

export default TripsFeed
