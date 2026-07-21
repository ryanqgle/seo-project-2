import { useEffect, useState } from 'react'
import { Navigate, Link as RouterLink } from 'react-router-dom'
import {apiUrl} from '../api'
import {
  Box,
  Button,
  Card,
  CardBody,
  Heading,
  Text,
  VStack,
  Spinner,
  Icon,
} from '@chakra-ui/react'
import { CheckCircleIcon, WarningIcon } from '@chakra-ui/icons'
import { apiUrl } from '../api'

const PaymentReturn = () => {
  const [status, setStatus] = useState(null)
  const [customerEmail, setCustomerEmail] = useState('')

  useEffect(() => {
    const queryString = window.location.search
    const urlParams = new URLSearchParams(queryString)
    const sessionId = urlParams.get('session_id')

    if (!sessionId) {
      setStatus('error')
      return
    }

    fetch(apiUrl(`/api/session_status?session_id=${sessionId}`))
      .then((res) => res.json())
      .then((data) => {
        setStatus(data.status)
        setCustomerEmail(data.customer_email || '')
      })
      .catch(() => {
        setStatus('error')
      })
  }, [])

  if (status === 'open') {
    return <Navigate to="/dashboard" />
  }

  if (!status) {
    return (
      <CenterCard>
        <Spinner size="xl" color="blue.500" />
        <Heading size="md">Confirming your payment...</Heading>
        <Text color="gray.500">This should only take a moment.</Text>
      </CenterCard>
    )
  }

  if (status === 'complete') {
    return (
      <CenterCard>
        <Icon as={CheckCircleIcon} boxSize={14} color="green.400" />
        <Heading size="lg">Payment successful!</Heading>
        <Text color="gray.600" textAlign="center">
          Your ride is confirmed. You can now access the trip chat and coordinate with your driver
        </Text>

        {customerEmail && (
          <Text fontSize="sm" color="gray.500">
            Receipt sent to {customerEmail}
          </Text>
        )}

        <Button as={RouterLink} to="/dashboard" colorScheme="blue" size="lg">
          Back to Dashboard
        </Button>
      </CenterCard>
    )
  }

  return (
    <CenterCard>
      <Icon as={WarningIcon} boxSize={12} color="orange.400" />
      <Heading size="lg">Payment could not be confirmed</Heading>
      <Text color="gray.600" textAlign="center">
        Please return to your dashboard and try again. If you were charged, contact support
      </Text>
      <Button as={RouterLink} to="/dashboard" colorScheme="blue" size="lg">
        Back to Dashboard
      </Button>
    </CenterCard>
  )
}

const CenterCard = ({ children }) => {
  return (
    <Box minH="70vh" display="flex" alignItems="center" justifyContent="center" px={4}>
      <Card maxW="lg" w="full" boxShadow="lg" borderRadius="2xl">
        <CardBody>
          <VStack spacing={5} py={8}>
            {children}
          </VStack>
        </CardBody>
      </Card>
    </Box>
  )
}

export default PaymentReturn