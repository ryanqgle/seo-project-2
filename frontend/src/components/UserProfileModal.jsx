import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton,
    ModalBody, Avatar, Heading, Badge, Text, VStack
} from '@chakra-ui/react'

export default function UserProfileModal({ isOpen, onClose, user }) {
    if (!user) return null

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered size="sm">
            <ModalOverlay backdropFilter="blur(3px)" />
            <ModalContent borderRadius="2xl" pb={6}>
                <ModalHeader textAlign="center" borderBottom="none"></ModalHeader>
                <ModalCloseButton />
                <ModalBody display="flex" flexDir="column" alignItems="center">
                    <Avatar size="2xl" name={`${user.first_name || ''} ${user.last_name || ''}`} src={user.profile_picture} mb={4} boxShadow="md" />
                    <Heading size="md" mb={2} color="gray.800">{user.first_name || 'Unknown'} {user.last_name || ''}</Heading>
                    {user.role && <Badge colorScheme={user.role === 'driver' ? 'green' : 'blue'} mb={2} px={3} py={1} borderRadius="full">{user.role.toUpperCase()}</Badge>}
                    {user.school && <Text color="gray.500" fontSize="sm" fontWeight="medium">{user.school}</Text>}
                </ModalBody>
            </ModalContent>
        </Modal>
    )
}