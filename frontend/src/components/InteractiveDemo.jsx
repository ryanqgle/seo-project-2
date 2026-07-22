import React, { useState, useEffect } from 'react'
import {
  Box, Card, CardBody, Flex, Avatar, Heading, Badge, Text, Button,
  HStack, IconButton, Input, VStack, Divider, Circle
} from '@chakra-ui/react'
import { ChevronLeftIcon, ChevronRightIcon, ArrowUpIcon } from '@chakra-ui/icons'


// create ride demo
const CreateRideDemo = () => {
  const [status, setStatus] = useState('editing') // editing, posting, posted

  const handlePost = () => {
    setStatus('posting')
    setTimeout(() => setStatus('posted'), 1200)
  }

  return (
    <Card variant="outline" boxShadow="sm" borderRadius="xl" w="full" maxW="md" mx="auto" bg="white" _dark={{ bg: "gray.800", borderColor: "gray.700" }}>
      <CardBody p={5}>
        <Heading size="md" mb={5} textAlign="left">Post a Ride</Heading>
        
        <VStack spacing={4} mb={6}>
          <Box w="full">
            <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase" mb={1}>Trip Title</Text>
            <Input value="Tech Devcon" isReadOnly bg="gray.50" _dark={{ bg: "gray.700", border: "none" }} borderRadius="md" />
          </Box>
          <Box w="full">
            <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase" mb={1}>Origin</Text>
            <Input value="Newark, NJ" isReadOnly bg="gray.50" _dark={{ bg: "gray.700", border: "none" }} borderRadius="md" />
          </Box>
          <Box w="full">
            <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase" mb={1}>Destination</Text>
            <Input value="Millennium Hotel Times Square" isReadOnly bg="gray.50" _dark={{ bg: "gray.700", border: "none" }} borderRadius="md" />
          </Box>
        </VStack>

        <Flex gap={3} mb={6}>
          <Input value="Friday, 10:00 AM" isReadOnly bg="gray.50" _dark={{ bg: "gray.700", border: "none" }} borderRadius="md" />
          <Input value="3 Seats" w="35%" isReadOnly bg="gray.50" _dark={{ bg: "gray.700", border: "none" }} borderRadius="md" textAlign="center" />
        </Flex>

        {status === 'editing' && (
          <Button w="full" bg="black" color="white" _hover={{ bg: "gray.800" }} _dark={{ bg: "white", color: "black", _hover: { bg: "gray.200" } }} size="md" borderRadius="full" onClick={handlePost}>
            Create Ride
          </Button>
        )}
        {status === 'posting' && (
          <Button w="full" isLoading loadingText="Posting..." bg="black" color="white" _dark={{ bg: "white", color: "black" }} size="md" borderRadius="full" />
        )}
        {status === 'posted' && (
          <Button w="full" colorScheme="green" size="md" borderRadius="full">
            Ride Posted Successfully!
          </Button>
        )}
      </CardBody>
    </Card>
  )
}


// rider view

const RiderDemo = () => {
  const [riderStatus, setRiderStatus] = useState('open')

  useEffect(() => {
    if (riderStatus === 'requesting') {
      const timer = setTimeout(() => setRiderStatus('pending'), 1000)
      return () => clearTimeout(timer)
    }
  }, [riderStatus])

  return (
    <Card variant="outline" boxShadow="sm" borderRadius="xl" w="full" maxW="md" mx="auto" bg="white" _dark={{ bg: "gray.800", borderColor: "gray.700" }}>
      <CardBody p={5}>
        <Flex align="center" mb={4} p={2} m={-2} borderRadius="md" _hover={{ bg: 'gray.50', _dark: { bg: 'gray.700' } }} cursor="pointer" transition="all 0.2s">
          <Avatar size="sm" name="Yahir" bg="gray.800" color="white" mr={3} />
          <Text fontWeight="bold">Driver: Yahir</Text>
        </Flex>
        
        <Flex justify="space-between" align="flex-start" mb={2}>
          <Heading size="md">Tech Devcon</Heading>
          <Badge colorScheme="green" px={2} py={1} borderRadius="md" fontSize="sm">$12</Badge>
        </Flex>

        <Text fontSize="lg" fontWeight="bold" mb={4} color="gray.800" _dark={{ color: "white" }}>
          → To Millennium Hotel Times Square
        </Text>

        <HStack spacing={2} fontSize="sm" mb={6} color="gray.600" _dark={{ color: "gray.300" }}>
          <Text>Fri, 10:00 AM</Text>
          <Text>•</Text>
          <Text fontWeight="bold">1 seat left</Text>
        </HStack>

        {riderStatus === 'open' && (
          <Button w="full" bg="black" color="white" _hover={{ bg: "gray.800" }} _dark={{ bg: "white", color: "black", _hover: { bg: "gray.200" } }} size="sm" borderRadius="full" onClick={() => setRiderStatus('requesting')}>
            Request to Join
          </Button>
        )}
        {riderStatus === 'requesting' && (
          <Button w="full" isLoading loadingText="Sending Request..." bg="black" color="white" _dark={{ bg: "white", color: "black" }} size="sm" borderRadius="full" />
        )}
        {riderStatus === 'pending' && (
          <Button w="full" isDisabled size="sm" borderRadius="full">
            Request Pending
          </Button>
        )}
      </CardBody>
    </Card>
  )
}

