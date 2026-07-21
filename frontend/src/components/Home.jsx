import React from 'react'
import { Box, Button, Container, Heading, Text, VStack, HStack, Flex, Image, useColorModeValue } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import InteractiveDemo from './InteractiveDemo.jsx' 

export default function Home() {
  const navigate = useNavigate()
  
  const bgGradient = useColorModeValue("linear(to-b, gray.50, white)", "linear(to-b, gray.900, gray.800)")
  const textColor = useColorModeValue("gray.600", "gray.400")
  const headingColor = useColorModeValue("black", "white")
  const logoSrc = useColorModeValue("/logo-black.PNG", "/logo-white.PNG")

  return (
    <Box>

      <Box bgGradient={bgGradient} py={{ base: 10, md: 14 }} borderBottom="1px solid" borderColor={useColorModeValue("gray.200", "gray.700")}>
        <Container maxW="4xl" textAlign="center">
          <VStack spacing={6}>

            <HStack spacing={4} justify="center" align="center">
              <Image 
                src={logoSrc} 
                alt="Hop In Logo"
                boxSize={{ base: "80px", md: "120px" }}
                objectFit="contain"
              />
              <Heading as="h2" size="2xl" md={{ size: "3xl" }} fontWeight="black" letterSpacing="tighter" color={headingColor}>
                Hop In
              </Heading>
            </HStack>

            <VStack spacing={3}>
              <Heading as="h1" size="lg" md={{ size: "xl" }} fontWeight="bold" letterSpacing="tight" color={headingColor}>
                Share the ride. Split the cost.
              </Heading>
              
              <Text fontSize="lg" maxW="xl" color={textColor}>
                The exclusive college ridesharing network. Catch a ride to grocery store or split gas money by driving your peers.
              </Text>
            </VStack>
            
            <Flex gap={4} pt={1} flexDir={{ base: 'column', sm: 'row' }}>
              <Button 
                size="md" 
                bg={useColorModeValue("black", "white")}
                color={useColorModeValue("white", "black")}
                borderRadius="full"
                px={8}
                boxShadow="sm"
                _hover={{ transform: 'translateY(-2px)', boxShadow: 'md', bg: useColorModeValue("gray.800", "gray.200") }}
                transition="all 0.2s"
                onClick={() => navigate('/feed')}
              >
                Get Started
              </Button>
              <Button 
                size="md" 
                colorScheme="gray" 
                variant="outline" 
                borderRadius="full"
                px={8}
                _hover={{ bg: useColorModeValue('gray.100', 'whiteAlpha.200') }}
                onClick={() => {
                  document.getElementById('demo-section')?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                Try the Demo
              </Button>
            </Flex>
          </VStack>
        </Container>
      </Box>

      {/* interactive demo section */}
      <Box id="demo-section" py={10} bg={useColorModeValue("white", "gray.900")}>
        <Container maxW="6xl">
          <InteractiveDemo />
        </Container>
      </Box>
      
    </Box>
  )
}