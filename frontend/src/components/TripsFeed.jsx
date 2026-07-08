import { useState, useEffect } from 'react'
import '../css/tripsFeed.css'

function formatDeparture(value) {
  if (!value) return 'Time TBD'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function TripsFeed() {
  const [trips, setTrips] = useState([])
  const [status, setStatus] = useState('loading') // 'loading' | 'error' | 'ready'

  useEffect(() => {
    let active = true

    fetch('/api/trips')
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (!active) return
        setTrips(Array.isArray(data) ? data : [])
        setStatus('ready')
      })
      .catch(() => {
        if (active) setStatus('error')
      })

    return () => {
      active = false
    }
  }, [])

  return (
    <main className="feed">
      <h1>Trips</h1>

      {status === 'loading' && <p className="feed__note">Loading trips…</p>}

      {status === 'error' && (
        <p className="feed__note">
          Couldn&apos;t load trips.
        </p>
      )}

      {status === 'ready' && trips.length === 0 && (
        <p className="feed__note">No trips posted yet.</p>
      )}

      {status === 'ready' && trips.length > 0 && (
        <ul className="feed__list">
          {trips.map((trip) => (
            <li key={trip.id} className="trip-card">
              <div className="trip-card__head">
                <h2>{trip.title}</h2>
                <span className="trip-card__cost">
                  {trip.cost ? `$${trip.cost}` : 'Free'}
                </span>
              </div>
              <p className="trip-card__dest">→ {trip.destination}</p>
              <p className="trip-card__meta">
                {formatDeparture(trip.departure_time)} · {trip.available_seats}{' '}
                seat{trip.available_seats === 1 ? '' : 's'}
                {trip.category ? ` · ${trip.category}` : ''}
              </p>
              {trip.description && (
                <p className="trip-card__desc">{trip.description}</p>
              )}
              {/* TO DO: Displays request sent msg and have it send a request to the user thru backend */}
              <button className="trip-card__join" type="button">
                Join Trip
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

export default TripsFeed