//driver view

const DriverDemo = () => {
  const [driverStatus, setDriverStatus] = useState('pending')
  const [seats, setSeats] = useState(1) // 2 accepted, 1 remaining

  const handleAccept = () => {
    setDriverStatus('accepted')
    setSeats(0)
  }

  const handleDecline = () => {
    setDriverStatus('decline')
  }

  return (
    <Card variant="outline" boxShadow="sm" borderRadius="xl" w="full" maxW="md" mx="auto" bg="white" _dark={{ bg: "gray.800", borderColor: "gray.700" }}>
      <CardBody p={5}>
        <Box mb={4}>
          <Heading size="md" mb={1}>Tech Devcon</Heading>
          <Text fontWeight="bold" fontSize="sm" color="gray.600" _dark={{ color: "gray.300" }}>
            → To Millennium Hotel Times Square
          </Text>
        </Box>
        <Divider mb={4} _dark={{ borderColor: "gray.600" }}/>

        {/* accepted Riders */}
        <Box mb={4} p={3} bg="gray.50" _dark={{ bg: "gray.700", borderColor: "gray.600" }} borderRadius="md" border="1px solid" borderColor="gray.200">
          <Text fontSize="sm" fontWeight="bold" color="gray.800" _dark={{ color: "gray.100" }} mb={3}>
            Accepted Riders ({driverStatus === 'accepted' ? 3 : 2}/3 Seats)
          </Text>
          <VStack spacing={2} align="stretch">
            <Flex align="center" justify="space-between" bg="white" _dark={{ bg: "gray.800" }} p={2} borderRadius="md" border="1px solid" borderColor="gray.200" _dark={{ borderColor: "gray.600" }}>
              <Flex align="center">
                <Avatar size="xs" name="Hailia" bg="purple.500" color="white" mr={2} />
                <Text fontWeight="bold" fontSize="sm">Hailia</Text>
              </Flex>
              <Badge colorScheme="green" variant="subtle">Paid</Badge>
            </Flex>
            <Flex align="center" justify="space-between" bg="white" _dark={{ bg: "gray.800" }} p={2} borderRadius="md" border="1px solid" borderColor="gray.200" _dark={{ borderColor: "gray.600" }}>
              <Flex align="center">
                <Avatar size="xs" name="Dyana" bg="pink.500" color="white" mr={2} />
                <Text fontWeight="bold" fontSize="sm">Dyana</Text>
              </Flex>
              <Badge colorScheme="green" variant="subtle">Paid</Badge>
            </Flex>
            
            {/* new rider pops into accepted block when approved */}
            {driverStatus === 'accepted' && (
              <Flex align="center" justify="space-between" bg="white" _dark={{ bg: "gray.800" }} p={2} borderRadius="md" border="1px solid" borderColor="gray.200" _dark={{ borderColor: "gray.600" }}>
                <Flex align="center">
                  <Avatar size="xs" name="Ryan" bg="teal.500" color="white" mr={2} />
                  <Text fontWeight="bold" fontSize="sm">Ryan</Text>
                </Flex>
                <Badge colorScheme="yellow" variant="subtle">Awaiting Payment</Badge>
              </Flex>
            )}
          </VStack>
        </Box>

        <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wide" mb={3} color="gray.800" _dark={{ color: "gray.200" }}>
          Pending Requests
        </Text>

        {driverStatus === 'pending' ? (
          <Flex align="center" justify="space-between" bg="white" _dark={{ bg: "gray.800", borderColor: "gray.600" }} p={2} borderRadius="md" border="1px solid" borderColor="gray.200">
            <Flex align="center">
              <Avatar size="xs" name="Ryan" bg="teal.500" color="white" mr={3} />
              <Text fontWeight="bold" fontSize="sm">Ryan</Text>
            </Flex>
            <HStack spacing={1}>
              <Button size="xs" bg="black" color="white" _hover={{ bg: "gray.800" }} _dark={{ bg: "white", color: "black", _hover: { bg: "gray.200" } }} onClick={handleAccept}>Accept</Button>
              <Button size="xs" colorScheme="red" variant="dangerSoft" onClick={handleDecline}>Decline</Button>
            </HStack>
          </Flex>
        ) : (
          <Text fontSize="sm" fontStyle="italic" color="gray.500">No new requests.</Text>
        )}
      </CardBody>
    </Card>
  )
}

