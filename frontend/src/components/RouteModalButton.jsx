import { useState } from 'react'
import {
  Button,
  Center,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Spinner,
  Text,
  useDisclosure,
} from '@chakra-ui/react'
import { supabase } from '../dbConnection.js'
import { apiUrl } from '../api'
import RouteMap from './RouteMap.jsx'

// A "View Route" button that, when clicked, fetches the trip's computed route
// from the backend and shows it on a map in a modal. Shared by the driver
// dashboard and the trips feed so both request/display the route the same way.
//
// Props:
//   tripId — the trip to fetch the route for
//   ...buttonProps — forwarded to the Chakra Button (size, colorScheme, etc.)
function RouteModalButton({ tripId, children = 'View Route', ...buttonProps }) {
  const { isOpen, onOpen, onClose } = useDisclosure()
  // 'idle' before first open, then 'loading' | 'error' | 'ready'.
  const [state, setState] = useState('idle')
  const [route, setRoute] = useState(null)
  const [error, setError] = useState('')

  // Opens the modal and (re)fetches the route each time, so it always reflects
  // the current set of accepted pickups.
  const openRoute = async () => {
    onOpen()
    setState('loading')
    setError('')

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setState('error')
      setError('Please log in to view the route.')
      return
    }

    try {
      const res = await fetch(apiUrl(`/api/trips/${tripId}/route`), {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not load the route.')
      setRoute(data)
      setState('ready')
    } catch (err) {
      setError(err.message || 'Could not load the route.')
      setState('error')
    }
  }

  return (
    <>
      <Button onClick={openRoute} {...buttonProps}>
        {children}
      </Button>

      <Modal isOpen={isOpen} onClose={onClose} isCentered size="xl">
        <ModalOverlay />
        <ModalContent borderRadius="xl">
          <ModalHeader>Trip Route</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {state === 'loading' && (
              <Center py={10}>
                <Spinner size="xl" color="blue.500" thickness="4px" />
              </Center>
            )}
            {state === 'error' && (
              <Text color="red.500" py={4}>
                {error}
              </Text>
            )}
            {state === 'ready' && route && (
              <RouteMap
                stops={route.stops}
                geometry={route.geometry}
                distanceMeters={route.distance_meters}
                durationSeconds={route.duration_seconds}
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
}

export default RouteModalButton
