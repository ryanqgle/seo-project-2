import os
import stripe
from flask import Blueprint, request, jsonify
from dotenv import load_dotenv
from db import supabase
from datetime import datetime, timezone

payments_bp = Blueprint('payments', __name__)

load_dotenv()
stripe_secret_key = os.getenv('STRIPE_SECRET_KEY')
client = stripe.StripeClient(stripe_secret_key)
webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET_KEY')

DOMAIN = os.getenv('FRONTEND_URL', 'http://localhost:5173')


def get_authenticated_user():
    from app import get_authenticated_user as get_authenticated_user_from_app

    return get_authenticated_user_from_app()



@payments_bp.route('/create-checkout-session', methods=['POST'])
def create_checkout_session():
    user = get_authenticated_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json()
    trip_request_id = data.get("trip_request_id")
    
    if not trip_request_id:
        return jsonify({'error': 'trip_request_id is missing'}), 400
    
    trip_request_result = (
        supabase
        .table("trip_requests")
        .select("*")
        .eq("id", trip_request_id)
        .execute()
    )
    
    if not trip_request_result.data:
        return jsonify({'error': 'trip request not found'}), 404
    
    trip_request = trip_request_result.data[0]

    if trip_request.get('passenger_id') != user.id:
        return jsonify({'error': 'Forbidden'}), 403
    
    if trip_request['status'] != 'awaiting_payment':
        return jsonify({'error': 'request is not ready for payment'}), 400
    
    trip_id = trip_request['trip_id']
    
    trip_result = (
        supabase
        .table("trips")
        .select("*")
        .eq("id", trip_id)
        .execute()
    )
    
    if not trip_result.data:
        return jsonify({'error': 'trip not found'}), 404
    
    trip = trip_result.data[0]
    
    if trip.get('cost') is None:
        return jsonify({'error': 'cost not found'}), 404
    
    amount_cents = int(float(trip['cost']) * 100)
    destination = trip.get('destination', 'Ride')
    
    existing_payment_result = (
        supabase
        .table("payments")
        .select("*")
        .eq("trip_requests_id", trip_request_id)
        .eq("status", "pending")
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )

    if existing_payment_result.data:
        existing_payment = existing_payment_result.data[0]
        existing_session_id = existing_payment.get("stripe_checkout_session_id")

        if existing_session_id:
            try:
                existing_session = client.v1.checkout.sessions.retrieve(
                    existing_session_id
                )

                if existing_session.status == "open":
                    return jsonify(clientSecret=existing_session.client_secret)

            except Exception as e:
                print("Failed to retrieve existing checkout session:", e)
        
    payment_result = (
        supabase
        .table("payments")
        .insert({
            "trip_requests_id": trip_request_id,
            "amount_cents": amount_cents,
            "currency": "usd",
            "status": "pending",
        })
        .execute()
    )
    
    if not payment_result.data:
        return jsonify({"error": "failed to create payment record"}), 500
    
    payment = payment_result.data[0]
    payment_id = payment['id']
    
    try:
        session = client.v1.checkout.sessions.create(
            params={
                'line_items': [{
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': f'Ride to {destination}',
                        },
                        'unit_amount': amount_cents,
                    },
                    'quantity': 1,
                }],
                'mode': 'payment',
                'ui_mode': 'embedded_page',
                'return_url': DOMAIN + '/payment-return?session_id={CHECKOUT_SESSION_ID}',
                'metadata': {
                    'trip_request_id': str(trip_request_id),
                    'trip_id': str(trip_id),
                    'payment_id': str(payment_id)
                }
            },
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
    update_result = (
        supabase
        .table("payments")
        .update({
            "stripe_checkout_session_id": session.id,
        })
        .eq("id", payment_id)
        .execute()
    )
    
    if not update_result.data:
        return jsonify({'error': 'failed to update payment session id'}), 500

    return jsonify(clientSecret=session.client_secret)

@payments_bp.route('/session_status', methods=['GET'])
def session_status():
    try:
        session_id = request.args.get('session_id')
        
        if not session_id:
            return jsonify({'error': "session_id is missing"}), 400
        
        session = client.v1.checkout.sessions.retrieve(session_id)
        session_status = session.status
        
        if session.customer_details:
            customer_email = session.customer_details.email
        else:
            customer_email = None        
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

    
    return jsonify(status=session_status, customer_email=customer_email)

@payments_bp.route('/stripe-webhook', methods=['POST'])
def stripe_webhook():
    payload = request.data
    sig_header = request.headers.get('Stripe-Signature')
    
    try:
        event = stripe.Webhook.construct_event(
            payload,
            sig_header,
            webhook_secret
        )
    except ValueError:
        return jsonify({'error': 'Invalid payload'}), 400
    except stripe.SignatureVerificationError:
        return jsonify({'error': 'Invalid signature'}), 400
    
    
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        
        payment_id = session['metadata']['payment_id']
        trip_request_id = session['metadata']['trip_request_id']
        
        payment_update = (
            supabase
            .table('payments')
            .update({
                'status': 'paid',
                'stripe_payment_intent_id': session['payment_intent'],
                'paid_at': datetime.now(timezone.utc).isoformat()
            })
            .eq('id', payment_id)
            .execute()
        )
        
        trip_request_update = (
            supabase
            .table('trip_requests')
            .update({
                'status': 'accepted',
            })
            .eq('id', trip_request_id)
            .execute()
        )
        
    return jsonify({'received': True}), 200