// chat demo 

const ChatDemo = () => {
  const [messages, setMessages] = useState([
    { text: "So excited for Tech Devcon next week! I live in Jersey so I can meet wherever.", sender: "Dyana", isMe: false, color: "pink.500" },
    { text: "I'll be in Jersey too! My flight gets into Newark airport at 2 PM.", sender: "Ryan", isMe: false, color: "teal.500" },
    { text: "I live in nyc so I can show you guys around the city in our free time! 🗽", sender: "Hailia", isMe: false, color: "purple.500" },
  ])
  const [newMsg, setNewMsg] = useState("")

  const handleSend = (e) => {
    e.preventDefault()
    if (!newMsg.trim()) return
    setMessages([...messages, { text: newMsg, sender: "Yahir", isMe: true }])
    setNewMsg("")
  }

  return (
    <Card variant="outline" boxShadow="sm" borderRadius="xl" w="full" maxW="md" h="450px" mx="auto" bg="white" _dark={{ bg: "gray.800", borderColor: "gray.700" }} overflow="hidden">
      <Flex direction="column" h="full">
        <Flex align="center" justify="space-between" p={3} borderBottom="1px solid" borderColor="gray.200" _dark={{ borderColor: "gray.700" }} bg="gray.50" _dark={{ bg: "gray.900" }}>
          <Heading size="sm" isTruncated>Tech Devcon</Heading>
          {/* avatar stack for participants */}
          <Flex ml={2}>
            <Avatar size="xs" name="Hailia" bg="purple.500" color="white" ml={-2} border="2px solid white" _dark={{ borderColor: "gray.900" }}/>
            <Avatar size="xs" name="Dyana" bg="pink.500" color="white" ml={-2} border="2px solid white" _dark={{ borderColor: "gray.900" }}/>
            <Avatar size="xs" name="Ryan" bg="teal.500" color="white" ml={-2} border="2px solid white" _dark={{ borderColor: "gray.900" }}/>
          </Flex>
        </Flex>
        
        <Box flex="1" overflowY="auto" p={4}>
          <VStack spacing={4} align="stretch">
            {messages.map((msg, idx) => (
              <Flex key={idx} justify={msg.isMe ? "flex-end" : "flex-start"} align="flex-end" gap={2}>
                {!msg.isMe && <Avatar size="xs" name={msg.sender} bg={msg.color} color="white" />}
                
                <Box maxW="75%">
                  {!msg.isMe && (
                      <Text fontSize="xs" color="gray.500" _dark={{ color: "gray.400" }} mb={1} ml={1}>
                          {msg.sender}
                      </Text>
                  )}
                  <Box 
                    bg={msg.isMe ? "black" : "gray.100"} 
                    color={msg.isMe ? "white" : "gray.800"}
                    _dark={{ bg: msg.isMe ? "white" : "gray.700", color: msg.isMe ? "black" : "white" }}
                    px={4} py={2} 
                    borderRadius="2xl"
                    borderBottomRightRadius={msg.isMe ? "sm" : "2xl"}
                    borderBottomLeftRadius={!msg.isMe ? "sm" : "2xl"}
                    boxShadow="sm"
                  >
                    <Text fontSize="sm"
                          color={msg.isMe ? "white" : "gray.800"}
                          _dark={{ color: msg.isMe ? "black" : "white" }}
                        >
                        {msg.text}</Text>
                  </Box>
                </Box>
              </Flex>
            ))}
          </VStack>
        </Box>

        <Box p={3} borderTop="1px solid" borderColor="gray.200" _dark={{ borderColor: "gray.700" }}>
          <form onSubmit={handleSend}>
            <Flex gap={2}>
              <Input 
                value={newMsg} onChange={(e) => setNewMsg(e.target.value)}
                placeholder="Message the group..." borderRadius="full" 
                bg="gray.50" _dark={{ bg: "gray.700", border: "none" }}
              />
              <IconButton type="submit" icon={<ArrowUpIcon />} bg="black" color="white" _hover={{ bg: "gray.800" }} _dark={{ bg: "white", color: "black", _hover: { bg: "gray.200" } }} isRound isDisabled={!newMsg.trim()}/>
            </Flex>
          </form>
        </Box>
      </Flex>
    </Card>
  )
}

