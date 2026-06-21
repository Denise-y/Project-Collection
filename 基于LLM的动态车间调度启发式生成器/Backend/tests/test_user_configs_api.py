"""
Author: Minpei LIN (user configuration API tests)
"""

from Backend.db.models import UserConfig


def test_get_user_config_returns_none_when_missing(client, auth_headers):
    response = client.get("/api/user/configs/preferences", headers=auth_headers)

    assert response.status_code == 200
    assert response.json() == {"key": "preferences", "value": None}


def test_set_user_config_creates_value(client, auth_headers, db_session, test_user):
    payload = {"theme": "light", "pageSize": 20}

    response = client.put("/api/user/configs/preferences", headers=auth_headers, json=payload)

    assert response.status_code == 200
    assert response.json() == {"key": "preferences", "value": payload}

    stored = (
        db_session.query(UserConfig)
        .filter(UserConfig.user_id == test_user.id, UserConfig.config_key == "preferences")
        .first()
    )
    assert stored is not None
    assert stored.config_value == payload


def test_set_user_config_updates_existing_value(client, auth_headers, db_session, test_user):
    existing = UserConfig(
        user_id=test_user.id,
        config_key="preferences",
        config_value={"theme": "dark"},
    )
    db_session.add(existing)
    db_session.commit()

    response = client.put(
        "/api/user/configs/preferences",
        headers=auth_headers,
        json={"theme": "light", "compact": True},
    )

    assert response.status_code == 200
    assert response.json()["value"] == {"theme": "light", "compact": True}

    db_session.refresh(existing)
    assert existing.config_value == {"theme": "light", "compact": True}


def test_user_config_isolated_per_user(
    client, auth_headers, db_session, test_user, user_factory
):
    other_user = user_factory(username="other-user", email="other@example.com")
    db_session.add(
        UserConfig(
            user_id=other_user.id,
            config_key="preferences",
            config_value={"theme": "other-user-dark"},
        )
    )
    db_session.commit()

    create_response = client.put(
        "/api/user/configs/preferences",
        headers=auth_headers,
        json={"theme": "current-user-light"},
    )
    assert create_response.status_code == 200

    response = client.get("/api/user/configs/preferences", headers=auth_headers)

    assert response.status_code == 200
    assert response.json() == {
        "key": "preferences",
        "value": {"theme": "current-user-light"},
    }

    other_value = (
        db_session.query(UserConfig)
        .filter(UserConfig.user_id == other_user.id, UserConfig.config_key == "preferences")
        .one()
    )
    assert other_value.config_value == {"theme": "other-user-dark"}
