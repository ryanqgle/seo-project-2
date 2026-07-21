from datetime import datetime
from flask import Blueprint, render_template, request, redirect, url_for, session, flash, jsonify

from db import supabase
from routing import optimize_pickup_order, route_geometry, RoutingError

trips_bp = Blueprint('trips', __name__)

CATEGORY_CHOICES = ['campus', 'grocery', 'airport', 'other']


@trips_bp.route('/api/trips', methods=['GET'])
def get_trips():
    """Return open trips as JSON for the frontend feed, soonest departure first."""
    try:
        result = supabase.table('trips').select('*, users(first_name, last_name, profile_picture, role, school)') \
            .in_('status', ['open', 'full']) \
            .order('departure_time', desc=False) \
            .execute()
        return jsonify(result.data)
    except Exception as error:
        return jsonify({'error': str(error)}), 500


@trips_bp.route('/api/trips/<int:trip_id>/route', methods=['GET'])
def get_trip_route(trip_id):
    """Build the single multi-stop route for a trip, on demand.

    Combines the driver's origin, every accepted rider's pickup (ordered
    optimally by ORS), and the destination into one drivable route. Only the
    driver or an accepted passenger of the trip may view it.
    """
    from app import get_authenticated_user

    user = get_authenticated_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    try:
        trip_res = supabase.table('trips').select('*').eq('id', trip_id).execute()
        if not trip_res.data:
            return jsonify({'error': 'Trip not found'}), 404
        trip = trip_res.data[0]

        # Only the driver or an accepted passenger can see the route.
        accepted = supabase.table('trip_requests').select('*') \
            .eq('trip_id', trip_id).eq('status', 'accepted').execute().data or []
        is_driver = trip['driver_id'] == user.id
        is_passenger = any(r['passenger_id'] == user.id for r in accepted)
        if not is_driver and not is_passenger:
            return jsonify({'error': 'Unauthorized'}), 403

        if trip.get('origin_lat') is None or trip.get('destination_lat') is None:
            return jsonify({'error': 'This trip has no origin/destination coordinates.'}), 400

        start = (trip['origin_lat'], trip['origin_lng'])
        end = (trip['destination_lat'], trip['destination_lng'])

        # Accepted pickups that actually have coordinates.
        pickups = [
            {
                'id': r['id'],
                'lat': r['pickup_lat'],
                'lng': r['pickup_lng'],
                'address': r.get('pickup_address'),
                'passenger_id': r['passenger_id'],
            }
            for r in accepted
            if r.get('pickup_lat') is not None and r.get('pickup_lng') is not None
        ]

        # Order the pickups optimally (skip the ORS solve if there are none).
        order = optimize_pickup_order(start, end, pickups)
        by_id = {p['id']: p for p in pickups}
        ordered_pickups = [by_id[i] for i in order] if order else pickups

        coords = [start] + [(p['lat'], p['lng']) for p in ordered_pickups] + [end]
        route = route_geometry(coords)

        # Look up the driver + every accepted passenger so each stop can carry the
        # person it belongs to (name + profile picture). The map uses these to
        # label pins with faces and names instead of numbers.
        user_ids = list({trip['driver_id'], *(p['passenger_id'] for p in ordered_pickups)})
        users_by_id = {}
        if user_ids:
            users_res = supabase.table('users') \
                .select('id, first_name, last_name, profile_picture') \
                .in_('id', user_ids).execute()
            users_by_id = {u['id']: u for u in (users_res.data or [])}

        driver = users_by_id.get(trip['driver_id'], {})
        stops = [{
            'type': 'origin',
            'lat': start[0],
            'lng': start[1],
            'address': trip.get('origin'),
            'user_id': trip['driver_id'],
            'first_name': driver.get('first_name'),
            'last_name': driver.get('last_name'),
            'profile_picture': driver.get('profile_picture'),
        }]
        for idx, p in enumerate(ordered_pickups, start=1):
            passenger = users_by_id.get(p['passenger_id'], {})
            stops.append({
                'type': 'pickup',
                'order': idx,
                'lat': p['lat'],
                'lng': p['lng'],
                'address': p['address'],
                'passenger_id': p['passenger_id'],
                'user_id': p['passenger_id'],
                'first_name': passenger.get('first_name'),
                'last_name': passenger.get('last_name'),
                'profile_picture': passenger.get('profile_picture'),
            })
        stops.append({'type': 'destination', 'lat': end[0], 'lng': end[1], 'address': trip.get('destination')})

        return jsonify({
            'stops': stops,
            'geometry': route['geometry'],
            'distance_meters': route['distance_meters'],
            'duration_seconds': route['duration_seconds'],
        })
    except RoutingError as error:
        return jsonify({'error': str(error)}), 502
    except Exception as error:
        return jsonify({'error': str(error)}), 500


