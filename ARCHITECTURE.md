# Architecture

For the project's overall architecture, see the image below:

<img src="public/architecture.png" alt="image of project architecture" width="500" height="333">

## Overview

Hop In is a two-tier application:

- **Frontend** — a React (Vite) single-page app styled with Chakra UI. It talks
  to Supabase directly for authentication and to the Flask backend for all
  application data. In development, Vite proxies `/api/*` to the Flask server.
- **Backend** — a Flask JSON API. It verifies the Supabase access token on each
  protected request, then reads/writes the Supabase Postgres database using the
  server-side Supabase client.
- **Supabase** — provides Google OAuth authentication and the hosted Postgres
  database.

### Authentication flow

1. The user signs in with Google via Supabase (`supabase.auth.signInWithOAuth`).
2. `AuthProvider` (`auth.jsx`) restores/holds the session and rejects any
   account whose email does not end in `.edu`.
3. The frontend attaches `Authorization: Bearer <access_token>` to API calls.
4. Flask's `get_authenticated_user()` (`app.py`) validates the token with
   Supabase and re-checks the `.edu` domain before serving protected routes.

## App functionality

Lets users do the following:
- Sign up / log in using their `.edu` emails (Google OAuth via Supabase)
- Browse available/upcoming trips with seat availability, price, and category
- View a driver's profile and a map preview of the destination
- Request to join trips
- Post trips as a driver (with address verification)
- Accept/decline join requests from a driver dashboard
- Edit their own profile (name, role, picture; school auto-derived)

_Planned:_ ratings/reviews, live routing and location, and in-trip chat.

### For UML diagrams, see:
- [how ride requests work](/public/ride-request.png)
- [how posting rides works](/public/ride-post.png)
- [how signups/logins work](/public/signup-login.png)

## Backend structure

The Flask app is split into `app.py` plus two blueprints:

| Module | Registers | Responsibility |
|---|---|---|
| `app.py` | – | Auth helper, `/api/auth`, `/api/edit-profile`, `/api/users/exists`, `POST /api/trips` |
| `trips.py` | `trips_bp` | `GET /api/trips` (open-trip feed with driver join) |
| `requests.py` | `requests_bp` | Join requests: list, create, accept/decline |
| `db.py` | – | Initializes the shared server-side Supabase client |

Full endpoint list is in the [README](./README.md#api-reference).

## External APIs

### Google OAuth (via Supabase Auth)

- Sign-in is handled by `supabase.auth.signInWithOAuth({ provider: 'google' })`.
- On return, the session is restored client-side and the user is upserted into
  the `users` table via `POST /api/auth`.
- Only `.edu` accounts are permitted (enforced on both client and server).

### OpenStreetMap Nominatim (address verification)

- **Endpoint:** `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=<address>`
- **Used by:** the Post-a-Ride form to confirm the destination resolves to a
  real place before saving; a valid address is stored.
- **Rate limit:** ~1 request/second.

### Google Maps Embed (map preview)

- **Endpoint:** `https://www.google.com/maps?q=<destination>&output=embed`
- **Used by:** the trip feed's destination popup. Keyless embed (no API key
  required).

## Database Schema

Our SQL-based database is hosted on Supabase to securely store account
information, trip information, join requests, and (planned) reviews. The JSON
API uses the lowercase table names below (`users`, `trips`, `trip_requests`).

### `users` table

| Field | Type | Description |
|---|---|---|
| `id` | UUID (PRIMARY KEY) | Matches the Supabase Auth user ID |
| `first_name` | VARCHAR | User's first name |
| `last_name` | VARCHAR | User's last name |
| `email` | VARCHAR (UNIQUE) | Email associated with user |
| `school` | VARCHAR | Auto-derived from the email domain on profile save |
| `role` | VARCHAR | Whether user is a `passenger` or `driver` |
| `profile_picture` | VARCHAR | Profile picture URL |
| `rating` | FLOAT | User's rating as a rider/driver (planned) |
| `created_at` | TIMESTAMP | Time the user's account was created |

### `trips` table

| Field | Type | Description |
|---|---|---|
| `id` | INT (PRIMARY KEY) | Auto-incremented Trip ID |
| `driver_id` | UUID (FOREIGN KEY) | References the driving user's ID |
| `title` | VARCHAR | Title for the trip |
| `category` | VARCHAR | Type of trip (`campus`, `grocery`, `airport`, `other`) |
| `destination` | VARCHAR | Trip's destination (verified address) |
| `departure_time` | TIMESTAMP | Time of the trip's departure |
| `available_seats` | INT | Number of empty seats in the trip |
| `cost` | DECIMAL | Cost per trip passenger |
| `round_trip` | BOOLEAN | Whether the trip is round-trip |
| `description` | TEXT | Description of the trip |
| `status` | VARCHAR | Trip status (`open`, `full`, `completed`) |
| `created_at` | TIMESTAMP | Time the trip was created |

### `trip_requests` table

| Field | Type | Description |
|---|---|---|
| `id` | INT (PRIMARY KEY) | Auto-incremented TripRequest ID |
| `trip_id` | INT (FOREIGN KEY) | References the Trip ID |
| `passenger_id` | UUID (FOREIGN KEY) | References the user ID of the passenger |
| `status` | VARCHAR | Request status (`pending`, `accepted`, `declined`) |
| `requested_at` | TIMESTAMP | Time the join request was sent |

### `Reviews` table _(planned)_

| Field | Type | Description |
|---|---|---|
| `id` | INT (PRIMARY KEY) | Auto-incremented Reviews ID |
| `trip_id` | INT (FOREIGN KEY) | References the Trip ID |
| `reviewer_id` | UUID (FOREIGN KEY) | References the reviewing user's ID |
| `reviewee_id` | UUID (FOREIGN KEY) | References the ID of the user being reviewed |
| `rating` | INT | Rating that the reviewer gives |
| `comment` | TEXT | Optional comment left with the review |
| `created_at` | TIMESTAMP | Time the review was made |
