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
  useDisclosure
} from '@chakra-ui/react'

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

function TripsFeed() {
  const [trips, setTrips] = useState([])
  const [status, setStatus] = useState('loading') // 'loading' | 'error' | 'ready'
  const [selectedDriver, setSelectedDriver] = useState(null)
  const { isOpen, onOpen, onClose } = useDisclosure()

  const openDriver = (driver) => {
    setSelectedDriver(driver)
    onOpen()
  }

  useEffect(() => {
    let active = true

    fetch('/api/trips')
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
      
      <Heading size="xl" mb={6} color="gray.800">
        Available Rides
      </Heading>

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

                <Text textAlign="left" fontSize="lg" fontWeight="bold" color="blue.600" mb={2}>
                  → To {trip.destination}
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
                
                {/* TO DO: Displays request sent msg and have it send a request to the user thru backend */}
                <Button colorScheme="blue" width="x" variant="solid" borderRadius="full" size="sm">
                  Request to Join
                </Button>

              </CardBody>
            </Card>

          ))}
        </VStack>
      )}

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
    </Box>
  )
}

export default TripsFeed
