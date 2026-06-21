"""
Author: Minpei LIN (machines API tests)
"""

def test_list_machines_returns_default_set_for_authenticated_user(client, auth_headers):
    response = client.get("/api/machines/", headers=auth_headers)

    assert response.status_code == 200
    body = response.json()
    assert [item["id"] for item in body] == ["1", "2", "3"]
    assert all(item["status"] == "available" for item in body)


def test_create_machine_returns_201_and_persists_machine(client, auth_headers):
    response = client.post(
        "/api/machines/",
        headers=auth_headers,
        json={"id": "4", "name": "Laser Cutter"},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["id"] == "4"
    assert body["name"] == "Laser Cutter"
    assert body["status"] == "available"

    list_response = client.get("/api/machines/", headers=auth_headers)
    ids = [item["id"] for item in list_response.json()]
    assert "4" in ids


def test_create_duplicate_machine_returns_400(client, auth_headers):
    first = client.post(
        "/api/machines/",
        headers=auth_headers,
        json={"id": "4", "name": "Laser Cutter"},
    )
    second = client.post(
        "/api/machines/",
        headers=auth_headers,
        json={"id": "4", "name": "Backup Cutter"},
    )

    assert first.status_code == 201
    assert second.status_code == 400
    assert second.json()["detail"] == "Machine 4 already exists"


def test_update_machine_changes_name(client, auth_headers):
    create_response = client.post(
        "/api/machines/",
        headers=auth_headers,
        json={"id": "4", "name": "Laser Cutter"},
    )
    assert create_response.status_code == 201

    response = client.put(
        "/api/machines/4",
        headers=auth_headers,
        json={"name": "Updated Cutter"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == "4"
    assert body["name"] == "Updated Cutter"


def test_delete_machine_removes_machine(client, auth_headers):
    create_response = client.post(
        "/api/machines/",
        headers=auth_headers,
        json={"id": "4", "name": "Laser Cutter"},
    )
    assert create_response.status_code == 201

    delete_response = client.delete("/api/machines/4", headers=auth_headers)

    assert delete_response.status_code == 204
    assert delete_response.content == b""

    list_response = client.get("/api/machines/", headers=auth_headers)
    ids = [item["id"] for item in list_response.json()]
    assert "4" not in ids
