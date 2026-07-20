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
    Avatar,
    Divider,
    Center,
    Spinner,
    Drawer,
    DrawerBody,
    DrawerHeader,
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

{/*
    This component acts as the Activity tab for users who are riders (passengers).
    It fetches and displays the status of all trips the rider has requested to join.
  */}

export default function RiderActivity() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [activeTripChat, setActiveTripChat] = useState(null)

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

  return (
    <Box py={6} px={4} maxW="full">

      {/* upcoming rides */}
<Heading size="md" mb={4} color="gray.800">Upcoming Rides</Heading>
      {upcomingTrips.length === 0 ? (
        <Text color="gray.500" mb={6}>No upcoming rides yet.</Text>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5} w="full" mb={8}>
          {upcomingTrips.map(req => (
            <Card key={req.id} variant="outline" boxShadow="sm" borderRadius="xl" border="1px solid" borderColor="gray.100">
              <CardBody>
                <Flex justify="space-between" align="flex-start" mb={2}>
                  <Box>
                     <Heading size="sm" mb={1}>{req.trips.title}</Heading>
                     <Text color="blue.600" fontWeight="bold" fontSize="sm">
                       → To {req.trips.destination}
                     </Text>
                  </Box>
                  <HStack>
                    <Button
                        size="sm"
                        colorScheme="blue"
                        borderRadius="full"
                        onClick={() => {
                            setActiveTripChat(req.trips.id)
                            onOpen()
                        }}
                    >
                        Chat
                    </Button>
                    <Button size="sm"
                      colorScheme="red"
                      variant="outline"
                      borderRadius="full"
                      onClick={() => handleCancelRequest(req.id)}>
                        Leave
                    </Button>
                  </HStack>
                </Flex>
                
                <Flex align="center" bg="gray.50" p={2} mt={3} borderRadius="md" border="1px solid" borderColor="gray.100">
                  <Avatar size="xs" src={req.trips.users?.profile_picture} mr={2} />
                  <Text fontSize="sm" color="gray.700" fontWeight="bold">
                    Driver: {req.trips.users?.first_name || 'Unknown'}
                  </Text>
                </Flex>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      )}

      <Divider mb={6} borderColor="gray.200" />

      {/* Awaiting payment */}
      <Heading size="md" mb={4} color="gray.800">Awaiting Payment</Heading>
      {awaitingPaymentTrips.length === 0 ? (
        <Text color="gray.500" mb={6}>No rides waiting for payment.</Text>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5} w="full" mb={8}>
          {awaitingPaymentTrips.map(req => (
            <Card key={req.id} variant="outline" bg="blue.50" borderRadius="xl" border="1px solid" borderColor="blue.100">
              <CardBody py={3}>
                <Flex justify="space-between" align="center">
                  <Box>
                    <Heading size="sm" color="gray.700" mb={1}>{req.trips.title}</Heading>
                    <Text fontSize="sm" color="gray.600">{req.trips.destination}</Text>
                  </Box>
                  <Button
                    size="sm"
                    colorScheme="blue"
                    onClick={() => navigate(`/payment/${req.id}`)}
                  >
                    Pay Now
                  </Button>
                </Flex>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      )}

      <Divider mb={6} borderColor="gray.200" />

      {/* pending req */}
      <Heading size="md" mb={4} color="gray.800">Pending Requests</Heading>
      {pendingTrips.length === 0 ? (
        <Text color="gray.500">No pending requests.</Text>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5} w="full">
          {pendingTrips.map(req => (
            <Card key={req.id} variant="outline" bg="gray.50" borderRadius="xl" border="1px solid" borderColor="gray.100">
              <CardBody py={3}>
                <Flex justify="space-between" align="center">
                  <Box>
                    <Heading size="sm" color="gray.600" mb={1}>{req.trips.title}</Heading>
                    <Text fontSize="sm" color="gray.500">{req.trips.destination}</Text>
                  </Box>
                  <HStack>
                    <Badge colorScheme="yellow" fontSize="2xs">Pending</Badge>
                    <Button size="xs"
                      colorScheme="red"
                      variant="ghost"
                      onClick={() => handleCancelRequest(req.id)}>
                      Cancel
                    </Button>
                  </HStack>
                </Flex>
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
                 <TripChat tripId={activeTripChat} currUserId={requests[0]?.passenger_id} />
              </Box>
            )}

          </DrawerBody>
        </DrawerContent>
      </Drawer>

    </Box>
  )
}