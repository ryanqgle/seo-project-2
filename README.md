# Hop In

A ride-sharing web app for college students. Students sign in with their `.edu`
email, drivers post trips (grocery runs, airport drop-offs, campus rides), and
riders browse the feed and request a seat. Drivers review and accept/decline
requests from a dashboard.


## Features

- **`.edu`-only auth** — Google OAuth through Supabase, with a hard check that
  the account's email ends in `.edu`.
- **Trip feed** — browse open trips with driver, destination, departure time,
  seats left, price, and category.
- **Driver profiles** — click a driver on any trip card to see a profile popup
  (name, role, school).
- **Map preview** — click a trip's destination to open an embedded Google Map.
- **Post a ride** (drivers) — a form that verifies the destination is a real
  address (via OpenStreetMap geocoding) before saving.
- **Request to join** (riders) — one click sends a join request to the driver.
- **Driver dashboard** — accept or decline pending requests; accepting
  decrements available seats and closes the trip when full.
- **Editable profile** — set first/last name, role (driver/passenger), and
  profile picture. School is auto-derived from the email domain.


## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React, Vite, Chakra UI, React Router |
| Backend | Python, Flask, Flask-CORS |
| Auth & DB | Supabase (Postgres + Auth, Google OAuth) |
| External APIs | OpenStreetMap Nominatim (address verification), Google OAuth API, Google Maps Embed (keyless map preview) |


## Getting started

### Prerequisites

- Node.js 18+ and npm
- Python 3.12+
- A Supabase project (URL + anon/service key), with Google OAuth enabled

NOTE: Clone the repo!

### 1. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env               # then fill in your Supabase credentials
python app.py
```

The API runs on **http://127.0.0.1:5000**.

`backend/.env`:

Use the `.env.example` template to create `.env`

```
SUPABASE_URL=your-project-url
SUPABASE_KEY=your-service-or-anon-key
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs on **http://localhost:5173** and proxies `/api/*` to the Flask
backend on port 5000 (see [`vite.config.js`](frontend/vite.config.js)).

Create `frontend/.env`:

```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_KEY=your-anon-key
```

> **Note:** Both the frontend and backend must be running. If you change the
> backend port, update it in both `backend/app.py` (`app.run(...)`) and the
> proxy target in `frontend/vite.config.js`.

---

## API reference

All JSON endpoints expect a Supabase access token via
`Authorization: Bearer <token>` unless noted. Requests are proxied through Vite
under `/api` in development.

### Auth & profile (`app.py`)

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/` | – | Health check |
| `POST` | `/api/auth` | ✅ | Upsert the signed-in user into `users` |
| `GET` | `/api/edit-profile` | ✅ | Fetch the current user's profile |
| `PUT` | `/api/edit-profile` | ✅ | Update profile (school auto-derived from email) |
| `GET` | `/api/users/exists?email=` | – | Whether an email already has an account |

### Trips (`trips.py`, `app.py`)

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/trips` | – | List open trips (soonest first) with driver info |
| `POST` | `/api/trips` | ✅ | Create a trip with origin, destination, coordinates, departure time, seats, cost, and category |

### Join requests (`requests.py`)

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/trips/<trip_id>/requests` | – | List a trip's join requests |
| `POST` | `/api/trips/<trip_id>/requests` | ✅ | Request to join a trip |
| `PATCH` | `/api/trips/<trip_id>/requests/<request_id>` | ✅ | Driver accepts/declines a request |

### Payments (`payments.py`)

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/create-checkout-session` | ✅ | Create an embedded Stripe checkout session for the authenticated rider's `awaiting_payment` request |
| `GET` | `/api/session_status` | – | Read a Stripe checkout session's status by `session_id` |

---

## Frontend routes

| Path | Component | Access |
|---|---|---|
| `/` | Home | Public |
| `/feed` | TripsFeed | Logged in |
| `/profile` | ProfileView (read-only) | Logged in |
| `/edit-profile` | UserProfile (form) | Logged in |
| `/create-ride` | CreateRideForm | Logged in |
| `/dashboard` | DriverRequests | Drivers only |

---

## Notes & known gaps

- The Reviews/ratings system in `ARCHITECTURE.md` is planned but not yet
  implemented.
- Some legacy server-rendered Flask routes (`/trips/new`, `/profile`) and
  capitalized table references (`Trips`, `Users`) predate the JSON API and are
  not used by the React frontend.
- Nominatim (address verification) is rate-limited to ~1 request/second.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for diagrams and the database schema.
