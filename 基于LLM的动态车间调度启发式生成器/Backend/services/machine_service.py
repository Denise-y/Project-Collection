from typing import List, Optional
from Backend.domain.models import Machine


def get_machine_display_name(machine_id: str) -> str:
    """
    Convert a machine ID to a user-friendly display name.

    Rule:
    - Numeric IDs 1..26 map to letters A..Z (e.g. "1" -> "Machine A")
    - Otherwise fall back to "Machine <id>"
    """
    try:
        numeric_id = int(machine_id)
    except (ValueError, TypeError):
        return f"Machine {machine_id}"

    if 1 <= numeric_id <= 26:
        return f"Machine {chr(64 + numeric_id)}"  # 65='A'
    return f"Machine {machine_id}"


class MachineService:
    """
    Service for handling machine information.
    
    Currently uses in-memory storage. Can be extended to use database in the future.
    """
    
    def __init__(self):
        # In-memory machine storage
        # Format: {machine_id: Machine}
        self._machines: dict[str, Machine] = {}
        # Initialize with default machines
        self._initialize_default_machines()
    
    def _initialize_default_machines(self):
        """Initialize with default machines if empty"""
        if not self._machines:
            default_machines = [
                Machine(id="1", name=get_machine_display_name("1"), status="available"),
                Machine(id="2", name=get_machine_display_name("2"), status="available"),
                Machine(id="3", name=get_machine_display_name("3"), status="available"),
            ]
            for machine in default_machines:
                self._machines[machine.id] = machine
    
    def get_all(self) -> List[Machine]:
        """Get all machines"""
        return list(self._machines.values())
    
    def get_by_id(self, machine_id: str) -> Optional[Machine]:
        """Get a machine by ID"""
        return self._machines.get(machine_id)
    
    def create(self, machine: Machine) -> Machine:
        """Create a new machine"""
        self._machines[machine.id] = machine
        return machine
    
    def update(self, machine_id: str, updates: dict) -> Optional[Machine]:
        """Update an existing machine"""
        if machine_id in self._machines:
            current = self._machines[machine_id]
            updated = current.model_copy(update=updates)
            self._machines[machine_id] = updated
            return updated
        return None
    
    def delete(self, machine_id: str) -> bool:
        """Delete a machine"""
        if machine_id in self._machines:
            del self._machines[machine_id]
            return True
        return False
    
    def load_from_jobs(self, jobs):
        """
        Build machine list from job steps for scheduling. Does NOT persist.
        Used only during schedule run - does not modify user's stored machines.
        """
        machine_ids = set()
        for job in jobs:
            for step in job.steps:
                machine_ids.add(step.machine)

        # Build temporary Machine objects for the scheduler (no persistence)
        return [
            Machine(id=mid, name=get_machine_display_name(mid), status="available")
            for mid in sorted(machine_ids)
        ]
