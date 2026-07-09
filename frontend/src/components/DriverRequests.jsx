import { useState, useEffect } from 'react'
import { supabase } from '../dbConnection'

function DriverRequests() {
  const [trips, setTrips] = useState([])
  const [requestsByTrip, setRequestsByTrip] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const { data: { session } } = supabase.auth.getSession()
    if (!session) return

    const loadRequests = async () => {
      try {
        const profileRes = await fetch('http://127.0.0.1:5001/api/profile', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        })
        const profileData = await profileRes.json()
        const myId = profileData.profile.id

        const tripsRes = await fetch('/api/trips')
        const allTrips = await tripsRes.json()
        const myTrips = allTrips.filter((trip) => trip.driver_id === myId)
        setTrips(myTrips)

        const requests = {}
        for (const trip of myTrips) {
          const res = await fetch(`http://127.0.0.1:5001/api/trips/${trip.id}/requests`)
          requests[trip.id] = await res.json()
        }
        setRequestsByTrip(requests)
      } catch (err) {
        console.error('Error loading requests:', err)
      } finally {
        setLoading(false)
      }
    }

    loadRequests()
  }, [])

  const handleDecision = async (tripId, requestId, status) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    try {
      const res = await fetch(`http://127.0.0.1:5001/api/trips/${tripId}/requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      })
      const updated = await res.json()

      setRequestsByTrip((prev) => ({
        ...prev,
        [tripId]: prev[tripId].map((r) => (r.id === updated.id ? updated : r))
      }))
    } catch (err) {
      console.error('Error updating request:', err)
    }
  }

  if (loading) return <p>Loading requests...</p>

  return (
    <>
      <h2>Requests for your trips</h2>
      {trips.length === 0 && <p>You don't have any open trips right now.</p>}
      {trips.map((trip) => (
        <div key={trip.id}>
          <h3>{trip.title} — {trip.destination}</h3>
          {(requestsByTrip[trip.id] || []).length === 0 && <p>No requests yet.</p>}
          {(requestsByTrip[trip.id] || []).map((request) => (
            <div key={request.id}>
              <span>{request.users?.first_name} {request.users?.last_name} — {request.status}</span>
              {request.status === 'pending' && (
                <>
                  <button type="button" onClick={() => handleDecision(trip.id, request.id, 'accepted')}>Accept</button>
                  <button type="button" onClick={() => handleDecision(trip.id, request.id, 'declined')}>Decline</button>
                </>
              )}
            </div>
          ))}
        </div>
      ))}
    </>
  )
}

export default DriverRequests