@trips_bp.route('/api/trips/<int:trip_id>/base-route', methods=['GET'])
def get_trip_base_route(trip_id):
    from app import get_authenticated_user

    user = get_authenticated_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    try:
        trip_res = supabase.table('trips').select(
            'origin, origin_lat, origin_lng, destination, destination_lat, destination_lng'
        ).eq('id', trip_id).execute()
        if not trip_res.data:
            return jsonify({'error': 'Trip not found'}), 404
        trip = trip_res.data[0]

        if trip.get('origin_lat') is None or trip.get('destination_lat') is None:
            return jsonify({'error': 'This trip has no origin/destination coordinates.'}), 400

        start = (trip['origin_lat'], trip['origin_lng'])
        end = (trip['destination_lat'], trip['destination_lng'])
        route = route_geometry([start, end])

        return jsonify({
            'stops': [
                {'type': 'origin', 'lat': start[0], 'lng': start[1], 'address': trip.get('origin')},
                {'type': 'destination', 'lat': end[0], 'lng': end[1], 'address': trip.get('destination')},
            ],
            'geometry': route['geometry'],
            'distance_meters': route['distance_meters'],
            'duration_seconds': route['duration_seconds'],
        })
    except RoutingError as error:
        return jsonify({'error': str(error)}), 502
    except Exception as error:
        return jsonify({'error': str(error)}), 500


@trips_bp.route('/trips/new', methods=['GET', 'POST'])
def create_trip():
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))

    if request.method == 'POST':
        title = request.form.get('title')
        destination = request.form.get('destination')
        departure_time_raw = request.form.get('departure_time')
        category = request.form.get('category')
        available_seats = request.form.get('available_seats')
        cost = request.form.get('cost')
        description = request.form.get('description')
        round_trip = request.form.get('round_trip') == 'on'

        if not title or not destination or not departure_time_raw:
            flash('Please fill out title, destination, and departure time')
            return redirect(url_for('trips.create_trip'))

        departure_time = datetime.strptime(departure_time_raw, '%Y-%m-%dT%H:%M').isoformat()

        supabase.table('Trips').insert({
            'driver_id': session['user_id'],
            'title': title,
            'destination': destination,
            'departure_time': departure_time,
            'category': category,
            'available_seats': int(available_seats) if available_seats else 1,
            'cost': float(cost) if cost else 0,
            'round_trip': round_trip,
            'description': description,
            'status': 'open'
        }).execute()

        return redirect(url_for('trips.profile'))

    return render_template('create_trip.html', categories=CATEGORY_CHOICES)


@trips_bp.route('/profile')
def profile():
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))

    user_id = session['user_id']

    user_result = supabase.table('users').select('*').eq('id', user_id).single().execute()
    user = user_result.data

    posted_result = supabase.table('trips').select('*') \
        .eq('driver_id', user_id).order('departure_time', desc=True).execute()
    posted_trips = posted_result.data

    joined_result = supabase.table('trip_requests').select('*, Trips(*)') \
        .eq('passenger_id', user_id).order('requested_at', desc=True).execute()
    joined_requests = joined_result.data

    return render_template(
        'profile.html',
        user=user,
        posted_trips=posted_trips,
        joined_requests=joined_requests
    )

@trips_bp.route('/api/driver/trips', methods=['GET'])
def get_driver_trips():
    """
    Returns all trips owned by the logged-in driver, including full trips.
    Used by Driver Dashboard
    """
    from app import get_authenticated_user

    user = get_authenticated_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    try:
        result = (
            supabase
            .table('trips')
            .select('*')
            .eq('driver_id', user.id)
            .execute()
        )

        return jsonify(result.data), 200

    except Exception as error:
        return jsonify({'error': str(error)}), 500