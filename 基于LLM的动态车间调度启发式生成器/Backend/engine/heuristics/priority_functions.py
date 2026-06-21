"""
Standard priority functions for job-shop scheduling.

Each priority function takes a list of available tasks and current time,
and returns the index of the task to schedule next, or None if none should be scheduled.

Author: Zhiqian ZHANG (FIFO/SPT/LPT priority strategies and baseline heuristics)
"""
from typing import List, Optional
from Backend.engine.core_scheduler import Task
from Backend.engine.heuristics.base import PriorityFunction


def fifo_priority(available: List[Task], current_time: float) -> Optional[int]:
    """
    First-In-First-Out priority function.
    
    Chooses the first task in the available list, maintaining input order.
    
    Args:
        available: List of available tasks
        current_time: Current simulation time
        
    Returns:
        Index of selected task (0) or None if no tasks available
    """
    return 0 if available else None


def spt_priority(available: List[Task], current_time: float) -> Optional[int]:
    """
    Shortest Processing Time priority function.
    
    Chooses the task with the shortest processing time.
    This minimizes makespan for simple cases.
    
    Args:
        available: List of available tasks
        current_time: Current simulation time
        
    Returns:
        Index of task with shortest proc_time, or None if no tasks available
    """
    if not available:
        return None
    min_idx = 0
    min_p = available[0].proc_time
    for i, t in enumerate(available):
        if t.proc_time < min_p:
            min_p = t.proc_time
            min_idx = i
    return min_idx


def lpt_priority(available: List[Task], current_time: float) -> Optional[int]:
    """
    Longest Processing Time priority function.
    
    Chooses the task with the longest processing time.
    Useful for load balancing in some scenarios.
    
    Args:
        available: List of available tasks
        current_time: Current simulation time
        
    Returns:
        Index of task with longest proc_time, or None if no tasks available
    """
    if not available:
        return None
    max_idx = 0
    max_p = available[0].proc_time
    for i, t in enumerate(available):
        if t.proc_time > max_p:
            max_p = t.proc_time
            max_idx = i
    return max_idx

