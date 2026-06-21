from pydantic import BaseModel
from typing import List, Dict
from Backend.domain.models import Job, Schedule


class ScheduleRequest(BaseModel):
    jobs: List[Job]
    goal: str

class ScheduleResponse(BaseModel):
    raw_rule: str
    parsed_rule: Dict
    schedule: Schedule
