"""OpenRouteService (ORS) helpers for building a single multi-stop route.

Two ORS endpoints are used:
  * /optimization  — given the driver's start/end and each rider's pickup as a
    "job", returns the optimal order to visit the pickups (a vehicle-routing
    solve). This is what turns scattered pickups into "stops along the way".
  * /v2/directions — given an ordered list of coordinates, returns the drivable
    road geometry plus total distance and duration.

ORS expects coordinates as [longitude, latitude] (note the order) and the API
key in a bare `Authorization` header (no "Bearer" prefix). We take/return
(lat, lng) everywhere else in the app and convert at the boundary here.
"""
import os

import httpx

ORS_BASE = "https://api.openrouteservice.org"
_TIMEOUT = 20.0


class RoutingError(Exception):
    """Raised when routing can't be completed (missing key or an ORS failure)."""


def _api_key():
    key = os.environ.get("ORS_API_KEY")
    if not key:
        raise RoutingError("ORS_API_KEY is not configured on the server.")
    return key


def optimize_pickup_order(start, end, pickups):
    """Return the pickup ids in the optimal order to visit them.

    start / end: (lat, lng) tuples for the driver's origin and destination.
    pickups: list of dicts each with 'id', 'lat', 'lng'.
    Returns a list of pickup ids; empty if there are no pickups.
    """
    if not pickups:
        return []

    body = {
        "jobs": [
            {"id": p["id"], "location": [p["lng"], p["lat"]]} for p in pickups
        ],
        "vehicles": [
            {
                "id": 1,
                "profile": "driving-car",
                "start": [start[1], start[0]],
                "end": [end[1], end[0]],
            }
        ],
    }

    try:
        resp = httpx.post(
            f"{ORS_BASE}/optimization",
            json=body,
            headers={"Authorization": _api_key()},
            timeout=_TIMEOUT,
        )
    except httpx.HTTPError as exc:
        raise RoutingError(f"Could not reach ORS optimization: {exc}") from exc

    if resp.status_code != 200:
        raise RoutingError(f"ORS optimization failed ({resp.status_code}): {resp.text}")

    steps = resp.json()["routes"][0]["steps"]
    return [s["job"] for s in steps if s["type"] == "job"]


def route_geometry(coords):
    """Fetch the drivable route through an ordered list of (lat, lng) points.

    Returns { 'geometry': [[lat, lng], ...], 'distance_meters', 'duration_seconds' }.
    Geometry is returned as (lat, lng) pairs, ready for a Leaflet polyline.
    """
    body = {"coordinates": [[c[1], c[0]] for c in coords]}

    try:
        resp = httpx.post(
            f"{ORS_BASE}/v2/directions/driving-car/geojson",
            json=body,
            headers={"Authorization": _api_key()},
            timeout=_TIMEOUT,
        )
    except httpx.HTTPError as exc:
        raise RoutingError(f"Could not reach ORS directions: {exc}") from exc

    if resp.status_code != 200:
        raise RoutingError(f"ORS directions failed ({resp.status_code}): {resp.text}")

    feature = resp.json()["features"][0]
    geometry = [[lat, lng] for lng, lat in feature["geometry"]["coordinates"]]
    summary = feature["properties"].get("summary", {})
    return {
        "geometry": geometry,
        "distance_meters": summary.get("distance"),
        "duration_seconds": summary.get("duration"),
    }
