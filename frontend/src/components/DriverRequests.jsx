import { useState, useEffect } from 'react'
import { supabase } from '../dbConnection'
import { apiUrl } from '../api'
import RouteModalButton from './RouteModalButton.jsx'
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
  SimpleGrid,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  useDisclosure,
  Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon
} from '@chakra-ui/react'
import TripChat from './TripChat'
import UserProfileModal from './UserProfileModal.jsx'

// The driver's dashboard (shown at "/dashboard"). It lists the trips this driver
// has posted and, under each one, the riders who have asked to join. The driver
// can accept or decline each pending request.
function DriverRequests() {
  // The trips posted by this driver.
  const [trips, setTrips] = useState([])
  // The join requests for each trip, grouped by trip id
  // (e.g. { 12: [request, request], 15: [request] }).
  const [requestsByTrip, setRequestsByTrip] = useState({})
  // True while the dashboard is still loading its data.
  const [loading, setLoading] = useState(true)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [activeTripChat, setActiveTripChat] = useState(null)

  const { isOpen: isProfileOpen, onOpen: onProfileOpen, onClose: onProfileClose } = useDisclosure()
  const [selectedUser, setSelectedUser] = useState(null)

  const openProfile = (user) => {
      setSelectedUser(user)
      onProfileOpen()
  }

  // When the dashboard opens: find this driver's trips, then load the join
  // requests for each of those trips.
  useEffect(() => {

    const loadRequests = async () => {
      // Get the current login session so we can prove who we are to the backend.
      const response = await supabase.auth.getSession()
      const session = response?.data?.session

      if (!session) {
        setLoading(false)
        return
      }

      try {
        // Look up our own user id so we can pick out only our trips.
        const profileRes = await fetch(apiUrl('/api/edit-profile'), {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        })
        const profileData = await profileRes.json()
        const myId = profileData.profile.id

        // Load all open trips, then keep only the ones this driver posted.
        const tripsRes = await fetch(apiUrl('/api/trips'))
        const allTrips = await tripsRes.json()
        const myTrips = allTrips.filter((trip) => trip.driver_id === myId)
        setTrips(myTrips)

        // For each of our trips, load its join requests and store them by trip id.
        const requests = {}
        for (const trip of myTrips) {
          const res = await fetch(apiUrl(`/api/trips/${trip.id}/requests`))
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

  // Accept or decline a rider's request. `status` is either 'accepted' or
  // 'declined'. After the backend saves the decision, we update that one request
  // on screen so the change shows immediately without reloading the page.
  const handleDecision = async (tripId, requestId, status) => {
    const response = await supabase.auth.getSession()
    const session = response?.data?.session

    if (!session) return

    try {
      const res = await fetch(apiUrl(`/api/trips/${tripId}/requests/${requestId}`), {
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
        [tripId]: prev[tripId].map((r) => (r.id === updated.id ? { ...r, status: updated.status } : r))
      }))
    } catch (err) {
      console.error('Error updating request:', err)
    }
  }

  const handleDeleteTrip = async (tripId) => {
    if (!window.confirm("Are you sure you want to delete this trip? This will remove all passengers.")) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      await fetch(apiUrl(`/api/trips/${tripId}`), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      setTrips(prev => prev.filter(t => t.id !== tripId));
    } catch (err) {
      console.error("Failed to delete trip", err);
    }
  };

  const handleKickRider = async (tripId, requestId) => {
    if (!window.confirm("Are you sure you want to remove this rider from the trip?")) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      await fetch(apiUrl(`/api/requests/${requestId}`), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      setRequestsByTrip((prev) => ({
        ...prev,
        [tripId]: prev[tripId].filter((r) => r.id !== requestId)
      }));
    } catch (err) {
      console.error('Error kicking rider:', err);
    }
  };

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

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3}} spacing={5} w="full">
        {trips.map((trip) => {
          const tripReqs = requestsByTrip[trip.id] || []
          const pending = tripReqs.filter(r => r.status === 'pending')
          const accepted = tripReqs.filter(r => r.status === 'accepted')

          return (
            <Card key={trip.id} variant="outline" boxShadow="sm" borderRadius="xl" border="1px solid" borderColor="gray.100">
              <CardBody>
                
                {/* header + buttons */}
                <Box mb={4}>
                  <Heading size="md" color="gray.800" mb={1} noOfLines={1}>{trip.title}</Heading>
                  <Text color="blue.600" fontWeight="bold" fontSize="sm" noOfLines={1} title={trip.destination}>
                      → To {trip.destination}
                  </Text>
                  
                  <Flex mt={4} justify="space-between" align="center" w="full">
                    <HStack spacing={2}>
                      <Button size="sm" colorScheme="blue" borderRadius="full" onClick={() => { setActiveTripChat(trip.id); onOpen() }}>
                        Chat
                      </Button>
                      <RouteModalButton tripId={trip.id} size="sm" colorScheme="gray" variant="outline" borderRadius="full">
                        Route
                      </RouteModalButton>
                    </HStack>
                    <Button size="sm" colorScheme="red" variant="ghost" onClick={() => handleDeleteTrip(trip.id)}>
                      Delete Trip
                    </Button>
                  </Flex>
                </Box>

                <Divider mb={4} borderColor="gray.200" />

                {/* collapsible accepted riders tracker */}
                {accepted.length > 0 && (
                  <Accordion allowToggle mb={4}>
                      <AccordionItem border="none" bg="green.50" borderRadius="md">
                          <AccordionButton _hover={{ bg: "green.100" }} borderRadius="md" px={3} py={2}>
                          <Box flex="1" textAlign="left">
                              <Text fontSize="sm" fontWeight="bold" color="green.700">
                                  Accepted Riders ({accepted.length}/{trip.available_seats || '?'} Seats)
                              </Text>
                          </Box>
                          <AccordionIcon color="green.700" />
                          </AccordionButton>
                          <AccordionPanel pb={3} px={3}>
                              <VStack spacing={2} align="stretch">
                                  {accepted.map((request) => (
                                      <Flex key={request.id} align="center" justify="space-between" bg="white" p={2} borderRadius="md" border="1px solid" borderColor="green.200">
                                          <Flex align="center" cursor="pointer" onClick={() => openProfile(request.users)}>
                                              <Avatar size="xs" name={`${request.users?.first_name || ''} ${request.users?.last_name || ''}`} src={request.users?.profile_picture} mr={2} />
                                              <Text fontWeight="bold" fontSize="sm" color="gray.700">
                                                  {request.users?.first_name || 'Unknown'} {request.users?.last_name || ''}
                                              </Text>
                                          </Flex>
                                          <Button size="xs" colorScheme="red" variant="ghost" onClick={() => handleKickRider(trip.id, request.id)}>
                                              Remove
                                          </Button>
                                      </Flex>
                                  ))}
                              </VStack>
                          </AccordionPanel>
                      </AccordionItem>
                  </Accordion>
                )}

                {/* pending requests list */}
                <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wide" color="gray.500" mb={3}>
                  Pending Requests
                </Text>
                
                {pending.length === 0 && (
                  <Text color="gray.400" fontSize="sm" fontStyle="italic">No new requests.</Text>
                )}

                <VStack spacing={2} align="stretch">
                  {pending.map((request) => (
                    <Flex key={request.id} align="center" justify="space-between" bg="gray.50" p={2} borderRadius="md" border="1px solid" borderColor="gray.100">
                     <Flex align="center" cursor="pointer" onClick={() => openProfile(request.users)}>
                        <Avatar size="xs" name={`${request.users?.first_name || ''} ${request.users?.last_name || ''}`} src={request.users?.profile_picture} mr={3} />
                        <Text fontWeight="bold" fontSize="sm" color="gray.700">
                          {request.users?.first_name || 'Unknown'} {request.users?.last_name || ''}
                        </Text>
                      </Flex>
                      <HStack spacing={1}>
                          <Button size="xs" colorScheme="green" onClick={() => handleDecision(trip.id, request.id, 'accepted')}>Accept</Button>
                          <Button size="xs" colorScheme="red" variant="ghost" onClick={() => handleDecision(trip.id, request.id, 'declined')}>Decline</Button>
                      </HStack>
                    </Flex>
                  ))}
                </VStack>

              </CardBody>
            </Card>
          )
        })}
      </SimpleGrid>

      <UserProfileModal isOpen={isProfileOpen} onClose={onProfileClose} user={selectedUser} />

      <Drawer placement="bottom" onClose={onClose} isOpen={isOpen} size="md">
        <DrawerOverlay />
        <DrawerContent borderTopRadius="2xl" h="80vh">
          <DrawerCloseButton zIndex={20} bg="white" borderRadius="full"/>
          <DrawerBody p={0} display="flex" flexDir="column">

            {activeTripChat && (
              <Box flex="1" overflow="hidden">
                 <TripChat
                    tripId={activeTripChat}
                    currUserId={trips.find(t => t.id === activeTripChat)?.driver_id}
                 />
              </Box>
            )}

          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>

  )
}

export default DriverRequests
