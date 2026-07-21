import os
import stripe
from flask import Blueprint, jsonify
from dotenv import load_dotenv
from db import supabase

connect_bp = Blueprint('connect', __name__)

load_dotenv()
stripe_secret_key = os.getenv('STRIPE_SECRET_KEY')
client = stripe.StripeClient(stripe_secret_key)

FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')


@connect_bp.route('/stripe/connect/onboard', methods=['POST'])
def create_connect_onboarding_link():
    from app import get_authenticated_user

    user = get_authenticated_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    profile_result = (
        supabase
        .table('users')
        .select('*')
        .eq('id', user.id)
        .execute()
    )

    if not profile_result.data:
        return jsonify({'error': 'User profile not found'}), 404

    profile = profile_result.data[0]
    stripe_account_id = profile.get('stripe_account_id')

    try:
        if not stripe_account_id:
            account = client.v1.accounts.create(
                params={
                    'type': 'express',
                    'email': user.email,
                    'capabilities': {
                        'card_payments': {'requested': True},
                        'transfers': {'requested': True},
                    },
                }
            )

            stripe_account_id = account.id

            supabase.table('users').update({
                'stripe_account_id': stripe_account_id,
            }).eq('id', user.id).execute()

        account_link = client.v1.account_links.create(
            params={
                'account': stripe_account_id,
                'refresh_url': f'{FRONTEND_URL}/dashboard',
                'return_url': f'{FRONTEND_URL}/dashboard',
                'type': 'account_onboarding',
            }
        )

        return jsonify({'url': account_link.url}), 200

    except Exception as error:
        return jsonify({'error': str(error)}), 500
    
@connect_bp.route('/stripe/connect/status', methods=['GET'])
def get_connect_status():
    from app import get_authenticated_user

    user = get_authenticated_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    profile_result = (
        supabase
        .table('users')
        .select('*')
        .eq('id', user.id)
        .execute()
    )

    if not profile_result.data:
        return jsonify({'error': 'User profile not found'}), 404

    profile = profile_result.data[0]
    stripe_account_id = profile.get('stripe_account_id')

    if not stripe_account_id:
        return jsonify({
            'connected': False,
            'charges_enabled': False,
            'payouts_enabled': False,
            'onboarding_complete': False,
        }), 200

    try:
        account = client.v1.accounts.retrieve(stripe_account_id)

        charges_enabled = account.charges_enabled
        payouts_enabled = account.payouts_enabled
        onboarding_complete = charges_enabled and payouts_enabled

        supabase.table('users').update({
            'stripe_charges_enabled': charges_enabled,
            'stripe_payouts_enabled': payouts_enabled,
            'stripe_onboarding_complete': onboarding_complete,
        }).eq('id', user.id).execute()

        return jsonify({
            'connected': True,
            'charges_enabled': charges_enabled,
            'payouts_enabled': payouts_enabled,
            'onboarding_complete': onboarding_complete,
        }), 200

    except Exception as error:
        return jsonify({'error': str(error)}), 500