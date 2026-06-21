"""
Author: Minpei LIN (backend schedule API tests and performance coverage)
"""

import random
import time

from Backend.db.models import ScheduleHistory
from Backend.llm.llm_client import LLMClient

# Max time (seconds) allowed for 100-job schedule request (API should not timeout)
SCHEDULE_100_JOBS_TIMEOUT_SEC = 15


def _valid_schedule_payload():
    return {
        "jobs": [
            {
                "id": "Job-1",
                "steps": [
                    {"machine": "1", "duration": 3},
                    {"machine": "2", "duration": 2},
                ],
            },
            {
                "id": "Job-2",
                "steps": [
                    {"machine": "2", "duration": 4},
                ],
            },
        ],
        "goal": "Minimize makespan",
    }


def test_schedule_rejects_empty_jobs(client, auth_headers, db_session):
    response = client.post(
        "/api/schedule/",
        headers=auth_headers,
        json={"jobs": [], "goal": "Minimize makespan"},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Jobs list cannot be empty"
    assert db_session.query(ScheduleHistory).count() == 0


def test_schedule_returns_schedule_payload_with_mocked_llm(
    client, auth_headers, monkeypatch
):
    calls = {"count": 0}

    def fake_generate_rule(self, goal, job_ids=None):
        calls["count"] += 1
        assert goal == "Minimize makespan"
        assert job_ids == ["Job-1", "Job-2"]
        return '{"type": "FIFO", "description": "Deterministic test rule"}'

    monkeypatch.setattr(LLMClient, "generate_rule", fake_generate_rule)

    response = client.post(
        "/api/schedule/",
        headers=auth_headers,
        json=_valid_schedule_payload(),
    )

    assert response.status_code == 200
    assert calls["count"] == 1

    body = response.json()
    assert body["parsed_rule"]["type"] == "FIFO"
    assert body["parsed_rule"]["description"] == "Deterministic test rule"
    assert len(body["schedule"]["events"]) == 3
    assert body["schedule"]["makespan"] > 0
    assert max(event["end_time"] for event in body["schedule"]["events"]) == body["schedule"]["makespan"]


def test_successful_schedule_persists_history(
    client, auth_headers, db_session, test_user, monkeypatch
):
    def fake_generate_rule(self, goal, job_ids=None):
        return '{"type": "FIFO", "description": "Deterministic test rule"}'

    monkeypatch.setattr(LLMClient, "generate_rule", fake_generate_rule)

    response = client.post(
        "/api/schedule/",
        headers=auth_headers,
        json=_valid_schedule_payload(),
    )

    assert response.status_code == 200

    db_session.expire_all()
    history_items = db_session.query(ScheduleHistory).all()

    assert len(history_items) == 1
    history = history_items[0]
    assert history.user_id == test_user.id
    assert history.goal == "Minimize makespan"
    assert history.rule_type == "FIFO"
    assert history.status == "success"
    assert history.request_payload["jobs"][0]["id"] == "Job-1"
    assert history.result_payload["schedule"] == response.json()["schedule"]


def test_schedule_plain_text_llm_rule_is_parsed_as_spt(client, auth_headers, monkeypatch):
    def fake_generate_rule(self, goal, job_ids=None):
        return "Use shortest processing time first for this workload."

    monkeypatch.setattr(LLMClient, "generate_rule", fake_generate_rule)

    response = client.post(
        "/api/schedule/",
        headers=auth_headers,
        json=_valid_schedule_payload(),
    )

    assert response.status_code == 200
    body = response.json()
    assert body["parsed_rule"]["type"] == "SPT"
    assert body["parsed_rule"]["description"] == "Shortest Processing Time"
    assert len(body["schedule"]["events"]) == 3


def test_schedule_invalid_parametric_rule_falls_back_to_fifo_and_marks_history(
    client, auth_headers, db_session, monkeypatch
):
    def fake_generate_rule(self, goal, job_ids=None):
        return '{"rule_type":"parametric_score","weights":{}}'

    monkeypatch.setattr(LLMClient, "generate_rule", fake_generate_rule)

    response = client.post(
        "/api/schedule/",
        headers=auth_headers,
        json=_valid_schedule_payload(),
    )

    assert response.status_code == 200
    body = response.json()
    assert body["parsed_rule"]["type"] == "FIFO"
    assert body["parsed_rule"]["rule_type"] == "fifo"
    assert "fell back to fifo" in body["parsed_rule"]["_safety_message"].lower()

    db_session.expire_all()
    history = db_session.query(ScheduleHistory).one()
    assert history.status == "fallback_fifo"


def _make_large_schedule_payload(
    n_jobs: int = 100,
    steps_min: int = 3,
    steps_max: int = 5,
    machine_ids: list[str] | None = None,
    duration_min: int = 5,
    duration_max: int = 60,
    seed: int = 42,
) -> dict:
    """Generate a schedule request with many jobs for load/scale tests.
    Each job has steps_min..steps_max steps on machines from machine_ids,
    with duration in [duration_min, duration_max] (e.g. 5–60 sec).
    """
    if machine_ids is None:
        machine_ids = ["1", "2", "3", "4", "5"]
    rng = random.Random(seed)
    jobs = []
    for i in range(n_jobs):
        n_steps = rng.randint(steps_min, steps_max)
        steps = []
        for _ in range(n_steps):
            machine = rng.choice(machine_ids)
            duration = rng.randint(duration_min, duration_max)
            steps.append({"machine": machine, "duration": duration})
        jobs.append({"id": f"Job-{i + 1}", "steps": steps})
    return {
        "jobs": jobs,
        "goal": "Minimize makespan while avoiding long idle periods on any machine.",
    }


def test_schedule_100_jobs_completes_in_reasonable_time(
    client, auth_headers, monkeypatch
):
    """100+ jobs, 3–5 steps each, 3–5 machines, 5–60 sec per step.
    Request must return within SCHEDULE_100_JOBS_TIMEOUT_SEC and yield valid schedule.
    """
    def fake_generate_rule(self, goal, job_ids=None):
        assert goal and "makespan" in goal.lower()
        assert job_ids is not None and len(job_ids) == 100
        return '{"type": "FIFO", "description": "Deterministic test rule"}'

    monkeypatch.setattr(LLMClient, "generate_rule", fake_generate_rule)

    payload = _make_large_schedule_payload(
        n_jobs=100,
        steps_min=3,
        steps_max=5,
        duration_min=5,
        duration_max=60,
    )

    start = time.perf_counter()
    response = client.post(
        "/api/schedule/",
        headers=auth_headers,
        json=payload,
    )
    elapsed = time.perf_counter() - start

    assert response.status_code == 200, response.text
    assert elapsed < SCHEDULE_100_JOBS_TIMEOUT_SEC, (
        f"Schedule took {elapsed:.1f}s, expected < {SCHEDULE_100_JOBS_TIMEOUT_SEC}s"
    )

    body = response.json()
    schedule = body["schedule"]
    events = schedule["events"]
    makespan = schedule["makespan"]

    assert len(events) >= 100, "Should have at least one event per job"
    assert makespan > 0
    assert max(e["end_time"] for e in events) == makespan
