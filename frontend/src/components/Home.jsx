import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
} from "@chakra-ui/react";
import { SearchIcon, AddIcon, ChatIcon } from "@chakra-ui/icons";
import { useAuth } from "../auth.jsx";
import { apiUrl } from "../api";
import InteractiveDemo from './InteractiveDemo.jsx'

export default function Home({ onLogin }) {
  const navigate = useNavigate();
  const toast = useToast();
  const { token } = useAuth();
  const [role, setRole] = useState(null);
  const logoSrc = useColorModeValue("/logo-black.PNG", "/logo-white.PNG");
  const imageBg = useColorModeValue("white", "gray.800");
  const mutedText = useColorModeValue("gray.600", "gray.300");
  const iconColor = useColorModeValue("black", "white");
  const demoBg = useColorModeValue("gray.50", "gray.900")
  const demoCardBg = useColorModeValue("white", "gray.800")

  // After a logged-out user picks a button we stash where they wanted to go,
  // open the login modal, and let them sign in / sign up (Google/Microsoft
  // OAuth redirects the browser back to the home page). Once they're logged in
  // we send them on to that saved destination.
  useEffect(() => {
    if (!token) return;

    const dest = sessionStorage.getItem("postLoginRedirect");
    if (dest) {
      sessionStorage.removeItem("postLoginRedirect");
      navigate(dest);
    }
  }, [token, navigate]);

  useEffect(() => {
    if (!token) return;

    fetch(apiUrl("/api/edit-profile"), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.status === "success") {
          setRole(data.profile?.role);
        }
      })
      .catch((err) => console.error("Failed to load role:", err));
  }, [token]);

  // Remember where the user was trying to go, then open the login modal. The
  // redirect effect above finishes the trip once they're signed in.
  const requireAuth = (dest) => {
    sessionStorage.setItem("postLoginRedirect", dest);
    onLogin?.();
  };

  const handleFindRide = () => {
    if (!token) {
      requireAuth("/dashboard");
      return;
    }

    if (role === "driver") {
      toast({
        title: "Switch to rider first.",
        description:
          "Go to your profile and change your role to rider before finding rides",
        status: "warning",
        duration: 4000,
        isClosable: true,
      });
      navigate("/profile");
      return;
    }

    navigate("/dashboard");
  };

  const handleOfferRide = () => {
    if (!token) {
      requireAuth("/create-ride");
      return;
    }

    if (role !== "driver") {
      toast({
        title: "Switch to driver first.",
        description:
          "Go to your profile and change your role to driver before offering a ride",
        status: "warning",
        duration: 4000,
        isClosable: true,
      });
      navigate("/profile");
      return;
    }

    navigate("/create-ride");
  };

  const handleViewActivity = () => {
    if (!token) {
      requireAuth("/dashboard");
      return;
    }

    navigate("/dashboard");
  };

  return (
    <Box>
      <Box
        maxW="7xl"
        mx="auto"
        px={{ base: 5, md: 16 }}
        py={{ base: 10, md: 16 }}
      >
        <Flex
          align="center"
          justify="space-between"
          gap={{ base: 10, md: 16 }}
          direction={{ base: "column", lg: "row" }}
        >
          <Box flex="1" w="full" textAlign="left">
            <Text fontWeight="bold" color={mutedText} mb={4}>
              Share rides with students near you
            </Text>

            <Heading
              fontSize={{ base: "4xl", md: "6xl" }}
              lineHeight="1.05"
              mb={5}
            >
              Hop In
            </Heading>

            <Text fontSize="lg" color={mutedText} maxW="480px" mb={8}>
              Share rides with fellow students. Save money, reduce traffic, and
              get there together
            </Text>

            <Card maxW="520px" borderRadius="2xl">
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <HStack spacing={3} flexWrap="wrap">
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

                    <Button
                      variant="ghost"
                      borderRadius="lg"
                      bg={useColorModeValue('purple.50', 'purple.900')}
                      color={useColorModeValue('purple.700', 'purple.100')}
                      _hover={{
                        bg: useColorModeValue('purple.100', 'purple.800'),
                      }}
                      onClick={() => {
                        document.getElementById('demo-section')?.scrollIntoView({ behavior: 'smooth' })
                      }}
                    >
                      Try Demo
                    </Button>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          </Box>

          <Box
            flex="1"
            display="flex"
            justifyContent="center"
            alignItems="center"
          >
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
                maxH={{ base: "180px", md: "300px" }}
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
                <Button
                  size="sm"
                  variant="ghost"
                  borderRadius="full"
                  bg={useColorModeValue('purple.50', 'purple.900')}
                  color={useColorModeValue('purple.700', 'purple.100')}
                  _hover={{
                    bg: useColorModeValue('purple.100', 'purple.800'),
                  }}
                  onClick={handleFindRide}
                >
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
                <Button
                  size="sm"
                  variant="ghost"
                  borderRadius="full"
                  bg={useColorModeValue('purple.50', 'purple.900')}
                  color={useColorModeValue('purple.700', 'purple.100')}
                  _hover={{
                    bg: useColorModeValue('purple.100', 'purple.800'),
                  }}
                  onClick={handleOfferRide}
                >
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
                  <Button
                    size="sm"
                    variant="ghost"
                    borderRadius="full"
                    bg={useColorModeValue('purple.50', 'purple.900')}
                    color={useColorModeValue('purple.700', 'purple.100')}
                    _hover={{
                      bg: useColorModeValue('purple.100', 'purple.800'),
                    }}
                    onClick={handleViewActivity}
                  >
                    Find rides
                  </Button>
              </CardBody>
            </Card>
          </SimpleGrid>
        </Box>
      </Box>

      <Box id="demo-section" py={{ base: 8, md: 10 }} bg={demoBg}>
        <Box maxW="7xl" mx="auto" px={{ base: 5, md: 8 }}>
          <Box textAlign="center" mb={8}>

            <Heading size="xl" mb={3}>
              Try Hop In before signing up
            </Heading>

            <Text color={mutedText} maxW="620px" mx="auto">
              Explore a quick demo of finding rides, offering seats, and coordinating with other students
            </Text>
          </Box>

          <Card bg={demoCardBg} borderRadius="2xl" maxW="800px" mx="auto">
            <CardBody p ={{ base: 3, md: 4}}>
              <InteractiveDemo compact />
            </CardBody>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
