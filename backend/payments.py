import os
import stripe
from flask import Blueprint, request, jsonify
from dotenv import load_dotenv

payments_bp = Blueprint('payments', __name__)

load_dotenv()
stripe_secret_key = os.getenv('STRIPE_SECRET_KEY')
client = stripe.StripeClient(stripe_secret_key)
webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET_KEY')

DOMAIN = 'http://localhost:5173'



@payments_bp.route('/create-checkout-session', methods=['POST'])
def create_checkout_session():
<<<<<<< HEAD
=======
    
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
    
>>>>>>> d8e535a (feat(payments): add Stripe payment checkout)
    try:
        session = client.v1.checkout.sessions.create(
            params={
                'line_items': [{
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': 'T-shirt',  # shift to  describe the ride 
                        },
                        'unit_amount': 2000, # switch to get from trip.costs
                    },
                    'quantity': 1,
                }],
                'mode': 'payment',
                'ui_mode': 'embedded_page',
<<<<<<< HEAD
                'return_url': DOMAIN + '/payment-return?session_id={CHECKOUT_SESSION_ID}'
=======
                'return_url': DOMAIN + '/payment-return?session_id={CHECKOUT_SESSION_ID}',
                'metadata': {
                    'trip_request_id': str(trip_request_id),
                    'trip_id': str(trip_id),
                    'payment_id': str(payment_id)
                }
>>>>>>> d8e535a (feat(payments): add Stripe payment checkout)
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
    
    print("Webhook receieved")
    print(payload)
    
    return jsonify({'received': True}), 200
