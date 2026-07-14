import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

os.environ.setdefault('SUPABASE_URL', 'https://example.supabase.co')
os.environ.setdefault('SUPABASE_KEY', 'test-key')

import pytest

import app as app_module
import trips as trips_module


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

    def delete(self, *args, **kwargs):
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


def test_get_trips_returns_open_trips(client, monkeypatch):
    fake_data = {'trips': [{'id': 1, 'title': 'Airport run', 'status': 'open'}]}
    monkeypatch.setattr(trips_module, 'supabase', FakeSupabase(fake_data))

    response = client.get('/api/trips')

    assert response.status_code == 200
    assert response.get_json()[0]['title'] == 'Airport run'


def test_delete_trip_success(client, monkeypatch):
    monkeypatch.setattr(app_module, 'get_authenticated_user', lambda: FakeUser('driver-1'))
    fake_data = {'trips': [{'id': 5, 'driver_id': 'driver-1'}]}
    monkeypatch.setattr(trips_module, 'supabase', FakeSupabase(fake_data))

    response = client.delete('/api/trips/5')

    assert response.status_code == 200
    assert response.get_json()['status'] == 'success'


def test_delete_trip_requires_auth(client, monkeypatch):
    monkeypatch.setattr(app_module, 'get_authenticated_user', lambda: None)

    response = client.delete('/api/trips/5')

    assert response.status_code == 401


def test_delete_trip_rejects_non_owner(client, monkeypatch):
    monkeypatch.setattr(app_module, 'get_authenticated_user', lambda: FakeUser('user-1'))
    fake_data = {'trips': [{'id': 5, 'driver_id': 'someone-else'}]}
    monkeypatch.setattr(trips_module, 'supabase', FakeSupabase(fake_data))

    response = client.delete('/api/trips/5')

    assert response.status_code == 403


def test_delete_trip_not_found(client, monkeypatch):
    monkeypatch.setattr(app_module, 'get_authenticated_user', lambda: FakeUser('user-1'))
    fake_data = {'trips': []}
    monkeypatch.setattr(trips_module, 'supabase', FakeSupabase(fake_data))

    response = client.delete('/api/trips/999')

    assert response.status_code == 404
