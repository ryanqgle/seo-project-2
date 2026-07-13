import { useState } from 'react'
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
  AlertIcon
} from '@chakra-ui/react'
import { useAuth } from '../auth.jsx'

const CATEGORY_CHOICES = ['campus', 'grocery', 'airport', 'other']

const initialForm = {
  title: '',
  destination: '',
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
  // All the form's current values (title, destination, seats, etc.).
  const [form, setForm] = useState(initialForm)
  // True while the trip is being posted (shows the button's loading state).
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Keeps the form in sync as the user types or ticks the checkbox. Each input's
  // `name` matches a field in `form`, so this updates just the one that changed.
  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm({ ...form, [e.target.name]: value })
  }

  // Checks that the typed destination is a real place, so drivers can't post a
  // made-up address. It looks the address up using OpenStreetMap's free, public
  // map-search service. If a match is found, it returns the cleaned-up full
  // address; if nothing matches, it returns null.
  const verifyDestination = async (address) => {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`
    )
    if (!res.ok) throw new Error(`Address lookup failed: ${res.status}`)
    const results = await res.json()
    return results.length > 0 ? results[0].display_name : null
  }

  // Runs when the driver clicks "Post Ride". It first confirms the destination
  // is a real address, then sends the trip to the backend. On success it takes
  // the driver to the trips feed so they can see their new post.
  const handleSubmit = async (e) => {
    e.preventDefault()  // stop the browser from reloading the page on submit
    setError('')
    setSubmitting(true)

    try {
      let verifiedDestination
      try {
        verifiedDestination = await verifyDestination(form.destination)
      } catch {
        setError('Could not verify the address. Please try again.')
        setSubmitting(false)
        return
      }

      if (!verifiedDestination) {
        setError('Please enter a valid address for the destination.')
        setSubmitting(false)
        return
      }

      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...form,
          destination: verifiedDestination,
          available_seats: Number(form.available_seats),
          cost: Number(form.cost),
        })
      })
      const data = await res.json()

      if (data.status === 'success') {
        navigate('/feed')
      } else {
        setError(data.message || 'Could not post ride.')
      }
    } catch (err) {
      console.error('Error creating trip:', err)
      setError('Could not post ride.')
    } finally {
      setSubmitting(false)
    }
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
                <FormLabel fontSize="sm" fontWeight="bold">Destination</FormLabel>
                <Input
                  name="destination"
                  value={form.destination}
                  onChange={handleChange}
                  placeholder="Target, Downtown"
                />
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
