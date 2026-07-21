import * as React from 'react';
import {loadStripe} from '@stripe/stripe-js';
import {
    EmbeddedCheckoutProvider,
    EmbeddedCheckout
} from '@stripe/react-stripe-js';
import {useParams} from 'react-router-dom';
import { useAuth } from '../auth.jsx'
import { apiUrl } from '../api'

// Make sure to call `loadStrip` outside of a component's render to avoid
// recreating the `Stripe` object on every render
// This is a public sample test API key.
// Don't submit any personally identifiable information in requests made with this key.
// Sign in to see your own test API key embedded in code samples.

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const Payment = () => {
    const {tripRequestId} = useParams();
    const { token } = useAuth();

    const fetchClientSecret = React.useCallback(() => {
        if (!token) {
            return Promise.reject(new Error('Unauthorized'))
        }

        return fetch(apiUrl('/api/create-checkout-session'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                trip_request_id: tripRequestId,
            }),
        })
            .then(async (res) => {
                const data = await res.json()
                if (!res.ok) {
                    throw new Error(data.error || 'Failed to create checkout session')
                }
                return data.clientSecret
            });
    }, [token, tripRequestId]);

    const options = {fetchClientSecret};

    return (
        <div id='checkout'>
            <EmbeddedCheckoutProvider
                stripe={stripePromise}
                options={options}
            >
                <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
        </div>
    )
}

export default Payment;