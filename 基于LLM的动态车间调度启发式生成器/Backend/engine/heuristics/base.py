"""
Base definitions for priority functions and heuristic rules.

Priority functions are callables that take (available_tasks, current_time) 
and return the index of the selected task or None.
"""
from typing import List, Callable, Optional
from Backend.engine.core_scheduler import Task

# Type alias for priority functions
PriorityFunction = Callable[[List[Task], float], Optional[int]]
