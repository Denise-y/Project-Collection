from fastapi import APIRouter, Body, Depends
from sqlalchemy.orm import Session

from Backend.api.deps import get_current_user
from Backend.db.models import UserConfig
from Backend.db.session import get_db


router = APIRouter(prefix="/api/user/configs", tags=["User Configs"])


@router.get("/{key}")
def get_config(key: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    item = (
        db.query(UserConfig)
        .filter(UserConfig.user_id == current_user.id, UserConfig.config_key == key)
        .first()
    )
    return {"key": key, "value": item.config_value if item else None}


@router.put("/{key}")
def set_config(
    key: str,
    value=Body(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    item = (
        db.query(UserConfig)
        .filter(UserConfig.user_id == current_user.id, UserConfig.config_key == key)
        .first()
    )
    if item:
        item.config_value = value
    else:
        item = UserConfig(user_id=current_user.id, config_key=key, config_value=value)
        db.add(item)

    db.commit()
    return {"key": key, "value": item.config_value}

