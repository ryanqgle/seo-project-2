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
  Stack,
  Image
} from '@chakra-ui/react'
import { HamburgerIcon, CloseIcon, SunIcon, MoonIcon } from '@chakra-ui/icons'

// The navigation bar shown at the top of every page. It adapts to who is
// looking at it:
//   - Logged-out visitors see Home + a Login button.
//   - Logged-in users also see Trips and Profile.
//   - Drivers additionally see a Dashboard link.
// It also has a light/dark mode toggle and collapses into a hamburger menu on
// small screens (phones).
//
// Values passed in from the app:
//   onLogin    - called when the Login button is clicked (opens the login pop-up)
//   isLoggedIn - whether someone is currently signed in
//   onLogout   - called when the Log out button is clicked
//   isDriver   - whether the signed-in user is a driver (shows the Dashboard link)
function Header({ onLogin, isLoggedIn, onLogout, isDriver }) {
  // Tracks whether the mobile hamburger menu is currently open.
  const { isOpen, onOpen, onClose } = useDisclosure()
  // Current theme (light/dark) and a function to switch between them.
  const { colorMode, toggleColorMode } = useColorMode()

  const bg = useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(23, 25, 35, 0.8)')
  const textColor = useColorModeValue('gray.800', 'white')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const logoSrc = useColorModeValue('/logo-black.PNG', '/logo-white.PNG')

  // The set of navigation links. Defined once here and reused in both the
  // desktop bar and the mobile drop-down menu so they always stay in sync.
  const NavLinks = () => (
    <>
      <Link as={RouterLink} to="/" onClick={onClose} fontWeight="medium" _hover={{ color: 'gray.400' }}>
        Home
      </Link>
      
      {isLoggedIn && (
        <>
          <Link as={RouterLink} to="/feed" onClick={onClose} fontWeight="bold"  _hover={{ color: 'gray.400' }}>
            Dashboard
          </Link>

          <Link as={RouterLink} to="/profile" onClick={onClose} fontWeight="medium" _hover={{ color: 'gray.400' }}>
            Profile
          </Link>
        </>
      )}
    </>
  )

  return (
    <Box bg={bg} px={4} boxShadow="sm" position="sticky" top={0} zIndex="sticky" borderBottom="1px" borderColor={borderColor} backdropFilter="blur(10px)">
      <Flex h={16} alignItems="center" justifyContent="space-between" maxW="6xl" mx="auto">

      <HStack spacing={4} alignItems="center">
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
          <Flex direction="row" align="center" gap={3}>
            <Image
                src={logoSrc}
                alt="Hop In Logo" 
                height={{ base: "40px", md: "48px" }}
                objectFit="contain"
                width="auto"
                display="block"
                transform="scale(1.8)"
              />
            <Heading size="lg" letterSpacing="tight">
              Hop In
            </Heading>
          </Flex>
        </Link>
      </HStack>

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
