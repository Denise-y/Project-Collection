from pydantic import BaseModel
from typing import List, Optional

#use pydantic model, we can make sure the type of data
class Operation(BaseModel):
    machine: str
    duration: int

class Job(BaseModel):
    id: str
    steps: List[Operation]

class Machine(BaseModel):
    id: str
    name: Optional[str] = None  # Machine name/display name
    status: Optional[str] = "available"

class Event(BaseModel):
    job_id: str
    machine: str
    start_time: int
    end_time: int

class Schedule(BaseModel):
    events: List[Event]
    makespan: int

class Context(BaseModel):
    jobs: List[Job]
    machines: List[Machine]
    rule: str
