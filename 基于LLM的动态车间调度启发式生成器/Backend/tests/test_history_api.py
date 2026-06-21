"""
Author: Minpei LIN (schedule history API tests)
"""

from datetime import datetime, timedelta

from Backend.db.models import ScheduleHistory


def test_list_history_returns_only_current_user_items_in_desc_order(
    client, auth_headers, db_session, test_user, user_factory
):
    other_user = user_factory(username="other-user", email="other@example.com")
    earlier = datetime(2026, 1, 1, 8, 0, 0)
    later = earlier + timedelta(hours=1)

    own_old = ScheduleHistory(
        user_id=test_user.id,
        goal="Older run",
        title="Old",
        rule_type="FIFO",
        status="success",
        request_payload={"jobs": [{"id": "Job-1"}]},
        result_payload={"schedule": {"makespan": 5}, "machine_utilization": 50},
        created_at=earlier,
    )
    own_new = ScheduleHistory(
        user_id=test_user.id,
        goal="Newer run",
        title="New",
        rule_type="SPT",
        status="fallback_fifo",
        request_payload={"jobs": [{"id": "Job-2"}]},
        result_payload={"schedule": {"makespan": 3}, "machine_utilization": 75},
        created_at=later,
    )
    other_item = ScheduleHistory(
        user_id=other_user.id,
        goal="Other user's run",
        title="Other",
        rule_type="LPT",
        status="success",
        request_payload={"jobs": [{"id": "Job-3"}]},
        result_payload={"schedule": {"makespan": 9}, "machine_utilization": 10},
        created_at=later,
    )
    db_session.add_all([own_old, own_new, other_item])
    db_session.commit()

    response = client.get("/api/schedules/history", headers=auth_headers)

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 2
    assert [item["goal"] for item in body] == ["Newer run", "Older run"]
    assert body[0]["rule_type"] == "SPT"
    assert body[0]["status"] == "fallback_fifo"
    assert body[0]["makespan"] == 3
    assert body[0]["machine_utilization"] == 75


def test_get_history_detail_returns_owned_item(client, auth_headers, db_session, test_user):
    history = ScheduleHistory(
        user_id=test_user.id,
        goal="Inspect detail",
        title="Detail title",
        rule_type="FIFO",
        status="success",
        request_payload={"jobs": [{"id": "Job-1"}]},
        result_payload={"schedule": {"makespan": 6}},
    )
    db_session.add(history)
    db_session.commit()
    db_session.refresh(history)

    response = client.get(f"/api/schedules/history/{history.id}", headers=auth_headers)

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == history.id
    assert body["goal"] == "Inspect detail"
    assert body["title"] == "Detail title"
    assert body["request_payload"] == {"jobs": [{"id": "Job-1"}]}
    assert body["result_payload"] == {"schedule": {"makespan": 6}}


def test_get_history_detail_returns_404_for_other_users_item(
    client, auth_headers, db_session, user_factory
):
    other_user = user_factory(username="other-user", email="other@example.com")
    history = ScheduleHistory(
        user_id=other_user.id,
        goal="Other user detail",
        rule_type="FIFO",
        status="success",
        request_payload={},
        result_payload={},
    )
    db_session.add(history)
    db_session.commit()
    db_session.refresh(history)

    response = client.get(f"/api/schedules/history/{history.id}", headers=auth_headers)

    assert response.status_code == 404
    assert response.json()["detail"] == "History item not found"


def test_delete_history_item_removes_owned_item(client, auth_headers, db_session, test_user):
    history = ScheduleHistory(
        user_id=test_user.id,
        goal="Delete me",
        rule_type="FIFO",
        status="success",
        request_payload={},
        result_payload={},
    )
    db_session.add(history)
    db_session.commit()
    db_session.refresh(history)
    history_id = history.id

    response = client.delete(f"/api/schedules/history/{history_id}", headers=auth_headers)

    assert response.status_code == 204
    db_session.expire_all()
    assert db_session.get(ScheduleHistory, history_id) is None


def test_delete_history_item_returns_404_for_other_users_item(
    client, auth_headers, db_session, user_factory
):
    other_user = user_factory(username="other-user", email="other@example.com")
    history = ScheduleHistory(
        user_id=other_user.id,
        goal="Protected",
        rule_type="FIFO",
        status="success",
        request_payload={},
        result_payload={},
    )
    db_session.add(history)
    db_session.commit()
    db_session.refresh(history)

    response = client.delete(f"/api/schedules/history/{history.id}", headers=auth_headers)

    assert response.status_code == 404
    assert response.json()["detail"] == "History item not found"
