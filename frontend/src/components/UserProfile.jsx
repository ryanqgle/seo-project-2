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

// The "edit your profile" page (shown at "/edit-profile"). It loads the user's
// current details into a form, lets them change their name, role, and profile
// picture, and saves the changes back to the backend. The school field is filled
// in automatically from the user's email and can't be edited here.
export default function UserProfile() {
    // `token` proves who we are to the backend on every request.
    const { token } = useAuth()
    const navigate = useNavigate()
    // The form's current values.
    const [profile, setProfile] = useState({
        first_name: '',
        last_name: '',
        role: '',
        profile_picture: ''
    })
    // True while first loading the profile (shows a spinner).
    const [loading, setLoading] = useState(true)
    // True while a save is in progress (shows the button's loading state).
    const [saving, setSaving] = useState(false)

    // When the page opens, load the user's existing profile so the form starts
    // pre-filled with their current details instead of being blank.
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

    // Saves the form. Sends the updated details to the backend, and on success
    // shows a confirmation and returns the user to their profile page.
    const handleSave = async (e) => {
        e.preventDefault()  // stop the browser from reloading the page on submit
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
                setProfile(prevProfile => ({...prevProfile, ...data.profile }))
                navigate('/profile')
            }
        } catch (err) {
            console.error('Error updating profile:', err)
        } finally {
            setSaving(false)
        }
    }

    // Keeps the form in sync as the user types. Each input's `name` matches a
    // field in `profile`, so this updates just the field that changed.
    const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    if (loading) {
        return (
            <Center mt={20}>
                <Spinner size="xl" color="blue.500"  />
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
