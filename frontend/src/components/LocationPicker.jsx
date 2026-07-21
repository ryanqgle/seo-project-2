import { useCallback, useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  Box,
  Button,
  HStack,
  Input,
  InputGroup,
  InputRightElement,
  List,
  ListItem,
  Spinner,
  Text,
} from '@chakra-ui/react'

// Leaflet imports its marker icons as image files whose paths it guesses at
// runtime, which fails and renders the icon as broken on Vite.
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

const PIN_ICON = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

// Default map center when the picker opens with no prior location. Rice
// University — a reasonable neutral starting view; the pin is what matters.
const DEFAULT_CENTER = [40.7589, -73.9851]

// Searches are restricted to roughly this many miles around the current map
// center, so results stay local while still
// reaching places just outside the visible map.
const SEARCH_RADIUS_MILES = 50

// Listens for clicks on the map and reports where the user tapped, so a click
// anywhere drops (or moves) the pin.
function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

// Programmatically re-centers the map when `target` changes. react-leaflet only
// reads the map's center once at open, so this is how we move the view after a
// search or the "use my current location" button (those spots may be
// off-screen). It deliberately does NOT work on plain clicks/drags, so the map
// doesn't fight the user while they adjust the pin.
function Recenter({ target }) {
  const map = useMap()
  useEffect(() => {
    if (target) map.setView(target, Math.max(map.getZoom(), 15))
  }, [target, map])
  return null
}

