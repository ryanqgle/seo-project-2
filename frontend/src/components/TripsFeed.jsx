import { useState, useEffect, useMemo } from 'react'
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
  Input,
  Select,
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
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth.jsx'
import { supabase } from '../dbConnection.js'
import { apiUrl } from '../api'
import LocationPicker from './LocationPicker.jsx'
import RouteModalButton from './RouteModalButton.jsx'

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

  // Text the rider has typed to search trips (case-insensitive). Matches against
  // the trip title, driver name, and destination.
  const [searchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '')

  // Which trip category the rider is filtering by. 'all' shows every category.
  const [categoryFilter, setCategoryFilter] = useState('all')

  // How the list is ordered. 'date-soon' (soonest departure first) is the
  // default; the other options order by latest date or by price.
  const [sortBy, setSortBy] = useState('date-soon') // 'date-soon' | 'date-late' | 'price-low' | 'price-high'

  // The driver whose profile pop-up is currently open (null when closed).
  const [selectedDriver, setSelectedDriver] = useState(null)

  // The destination shown in the map pop-up (null when closed).
  const [mapDestination, setMapDestination] = useState(null)

  // The signed-in user's role, used to decide whether to show driver-only tools.
  const [role, setRole] = useState(null)
  // Trip ids the signed-in rider has been accepted onto, so those cards can
  // offer "View Route" instead of "Request to Join".
  const [acceptedTripIds, setAcceptedTripIds] = useState(() => new Set())

  // The id of the trip we're currently sending a join request for (shows that
  // one button as loading). Null when no request is in progress.
  const [requesting, setRequesting] = useState(null)

  // The trip a rider is requesting a seat on (drives the pickup modal), plus the
  // pickup location they've chosen on the map ({ lat, lng, address }).
  const [pickupTrip, setPickupTrip] = useState(null)
  const [pickupLocation, setPickupLocation] = useState(null)
  const [pickupRoute, setPickupRoute] = useState(null)
  const [pendingTripIds, setPendingTripIds] = useState(() => new Set())

  // Controls the driver-profile pop-up (open/close).
  const { isOpen, onOpen, onClose } = useDisclosure()

  // Controls the map pop-up (open/close), kept separate from the one above.
  const map = useDisclosure()
  
  // Controls the "set your pickup location" pop-up.
  const pickup = useDisclosure()
  const { token, session } = useAuth()
  // The signed-in user's id, matched against each trip's driver_id so we can hide
  // the "Request to Join" button on the user's own trips (you can't join your
  // own ride).
  const currentUserId = session?.user?.id ?? null
  const navigate = useNavigate()
  // Chakra's toast shows the small pop-up notifications (e.g. "Request sent!").
  const toast = useToast()

  // Opens the driver-profile pop-up for the given driver.
  const openDriver = (driver) => {
    setSelectedDriver(driver)
    onOpen()
  }

  // Opens the "set your pickup location" pop-up for a trip. Requires being
  // logged in; the rider picks where they want to be picked up before we send
  // the request.
  const openPickup = async (trip) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      toast({ title: 'Please log in to request a seat.', status: 'warning', duration: 3000 })
      return
    }
    setPickupTrip(trip)
    setPickupLocation(null)
    setPickupRoute(null)
    pickup.onOpen()

    // Load the trip's origin→destination route so the rider can see where the
    // trip goes while choosing a pickup point.
    try {
      const res = await fetch(apiUrl(`/api/trips/${trip.id}/base-route`), {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (res.ok) setPickupRoute(await res.json())
    } catch {
      // Ignore — the straight-line fallback still gives spatial context.
    }
  }

  // Origin/destination endpoints for the pickup map, taken straight from the
  // trip so they're available immediately (before the road route loads).
  const pickupRouteStops =
    pickupTrip && pickupTrip.origin_lat != null && pickupTrip.destination_lat != null
      ? [
          {
            type: 'origin',
            lat: pickupTrip.origin_lat,
            lng: pickupTrip.origin_lng,
            address: pickupTrip.origin,
          },
          {
            type: 'destination',
            lat: pickupTrip.destination_lat,
            lng: pickupTrip.destination_lng,
            address: pickupTrip.destination,
          },
        ]
      : []

  // Sends the join request once the rider has chosen a pickup location. Includes
  // the pickup coordinates + address so the driver can route to them. Shows a
  // success or error notification depending on how it goes.
  const submitRequest = async () => {
    if (!pickupLocation?.lat) {
      toast({ title: 'Please set your pickup location on the map.', status: 'warning', duration: 3000 })
      return
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      toast({ title: 'Please log in to request a seat.', status: 'warning', duration: 3000 })
      return
    }

    setRequesting(pickupTrip.id)
    try {
      // Fall back to coordinates if the address label is still resolving.
      const label =
        pickupLocation.address ||
        `${pickupLocation.lat.toFixed(5)}, ${pickupLocation.lng.toFixed(5)}`

      const res = await fetch(apiUrl(`/api/trips/${pickupTrip.id}/requests`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pickup_address: label,
          pickup_lat: pickupLocation.lat,
          pickup_lng: pickupLocation.lng,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Could not request this ride')
      }

      toast({
        title: 'Request sent!',
        description: "We've notified the driver of your request",
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      setPendingTripIds(prev => new Set(prev).add(pickupTrip.id))
      pickup.onClose()
    } catch (err) {
      toast({
        title: 'Could not send request.',
        description: err.message || 'Could not send request',
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

  // Load which trips the rider has been accepted onto, so we can show "View
  // Route" on those cards.
  useEffect(() => {
    if (!token) return
    let active = true

    fetch(apiUrl('/api/my-requests'), {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!active || !Array.isArray(data)) return
        const accepted = data.filter((r) => r.status === 'accepted').map((r) => r.trip_id)
        setAcceptedTripIds(new Set(accepted))

        const pending = data.filter((r) => r.status === 'pending').map((r) => r.trip_id)
        setPendingTripIds(new Set(pending))
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

  // The distinct categories present in the loaded trips, used to populate the
  // filter dropdown. Sorted alphabetically so the options are stable.
  const categories = useMemo(() => {
    const set = new Set()
    trips.forEach((trip) => {
      if (trip.category) set.add(trip.category)
    })
    return Array.from(set).sort()
  }, [trips])

  // The trips actually shown, after applying the search and category filter,
  // then ordered by the chosen sort. The search and category are optional: an
  // empty search and 'all' category show everything. The single search box
  // matches against the trip title, driver name, and destination.
  const filteredTrips = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    const matches = trips.filter((trip) => {
      const haystack = [
        trip.title,
        `${trip.users?.first_name || ''} ${trip.users?.last_name || ''}`,
        trip.destination,
      ]
        .join(' ')
        .toLowerCase()
      const matchesSearch = !query || haystack.includes(query)
      const matchesCategory =
        categoryFilter === 'all' || trip.category === categoryFilter
      return matchesSearch && matchesCategory
    })

    // Sort a copy so we never mutate the original trips array. A free/blank
    // cost counts as 0; a missing/invalid departure time sorts to the end.
    const sorted = [...matches]
    if (sortBy === 'price-low') {
      sorted.sort((a, b) => (Number(a.cost) || 0) - (Number(b.cost) || 0))
    } else if (sortBy === 'price-high') {
      sorted.sort((a, b) => (Number(b.cost) || 0) - (Number(a.cost) || 0))
    } else if (sortBy === 'date-late') {
      // Latest departure first. Missing/invalid times sort to the end.
      sorted.sort((a, b) => {
        const timeA = new Date(a.departure_time).getTime()
        const timeB = new Date(b.departure_time).getTime()
        const safeA = Number.isNaN(timeA) ? -Infinity : timeA
        const safeB = Number.isNaN(timeB) ? -Infinity : timeB
        return safeB - safeA
      })
    } else {
      // Default to 'date-soon' (soonest departure first).
      sorted.sort((a, b) => {
        const timeA = new Date(a.departure_time).getTime()
        const timeB = new Date(b.departure_time).getTime()
        const safeA = Number.isNaN(timeA) ? Infinity : timeA
        const safeB = Number.isNaN(timeB) ? Infinity : timeB
        return safeA - safeB
      })
    }
    return sorted
  }, [trips, searchQuery, categoryFilter, sortBy])

  return (
    <Box maxW="2xl" w="full" mx="auto" py={8} px={4}>
      
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="xl">
          Available Rides
        </Heading>
        {role === 'driver' && (
          <Button
            borderRadius="full"
            onClick={() => navigate('/create-ride')}
          >
            + Create Ride
          </Button>
        )}
      </Flex>

      {status === 'ready' && trips.length > 0 && (
        <VStack spacing={3} mb={6} align="stretch">
          <Input
            placeholder="Search by title, driver, or destination"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Flex gap={3} direction={{ base: 'column', sm: 'row' }}>
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              flex="1"
            >
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              flex="1"
            >
              <option value="date-soon">Sort by: Date (soonest)</option>
              <option value="date-late">Sort by: Date (latest)</option>
              <option value="price-low">Sort by: Price (lowest)</option>
              <option value="price-high">Sort by: Price (highest)</option>
            </Select>
          </Flex>
        </VStack>
      )}

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
            <Text fontSize="lg">No trips posted yet. Check back soon!</Text>
        </Center>
      )}

      {status === 'ready' && trips.length > 0 && filteredTrips.length === 0 && (
        <Center mt={10}>
            <Text fontSize="lg">No trips match your search.</Text>
        </Center>
      )}

      {status === 'ready' && filteredTrips.length > 0 && (
        <VStack spacing={3} w="full" align="stretch">
          {filteredTrips.map((trip) => (
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
                  _hover={{ bg: 'gray.50', _dark: { bg: 'gray.700' } }}
                >
                  <Avatar
                    size="sm"
                    name={`${trip.users?.first_name} ${trip.users?.last_name}`}
                    src={trip.users?.profile_picture}
                    mr={3}
                  />
                  <Text fontWeight="bold">
                    Driver: {trip.users?.first_name || 'Unknown'} {trip.users?.last_name || 'Driver'}
                  </Text>
                </Flex>
                <Flex justify="space-between" align="flex-start" mb={2}>
                  <Heading size="md">
                    {trip.title}
                  </Heading>
                  <Badge colorScheme={trip.cost ? "green" : "gray"} fontSize="sm" px={2} py={1} borderRadius="md">
                    {trip.cost ? `$${trip.cost}` : 'Free'}
                  </Badge>
                </Flex>

                <Text
                  textAlign="left"
                  fontSize="lg"
                  fontWeight="bold"
                  mb={2}
                  cursor="pointer"
                  onClick={() => openMap(trip.destination)}
                  _hover={{ textDecoration: 'underline' }}
                  title="View on map"
                >
                  → To {truncate(trip.destination)}
                </Text>

                <HStack spacing={2} fontSize="sm" mb={4}>
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
                  <Text mb={4}>
                    {trip.description}
                  </Text>
                )}

                {currentUserId && trip.driver_id === currentUserId ? (
                  <RouteModalButton
                    tripId={trip.id}
                    variant="solid"
                    borderRadius="full"
                    size="sm"
                  >
                    View Route
                  </RouteModalButton>
                ) : role === 'driver' ? (
                  <RouteModalButton
                    tripId={trip.id}
                    routeType="base"
                    variant="solid"
                    borderRadius="full"
                    size="sm"
                  >
                    View Route
                  </RouteModalButton>
                ) : acceptedTripIds.has(trip.id) ? (
                  <RouteModalButton
                    tripId={trip.id}
                    variant="solid"
                    borderRadius="full"
                    size="sm"
                  >
                    View Route
                  </RouteModalButton>
                ) : pendingTripIds.has(trip.id) ? (
                  <Button
                    variant="solid"
                    borderRadius="full"
                    size="sm"
                    isDisabled
                  >
                    Request Pending
                  </Button>
                ) : (
                  <Button
                    variant="solid"
                    borderRadius="full"
                    size="sm"
                    onClick={() => openPickup(trip)}
                  >
                    {trip.available_seats <= 0 ? 'Join Waitlist' : 'Request to Join'}
                  </Button>
                )}

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
              <Heading size="md" >
                {selectedDriver?.first_name || 'Unknown'} {selectedDriver?.last_name || 'Driver'}
              </Heading>
              {selectedDriver?.role && (
                <Badge fontSize="sm" px={2} py={1} borderRadius="md">
                  {selectedDriver.role}
                </Badge>
              )}
              {selectedDriver?.school && (
                <Text>{selectedDriver.school}</Text>
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

      {/* Pop-up where the rider drops a pin for where they want to be picked up. */}
      <Modal isOpen={pickup.isOpen} onClose={pickup.onClose} isCentered size="xl">
        <ModalOverlay />
        <ModalContent borderRadius="xl">
          <ModalHeader>Set your pickup location</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Text mb={2}>
              Where should {pickupTrip?.users?.first_name || 'the driver'} pick you up
              {pickupTrip?.title ? ` for “${pickupTrip.title}”` : ''}?
            </Text>
            {pickupRouteStops.length > 0 && (
              <HStack mb={3} spacing={2} fontSize="sm" color="gray.500" flexWrap="wrap">
                {pickupRoute?.distance_meters != null && (
                  <Text fontWeight="bold" color="gray.600">
                    {(pickupRoute.distance_meters / 1609.34).toFixed(1)} mi
                    {pickupRoute.duration_seconds != null &&
                      ` • ~${Math.round(pickupRoute.duration_seconds / 60)} min drive`}
                  </Text>
                )}
              </HStack>
            )}
            <LocationPicker
              onChange={setPickupLocation}
              height={320}
              routeGeometry={pickupRoute?.geometry}
              routeStops={pickupRouteStops}
            />
            <Button
              mt={4}
              w="full"
              borderRadius="full"
              onClick={submitRequest}
              isLoading={requesting === pickupTrip?.id}
              loadingText="Requesting..."
              isDisabled={!pickupLocation?.lat}
            >
              Confirm pickup & request seat
            </Button>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  )
}

export default TripsFeed
