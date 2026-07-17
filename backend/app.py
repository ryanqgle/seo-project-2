import os
from flask import Flask, request
from flask_cors import CORS
from db import supabase

app = Flask(__name__)

# Origins allowed to call this API from the browser. Local Vite dev servers plus
# the deployed Vercel frontend. Additional origins can be supplied at runtime via
# the FRONTEND_ORIGINS env var (comma-separated) without a code change.
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://hop-in-beta.vercel.app",
]
ALLOWED_ORIGINS += [
    o.strip() for o in os.environ.get("FRONTEND_ORIGINS", "").split(",") if o.strip()
]

CORS(app, resources={r"/*": {"origins": ALLOWED_ORIGINS}}, allow_headers=["Content-Type", "Authorization"], methods=["GET", "POST", "OPTIONS", "PUT", "DELETE"])


def get_authenticated_user():
    """
    Extracts token from incoming request header, verifies it
    with Supabase, and ensures the user has a valid .edu email address
    """

    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return None

    token = auth_header.replace('Bearer ', '')
    
    try:
        user_response = supabase.auth.get_user(token)
        user = user_response.user

        if user and user.email.endswith('.edu'):
            return user

        return None
    except Exception as e:
        print(f"Error fetching user: {e}")
        return None

@app.route('/', methods=['GET'])
def home():
    return "Flask is successfully running"


@app.route('/api/auth', methods=['POST'])
def register_auth_user():
    """
    Called when a user signs up or logs in and upserts
    their Supabase Auth ID and email into users
    """

    # Handle CORS preflight requests from the browser
    if request.method == 'OPTIONS':
        return {"status": "preflight ok"}, 200

    user = get_authenticated_user()

    if user:
        try:
            supabase.table('users').upsert({
                'id': user.id,
                'email': user.email
            }).execute()
            return {"status": "success", "message": f"User {user.email} registered successfully."}
        except Exception as e:
            print(f"Error registering user: {e}")
            return {"status": "error", "message": "Failed to register user."}, 500

    return {"status": "error", "message": "Unauthorized."}, 401

def extract_school_from_email(email):
    """Helper function to parse the university name from a .edu email"""

    school = email.split('@')[1].replace('.edu', '')
    return school.capitalize()

@app.route('/api/edit-profile', methods=['GET', 'PUT'])
def manage_profile():
    """
    GET: fetches the logged-in user's profile data
    PUT: updates the user's profile details and auto-assigns their school
    """

    user = get_authenticated_user()

    if not user:
        return {"status": "error", "message": "Unauthorized."}, 401

    if request.method == 'GET':
        try:
            res = supabase.table('users').select('*').eq('id', user.id).execute()
            if res.data:
                return {"status": "success", "profile": res.data[0]}, 200
            return {"status": "error", "message": "Profile not found."}, 404
        except Exception as e:
            return {"status": "error", "message": f"Error fetching profile: {e}"}, 500

    if request.method == 'PUT':
        try:
            data = request.json
            verify_school = extract_school_from_email(user.email)

            update_data = {
                'first_name': data.get('first_name'),
                'last_name': data.get('last_name'),
                'role': data.get('role'),
                'profile_picture': data.get('profile_picture'),
                'school': verify_school
                }

            res = supabase.table('users').update(update_data).eq('id', user.id).execute()
            return {"status": "success", "profile": res.data[0]}, 200
        except Exception as e:
            return {"status": "error", "message": f"Error updating profile: {e}"}, 500

@app.route('/api/requests/driver', methods=['POST'])
def get_driver_requests():
    """
    Fetches all pending requests for all trips owned by the logged-in driver
    """

    user = get_authenticated_user()

    if not user:
        return {"status": "error", "message": "Unauthorized."}, 401

    try:
        trips_res = supabase.table('trips').select('*').eq('driver_id', user.id).execute()
        driver_trips = trips_res.data

        if not driver_trips:
            return {"status": "success", "requests": []}, 200

        trip_ids = [trip['id'] for trip in driver_trips]
        req_response = supabase.table('trip_requests')\
            .select('id, status, trip_id, requested_at, users(first_name, last_name)')\
            .in_('trip_id', trip_ids).execute()

        return {"status": "success", "requests": req_response.data}, 200
    except Exception as e:
        return {"status": "error", "message": f"Error fetching driver requests: {e}"}, 500


@app.route('/api/requests/<int:request_id>', methods=['PUT'])
def update_request_status(request_id):
    """Allows a driver to accept or reject a specific trip request."""
    
    user = get_authenticated_user()

    if not user:
        return {"status": "error", "message": "Unauthorized."}, 401

    try:
        data = request.json
        new_status = data.get('status')

        if new_status not in ['accepted', 'rejected']:
            return {"status": "error", "message": "Invalid status."}, 400

        res = supabase.table('trip_requests').update({'status': new_status}).eq('id', request_id).execute()
        return {"status": "success", "request": res.data[0]}, 200

    except Exception as e:
        return {"status": "error", "message": f"Error updating request status: {e}"}, 500


@app.route('/api/users/exists', methods=['GET'])
def user_exists():
    """Check whether an email already has an account.

    The frontend uses this to decide whether to prompt single sign-on
    (account exists) or sign up (no account yet).
    """
    email = request.args.get('email', '').strip()
    if not email:
        return {"exists": False, "error": "email is required"}, 400

    try:
        # ilike = same as the ILIKE operator in SQL, which is case-insensitive
        result = supabase.table('users').select('id').ilike('email', email).limit(1).execute()
        return {"exists": len(result.data) > 0}
    except Exception as e:
        print(f"Error checking user: {e}")
        return {"exists": False, "error": "lookup failed"}, 500


@app.route('/api/trips', methods=['POST'])
def create_trip_api():
    """Create a trip from the frontend Post-a-Ride form (JSON + bearer token)."""
    user = get_authenticated_user()

    if not user:
        return {"status": "error", "message": "Unauthorized."}, 401

    try:
        data = request.json or {}

        title = (data.get('title') or '').strip()
        destination = (data.get('destination') or '').strip()
        departure_time = data.get('departure_time')

        if not title or not destination or not departure_time:
            return {
                "status": "error",
                "message": "Title, destination, and departure time are required.",
            }, 400

        new_trip = {
            'driver_id': user.id,
            'title': title,
            'destination': destination,
            'departure_time': departure_time,
            'category': data.get('category'),
            'available_seats': int(data.get('available_seats') or 1),
            'cost': float(data.get('cost') or 0),
            'description': data.get('description'),
            'round_trip': bool(data.get('round_trip')),
            'status': 'open',
        }

        res = supabase.table('trips').insert(new_trip).execute()
        return {"status": "success", "trip": res.data[0]}, 201
    except Exception as e:
        print(f"Error creating trip: {e}")
        return {"status": "error", "message": f"Error creating trip: {e}"}, 500


# Import blueprints after `supabase` is defined so trips.py can import it
from trips import trips_bp
app.register_blueprint(trips_bp)

from trip_requests import requests_bp
app.register_blueprint(requests_bp)

from payments import payments_bp
app.register_blueprint(payments_bp, url_prefix="/api")


if __name__ == '__main__':
    app.run(debug=True, port=5000)
