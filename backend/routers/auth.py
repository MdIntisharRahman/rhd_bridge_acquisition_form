from datetime import timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.config import settings
from backend.database import get_db
from backend.models import User
from backend.schemas import Token, UserResponse, UserBase
from backend.auth import (
    verify_password, create_access_token, get_current_user,
    get_password_hash, oauth2_scheme
)
from backend.security import login_rate_limiter, get_client_ip, validate_no_banned_terms

router = APIRouter(prefix="/auth", tags=["Authentication & Roles"])

class LoginRequest(BaseModel):
    username: str
    password: str

class RoleSwitchRequest(BaseModel):
    target_role: Optional[str] = None
    target_username: Optional[str] = None
    target_division_id: Optional[int] = None

@router.post("/token", response_model=Token)
def login_for_access_token(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    ip = get_client_ip(request)
    login_rate_limiter.check(ip)

    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User account is inactive.")

    access_token = create_access_token(
        data={"sub": user.username, "role": user.role, "id": user.id}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role,
            "designation": user.designation,
            "office_zone_id": user.office_zone_id,
            "office_circle_id": user.office_circle_id,
            "office_division_id": user.office_division_id,
            "office_zone_name": user.zone.name if user.zone else None,
            "office_circle_name": user.circle.name if user.circle else None,
            "office_division_name": user.division.name if user.division else None
        }
    }

@router.post("/login", response_model=Token)
def login_json(
    request: Request,
    req: LoginRequest,
    db: Session = Depends(get_db)
):
    ip = get_client_ip(request)
    login_rate_limiter.check(ip)

    user = db.query(User).filter(User.username == req.username).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User account is inactive.")

    access_token = create_access_token(
        data={"sub": user.username, "role": user.role, "id": user.id}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role,
            "designation": user.designation,
            "office_zone_id": user.office_zone_id,
            "office_circle_id": user.office_circle_id,
            "office_division_id": user.office_division_id,
            "office_zone_name": user.zone.name if user.zone else None,
            "office_circle_name": user.circle.name if user.circle else None,
            "office_division_name": user.division.name if user.division else None
        }
    }

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/switch-role", response_model=Token)
def switch_active_role(
    req: RoleSwitchRequest,
    db: Session = Depends(get_db)
):
    """
    Role Switching Utility for multi-tier institutional testing.
    Security Guards:
    1. Disabled when ENABLE_ROLE_SWITCHER is False.
    2. Enforces validation against predefined RHD roles.
    """
    if not settings.ENABLE_ROLE_SWITCHER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Role switching utility is disabled in this environment."
        )

    valid_roles = [
        settings.ROLE_SUPREME,
        settings.ROLE_WEBMASTER,
        settings.ROLE_FIELD_SAE,
        settings.ROLE_FIELD_SDE,
        settings.ROLE_FIELD_EE,
        settings.ROLE_FIELD_SE,
        settings.ROLE_FIELD_ACE,
        settings.ROLE_BMW_ACE,
        settings.ROLE_BDC_SE,
        settings.ROLE_BDD_EE,
        settings.ROLE_BDD_SDE
    ]
    # Find corresponding user for this request
    target_user = None
    if req.target_username:
        target_user = db.query(User).filter(User.username == req.target_username, User.is_active == True).first()
    elif req.target_division_id:
        query = db.query(User).filter(
            User.office_division_id == req.target_division_id,
            User.is_active == True
        )
        if req.target_role:
            target_user = query.filter(User.role == req.target_role).first()
        if not target_user:
            # Default to EE first, then SDE, then any active division user
            target_user = (
                query.filter(User.role.in_([settings.ROLE_FIELD_EE, settings.ROLE_BDD_EE])).first()
                or query.filter(User.role.in_([settings.ROLE_FIELD_SDE, settings.ROLE_BDD_SDE])).first()
                or query.first()
            )
    elif req.target_role:
        if req.target_role not in valid_roles:
            raise HTTPException(status_code=400, detail=f"Invalid target role: {req.target_role}")
        target_user = db.query(User).filter(User.role == req.target_role, User.is_active == True).first()

    if not target_user:
        raise HTTPException(
            status_code=404,
            detail=f"No active user found matching criteria (role={req.target_role}, username={req.target_username}, division_id={req.target_division_id})"
        )

    access_token = create_access_token(
        data={"sub": target_user.username, "role": target_user.role, "id": target_user.id}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": target_user.id,
            "username": target_user.username,
            "full_name": target_user.full_name,
            "role": target_user.role,
            "designation": target_user.designation,
            "office_zone_id": target_user.office_zone_id,
            "office_circle_id": target_user.office_circle_id,
            "office_division_id": target_user.office_division_id,
            "office_zone_name": target_user.zone.name if target_user.zone else None,
            "office_circle_name": target_user.circle.name if target_user.circle else None,
            "office_division_name": target_user.division.name if target_user.division else None
        }
    }
