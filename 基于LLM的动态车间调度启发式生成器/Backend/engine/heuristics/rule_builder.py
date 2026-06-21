"""
Builder for creating priority functions from JSON rules.

This module converts LLM-generated rule specifications into executable
priority functions that can be used by the scheduling engine.

Author: Zhiqian ZHANG (parametric scoring and heuristic rule builder)
"""
from typing import Dict, Optional, Any
from Backend.engine.core_scheduler import Task
from Backend.engine.heuristics.base import PriorityFunction
from Backend.engine.heuristics.priority_functions import (
    fifo_priority,
    spt_priority,
    lpt_priority
)


def build_priority_fn_from_json(rule_json: Dict, context: Optional[Dict[str, Any]] = None) -> PriorityFunction:
    """
    Build a dynamic priority function from a JSON rule specification.
    
    Designed to convert a LLM-generated text or JSON rule into a real, 
    executable Python function that the scheduling engine can use to decide 
    which task to schedule next.
    
    Supported rule types:
    - "fifo": First-In-First-Out
    - "spt": Shortest Processing Time
    - "lpt": Longest Processing Time  
    - "parametric_score": Weighted scoring over predefined features
    
    Examples:
        >>> rule = {"type": "FIFO"}
        >>> fn = build_priority_fn_from_json(rule)  # Returns FIFO function
        
    Args:
        rule_json: Dictionary containing rule specification
        context: Optional runtime context from the scheduling engine (e.g. job_lengths)
        
    Returns:
        Priority function that can be used by the scheduler
    """
    rule_type = rule_json.get("rule_type", "").lower()
    
    if rule_type == "parametric_score":
        weights = rule_json.get("weights") or {}
        if not isinstance(weights, dict) or not weights:
            return fifo_priority

        job_lengths: Dict[str, int] = {}
        job_priority: Dict[str, float] = {}
        if isinstance(context, dict):
            jl = context.get("job_lengths")
            if isinstance(jl, dict):
                job_lengths = {str(k): int(v) for k, v in jl.items() if v is not None}
            jp = context.get("job_priority")
            if isinstance(jp, dict):
                # values are expected to be numeric; coerce to float
                for k, v in jp.items():
                    try:
                        job_priority[str(k)] = float(v)
                    except Exception:
                        continue

        def _feature(task: Task, name: str) -> float:
            if name == "inverse_processing_time":
                p = float(task.proc_time) if task.proc_time else 0.0
                return (1.0 / p) if p > 0 else 0.0
            if name == "urgency":
                # Implemented as inverse remaining operations: 1 / remaining_ops
                total_ops = job_lengths.get(str(task.job_id))
                if total_ops is None:
                    return 0.0
                remaining = max(1, int(total_ops) - int(task.op_index))
                return 1.0 / float(remaining)
            if name == "priority":
                return float(job_priority.get(str(task.job_id), 0.0))
            return 0.0

        def _normalize(vals: list[float]) -> list[float]:
            if not vals:
                return vals
            vmin = min(vals)
            vmax = max(vals)
            if vmax - vmin <= 1e-12:
                return [0.0 for _ in vals]
            scale = vmax - vmin
            return [(v - vmin) / scale for v in vals]

        def priority_fn(available: list[Task], current_time: float) -> Optional[int]:
            if not available:
                return None
            feature_names = [k for k, w in weights.items() if isinstance(k, str) and isinstance(w, (int, float))]
            if not feature_names:
                return 0

            # Precompute normalized feature values per feature across available tasks
            per_feature_norm: Dict[str, list[float]] = {}
            for fname in feature_names:
                raw_vals = [_feature(t, fname) for t in available]
                per_feature_norm[fname] = _normalize(raw_vals)

            best_idx = 0
            best_score = None
            for i, t in enumerate(available):
                score = 0.0
                for fname in feature_names:
                    try:
                        w = float(weights.get(fname, 0.0))
                    except Exception:
                        w = 0.0
                    score += w * float(per_feature_norm[fname][i])
                if best_score is None or score > best_score:
                    best_score = score
                    best_idx = i
            return best_idx

        return priority_fn
    
    # Handle named rule types (for backward compatibility)
    elif rule_type == "fifo" or rule_json.get("type") == "FIFO":
        return fifo_priority
    elif rule_type == "spt" or rule_json.get("type") == "SPT":
        return spt_priority
    elif rule_type == "lpt" or rule_json.get("type") == "LPT":
        return lpt_priority
    else:
        # Default to FIFO if rule type is unknown
        return fifo_priority

