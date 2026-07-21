import { useState, useEffect } from 'react'
import {
    Container,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    Spinner,
    Center
} from '@chakra-ui/react'
import { useAuth } from '../auth.jsx'
import { apiUrl } from '../api'
import TripsFeed from './TripsFeed.jsx'
import DriverRequests from './DriverRequests.jsx'
import RiderActivity from './RiderActivity.jsx'

{/*
    - Fetches the current user's profile to determine their role (driver vs rider)
    - Manages the Available Trips vs Activity tab navigation
    - Dynamically renders the correct dashboard component (DriverRequests vs RiderActivity)
      based on the user's assigned role
 */}

export default function Dashboard() {
    const { token } = useAuth()
    const [role, setRole] = useState(null)
    const [loading, setLoading] = useState(true)

    // fetch user's role
    useEffect(() => {
        if (!token) return

        fetch(apiUrl('/api/edit-profile'), {
            headers: { 'Authorization': `Bearer ${token}` },
            })
            .then((res) => res.json())
            .then((data) => {
                if (data?.status === 'success') setRole(data.profile?.role)
                setLoading(false)
            })
    }, [token])

    if (loading) {
        return <Center mt={20}><Spinner size="xl" /></Center>
    }

    return (
        <Container maxW={{base:"full", ld:"5xl"}} flex="1" minH="0" p={{base:0, md:4}} display="flex" flexDir="column">
            <Tabs isFitted={{base: true, md: false}} display="flex" flexDir="column" flex="1">
                <TabList>
                    <Tab fontWeight="bold">Available Trips</Tab>
                    <Tab fontWeight="bold">Activity</Tab>
                </TabList>

                <TabPanels flex="1" overflowY="auto">
                    <TabPanel p={0}>
                        <TripsFeed />
                    </TabPanel>

                    <TabPanel p={0}>
                        {role === 'driver' ? (
                             <DriverRequests />
                        ) : (
                            <RiderActivity />
                        )}
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </Container>
    )
}