const demoViews = [
  { label: "Step 1: Offer a Ride", component: <CreateRideDemo /> },
  { label: "Step 2: Find a Seat", component: <RiderDemo /> },
  { label: "Step 3: Accept Riders", component: <DriverDemo /> },
  { label: "Step 4: Coordinate Pickup", component: <ChatDemo /> },
]

const viewFeatureMap = [
  "Drivers can easily post their route, set departure times, and choose how many seats to offer.",
  "Riders browse available trips and request a seat with a single tap.",
  "Drivers review passenger requests and accept them to fill up their car.",
  "Make introductions and share excitement using real-time, in-app group chat!"
]

export default function InteractiveDemo({ compact = false }) {
  const [viewIdx, setViewIdx] = useState(0)
  const outerPy = compact ? 4 : 10
  const highlightP = compact ? 4 : 6
  const highlightMb = compact ? 5 : 8
  const carouselMb = compact ? 5 : 8
  const featureFontSize = compact ? 'md' : 'lg'
  const labelFontSize = compact ? 'md' : 'lg'
  const arrowSize = compact ? 'md' : 'lg'
  const arrowIconSize = compact ? 6 : 8

  const handleNext = () => setViewIdx((prev) => (prev + 1) % demoViews.length)
  const handlePrev = () => setViewIdx((prev) => (prev - 1 + demoViews.length) % demoViews.length)

  return (
    <Box maxW="4xl" mx="auto" py={outerPy} px={3} textAlign="center">
      
      {/* feauture highlight box */}
      <Box 
        bg="white" _dark={{ bg: "gray.800", borderColor: "gray.600" }}
        border="1px solid" borderColor="gray.300"
        borderRadius="2xl"
        boxShadow="sm"
        p={highlightP} mb={highlightMb} mx="auto" maxW="xl"
        minH={compact ? '56px' : '80px'}
        display="flex" alignItems="center" justifyContent="center"
      >
        <Text fontSize={featureFontSize} fontWeight="semibold" color="black" _dark={{ color: "white" }}>
          {viewFeatureMap[viewIdx]}
        </Text>
      </Box>

      {/* carousel */}
      <Flex align="center" justify="center" gap={{ base: 2, md: 5 }} mb={carouselMb}>
        <IconButton 
          icon={<ChevronLeftIcon boxSize={arrowIconSize} />} 
          onClick={handlePrev} 
          variant="ghost" 
          color="black" _dark={{ color: "white" }}
          _hover={{ bg: "gray.100", _dark: { bg: "whiteAlpha.200" } }}
          isRound
          size={arrowSize}
          aria-label="Previous"
        />
        
        <Box flex="1" maxW="md">
          {demoViews[viewIdx].component}
        </Box>
        
        <IconButton 
          icon={<ChevronRightIcon boxSize={arrowIconSize} />} 
          onClick={handleNext} 
          variant="ghost" 
          color="black" _dark={{ color: "white" }}
          _hover={{ bg: "gray.100", _dark: { bg: "whiteAlpha.200" } }}
          isRound
          size={arrowSize}
          aria-label="Next"
        />
      </Flex>

      {/* bottom label*/}
      <HStack justify="center" spacing={3}>
        {demoViews.map((_, idx) => (
          <Circle key={idx} size={idx === viewIdx ? "10px" : "6px"} bg={idx === viewIdx ? "black" : "gray.300"} _dark={{ bg: idx === viewIdx ? "white" : "gray.600" }} transition="all 0.2s" />
        ))}
      </HStack>
      <Text mt={compact ? 2 : 4} color="gray.600" _dark={{ color: "gray.400" }} fontWeight={labelFontSize} fontSize={labelFontSize}>
        {demoViews[viewIdx].label}
      </Text>

    </Box>
  )
}