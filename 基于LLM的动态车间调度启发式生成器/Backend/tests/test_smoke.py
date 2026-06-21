"""
Author: Minpei LIN (backend smoke tests)
"""

def test_root_healthcheck(client):
    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {"message": "IntelliSched Backend is running"}


def test_authenticated_fixture_can_access_protected_endpoint(client, auth_headers):
    response = client.get("/api/machines/", headers=auth_headers)

    assert response.status_code == 200
    assert isinstance(response.json(), list)
