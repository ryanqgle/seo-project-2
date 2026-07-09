import { useState, useEffect } from 'react'
import { supabase } from '../dbConnection'
import {
    Box,
    Button,
    FormControl,
    FormLabel,
    Input,
    Select,
    Spinner,
    VStack,
    Card,
    CardBody,
    Center,
    Heading
} from '@chakra-ui/react'
import { useAuth } from '../auth.jsx'
import { useNavigate } from 'react-router-dom'

export default function UserProfile() {
    const { token } = useAuth()
    const navigate = useNavigate()
    const [profile, setProfile] = useState({
        first_name: '',
        last_name: '',
        role: '',
        profile_picture: ''
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        const fetchProfile = async () => {
            if (!token) return

            try {
                const res = await fetch('/api/edit-profile', {
                  headers: { 'Authorization': `Bearer ${token}` }
                })
                const data = await res.json()

                if (data.status === 'success') {
                    setProfile(prevProfile => ({...prevProfile, ...data.profile }))
                }
            } catch (err) {
                console.error('Error fetching profile:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchProfile()
    }, [token])

    const handleSave = async (e) => {
        e.preventDefault()
        setSaving(true)

        try {
            const res = await fetch('/api/edit-profile', {
             method: 'PUT',
             headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
             },
             body: JSON.stringify(profile)
            });
            const data = await res.json()

            if (data.status === 'success') {
                alert('Profile updated successfully!')
                setProfile(data.profile)
                navigate('/profile')
            }
        } catch (err) {
            console.error('Error updating profile:', err)
        } finally {
            setSaving(false)
        }
    }

    const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    if (loading) {
        return (
            <Center mt={20}>
                <Spinner size="xl" color="blue.500" />
            </Center>
        )
    }

    return (
    <Box p={4}>
        <Card maxW="lg" mx="auto" boxShadow="lg" borderRadius="xl">
            <CardBody p={8}>
                <Heading size="lg" mb={6} textAlign="center" color="gray.700">
                    Edit Profile
                </Heading>
                 <form onSubmit={handleSave}>
                    <VStack spacing={5}>
                            
                        <FormControl isRequired>
                            <FormLabel fontSize="sm" fontWeight="bold">First Name</FormLabel>
                            <Input
                                    size="md"
                                    name="first_name"
                                    type="text"
                                    value={profile.first_name || ''}
                                    onChange={handleChange}
                                />
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel fontSize="sm" fontWeight="bold">Last Name</FormLabel>
                            <Input
                                    size="md"
                                    name="last_name"
                                    type="text"
                                    value={profile.last_name || ''}
                                    onChange={handleChange}
                                />
                        </FormControl>

                        <FormControl isRequired>
                                <FormLabel fontSize="sm" fontWeight="bold">Role</FormLabel>
                                <Select
                                    size="md"
                                    name="role"
                                    value={profile.role || ''}
                                    onChange={handleChange}
                                >
                                    <option value="">Select a role</option>
                                    <option value="driver">Driver</option>
                                    <option value="passenger">Passenger</option>
                                </Select>
                            </FormControl>

                            <FormControl>
                                <FormLabel fontSize="sm" fontWeight="bold">Profile Picture URL</FormLabel>
                                <Input
                                    size="md"
                                    name="profile_picture"
                                    type="url"
                                    value={profile.profile_picture || ''}
                                    onChange={handleChange}
                                />
                            </FormControl>

                            <FormControl>
                                <FormLabel fontSize="sm" fontWeight="bold">School (Auto-Verified)</FormLabel>
                                <Input
                                    size="md"
                                    name="school"
                                    type="text"
                                    value={profile.school || 'Verified on Save'}
                                    isReadOnly 
                                    variant="filled" 
                                />
                            </FormControl>

                            <Button
                                type="submit" 
                                colorScheme="blue" 
                                size="lg" 
                                w="full" 
                                mt={4} 
                                isLoading={saving} 
                                loadingText="Saving..."
                            >
                                Save Changes
                            </Button>
                    </VStack>
                </form>
            </CardBody>
        </Card>

    </Box>
    )
}
