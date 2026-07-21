import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

os.environ.setdefault('SUPABASE_URL', 'https://example.supabase.co')
os.environ.setdefault('SUPABASE_KEY', 'test-key')

import pytest

import app as app_module


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

    def ilike(self, *args, **kwargs):
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
    def __init__(self, id, email):
        self.id = id
        self.email = email


@pytest.fixture
def client():
    app_module.app.config['TESTING'] = True
    return app_module.app.test_client()


def test_create_trip_api_success(client, monkeypatch):
    monkeypatch.setattr(app_module, 'get_authenticated_user', lambda: FakeUser('user-1', 'driver@usc.edu'))
    fake_data = {'trips': [{'id': 1, 'title': 'Airport run', 'driver_id': 'user-1'}]}
    monkeypatch.setattr(app_module, 'supabase', FakeSupabase(fake_data))

    response = client.post('/api/trips', json={
        'title': 'Airport run',
        'origin': 'USC Campus',
        'origin_lat': 34.0224,
        'origin_lng': -118.2851,
        'destination': 'LAX',
        'destination_lat': 33.9416,
        'destination_lng': -118.4085,
        'departure_time': '2026-07-14T09:00'
    })

    assert response.status_code == 201
    assert response.get_json()['trip']['title'] == 'Airport run'


def test_create_trip_api_requires_auth(client, monkeypatch):
    monkeypatch.setattr(app_module, 'get_authenticated_user', lambda: None)

    response = client.post('/api/trips', json={
        'title': 'Airport run', 'destination': 'LAX', 'departure_time': '2026-07-14T09:00'
    })

    assert response.status_code == 401


def test_manage_profile_get_success(client, monkeypatch):
    monkeypatch.setattr(app_module, 'get_authenticated_user', lambda: FakeUser('user-1', 'driver@usc.edu'))
    fake_data = {'users': [{'id': 'user-1', 'first_name': 'James', 'role': 'driver'}]}
    monkeypatch.setattr(app_module, 'supabase', FakeSupabase(fake_data))

    response = client.get('/api/edit-profile')

    assert response.status_code == 200
    assert response.get_json()['profile']['first_name'] == 'James'


def test_manage_profile_requires_auth(client, monkeypatch):
    monkeypatch.setattr(app_module, 'get_authenticated_user', lambda: None)

    response = client.get('/api/edit-profile')

    assert response.status_code == 401


def test_user_exists_true(client, monkeypatch):
    fake_data = {'users': [{'id': 'user-1'}]}
    monkeypatch.setattr(app_module, 'supabase', FakeSupabase(fake_data))

    response = client.get('/api/users/exists?email=driver@usc.edu')

    assert response.status_code == 200
    assert response.get_json()['exists'] is True


def test_user_exists_false(client, monkeypatch):
    fake_data = {'users': []}
    monkeypatch.setattr(app_module, 'supabase', FakeSupabase(fake_data))

    response = client.get('/api/users/exists?email=nobody@usc.edu')

    assert response.status_code == 200
    assert response.get_json()['exists'] is False
