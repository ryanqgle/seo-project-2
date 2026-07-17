from datetime import datetime
from flask import Blueprint, render_template, request, redirect, url_for, session, flash, jsonify
from app import get_authenticated_user

from db import supabase

trips_bp = Blueprint('trips', __name__)

CATEGORY_CHOICES = ['campus', 'grocery', 'airport', 'other']


@trips_bp.route('/api/trips', methods=['GET'])
def get_trips():
    """Return open trips as JSON for the frontend feed, soonest departure first."""
    try:
        result = supabase.table('trips').select('*, users(first_name, last_name, profile_picture, role, school)') \
            .eq('status', 'open') \
            .order('departure_time', desc=False) \
            .execute()
        return jsonify(result.data)
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

@trips_bp.route('/api/trips/<int:trip_id>/messages', methods=['GET'])
def get_trip_messages(trip_id):
    """Fetches chat history when a user opens the DM"""

    user = get_authenticated_user
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    try:
        result = supabase.table('trip_messages')\
                .select('*, users(first_name, profile_picture)')\
                .eq('trip_id', trip_id)\
                .order('created_at', desc=False)\
                .execute()

        return jsonify(result.data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@trips_bp.route('/api/trips/<int:trip_id>/messages', methods=['POST'])
def send_trip_message(trip_id):
    """Saves new message to db"""

    user = get_authenticated_user
    text = request.json.get('text')

    if not user or not text:
        return jsonify({'error': 'Invalid request'}), 400

    try:
        result = supabase.table('trip_messages').insert({
            'trip_id': trip_id,
            'user_id': user.id,
            "text": text
        }).execute()

        return jsonify(result.data[0]), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500