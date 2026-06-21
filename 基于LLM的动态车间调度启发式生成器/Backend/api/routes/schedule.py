"""
Author: Zizhen WANG (scheduling API and end-to-end orchestration)
Collaborators: Yoong Theng WAN, Minpei LIN, Zhiqian ZHANG (engine, LLM, persistence integration)
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from Backend.api.models import ScheduleRequest, ScheduleResponse
from Backend.api.deps import get_current_user
from Backend.db.session import get_db
from Backend.db.models import ScheduleHistory
from Backend.services.job_data_converter import JobDataConverter
from Backend.llm.llm_client import LLMClient
from Backend.llm.rule_parser import RuleParser
from Backend.llm.safety_net import SafetyNet
from Backend.engine.scheduling_engine import SchedulingEngine
from Backend.services.machine_service import MachineService
from Backend.services.gantt_service import GanttService

router = APIRouter(prefix="/api/schedule", tags=["Schedule"])


def _did_validation_fallback(parsed_rule: dict, heuristic: dict) -> bool:
    if not isinstance(heuristic, dict):
        return False

    safety_message = str(heuristic.get("_safety_message", "")).lower()
    if "fell back to fifo" in safety_message or "fallback" in safety_message:
        return True

    heuristic_rule_type = str(heuristic.get("rule_type", "")).lower()
    heuristic_type = str(heuristic.get("type", "")).upper()

    if not parsed_rule:
        return heuristic_rule_type == "fifo" or heuristic_type == "FIFO"

    parsed_rule_type = str(parsed_rule.get("rule_type", "")).lower()
    parsed_type = str(parsed_rule.get("type", "")).upper()

    if parsed_rule_type == "parametric_score" and heuristic_rule_type == "fifo":
        return True

    if parsed_type and heuristic_type == "FIFO" and parsed_type != "FIFO":
        return True

    return False

@router.post("/", response_model=ScheduleResponse)
def schedule_jobs(
    request: ScheduleRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Main scheduling endpoint"""
    if not request.jobs:
        raise HTTPException(status_code=400, detail="Jobs list cannot be empty")
    jobs = JobDataConverter().from_json(request.model_dump())
    machines = MachineService().load_from_jobs(jobs)

    job_ids = [j.id for j in jobs]
    raw_rule = LLMClient().generate_rule(request.goal, job_ids=job_ids)
    parsed_rule = RuleParser().parse(raw_rule)
    heuristic = SafetyNet().validate_or_fallback(parsed_rule, allowed_job_ids=set(job_ids))
    used_fallback = _did_validation_fallback(parsed_rule, heuristic)

    schedule_data = SchedulingEngine().run(jobs, heuristic, machines)
    schedule = GanttService().build(schedule_data)
    used_fallback = used_fallback or "fell back to fifo" in str(heuristic.get("_safety_message", "")).lower()

    response = ScheduleResponse(
        raw_rule=raw_rule,
        parsed_rule=heuristic,
        schedule=schedule
    )

    # Persist history (best-effort; should not break scheduling if DB write fails)
    try:
        result_payload = jsonable_encoder(response)
        req_payload = jsonable_encoder(request)
        rule_type = None
        try:
            rule_type = (
                (parsed_rule or {}).get("type")
                or (parsed_rule or {}).get("rule_type")
                or (heuristic or {}).get("type")
                or (heuristic or {}).get("rule_type")
            )
        except Exception:
            rule_type = None
        hist_status = "fallback_fifo" if used_fallback else "success"

        hist = ScheduleHistory(
            user_id=current_user.id,
            goal=request.goal,
            title=None,
            rule_type=str(rule_type) if rule_type else None,
            status=hist_status,
            request_payload=req_payload,
            result_payload=result_payload,
        )
        db.add(hist)
        db.commit()
    except Exception as e:
        print(f"[schedule] Failed to persist history: {e}")

    return response
