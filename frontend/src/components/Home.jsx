import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Card,
  CardBody,
  Flex,
  Heading,
  HStack,
  Image,
  SimpleGrid,
  Text,
  useToast,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react'
import { SearchIcon, AddIcon, ChatIcon } from '@chakra-ui/icons'
import { useAuth } from '../auth.jsx'
import { apiUrl } from '../api'

export default function Home() {
  const navigate = useNavigate()
  const toast = useToast()
  const { token } = useAuth()
  const [role, setRole] = useState(null)
  const logoSrc = useColorModeValue('/logo-black.PNG', '/logo-white.PNG')
  const imageBg = useColorModeValue('white', 'gray.800')
  const mutedText = useColorModeValue('gray.600', 'gray.300')
  const iconColor = useColorModeValue('black', 'white')


  useEffect(() => {
    if (!token) return

    fetch(apiUrl('/api/edit-profile'), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.status === 'success') {
          setRole(data.profile?.role)
        }
      })
      .catch((err) => console.error('Failed to load role:', err))
  }, [token])

  const handleFindRide = () => {
    if (!token) {
      navigate('/login')
      return
    }

    if (role === 'driver') {
      toast({
        title: 'Switch to rider first.',
        description: 'Go to your profile and change your role to rider before finding rides',
        status: 'warning',
        duration: 4000,
        isClosable: true,
      })
      navigate('/profile')
      return
    }

    navigate('/dashboard')
  }

  const handleOfferRide = () => {
    if (!token) {
      navigate('/login')
      return
    }

    if (role !== 'driver') {
      toast({
        title: 'Switch to driver first.',
        description: 'Go to your profile and change your role to driver before offering a ride',
        status: 'warning',
        duration: 4000,
        isClosable: true,
      })
      navigate('/profile')
      return
    }

    navigate('/create-ride')
  }

  return (
    <Box maxW="7xl" mx="auto" px={{ base: 5, md: 16 }} py={{ base: 10, md: 16 }}>
      <Flex
        align="center"
        justify="space-between"
        gap={{ base: 10, md: 16 }}
        direction={{ base: 'column', lg: 'row' }}
      >
        <Box flex="1" w="full" textAlign="left">
          <Text fontWeight="bold" color={mutedText} mb={4}>
            Share rides with students near you
          </Text>

          <Heading
            fontSize={{ base: '4xl', md: '6xl' }}
            lineHeight="1.05"
            mb={5}
          >
            Hop In
          </Heading>

          <Text fontSize="lg" color={mutedText} maxW="480px" mb={8}>
            Share rides with fellow students. Save money, reduce traffic, and get there together
          </Text>

        <Card maxW="520px" borderRadius="2xl">
          <CardBody>
            <VStack spacing={4} align="stretch">
              <HStack spacing={3}>
                <Button
                  borderRadius="lg"
                  leftIcon={<SearchIcon />}
                  onClick={handleFindRide}
                >
                  Find Rides
                </Button>

                <Button
                  variant="outline"
                  borderRadius="lg"
                  leftIcon={<AddIcon />}
                  onClick={handleOfferRide}
                >
                  Offer Ride
                </Button>
              </HStack>
            </VStack>
          </CardBody>
        </Card>
        </Box>

        <Box flex="1" display="flex" justifyContent="center" alignItems="center">
          <Box
            bg={imageBg}
            borderRadius="3xl"
            p={{ base: 8, md: 12 }}
            w="full"
            maxW="440px"
            display="flex"
            justifyContent="center"
            alignItems="center"
          >
            <Image
              src={logoSrc}
              alt="Hop In bunny car"
              maxH={{ base: '180px', md: '300px' }}
              objectFit="contain"
            />
          </Box>
        </Box>
      </Flex>

      <Box mt={{ base: 10, md: 12 }}>
        <Heading size="lg" mb={6}>
          What you can do with Hop In
        </Heading>

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5}>
          <Card borderRadius="2xl" variant="outline">
            <CardBody>
              <SearchIcon boxSize={6} mb={4} color={iconColor} />
              <Heading size="md" mb={2}>
                Find a ride
              </Heading>
              <Text color={mutedText} mb={4}>
                Browse available trips and request a seat
              </Text>
              <Button size="sm" variant="ghost" onClick={handleFindRide}>
                Find rides
              </Button>
            </CardBody>
          </Card>

          <Card borderRadius="2xl" variant="outline">
            <CardBody>
              <AddIcon boxSize={6} mb={4} color={iconColor} />
              <Heading size="md" mb={2}>
                Offer a ride
              </Heading>
              <Text color={mutedText} mb={4}>
                Post a trip and help other students get there
              </Text>
              <Button size="sm" variant="ghost" onClick={handleOfferRide}>
                Create ride
              </Button>
            </CardBody>
          </Card>

          <Card borderRadius="2xl" variant="outline">
            <CardBody>
              <ChatIcon boxSize={6} mb={4} color={iconColor} />
              <Heading size="md" mb={2}>
                Chat and pay
              </Heading>
              <Text color={mutedText} mb={4}>
                Coordinate pickup details and pay securely after approval
              </Text>
              <Button size="sm" variant="ghost" onClick={() => navigate('/dashboard')}>
                View activity
              </Button>
            </CardBody>
          </Card>
        </SimpleGrid>
      </Box>
    </Box>
  )
}