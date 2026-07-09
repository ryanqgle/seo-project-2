from flask import Blueprint, request, jsonify

from db import supabase

requests_bp = Blueprint('requests', __name__)

@requests_bp.route('/api/trips/<int:trip_id>/requests', methods=['GET'])
def get_requests(trip_id):
    """Return join requests for a trip, newest first."""
    try:
        result = supabase.table('trip_requests').select('*, users(first_name, last_name, profile_picture)') \
            .eq('trip_id', trip_id) \
            .order('requested_at', desc=True) \
            .execute()
        return jsonify(result.data)
    except Exception as error:
        return jsonify({'error': str(error)}), 500

@requests_bp.route('/api/trips/<int:trip_id>/requests', methods=['POST'])
def create_request(trip_id):
    from app import get_authenticated_user

    try:
        user = get_authenticated_user()
        if not user:
            return jsonify({'error': 'Unauthorized'}), 401

        trip_result = supabase.table('trips').select('*').eq('id', trip_id).execute()
        if not trip_result.data:
            return jsonify({'error': 'Trip not found'}), 404
        trip = trip_result.data[0]

        if trip['driver_id'] == user.id:
            return jsonify({'error': "You can't request your own trip"}), 400

        if trip['available_seats'] < 1:
            return jsonify({'error': 'No seats left on this trip'}), 400

        result = supabase.table('trip_requests').insert({
            'trip_id': trip_id,
            'passenger_id': user.id,
            'status': 'pending'
        }).execute()
        return jsonify(result.data[0]),201
    except Exception as error:
        print(f"Error creating request: {error}")
        return jsonify({'error': str(error)}), 500

@requests_bp.route('/api/trips/<int:trip_id>/requests/<int:request_id>', methods=['PATCH'])
def update_request(trip_id, request_id):
    from app import get_authenticated_user

    user = get_authenticated_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    new_status = request.json.get('status')
    if new_status not in ('accepted', 'declined'):
        return jsonify({'error': "status must be 'accepted' or 'declined'"}), 400

    try:
        trip_result = supabase.table('trips').select('*').eq('id', trip_id).execute()
        if not trip_result.data:
            return jsonify({'error': 'Trip not found'}), 404
        trip = trip_result.data[0]

        if trip['driver_id'] != user.id:
            return jsonify({'error': 'Unauthorized'}), 401

        if new_status == 'accepted':
            if trip['available_seats'] < 1:
                return jsonify({'error': 'No seats left on this trip'}), 400

            new_seats = trip['available_seats'] - 1
            trip_update = {'available_seats': new_seats}
            if new_seats == 0:
                trip_update['status'] = 'full'
            supabase.table('trips').update(trip_update).eq('id', trip_id).execute()

        result = supabase.table('trip_requests').update({'status': new_status}) \
            .eq('id', request_id).execute()
        return jsonify(result.data[0])
    except Exception as error:
        return jsonify({'error': str(error)}), 500
