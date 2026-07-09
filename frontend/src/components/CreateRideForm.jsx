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

function CreateRideForm() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm({ ...form, [e.target.name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...form,
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
