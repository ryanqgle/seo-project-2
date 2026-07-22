import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Card,
  CardBody,
  Checkbox,
  FormControl,
  FormLabel,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  NumberInput,
  NumberInputField,
  Select,
  SimpleGrid,
  Textarea,
  VStack,
  Alert,
  AlertTitle,
  AlertDescription,
  AlertIcon,
  Text
} from '@chakra-ui/react'
import { useAuth } from '../auth.jsx'
import { apiUrl } from '../api'
import LocationPicker from './LocationPicker.jsx'

const CATEGORY_CHOICES = ['campus', 'grocery', 'airport', 'other']

const initialForm = {
  title: '',
  departure_time: '',
  category: CATEGORY_CHOICES[0],
  available_seats: 1,
  cost: '',
  description: '',
  round_trip: false,
}

// The "Post a Ride" form, used by drivers to offer a new trip (shown at
// "/create-ride"). It collects the trip details, checks that the destination is
// a real address, and then saves the trip to the backend.
function CreateRideForm() {
  // `token` proves who we are so the backend knows which driver is posting.
  const { token } = useAuth()
  const navigate = useNavigate()
  // All the form's current values (title, seats, etc.). Location fields live in
  // their own state below since they come from the maps, not text inputs.
  const [form, setForm] = useState(initialForm)
  
  // Where the trip starts and ends, each { lat, lng, address } from a map pin.
  // Null until the driver drops the respective pin.
  const [origin, setOrigin] = useState(null)
  const [destination, setDestination] = useState(null)
  // True while the trip is being posted (shows the button's loading state).
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Consts to ensure Driver has stripe setup in order to create ride
  const [payoutsReady, setPayoutsReady] = useState(false)
  const [checkingPayouts, setCheckingPayouts] = useState(true)


  useEffect(() => {
    const checkPayouts = async () => {
      if (!token) return

      try {
        const res = await fetch(apiUrl('/api/stripe/connect/status'), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const data = await res.json()

        if (res.ok) {
          setPayoutsReady(data.onboarding_complete)
        }
      } catch (err) {
        console.error('Failed to check payout status:', err)
      } finally {
        setCheckingPayouts(false)
      }
    }

    checkPayouts()
  }, [token])

  // Keeps the form in sync as the user types or ticks the checkbox. Each input's
  // `name` matches a field in `form`, so this updates just the one that changed.
  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm({ ...form, [e.target.name]: value })
  }

  const handleSetupPayouts = async () => {
    try {
      const res = await fetch(apiUrl('/api/stripe/connect/onboard'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Could not start payout setup')
      }

      window.location.href = data.url
    } catch (err) {
      setError(err.message)
    }
  }

  // Runs when the driver clicks "Post Ride". The start and destination now come
  // from map pins (coordinates are the source of truth, with a reverse-geocoded
  // address label), so we just confirm both pins are set and send everything to
  // the backend. On success it takes the driver to the trips feed.
  const handleSubmit = async (e) => {
    e.preventDefault()  // stop the browser from reloading the page on submit
    setError('')

    if (!origin?.lat || !destination?.lat) {
      setError('Please set both a starting point and a destination on the maps.')
      return
    }

    setSubmitting(true)

    try {
      // If the address label is still resolving, fall back to the coordinates so
      // we always store something readable alongside the exact point.
      const originLabel = origin.address || `${origin.lat.toFixed(5)}, ${origin.lng.toFixed(5)}`
      const destinationLabel =
        destination.address || `${destination.lat.toFixed(5)}, ${destination.lng.toFixed(5)}`

      const res = await fetch(apiUrl('/api/trips'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: form.title,
          departure_time: form.departure_time,
          category: form.category,
          description: form.description,
          round_trip: form.round_trip,
          available_seats: Number(form.available_seats),
          cost: Number(form.cost),
          origin: originLabel,
          origin_lat: origin.lat,
          origin_lng: origin.lng,
          destination: destinationLabel,
          destination_lat: destination.lat,
          destination_lng: destination.lng,
        })
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.message || data.error || 'Could not post ride')
        return
      }

      if (data.status === 'success') {
        navigate('/feed')
      } else {
        setError(data.message || data.error|| 'Could not post ride')
      }
    } catch (err) {
      console.error('Error creating trip:', err)
      setError('Could not post ride.')
    } finally {
      setSubmitting(false)
    }
  }

if (checkingPayouts) {
  return (
    <Box maxW="xl" mx="auto" mt={10}>
      <Text>Checking payout setup...</Text>
    </Box>
  )
}

if (!payoutsReady) {
  return (
    <Box maxW="xl" mx="auto" mt={10} px={4}>
      <Alert status="warning" borderRadius="xl" mb={4}>
        <AlertIcon />
        <Box>
          <AlertTitle>Set up payouts first</AlertTitle>
          <AlertDescription>
            You need to finish Stripe payout setup before creating a ride.
          </AlertDescription>
        </Box>
      </Alert>

      <Button onClick={handleSetupPayouts}>
        Set up payouts
      </Button>

      {error && (
        <Alert status="error" borderRadius="md" mt={4}>
          <AlertIcon />
          {error}
        </Alert>
      )}
    </Box>
  )
}

  return (
    <Box p={4}>
      <Card maxW="lg" mx="auto" boxShadow="lg" borderRadius="xl">
        <CardBody p={8}>
          <Heading size="lg" mb={6} textAlign="center" color="gray.700">
            Post a Ride
          </Heading>

          <form onSubmit={handleSubmit}>
            <VStack spacing={5} align="stretch">
              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="bold">Title</FormLabel>
                <Input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Quick run to Target"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="bold">Starting point</FormLabel>
                <LocationPicker initialValue={origin} onChange={setOrigin} />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="bold">Destination</FormLabel>
                <LocationPicker initialValue={destination} onChange={setDestination} />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="bold">Departure Time</FormLabel>
                <Input
                  name="departure_time"
                  type="datetime-local"
                  value={form.departure_time}
                  onChange={handleChange}
                />
              </FormControl>

              <SimpleGrid columns={2} spacing={4}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="bold">Category</FormLabel>
                  <Select name="category" value={form.category} onChange={handleChange}>
                    {CATEGORY_CHOICES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="bold">Available Seats</FormLabel>
                  <NumberInput
                    min={1}
                    value={form.available_seats}
                    onChange={(valueString) =>
                      setForm((f) => ({ ...f, available_seats: valueString }))
                    }
                  >
                    <NumberInputField name="available_seats" />
                  </NumberInput>
                </FormControl>
              </SimpleGrid>

              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="bold">Cost</FormLabel>
                <InputGroup>
                  <InputLeftElement pointerEvents="none" color="gray.400">$</InputLeftElement>
                  <Input
                    name="cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.cost}
                    onChange={handleChange}
                    placeholder="0.00"
                  />
                </InputGroup>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="bold">Description</FormLabel>
                <Textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Anything riders should know?"
                  rows={3}
                />
              </FormControl>

              <Checkbox
                name="round_trip"
                isChecked={form.round_trip}
                onChange={handleChange}
                colorScheme="blue"
              >
                Round trip
              </Checkbox>

              {error && (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  {error}
                </Alert>
              )}

              <Button
                type="submit"
                colorScheme="blue"
                size="lg"
                w="full"
                mt={2}
                isLoading={submitting}
                loadingText="Posting..."
              >
                Post Ride
              </Button>
            </VStack>
          </form>
        </CardBody>
      </Card>
    </Box>
  )
}

export default CreateRideForm