// A reusable map with a single draggable pin. Used for every location the app
// collects (origin, destination, pickups).
//
// The pin can be set four ways: searching for a place/address, clicking the
// map, dragging the pin, or the "use my location" button. However it's set, the
// coordinates are paired with a readable address
// label (from the search result, or reverse-geocoded for clicks/drags).
//
// Parameters:
//   initialValue { lat, lng, address } — where to place the pin on open (setting is optional)
//   onChange(value) — called with { lat, lng, address } every time the pin moves
//   height — map height in px (default 300)
function LocationPicker({ initialValue = null, onChange, height = 300 }) {
  const hasInitial = initialValue && initialValue.lat != null
  // The pin's current position (null until the user drops pin).
  const [pos, setPos] = useState(hasInitial ? { lat: initialValue.lat, lng: initialValue.lng } : null)
  // The human-readable label for the pin, filled by reverse-geocoding.
  const [address, setAddress] = useState(initialValue?.address || '')
  // True while a reverse-geocode request is in progress.
  const [loading, setLoading] = useState(false)
  // Where to re-center the map next (set by search / location button / initial value).
  const [recenterTarget, setRecenterTarget] = useState(hasInitial ? [initialValue.lat, initialValue.lng] : null)
  const [geoError, setGeoError] = useState('')

  // Search box state: the current query text, the dropdown results, and whether
  // a search request is in progress.
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  // True when a completed search found nothing within the radius (drives the
  // "no places found nearby" hint).
  const [noMatches, setNoMatches] = useState(false)

  // The live Leaflet map instance, used to bias searches toward the current view.
  const mapRef = useRef(null)
  // Pending debounce timers so rapid typing / dragging doesn't spam Nominatim.
  const reverseDebounce = useRef(null)
  const searchDebounce = useRef(null)

  // When the picker sits inside a modal, Leaflet
  // measures the map before the container reaches its final size, leaving gray
  // or misaligned tiles. Re-measure a few times after mount to fix the layout.
  // Harmless when not in a modal.
  useEffect(() => {
    const timers = [150, 400, 800].map((ms) =>
      setTimeout(() => mapRef.current?.invalidateSize(), ms)
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  // Turn coordinates into a readable address via Nominatim's reverse endpoint.
  // Debounced (~500ms) to respect Nominatim's ~1 req/sec policy while dragging.
  // Falls back to showing the raw coordinates if the lookup fails or is empty.
  const reverseGeocode = useCallback(
    (lat, lng) => {
      setLoading(true)
      clearTimeout(reverseDebounce.current)
      reverseDebounce.current = setTimeout(async () => {
        let label
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
          )
          const data = res.ok ? await res.json() : null
          label = data?.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`
        } catch {
          label = `${lat.toFixed(5)}, ${lng.toFixed(5)}`
        }
        setAddress(label)
        onChange?.({ lat, lng, address: label })
        setLoading(false)
      }, 500)
    },
    [onChange]
  )

  // Move the pin to a new spot and detect it. If we already know the address
  // (e.g. from a search result) we use it directly; otherwise the pin's
  // coordinates are the location:
  const handlePick = useCallback(
    (lat, lng, knownAddress = null) => {
      setPos({ lat, lng })
      if (knownAddress != null) {
        setAddress(knownAddress)
        onChange?.({ lat, lng, address: knownAddress })
      } else {
        const coordLabel = `${lat.toFixed(5)}, ${lng.toFixed(5)}`
        setAddress(coordLabel)
        onChange?.({ lat, lng, address: coordLabel })
        reverseGeocode(lat, lng)
      }
    },
    [onChange, reverseGeocode]
  )

  // Search for a place or address (forward geocoding). Biases results
  // toward whatever the map is currently showing by passing its bounds as a
  // `viewbox`, so a generic query like "Target" surfaces nearby matches first.
  const runSearch = useCallback((q) => {
    clearTimeout(searchDebounce.current)
    if (!q.trim()) {
      setResults([])
      setSearching(false)
      setNoMatches(false)
      return
    }
    searchDebounce.current = setTimeout(async () => {
      setSearching(true)
      setNoMatches(false)
      try {
        const params = new URLSearchParams({ format: 'jsonv2', q, limit: '5' })
        const map = mapRef.current
        if (map) {
          // Build a ~50-mile box around the map center and strictly limit the
          // search to it. One degree of latitude is ~69 miles; a degree of
          // longitude shrinks toward the poles, hence the cos(lat) factor.
          const c = map.getCenter()
          const latDelta = SEARCH_RADIUS_MILES / 69
          const lngDelta = SEARCH_RADIUS_MILES / (69 * Math.cos((c.lat * Math.PI) / 180))
          const west = c.lng - lngDelta
          const east = c.lng + lngDelta
          const south = c.lat - latDelta
          const north = c.lat + latDelta
          params.set('viewbox', `${west},${south},${east},${north}`)
          params.set('bounded', '1') // strictly limit results to that box
        }
        const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`)
        const data = res.ok ? await res.json() : []
        const list = Array.isArray(data) ? data : []
        setResults(list)
        setNoMatches(list.length === 0)
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 500)
  }, [])

  // A search result was chosen: drop the pin there, recenter, and reuse the
  // result's address.
  const chooseResult = (r) => {
    const lat = parseFloat(r.lat)
    const lng = parseFloat(r.lon)
    handlePick(lat, lng, r.display_name)
    setRecenterTarget([lat, lng])
    setQuery(r.display_name)
    setResults([])
    setNoMatches(false)
  }

  // Ask the browser for the user's GPS position and drop the pin there, then
  // re-center the map on it since it may be outside the current view.
  const useMyLocation = () => {
    setGeoError('')
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const { latitude, longitude } = p.coords
        handlePick(latitude, longitude)
        setRecenterTarget([latitude, longitude])
      },
      () => setGeoError('Could not get your location. Search or drop a pin instead.'),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <Box>
      <HStack mb={2} align="start">
        {/* Search box + results dropdown. Position-relative so the dropdown can
            overlay the map, which sits below it. */}
        <Box position="relative" flex="1">
          <InputGroup>
            <Input
              size="sm"
              placeholder="Search a place or address (e.g. Target)"
              value={query}
              isRequired={false}
              onChange={(e) => {
                setQuery(e.target.value)
                runSearch(e.target.value)
              }}
            />
            {searching && (
              <InputRightElement height="2rem">
                <Spinner size="xs" color="blue.500" />
              </InputRightElement>
            )}
          </InputGroup>

          {results.length > 0 && (
            <List
              position="absolute"
              top="100%"
              left={0}
              right={0}
              zIndex={1500}
              mt={1}
              bg="white"
              borderRadius="md"
              boxShadow="lg"
              border="1px solid"
              borderColor="gray.200"
              maxH="220px"
              overflowY="auto"
            >
              {results.map((r) => (
                <ListItem
                  key={r.place_id}
                  px={3}
                  py={2}
                  fontSize="sm"
                  cursor="pointer"
                  _hover={{ bg: 'gray.100' }}
                  onClick={() => chooseResult(r)}
                >
                  {r.display_name}
                </ListItem>
              ))}
            </List>
          )}

          {noMatches && !searching && (
            <Box
              position="absolute"
              top="100%"
              left={0}
              right={0}
              zIndex={1500}
              mt={1}
              px={3}
              py={2}
              bg="white"
              borderRadius="md"
              boxShadow="lg"
              border="1px solid"
              borderColor="gray.200"
              fontSize="sm"
              color="gray.500"
            >
              No places found within {SEARCH_RADIUS_MILES} miles. Try a more specific
              name, or drop a pin on the map.
            </Box>
          )}
        </Box>

        <Button size="sm" variant="outline" flexShrink={0} onClick={useMyLocation}>
          📍 Current location
        </Button>
      </HStack>

      <Box borderRadius="md" overflow="hidden" border="1px solid" borderColor="gray.200">
        <MapContainer
          ref={mapRef}
          center={pos ? [pos.lat, pos.lng] : DEFAULT_CENTER}
          zoom={13}
          style={{ height, width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <ClickHandler onPick={handlePick} />
          <Recenter target={recenterTarget} />
          {pos && (
            <Marker
              position={[pos.lat, pos.lng]}
              icon={PIN_ICON}
              draggable
              eventHandlers={{
                dragend(e) {
                  const { lat, lng } = e.target.getLatLng()
                  handlePick(lat, lng)
                },
              }}
            />
          )}
        </MapContainer>
      </Box>

      <HStack mt={2} spacing={2}>
        {loading && <Spinner size="sm" color="blue.500" />}
        <Text fontSize="sm" color="gray.600">
          {pos
            ? address || 'Locating address…'
            : 'Search, tap the map, or use your location to drop a pin.'}
        </Text>
      </HStack>
      {geoError && (
        <Text fontSize="sm" color="red.500" mt={1}>
          {geoError}
        </Text>
      )}
    </Box>
  )
}

export default LocationPicker
