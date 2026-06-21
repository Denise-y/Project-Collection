"""
Author: Zhiqian ZHANG (schedule history API and persistence)
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from Backend.api.deps import get_current_user
from Backend.db.models import ScheduleHistory
from Backend.db.session import get_db


router = APIRouter(prefix="/api/schedules", tags=["Schedule History"])


@router.get("/history")
def list_history(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    items = (
        db.query(ScheduleHistory)
        .filter(ScheduleHistory.user_id == current_user.id)
        .order_by(ScheduleHistory.created_at.desc())
        .limit(200)
        .all()
    )

    # Keep response flexible (frontend is tolerant), but stable field names.
    result = []
    for it in items:
        makespan = None
        machine_utilization = None
        if isinstance(it.result_payload, dict):
            try:
                makespan = it.result_payload.get("schedule", {}).get("makespan")
            except Exception:
                makespan = None
            try:
                machine_utilization = it.result_payload.get("machine_utilization")
            except Exception:
                machine_utilization = None

        result.append(
            {
                "id": it.id,
                "created_at": it.created_at.isoformat() if getattr(it, "created_at", None) else None,
                "goal": it.goal,
                "title": it.title,
                "rule_type": it.rule_type,
                "status": it.status,
                "makespan": makespan,
                "machine_utilization": machine_utilization,
            }
        )
    return result


@router.get("/history/{history_id}")
def get_history_detail(
    history_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)
):
    it = (
        db.query(ScheduleHistory)
        .filter(ScheduleHistory.id == history_id, ScheduleHistory.user_id == current_user.id)
        .first()
    )
    if not it:
        raise HTTPException(status_code=404, detail="History item not found")

    return {
        "id": it.id,
        "created_at": it.created_at.isoformat() if getattr(it, "created_at", None) else None,
        "goal": it.goal,
        "title": it.title,
        "rule_type": it.rule_type,
        "status": it.status,
        "request_payload": it.request_payload,
        "result_payload": it.result_payload,
    }


@router.delete("/history/{history_id}", status_code=204)
def delete_history_item(
    history_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)
):
    it = (
        db.query(ScheduleHistory)
        .filter(ScheduleHistory.id == history_id, ScheduleHistory.user_id == current_user.id)
        .first()
    )
    if not it:
        raise HTTPException(status_code=404, detail="History item not found")

    db.delete(it)
    db.commit()
    return None

