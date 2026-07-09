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

function Header({ onNavigate, isLoggedIn, onLogout }) {
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
            
            <Link as={RouterLink} to="/about" fontWeight="medium" _hover={{ color: 'blue.500' }}>
              About
            </Link>

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
              onClick={() => onNavigate('login')} 
              colorScheme="blue" 
              size="md"
              borderRadius="full"
              >
              Login
            </Button>
          )}
        </HStack>
        </HStack>
      </Flex>
    </Box>

  )
}

export default Header
