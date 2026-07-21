import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

os.environ.setdefault('SUPABASE_URL', 'https://example.supabase.co')
os.environ.setdefault('SUPABASE_KEY', 'test-key')
os.environ.setdefault('STRIPE_SECRET_KEY', 'sk_test_example')
os.environ.setdefault('STRIPE_WEBHOOK_SECRET_KEY', 'whsec_test_example')

import pytest

import app as app_module
import payments as payments_module


class FakeResult:
    def __init__(self, data):
        self.data = data


class FakeQuery:
    def __init__(self, data):
        self.data = data

    def select(self, *args, **kwargs):
        return self

    def eq(self, *args, **kwargs):
        return self

    def order(self, *args, **kwargs):
        return self

    def limit(self, *args, **kwargs):
        return self

    def insert(self, *args, **kwargs):
        return self

    def update(self, *args, **kwargs):
        return self

    def execute(self):
        return FakeResult(self.data)


class FakeSupabase:
    def __init__(self, data_by_table):
        self.data_by_table = data_by_table

    def table(self, name):
        return FakeQuery(self.data_by_table.get(name, []))


class FakeUser:
    def __init__(self, id):
        self.id = id


class FakeCheckoutSessions:
    def retrieve(self, *args, **kwargs):
        raise AssertionError('retrieve should not be called in these tests')

    def create(self, *args, **kwargs):
        return type('FakeSession', (), {'id': 'cs_test_123', 'client_secret': 'secret_123'})()


class FakeStripeClient:
    def __init__(self):
        self.v1 = type('V1', (), {'checkout': type('Checkout', (), {'sessions': FakeCheckoutSessions()})()})()


@pytest.fixture
def client():
    app_module.app.config['TESTING'] = True
    return app_module.app.test_client()


def test_create_checkout_session_requires_auth(client, monkeypatch):
    monkeypatch.setattr(payments_module, 'get_authenticated_user', lambda: None)

    response = client.post('/api/create-checkout-session', json={'trip_request_id': 1})

    assert response.status_code == 401


def test_create_checkout_session_rejects_non_owner(client, monkeypatch):
    monkeypatch.setattr(payments_module, 'get_authenticated_user', lambda: FakeUser('user-1'))
    monkeypatch.setattr(payments_module, 'supabase', FakeSupabase({
        'trip_requests': [{'id': 1, 'trip_id': 5, 'passenger_id': 'someone-else', 'status': 'awaiting_payment'}]
    }))

    response = client.post('/api/create-checkout-session', json={'trip_request_id': 1})

    assert response.status_code == 403


def test_create_checkout_session_success(client, monkeypatch):
    monkeypatch.setattr(payments_module, 'get_authenticated_user', lambda: FakeUser('user-1'))
    monkeypatch.setattr(payments_module, 'supabase', FakeSupabase({
        'trip_requests': [{'id': 1, 'trip_id': 5, 'passenger_id': 'user-1', 'status': 'awaiting_payment'}],
        'trips': [{'id': 5, 'cost': 12.5, 'destination': 'LAX'}],
        'payments': [{'id': 42, 'stripe_checkout_session_id': 'cs_test_123', 'status': 'pending'}],
    }))
    monkeypatch.setattr(payments_module, 'client', FakeStripeClient())

    response = client.post('/api/create-checkout-session', json={'trip_request_id': 1})

    assert response.status_code == 200
    assert response.get_json()['clientSecret'] == 'secret_123'