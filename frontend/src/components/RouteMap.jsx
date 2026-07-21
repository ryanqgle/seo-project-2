import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Box, HStack, Text } from '@chakra-ui/react'

const ORIGIN_COLOR = '#2f855a'
const PICKUP_COLOR = '#2b6cb0'
const DEST_COLOR = '#c53030'

// Escape values before injecting them into a divIcon's raw HTML string (profile
// picture URLs and names come from user data, so treat them as untrusted).
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ))
}

// The stop owner's full name, or '' if unknown.
function personName(stop) {
  return `${stop.first_name || ''} ${stop.last_name || ''}`.trim()
}

// First initials, used as a fallback inside the pin when there's no photo.
function initials(stop) {
  const text = `${(stop.first_name || '')[0] || ''}${(stop.last_name || '')[0] || ''}`
  return text.toUpperCase() || '•'
}

// Small labeled circular marker ("E" for the end). Built with a divIcon so we
// don't depend on Leaflet's image assets here.
function stopIcon(label, bg) {
  return L.divIcon({
    className: '',
    html: `<div style="background:${bg};color:#fff;width:26px;height:26px;border-radius:50%;
      display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;
      border:2px solid #fff;box-shadow:0 0 3px rgba(0,0,0,.45)">${escapeHtml(label)}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -13],
  })
}

// A circular pin showing the stop owner's profile picture. Falls back to the person's initials when there's no picture.
function photoIcon(stop, ring) {
  const src = stop.profile_picture
  const inner = src
    ? `<img src="${escapeHtml(src)}" alt="" style="width:100%;height:100%;object-fit:cover;display:block" />`
    : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;
        background:${ring};color:#fff;font-weight:700;font-size:12px">${escapeHtml(initials(stop))}</div>`
  return L.divIcon({
    className: '',
    html: `<div style="width:36px;height:36px;border-radius:50%;overflow:hidden;background:#fff;
      border:3px solid ${ring};box-shadow:0 0 4px rgba(0,0,0,.5)">${inner}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  })
}

function iconForStop(stop) {
  // Origin (the driver) and pickups (riders) show a face; the destination is a
  // shared endpoint with no single person, so it keeps the "E" marker.
  if (stop.type === 'destination') return stopIcon('E', DEST_COLOR)
  if (stop.type === 'origin') return photoIcon(stop, ORIGIN_COLOR)
  return photoIcon(stop, PICKUP_COLOR)
}

function labelForStop(stop) {
  const name = personName(stop)
  if (stop.type === 'origin') {
    return `${name || 'Driver'} (start)${stop.address ? ` — ${stop.address}` : ''}`
  }
  if (stop.type === 'destination') {
    return `Destination — ${stop.address || 'End'}`
  }
  return `${name || `Pickup ${stop.order}`}${stop.address ? ` — ${stop.address}` : ''}`
}

// Miles read better than meters for US riders; round trip time to minutes/hours.
function formatDistance(meters) {
  if (meters == null) return null
  return `${(meters / 1609.34).toFixed(1)} mi`
}

function formatDuration(seconds) {
  if (seconds == null) return null
  const mins = Math.round(seconds / 60)
  if (mins < 60) return `${mins} min`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

// Zooms/pans the map so the whole route fits, and re-measures after mount so the
// map lays out correctly inside a modal (same fix as the location picker).
function FitRoute({ geometry }) {
  const map = useMap()
  useEffect(() => {
    if (geometry?.length) map.fitBounds(geometry, { padding: [30, 30] })
    const timers = [150, 400, 800].map((ms) => setTimeout(() => map.invalidateSize(), ms))
    return () => timers.forEach(clearTimeout)
  }, [geometry, map])
  return null
}

// Draws a computed trip route: the road-following polyline plus labeled markers
// for the start, each pickup (numbered in order), and the destination. Shows the
// total distance and drive time above the map.
//
// Props:
//   stops — [{ type: 'origin'|'pickup'|'destination', lat, lng, address, order? }]
//   geometry — [[lat, lng], ...] road geometry from the backend/ORS
//   distanceMeters, durationSeconds — route totals
//   height — map height in px (default 360)
function RouteMap({ stops = [], geometry = [], distanceMeters, durationSeconds, height = 360 }) {
  // Initial center only; FitRoute immediately reframes to the whole route, so
  // MapContainer's one-time read of this value is all that matters.
  const center = geometry[0] || (stops[0] ? [stops[0].lat, stops[0].lng] : [29.7174, -95.4018])
  const distance = formatDistance(distanceMeters)
  const duration = formatDuration(durationSeconds)
  const pickupCount = stops.filter((s) => s.type === 'pickup').length

  return (
    <Box>
      <HStack spacing={3} mb={3} fontSize="sm" color="gray.700" flexWrap="wrap">
        {distance && <Text fontWeight="bold">{distance}</Text>}
        {duration && (
          <>
            <Text color="gray.400">•</Text>
            <Text fontWeight="bold">{duration}</Text>
          </>
        )}
        <Text color="gray.400">•</Text>
        <Text>{pickupCount} pickup{pickupCount === 1 ? '' : 's'}</Text>
      </HStack>

      <Box borderRadius="md" overflow="hidden" border="1px solid" borderColor="gray.200">
        <MapContainer center={center} zoom={13} style={{ height, width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <FitRoute geometry={geometry} />
          {geometry.length > 1 && (
            <Polyline positions={geometry} color={PICKUP_COLOR} weight={5} opacity={0.8} />
          )}
          {stops.map((stop, i) => (
            <Marker key={i} position={[stop.lat, stop.lng]} icon={iconForStop(stop)}>
              <Popup>{labelForStop(stop)}</Popup>
            </Marker>
          ))}
        </MapContainer>
      </Box>
    </Box>
  )
}

export default RouteMap
