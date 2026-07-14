import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

os.environ.setdefault('SUPABASE_URL', 'https://example.supabase.co')
os.environ.setdefault('SUPABASE_KEY', 'test-key')

import pytest

import app as app_module
import requests as requests_module


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


@pytest.fixture
def client():
    app_module.app.config['TESTING'] = True
    return app_module.app.test_client()


def test_get_requests_returns_list(client, monkeypatch):
    fake_data = {'trip_requests': [{'id': 1, 'trip_id': 5, 'status': 'pending'}]}
    monkeypatch.setattr(requests_module, 'supabase', FakeSupabase(fake_data))

    response = client.get('/api/trips/5/requests')

    assert response.status_code == 200
    assert response.get_json()[0]['status'] == 'pending'


def test_create_request_success(client, monkeypatch):
    monkeypatch.setattr(app_module, 'get_authenticated_user', lambda: FakeUser('user-1'))
    fake_data = {
        'trips': [{'id': 5, 'driver_id': 'driver-1', 'available_seats': 2}],
        'trip_requests': [{'id': 10, 'trip_id': 5, 'passenger_id': 'user-1', 'status': 'pending'}],
    }
    monkeypatch.setattr(requests_module, 'supabase', FakeSupabase(fake_data))

    response = client.post('/api/trips/5/requests')

    assert response.status_code == 201
    assert response.get_json()['status'] == 'pending'


def test_create_request_requires_auth(client, monkeypatch):
    monkeypatch.setattr(app_module, 'get_authenticated_user', lambda: None)

    response = client.post('/api/trips/5/requests')

    assert response.status_code == 401


def test_create_request_rejects_own_trip(client, monkeypatch):
    monkeypatch.setattr(app_module, 'get_authenticated_user', lambda: FakeUser('user-1'))
    fake_data = {'trips': [{'id': 5, 'driver_id': 'user-1', 'available_seats': 2}]}
    monkeypatch.setattr(requests_module, 'supabase', FakeSupabase(fake_data))

    response = client.post('/api/trips/5/requests')

    assert response.status_code == 400
    assert 'own trip' in response.get_json()['error']


def test_update_request_accept_success(client, monkeypatch):
    monkeypatch.setattr(app_module, 'get_authenticated_user', lambda: FakeUser('driver-1'))
    fake_data = {
        'trips': [{'id': 5, 'driver_id': 'driver-1', 'available_seats': 2}],
        'trip_requests': [{'id': 10, 'status': 'accepted'}],
    }
    monkeypatch.setattr(requests_module, 'supabase', FakeSupabase(fake_data))

    response = client.patch('/api/trips/5/requests/10', json={'status': 'accepted'})

    assert response.status_code == 200
    assert response.get_json()['status'] == 'accepted'


def test_update_request_rejects_invalid_status(client, monkeypatch):
    monkeypatch.setattr(app_module, 'get_authenticated_user', lambda: FakeUser('driver-1'))

    response = client.patch('/api/trips/5/requests/10', json={'status': 'maybe'})

    assert response.status_code == 400
