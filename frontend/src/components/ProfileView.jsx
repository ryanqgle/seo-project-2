import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Avatar,
    Box,
    Button,
    Card,
    CardBody,
    Center,
    Heading,
    HStack,
    Spinner,
    Text,
    VStack
} from '@chakra-ui/react'
import { useAuth } from '../auth.jsx'

// The read-only "view your profile" page (shown at "/profile"). It displays the
// signed-in user's photo, name, email, role, and school, plus an "Edit Profile"
// button that takes them to the editable version of the page.
export default function ProfileView() {
    // `token` proves who we are to the backend; `session` holds the logged-in
    // user's basic info (like their email).
    const { token, session } = useAuth()
    const navigate = useNavigate()
    // The user's saved profile details. Starts blank and is filled in once we
    // load it from the backend.
    const [profile, setProfile] = useState({
        first_name: '',
        last_name: '',
        role: '',
        profile_picture: '',
        school: ''
    })
    // True while we're still loading the profile, so we can show a spinner.
    const [loading, setLoading] = useState(true)

    // When the page opens, load the user's profile from the backend.
    useEffect(() => {
        const fetchProfile = async () => {
            if (!token) return

            try {
                const res = await fetch('/api/edit-profile', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                const data = await res.json()

                if (data.status === 'success') {
                    // Merge the loaded details into what we already have.
                    setProfile(prevProfile => ({ ...prevProfile, ...data.profile }))
                }
            } catch (err) {
                console.error('Error fetching profile:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchProfile()
    }, [token])

    if (loading) {
        return (
            <Center mt={20}>
                <Spinner size="xl" color="blue.500" />
            </Center>
        )
    }

    const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ')

    return (
        <Box p={4}>
            <Card maxW="lg" mx="auto" boxShadow="lg" borderRadius="xl">
                <CardBody p={8}>
                    <VStack spacing={5}>
                        <Avatar size="2xl" name={fullName} src={profile.profile_picture || undefined} />

                        <Heading size="lg" textAlign="center" color="gray.700">
                            {fullName || 'Your Profile'}
                        </Heading>

                        <VStack spacing={3} align="stretch" w="full">
                            <ProfileField label="Email" value={session?.user?.email} />
                            <ProfileField label="Role" value={profile.role} />
                            <ProfileField label="School" value={profile.school} />
                        </VStack>

                        <Button
                            colorScheme="blue"
                            size="lg"
                            w="full"
                            mt={4}
                            onClick={() => navigate('/edit-profile')}
                        >
                            Edit Profile
                        </Button>
                    </VStack>
                </CardBody>
            </Card>
        </Box>
    )
}

// A small helper for one labeled row of the profile (e.g. "Email  →  you@x.edu").
// Shows a dash when the value is empty.
function ProfileField({ label, value }) {
    return (
        <HStack justify="space-between" borderBottomWidth="1px" borderColor="gray.100" pb={2}>
            <Text fontSize="sm" fontWeight="bold" color="gray.500">{label}</Text>
            <Text fontSize="sm" color="gray.800">{value || '—'}</Text>
        </HStack>
    )
}
