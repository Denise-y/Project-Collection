"""
Author: Yoong Theng WAN (core SchedulingEngine and multi-phase execution)
Collaborator: Zhiqian ZHANG (integration with safety mechanisms and parametric scoring context)
"""

from typing import List, Dict, Tuple, Optional
from Backend.domain.models import Job
from Backend.engine.core_scheduler import Scheduler, Task
from Backend.engine.heuristics import build_priority_fn_from_json, fifo_priority


def _phase1_tie_break(available: List[Task], current_time: float) -> Optional[int]:
    """Tie-breaker for phase 1: sort by (job_id, op_index), pick first."""
    if not available:
        return None
    ordered = sorted(available, key=lambda t: (t.job_id, t.op_index))
    return available.index(ordered[0])


def _find_earliest_slot(
    intervals: List[Tuple[float, float]], duration: float, earliest_start: float
) -> Tuple[float, float]:
    """Find earliest [start, end) slot of length duration >= earliest_start, not overlapping intervals."""
    intervals = sorted(intervals, key=lambda x: x[0])
    t = earliest_start
    for (s, e) in intervals:
        if t + duration <= s:
            return (t, t + duration)
        t = max(t, e)
    return (t, t + duration)


def _run_multiphase(
    jobs_dict: Dict[str, List[Tuple[str, float]]],
    job_priority: Dict[str, int],
) -> List[Dict]:
    """
    Multi-phase scheduling: number of phases = number of distinct priority levels.
    LLM assigns each job a priority (0..3); we schedule tier by tier (highest first).
    Same tier: schedule together (tie-break by job_id). Lower tiers fill into gaps.
    Returns list of {"job_id", "machine", "start_time", "end_time"}.
    """
    if not job_priority:
        return []

    # Tiers descending, e.g. [3, 2, 1, 0]; jobs not in job_priority get 0
    all_job_ids = set(jobs_dict.keys())
    tiers = sorted(set(job_priority.get(jid, 0) for jid in all_job_ids), reverse=True)

    machine_intervals: Dict[str, List[Tuple[float, float]]] = {}
    all_events: List[Dict] = []

    for tier in tiers:
        tier_job_ids = [jid for jid in all_job_ids if job_priority.get(jid, 0) == tier]
        if not tier_job_ids:
            continue

        tier_jobs = {jid: jobs_dict[jid] for jid in tier_job_ids if jid in jobs_dict}
        if not tier_jobs:
            continue

        # Schedule this tier as early as possible (given current machine_intervals)
        scheduler_tier = Scheduler(
            jobs=tier_jobs,
            priority_fn=_phase1_tie_break,
            fallback_fn=_phase1_tie_break,
        )
        df_tier = scheduler_tier.run()

        # Merge tier schedule into global timeline: place each op in earliest feasible slot (order by Start_Time)
        job_prev_end: Dict[str, float] = {jid: 0.0 for jid in tier_job_ids}
        tier_rows = df_tier.sort_values(by=["Start_Time", "Job_ID", "Op_Index"]).iterrows()
        for _, row in tier_rows:
            jid = str(row["Job_ID"])
            mid = str(row["Machine_ID"])
            proc = float(row["Proc_Time"])
            earliest = job_prev_end.get(jid, 0.0)
            intervals = machine_intervals.get(mid, [])
            start_f, end_f = _find_earliest_slot(intervals, proc, earliest)
            start_i, end_i = int(start_f), int(end_f)
            all_events.append({"job_id": jid, "machine": mid, "start_time": start_i, "end_time": end_i})
            machine_intervals.setdefault(mid, []).append((start_f, end_f))
            job_prev_end[jid] = end_f

    # Jobs that were not in any tier (shouldn't happen if job_priority covers all)
    scheduled_jids = {e["job_id"] for e in all_events}
    remaining = [jid for jid in sorted(all_job_ids) if jid not in scheduled_jids]
    for jid in remaining:
        ops = jobs_dict[jid]
        job_prev_end = 0.0
        for (machine_id, proc_time) in ops:
            intervals = machine_intervals.get(machine_id, [])
            start_f, end_f = _find_earliest_slot(intervals, float(proc_time), job_prev_end)
            start_i, end_i = int(start_f), int(end_f)
            all_events.append({
                "job_id": jid,
                "machine": machine_id,
                "start_time": start_i,
                "end_time": end_i,
            })
            machine_intervals.setdefault(machine_id, []).append((start_f, end_f))
            job_prev_end = end_f

    all_events.sort(key=lambda e: (e["start_time"], e["job_id"], e["machine"]))
    return all_events


