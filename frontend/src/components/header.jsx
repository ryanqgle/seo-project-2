import '../css/header.css'

import { Link as RouterLink } from 'react-router-dom'
import {
  Box, 
  Flex, 
  HStack, 
  Button, 
  Heading, 
  Link 
} from '@chakra-ui/react'

function Header({ onLogin, isLoggedIn, onLogout, isDriver }) {
  return (
    <Box bg="white" px={4} boxShadow="sm" position="sticky" top={0} zIndex="sticky">
      <Flex h={16} alignItems="center" justifyContent="space-between" maxW="6xl" mx="auto">
        <Link as={RouterLink} to="/" _hover={{ textDecoration: 'none' }}>
          <Heading size="lg" color="blue.600" letterSpacing="tight">
            Hop In
          </Heading>
        </Link>

        <HStack spacing={8} alignItems="center">
          <HStack as="nav" spacing={6}>
            <Link as={RouterLink} to="/" fontWeight="medium" _hover={{ color: 'blue.500' }}>
              Home
            </Link>
            
            {isLoggedIn && (
              <Link as={RouterLink} to="/feed" fontWeight="medium" _hover={{ color: 'blue.500' }}>
                Trips
              </Link>
            )}

            {isDriver && (
              <Link as={RouterLink} to="/dashboard" fontWeight="bold" color="green.600" _hover={{ color: 'green.500' }}>
                Dashboard
              </Link>
            )}

            {isLoggedIn && (
              <Link as={RouterLink} to="/edit-profile" fontWeight="medium" _hover={{ color: 'blue.500' }}>
                Profile
              </Link>
            )}
          </HStack>

            {isLoggedIn ? (
            <Button 
              onClick={onLogout} 
              colorScheme="red"
              variant="ghost"
              size="md"
            >
              Log out
            </Button>
          ) : (
            <Button 
              onClick={onLogin}
              colorScheme="blue" 
              size="md"
              borderRadius="full"
              >
              Login
            </Button>
          )}
        </HStack>
      </Flex>
    </Box>

  )
}

export default Header
