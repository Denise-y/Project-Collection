"""
Core scheduling engine implementation for job-shop scheduling.

Main classes:
- Task (dataclass): Represents a schedulable operation instance
- Scheduler (class): Main scheduler that takes jobs data and a priority function

Note: Priority functions are defined in Backend.engine.heuristics package.

Author: Yoong Theng WAN (discrete-event Scheduler and Task model)
"""

from dataclasses import dataclass
from typing import List, Tuple, Callable, Dict, Optional
import pandas as pd


@dataclass
class Task:
    """Represents a schedulable operation instance"""
    job_id: str
    op_index: int                # Step index within the job
    machine_id: str
    proc_time: float             # Processing time (in seconds or consistent time unit)
    release_time: float = 0.0    # When this task becomes available (default 0)
    # Internal fields
    start_time: Optional[float] = None
    end_time: Optional[float] = None

    def __repr__(self):
        return f"Task(job={self.job_id}, op={self.op_index}, M={self.machine_id}, p={self.proc_time})"


class Scheduler:
    """
    A simple discrete-event scheduler using step-by-step time advancement.

    Parameters:
    - jobs: dict mapping job_id -> list of (machine_id, proc_time) tuples
    - priority_fn: Callable[(available_tasks, current_time) -> selected_task_index]
        available_tasks: List[Task] available to be scheduled (not started, predecessors done, and machine idle)
        priority_fn should return the index of the selected task in available_tasks (or None if none chosen)
    - fallback_fn: Fallback strategy when priority_fn throws an error or returns invalid value (default FIFO)
    """

    def __init__(self,
                 jobs: Dict[str, List[Tuple[str, float]]],
                 priority_fn: Callable[[List[Task], float], Optional[int]],
                 fallback_fn: Optional[Callable[[List[Task], float], Optional[int]]] = None):
        self.jobs = jobs
        self.priority_fn = priority_fn
        # Use provided fallback or default to internal FIFO fallback
        self.fallback_fn = fallback_fn or self._fifo_idx
        # Scheduler state
        self.time = 0.0
        self.machine_busy_until: Dict[str, float] = {}   # machine_id -> busy_until_time
        self.job_next_op: Dict[str, int] = {jid: 0 for jid in jobs.keys()}
        self.scheduled_tasks: List[Task] = []

    # Default FIFO fallback: choose the first available task
    @staticmethod
    def _fifo_idx(available_tasks: List[Task], current_time: float) -> Optional[int]:
        """Default FIFO fallback function"""
        return 0 if available_tasks else None

    def _find_prev_op_end_time(self, job_id: str, op_idx: int) -> Optional[float]:
        """Find the end time of the previous operation (op_idx - 1) for the given job."""
        if op_idx == 0:
            return 0.0  # First operation has no predecessor
        # Search in scheduled_tasks for the previous operation
        for task in self.scheduled_tasks:
            if task.job_id == job_id and task.op_index == op_idx - 1:
                return task.end_time
        return None  # Previous operation not yet scheduled
    
    def _gather_available_tasks(self) -> List[Task]:
        """Generate a list of tasks that can be scheduled at the current time (self.time), ignoring priority."""
        available: List[Task] = []
        for job_id, ops in self.jobs.items():
            next_op_idx = self.job_next_op[job_id]
            if next_op_idx >= len(ops):
                continue  # job already completed
            
            # Check if previous operation is completed (precedence constraint)
            prev_op_end_time = self._find_prev_op_end_time(job_id, next_op_idx)
            if prev_op_end_time is None:
                continue  # Previous operation not yet completed
            if prev_op_end_time > self.time:
                continue  # Previous operation hasn't finished yet
            
            machine_id, proc_time = ops[next_op_idx]
            # A task is available if its machine is idle at the current time
            machine_free_time = self.machine_busy_until.get(machine_id, 0.0)
            if machine_free_time <= self.time:
                task = Task(job_id=job_id, op_index=next_op_idx, machine_id=machine_id, proc_time=proc_time)
                available.append(task)
        return available

    def _advance_time_to_next_event(self):
        """When no task is available, advance time to the next machine free time."""
        future_times = [t for t in self.machine_busy_until.values() if t > self.time]
        if not future_times:
            return  # all machines idle (should not happen unless all jobs are done)
        self.time = min(future_times)

    def run(self, max_steps: int = 100000) -> pd.DataFrame:
        """Run the scheduler and return a DataFrame with scheduling results."""
        steps = 0
        total_ops = sum(len(ops) for ops in self.jobs.values())
        while len(self.scheduled_tasks) < total_ops and steps < max_steps:
            steps += 1
            available = self._gather_available_tasks()
            if not available:
                # no available tasks: advance time to next event
                self._advance_time_to_next_event()
                continue

            # Try priority_fn; if error or invalid result, use fallback_fn
            try:
                sel_idx = self.priority_fn(available, self.time)
                if sel_idx is None or not (0 <= sel_idx < len(available)):
                    sel_idx = self.fallback_fn(available, self.time)
            except Exception as e:
                print(f"[Scheduler] priority_fn error: {e}. Falling back.")
                sel_idx = self.fallback_fn(available, self.time)

            if sel_idx is None:
                # nothing selected; advance time
                self._advance_time_to_next_event()
                continue

            task = available[sel_idx]
            task.start_time = self.time
            task.end_time = self.time + task.proc_time

            # mark machine as busy
            self.machine_busy_until[task.machine_id] = task.end_time

            # record scheduled task
            self.scheduled_tasks.append(task)

            # move job to next operation
            self.job_next_op[task.job_id] += 1

        # Build output dataframe
        rows = []
        for t in self.scheduled_tasks:
            rows.append({
                "Job_ID": t.job_id,
                "Machine_ID": t.machine_id,
                "Op_Index": t.op_index,
                "Start_Time": t.start_time,
                "End_Time": t.end_time,
                "Proc_Time": t.proc_time
            })
        df = pd.DataFrame(rows)
        if not df.empty:
            df = df.sort_values(by=["Start_Time", "Job_ID", "Op_Index"]).reset_index(drop=True)
        return df

