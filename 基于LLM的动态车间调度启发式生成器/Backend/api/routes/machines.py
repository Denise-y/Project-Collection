"""
Author: Zizhen WANG (machine CRUD API and persistence integration)
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from sqlalchemy.orm import Session

from Backend.domain.models import Machine
from Backend.services.machine_service import get_machine_display_name
from Backend.services.machine_repository import (
    get_all,
    get_by_id,
    create,
    update,
    delete,
    ensure_default_machines,
)
from Backend.db.session import get_db
from Backend.api.deps import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/api/machines", tags=["Machines"])


class MachineCreate(BaseModel):
    id: str
    name: Optional[str] = None
    status: Optional[str] = "available"


class MachineUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None


@router.get("/", response_model=List[Machine])
def list_machines(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List all machines for the current user. Persisted in DB."""
    ensure_default_machines(db, current_user.id)
    return get_all(db, current_user.id)


@router.get("/{machine_id}", response_model=Machine)
def get_machine(
    machine_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get a machine by ID"""
    machine = get_by_id(db, current_user.id, machine_id)
    if not machine:
        raise HTTPException(status_code=404, detail=f"Machine {machine_id} not found")
    return machine


@router.post("/", response_model=Machine, status_code=201)
def create_machine(
    machine_data: MachineCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Create a new machine"""
    existing = get_by_id(db, current_user.id, machine_data.id)
    if existing:
        raise HTTPException(status_code=400, detail=f"Machine {machine_data.id} already exists")

    default_name = machine_data.name or get_machine_display_name(machine_data.id)
    machine = Machine(
        id=machine_data.id,
        name=default_name,
        status=machine_data.status or "available",
    )
    return create(db, current_user.id, machine)


@router.put("/{machine_id}", response_model=Machine)
def update_machine(
    machine_id: str,
    updates: MachineUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Update an existing machine"""
    update_dict = updates.model_dump(exclude_unset=True)
    machine = update(db, current_user.id, machine_id, update_dict)
    if not machine:
        raise HTTPException(status_code=404, detail=f"Machine {machine_id} not found")
    return machine


@router.delete("/{machine_id}", status_code=204)
def delete_machine(
    machine_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Delete a machine"""
    success = delete(db, current_user.id, machine_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Machine {machine_id} not found")
    return None