class SchedulingEngine:
    """
    Core scheduling engine using the new discrete-event scheduler.
    
    This class acts as an adapter layer between domain models and the core Scheduler,
    and handles high-level safety mechanisms (exception recovery, fallback to FIFO).
    """

    def run(self, jobs: List[Job], heuristic: Dict, machines) -> List[Dict]:
        """
        Execute scheduling based on the given heuristic with safety net mechanism.
        
        The safety net catches any exceptions during scheduling execution and automatically
        falls back to FIFO (First-In-First-Out) strategy to ensure the system never crashes.
        
        Args:
            jobs: List of Job objects from domain models
            heuristic: Dictionary containing rule information (type, key, order, etc.)
            machines: List of Machine objects (not directly used, but kept for compatibility)
        
        Returns:
            List of schedule events in format: [{"job_id": str, "machine": str, "start_time": float, "end_time": float}, ...]
        """
        existing_safety_message = ""
        if isinstance(heuristic, dict):
            existing_safety_message = str(heuristic.get("_safety_message", "")).strip()

        # Convert jobs from domain models to scheduler format: {job_id: [(machine_id, proc_time), ...]}
        jobs_dict = {}
        for job in jobs:
            steps = [(step.machine, float(step.duration)) for step in job.steps]
            jobs_dict[job.id] = steps

        jp = isinstance(heuristic, dict) and heuristic.get("job_priority") or None
        if isinstance(jp, dict) and jp:
            # Multi-phase: number of phases = distinct priority levels (LLM-driven)
            try:
                schedule_data = _run_multiphase(jobs_dict, jp)
                safety_message = "Rule executed successfully (multi-phase)"
                if existing_safety_message:
                    safety_message = f"{existing_safety_message} {safety_message}".strip()
                heuristic["_safety_message"] = safety_message
                heuristic["_multi_phase"] = True
                return schedule_data
            except Exception as e:
                print(f"[SchedulingEngine] Multi-phase failed: {e}. Falling back to single-phase.")
                heuristic["_safety_message"] = f"Multi-phase failed: {e}; fell back to single-phase."

        # Single-phase: scoring or FIFO
        context = {"job_lengths": {jid: len(ops) for jid, ops in jobs_dict.items()}}
        if isinstance(heuristic, dict) and isinstance(heuristic.get("job_priority"), dict):
            context["job_priority"] = heuristic.get("job_priority")
        priority_fn = build_priority_fn_from_json(heuristic, context=context)

        try:
            scheduler = Scheduler(
                jobs=jobs_dict,
                priority_fn=priority_fn,
                fallback_fn=fifo_priority
            )
            df = scheduler.run()
            safety_message = "Rule executed successfully"
        except Exception as e:
            print(f"[SchedulingEngine] Rule execution failed: {e}. Falling back to FIFO.")
            scheduler = Scheduler(
                jobs=jobs_dict,
                priority_fn=fifo_priority,
                fallback_fn=fifo_priority
            )
            df = scheduler.run()
            safety_message = "Rule execution failed — automatically fell back to FIFO"

        schedule_data = []
        for _, row in df.iterrows():
            schedule_data.append({
                "job_id": str(row["Job_ID"]),
                "machine": str(row["Machine_ID"]),
                "start_time": int(row["Start_Time"]),
                "end_time": int(row["End_Time"])
            })

        if existing_safety_message:
            safety_message = f"{existing_safety_message} {safety_message}".strip()
        heuristic["_safety_message"] = safety_message
        return schedule_data
