import { Link as RouterLink } from 'react-router-dom'
import {
  Box, 
  Flex, 
  HStack, 
  Button, 
  Heading, 
  Link,
  IconButton,
  useDisclosure,
  useColorMode,
  useColorModeValue,
  Stack
} from '@chakra-ui/react'
import { HamburgerIcon, CloseIcon, SunIcon, MoonIcon } from '@chakra-ui/icons'

function Header({ onLogin, isLoggedIn, onLogout, isDriver }) {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { colorMode, toggleColorMode } = useColorMode()

  const bg = useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(23, 25, 35, 0.8)')
  const textColor = useColorModeValue('gray.800', 'white')
  const logoColor = useColorModeValue('blue.600', 'blue.400')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  const NavLinks = () => (
    <>
      <Link as={RouterLink} to="/" onClick={onClose} fontWeight="medium" _hover={{ color: 'blue.500' }}>
        Home
      </Link>
      
      {isLoggedIn && (
        <Link as={RouterLink} to="/feed" onClick={onClose} fontWeight="medium" _hover={{ color: 'blue.500' }}>
          Trips
        </Link>
      )}

      {isDriver && (
        <Link as={RouterLink} to="/dashboard" onClick={onClose} fontWeight="bold" color={useColorModeValue("green.600", "green.400")} _hover={{ color: 'green.500' }}>
          Dashboard
        </Link>
      )}

      {isLoggedIn && (
        <Link as={RouterLink} to="/profile" onClick={onClose} fontWeight="medium" _hover={{ color: 'blue.500' }}>
          Profile
        </Link>
      )}
    </>
  )

  return (
    <Box bg={bg} px={4} boxShadow="sm" position="sticky" top={0} zIndex="sticky" borderBottom="1px" borderColor={borderColor} backdropFilter="blur(10px)">
      <Flex h={16} alignItems="center" justifyContent="space-between" maxW="6xl" mx="auto">

        <IconButton
          size="md"
          icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
          aria-label="Open Menu"
          display={{ md: 'none' }}
          onClick={isOpen ? onClose : onOpen}
          variant="ghost"
          color={textColor}
        />

        <Link as={RouterLink} to="/" _hover={{ textDecoration: 'none' }}>
          <Heading size="lg" color={logoColor} letterSpacing="tight">
            Hop In
          </Heading>
        </Link>

        <HStack spacing={8} alignItems="center">

          <HStack as="nav" spacing={6} display={{ base: 'none', md: 'flex' }}>
            <NavLinks />
          </HStack>

          <Flex alignItems="center" gap={2}>
            <IconButton
              icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />} 
              onClick={toggleColorMode} 
              variant="ghost" 
              aria-label="Toggle Dark Mode"
              color={textColor}
              isRound
              mr={2}
            />

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
          </Flex>
        </HStack>
      </Flex>

      {isOpen ? (
        <Box pb={4} display={{ md: 'none' }}>
          <Stack as="nav" spacing={4} pt={2}>
            <NavLinks />
          </Stack>
        </Box>
      ) : null}
    </Box>

  )
}

export default Header
