import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../dbConnection'
import { useAuth } from '../auth'
import { apiUrl } from '../api'
import {
    Box, Flex, VStack, Text, Input, IconButton, Avatar,
    AvatarGroup, Tooltip, useDisclosure, Modal, ModalOverlay,
    ModalContent, ModalHeader, ModalCloseButton, ModalBody, Heading, Badge
} from '@chakra-ui/react'
import { ArrowUpIcon } from '@chakra-ui/icons'

{/*
 A real time chat component for a specific trip. It handles fetching message history,
 subscribing to live database updates via Supabase, and sending new messages.
 */}

function TripChat({tripId, currUserId}){
    const { token } = useAuth()
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState("")
    const [tripTitle, setTripTitle] = useState("Loading...")

    const messagesEndRef = useRef(null) // used to auto scroll the chat view to the bottom when new messages arrive
    const { isOpen, onOpen, onClose } = useDisclosure()
    const [selectedUser, setSelectedUser] = useState(null)

    // fetch initial data and set up the real time websocket listener
    useEffect(() => {
        if (!token) return

        // grab the title of the trip for the chat header
        const fetchTripTitle = async () => {
            const { data, error } = await supabase
                .from('trips')
                .select('title')
                .eq('id', tripId)
                .single()
            
            if (data && !error) setTripTitle(data.title)
        }
        fetchTripTitle()

        // fetch all prev chat history
        fetch(apiUrl(`/api/trips/${tripId}/messages`), {
            headers: {'Authorization': `Bearer ${token}`}
        })
            .then(res => res.json())
            .then(data => setMessages(data))

        // instantly appends to messages array without refreshing when new rows are added to trip_messages
        const chatChannel = supabase.channel(`chat_${tripId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'trip_messages',
                    filter: `trip_id=eq.${tripId}`
                },
                (payload) => {
                    //fetch user data for incoming msg
                    const { data: userData } = supabase
                        .from('users')
                        .select('first_name, last_name, profile_picture, role, school')
                        .eq('id', payload.new.user_id)
                        .single()

                    const newMessage = {
                         ...payload.new,
                        users: userData || null
                    }

                    setMessages((prev) => [...prev, newMessage])
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(chatChannel) // removes listener when chat is closed
        }
    }, [tripId, token])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    const participants = messages.reduce((acc, msg) => {
        if (msg.users && !acc.find(u => u.id === msg.user_id)) {
            acc.push({ id: msg.user_id, ...msg.users })
        }
        return acc
    }, [])

    // format timestamp for individual messages
    const formatTime = (dateString) => {
        if (!dateString) return ''
        return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    // checks if two dates fall on the same calendar day
    const isSameDay = (date1, date2) => {
        if (!date1 || !date2) return false
        const d1 = new Date(date1)
        const d2 = new Date(date2)
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate()
    }

    // generates text for date divider
    const formatDateDivider = (dateString) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        if (isSameDay(date, today)) return 'Today'
        if (isSameDay(date, yesterday)) return 'Yesterday'
        
        return date.toLocaleDateString(undefined, { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
        })
    }

    const handleAvatarClick = (user) => {
        setSelectedUser(user)
        onOpen()
    }

    const handleSendMessage = async (e) => {
        e.preventDefault()

        const response = await fetch(apiUrl(`/api/trips/${tripId}/messages`), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({text: newMessage})
        })

    setNewMessage('')
    }

    return(
    <Flex direction="column" h="full" bg="white">
            
            {/* participants*/}
            <Flex align="center" justify="space-between" pl={4} pr={12} borderBottom="1px solid" borderColor="gray.100" bg="gray.50">
                <Heading size="sm" color="gray.800" isTruncated maxW="70%">
                    {tripTitle}
                </Heading>

                <AvatarGroup size="sm" max={4} spacing="-0.5rem">
                    {participants.map((user) => (
                        <Tooltip key={user.id} label={`${user.first_name} ${user.last_name || ''}`} placement="bottom">
                            <Avatar 
                                name={`${user.first_name} ${user.last_name || ''}`} 
                                src={user.profile_picture} 
                                cursor="pointer"
                                onClick={() => handleAvatarClick(user)}
                                _hover={{ transform: 'scale(1.1)', zIndex: 10 }}
                                transition="all 0.2s"
                                border="2px solid white"
                            />
                        </Tooltip>
                    ))}
                </AvatarGroup>
            </Flex>

            {/* chat messages*/}
            <Box flex="1" overflowY="auto" p={4} bg="white">
                <VStack spacing={4} align="stretch">
                    {messages.length === 0 && (
                        <Text textAlign="center" color="gray.400" fontSize="sm" mt={4}>
                            This is the beginning of your journey!
                        </Text>
                    )}

                    {messages.map((msg, index) => {
                        const isMe = msg.user_id === currUserId

                        const sender = msg.users || participants.find(p => p.id === msg.user_id) || {}

                        const showDateDivider = index === 0 || !isSameDay(msg.created_at, messages[index - 1].created_at)

                        return (
                            <React.Fragment key={msg.id || index}>

                                {showDateDivider && (
                                    <Flex justify="center" my={3}>
                                        <Badge 
                                            borderRadius="full" 
                                            px={3} py={1} 
                                            textTransform="none" 
                                            bg="gray.100" 
                                            color="gray.500" 
                                            fontSize="xs"
                                        >
                                            {formatDateDivider(msg.created_at)}
                                        </Badge>
                                    </Flex>
                                )}
                            <Flex key={msg.id || index} w="full" justify={isMe ? "flex-end" : "flex-start"}>
                                {!isMe && (
                                    <Avatar
                                        size="sm" 
                                        name={`${sender.first_name || ''} ${sender.last_name || ''}`}
                                        src={sender.profile_picture}
                                        mr={2} 
                                        alignSelf="flex-end"
                                        cursor="pointer"
                                        onClick={() => handleAvatarClick(sender)}
                                    />
                                )}
                                
                                <Box maxW="75%">
                                    {!isMe && (
                                        <Text fontSize="xs" color="gray.500" mb={1} ml={1}>
                                            {sender.first_name || 'Someone'}
                                        </Text>
                                    )}
                                    
                                    <Box 
                                        bg={isMe ? "blue.500" : "gray.100"}
                                        color={isMe ? "white" : "gray.800"} 
                                        px={4} 
                                        py={2} 
                                        borderRadius="2xl"
                                        borderBottomRightRadius={isMe ? "sm" : "2xl"}
                                        borderBottomLeftRadius={!isMe ? "sm" : "2xl"}
                                        boxShadow="sm"
                                    >
                                        <Text fontSize="md">{msg.text}</Text>
                                    </Box>
                                    
                                    <Text 
                                        fontSize="2xs" 
                                        color="gray.400" 
                                        textAlign={isMe ? "right" : "left"} 
                                        mt={1}
                                        mr={isMe ? 1 : 0}
                                        ml={!isMe ? 1 : 0}
                                    >
                                        {formatTime(msg.created_at)}
                                    </Text>
                                </Box>
                            </Flex>
                        </React.Fragment>
                        )
                    })}
                    {/* for auto scroll to the bottom */}
                    <div ref={messagesEndRef} />
                </VStack>
            </Box>

            {/* message input box */}
            <Box p={3} borderTop="1px solid" borderColor="gray.100" bg="white">
                <form onSubmit={handleSendMessage}>
                    <Flex gap={2}>
                        <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            borderRadius="full"
                            bg="gray.50"
                            border="none"
                            _focus={{ bg: "gray.100", boxShadow: "none" }}
                        />
                        <IconButton
                            type="submit"
                            icon={<ArrowUpIcon />}
                            colorScheme="blue"
                            isRound
                            aria-label="Send Message"
                            isDisabled={!newMessage.trim()}
                        />
                    </Flex>
                </form>
            </Box>

            {/* participant pop up */}
            <Modal isOpen={isOpen} onClose={onClose} isCentered size="xs">
                <ModalContent borderRadius="2xl" pb={6}>
                    <ModalHeader textAlign="center" borderBottom="none"></ModalHeader>
                    <ModalCloseButton />
                    <ModalBody display="flex" flexDir="column" alignItems="center">
                        <Avatar 
                            size="2xl" 
                            name={`${selectedUser?.first_name || ''} ${selectedUser?.last_name || ''}`} 
                            src={selectedUser?.profile_picture} 
                            mb={4}
                            boxShadow="md"
                        />
                        <Heading size="md" mb={2} color="gray.800">
                            {selectedUser?.first_name || 'Unknown'} {selectedUser?.last_name || ''}
                        </Heading>

                        {selectedUser?.role && (
                            <Badge colorScheme={selectedUser.role === 'driver' ? 'green' : 'blue'} mb={2} px={3} py={1} borderRadius="full">
                                {selectedUser.role.toUpperCase()}
                            </Badge>
                        )}

                        {selectedUser?.school && (
                            <Text color="gray.500" fontSize="sm" fontWeight="medium">
                                {selectedUser.school}
                            </Text>
                        )}
                    </ModalBody>
                </ModalContent>
            </Modal>

        </Flex>
  )
}

export default TripChat