"""
Persistent machine storage per user. Only changed via Machine Resources tab.

Author: Zhiqian ZHANG (database persistence for machines)
"""

from typing import List, Optional

from sqlalchemy.orm import Session

from Backend.db.models import MachineDB
from Backend.domain.models import Machine
from Backend.services.machine_service import get_machine_display_name


def get_all(db: Session, user_id: int) -> List[Machine]:
    """Get all machines for a user."""
    rows = db.query(MachineDB).filter(MachineDB.user_id == user_id).all()
    return [
        Machine(id=r.machine_id, name=r.name or get_machine_display_name(r.machine_id), status=r.status)
        for r in rows
    ]


def get_by_id(db: Session, user_id: int, machine_id: str) -> Optional[Machine]:
    """Get a machine by ID for a user."""
    row = (
        db.query(MachineDB)
        .filter(MachineDB.user_id == user_id, MachineDB.machine_id == machine_id)
        .first()
    )
    if not row:
        return None
    return Machine(
        id=row.machine_id,
        name=row.name or get_machine_display_name(row.machine_id),
        status=row.status,
    )


def create(db: Session, user_id: int, machine: Machine) -> Machine:
    """Create a new machine for a user."""
    row = MachineDB(
        user_id=user_id,
        machine_id=machine.id,
        name=machine.name or get_machine_display_name(machine.id),
        status=machine.status or "available",
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return Machine(
        id=row.machine_id,
        name=row.name or get_machine_display_name(row.machine_id),
        status=row.status,
    )


def update(db: Session, user_id: int, machine_id: str, updates: dict) -> Optional[Machine]:
    """Update an existing machine."""
    row = (
        db.query(MachineDB)
        .filter(MachineDB.user_id == user_id, MachineDB.machine_id == machine_id)
        .first()
    )
    if not row:
        return None
    for k, v in updates.items():
        if hasattr(row, k):
            setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return Machine(
        id=row.machine_id,
        name=row.name or get_machine_display_name(row.machine_id),
        status=row.status,
    )


def delete(db: Session, user_id: int, machine_id: str) -> bool:
    """Delete a machine."""
    row = (
        db.query(MachineDB)
        .filter(MachineDB.user_id == user_id, MachineDB.machine_id == machine_id)
        .first()
    )
    if not row:
        return False
    db.delete(row)
    db.commit()
    return True


def ensure_default_machines(db: Session, user_id: int) -> List[Machine]:
    """Ensure user has at least default machines (1,2,3). Idempotent."""
    existing = get_all(db, user_id)
    if existing:
        return existing
    defaults = [
        Machine(id="1", name=get_machine_display_name("1"), status="available"),
        Machine(id="2", name=get_machine_display_name("2"), status="available"),
        Machine(id="3", name=get_machine_display_name("3"), status="available"),
    ]
    for m in defaults:
        create(db, user_id, m)
    return get_all(db, user_id)
