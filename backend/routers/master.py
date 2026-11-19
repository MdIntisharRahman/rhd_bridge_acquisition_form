import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session, joinedload

from backend.config import settings
from backend.database import get_db
from backend.models import RhdZone, RhdCircle, RhdDivision, RoadType, Road, User
from backend.schemas import (
    ZoneResponse, CircleResponse, DivisionResponse, RoadTypeResponse, RoadResponse,
    UserResponse, UserCreate, UserUpdate
)
from backend.auth import get_current_user, require_webmaster, get_password_hash
from backend.security import validate_no_banned_terms, validate_upload

router = APIRouter(prefix="/master", tags=["Master Data Hierarchy & Governance"])

@router.get("/zones", response_model=List[ZoneResponse])
def get_zones(db: Session = Depends(get_db)):
    zones = db.query(RhdZone).filter(RhdZone.is_active == True).options(
        joinedload(RhdZone.circles).joinedload(RhdCircle.divisions)
    ).all()
    return zones

@router.get("/jurisdiction-matrix")
def get_jurisdiction_matrix(db: Session = Depends(get_db)):
    from backend.jurisdiction import get_jurisdiction_duty_matrix
    return get_jurisdiction_duty_matrix(db)

@router.get("/circles", response_model=List[CircleResponse])
def get_circles(zone_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(RhdCircle).filter(RhdCircle.is_active == True)
    if zone_id:
        query = query.filter(RhdCircle.zone_id == zone_id)
    return query.options(joinedload(RhdCircle.divisions)).all()

@router.get("/divisions", response_model=List[DivisionResponse])
def get_divisions(circle_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(RhdDivision).filter(RhdDivision.is_active == True)
    if circle_id:
        query = query.filter(RhdDivision.circle_id == circle_id)
    return query.all()

@router.get("/road-types", response_model=List[RoadTypeResponse])
def get_road_types(db: Session = Depends(get_db)):
    return db.query(RoadType).filter(RoadType.is_active == True).all()

@router.get("/roads", response_model=List[RoadResponse])
def get_roads(road_type_id: Optional[int] = None, division_id: Optional[int] = None, search: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Road)
    if road_type_id:
        query = query.filter(Road.road_type_id == road_type_id)
    if division_id:
        query = query.filter(Road.division_id == division_id)
    if search:
        query = query.filter(
            (Road.road_number.ilike(f"%{search}%")) | (Road.road_name.ilike(f"%{search}%"))
        )
    return query.order_by(Road.road_number).all()

# --- Quick Creation Endpoints (Webmaster/Supreme) ---
@router.post("/zones", response_model=ZoneResponse)
def create_zone(name: str, code: str, current_user: User = Depends(require_webmaster), db: Session = Depends(get_db)):
    existing = db.query(RhdZone).filter(RhdZone.code == code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Zone code already exists")
    zone = RhdZone(name=name, code=code)
    db.add(zone)
    db.commit()
    db.refresh(zone)
    return zone

@router.post("/circles", response_model=CircleResponse)
def create_circle(name: str, code: str, zone_id: int, current_user: User = Depends(require_webmaster), db: Session = Depends(get_db)):
    zone = db.query(RhdZone).filter(RhdZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Parent Zone not found")
    circle = RhdCircle(name=name, code=code, zone_id=zone_id)
    db.add(circle)
    db.commit()
    db.refresh(circle)
    return circle

@router.post("/divisions", response_model=DivisionResponse)
def create_division(name: str, code: str, circle_id: int, current_user: User = Depends(require_webmaster), db: Session = Depends(get_db)):
    circle = db.query(RhdCircle).filter(RhdCircle.id == circle_id).first()
    if not circle:
        raise HTTPException(status_code=404, detail="Parent Circle not found")
    div = RhdDivision(name=name, code=code, circle_id=circle_id)
    db.add(div)
    db.commit()
    db.refresh(div)
    return div

@router.post("/roads", response_model=RoadResponse)
def create_road(road_number: str, road_name: str, road_type_id: int, division_id: Optional[int] = None, length_km: Optional[float] = 0.0, current_user: User = Depends(require_webmaster), db: Session = Depends(get_db)):
    road = Road(
        road_number=road_number,
        road_name=road_name,
        road_type_id=road_type_id,
        division_id=division_id,
        length_km=length_km
    )
    db.add(road)
    db.commit()
    db.refresh(road)
    return road

# --- Hierarchy JSON Import / Export ---
@router.get("/hierarchy-export")
def export_hierarchy(current_user: User = Depends(require_webmaster), db: Session = Depends(get_db)):
    zones = db.query(RhdZone).options(
        joinedload(RhdZone.circles).joinedload(RhdCircle.divisions)
    ).all()
    road_types = db.query(RoadType).all()
    roads = db.query(Road).all()
    users = db.query(User).all()

    payload = {
        "system": "RHD DESC Master Hierarchy Export",
        "zones": [
            {
                "code": z.code,
                "name": z.name,
                "circles": [
                    {
                        "code": c.code,
                        "name": c.name,
                        "divisions": [{"code": d.code, "name": d.name} for d in c.divisions]
                    } for c in z.circles
                ]
            } for z in zones
        ],
        "road_types": [{"code": rt.code, "name": rt.name, "description": rt.description} for rt in road_types],
        "roads": [{"road_number": r.road_number, "road_name": r.road_name, "road_type_id": r.road_type_id, "length_km": r.length_km} for r in roads],
        "users": [{"username": u.username, "full_name": u.full_name, "role": u.role, "designation": u.designation, "email": u.email} for u in users]
    }
    return payload

@router.post("/hierarchy-import")
async def import_hierarchy(file: UploadFile = File(...), current_user: User = Depends(require_webmaster), db: Session = Depends(get_db)):
    content = await file.read()
    try:
        data = json.loads(content)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON file: {e}")

    # Process and upsert zones, circles, divisions
    for z in data.get("zones", []):
        zone_obj = db.query(RhdZone).filter(RhdZone.code == z["code"]).first()
        if not zone_obj:
            zone_obj = RhdZone(code=z["code"], name=z["name"])
            db.add(zone_obj)
            db.flush()

        for c in z.get("circles", []):
            circle_obj = db.query(RhdCircle).filter(RhdCircle.code == c["code"]).first()
            if not circle_obj:
                circle_obj = RhdCircle(code=c["code"], name=c["name"], zone_id=zone_obj.id)
                db.add(circle_obj)
                db.flush()

            for d in c.get("divisions", []):
                div_obj = db.query(RhdDivision).filter(RhdDivision.code == d["code"]).first()
                if not div_obj:
                    div_obj = RhdDivision(code=d["code"], name=d["name"], circle_id=circle_obj.id)
                    db.add(div_obj)
                    db.flush()

    db.commit()
    return {"message": "RHD hierarchy imported successfully."}

# --- User Management (Webmaster / Supreme) ---
@router.get("/users", response_model=List[UserResponse])
def get_users(current_user: User = Depends(require_webmaster), db: Session = Depends(get_db)):
    return db.query(User).all()

@router.post("/users", response_model=UserResponse)
def create_user(u: UserCreate, current_user: User = Depends(require_webmaster), db: Session = Depends(get_db)):
    # Banned 'Admin' Terminology Check
    validate_no_banned_terms(u.username, "username")
    validate_no_banned_terms(u.role, "role")
    if u.designation:
        validate_no_banned_terms(u.designation, "designation")

    # Password complexity floor
    if not u.password or len(u.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters in length.")

    # Strict Supreme Singleton and Delegation Check
    if u.role == settings.ROLE_SUPREME:
        if current_user.role != settings.ROLE_SUPREME:
            raise HTTPException(
                status_code=403,
                detail="Only the existing Supreme authority can designate or transfer the Supreme role."
            )
        existing_supreme = db.query(User).filter(User.role == settings.ROLE_SUPREME).first()
        if existing_supreme:
            raise HTTPException(
                status_code=400,
                detail=f"Only 1 user in the entire system can hold the Supreme role. Currently assigned to: {existing_supreme.username}"
            )

    existing_user = db.query(User).filter(User.username == u.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")

    new_user = User(
        username=u.username,
        email=u.email,
        full_name=u.full_name,
        hashed_password=get_password_hash(u.password),
        role=u.role,
        designation=u.designation,
        office_zone_id=u.office_zone_id,
        office_circle_id=u.office_circle_id,
        office_division_id=u.office_division_id,
        is_active=u.is_active
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(user_id: int, u: UserUpdate, current_user: User = Depends(require_webmaster), db: Session = Depends(get_db)):
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    # If updating Supreme user, only Supreme can update it
    if target_user.role == settings.ROLE_SUPREME and current_user.role != settings.ROLE_SUPREME:
        raise HTTPException(status_code=403, detail="Only Supreme authority can modify the Supreme account.")

    if u.email:
        target_user.email = u.email
    if u.full_name:
        target_user.full_name = u.full_name
    if u.designation:
        validate_no_banned_terms(u.designation, "designation")
        target_user.designation = u.designation
    if u.office_zone_id is not None:
        target_user.office_zone_id = u.office_zone_id
    if u.office_circle_id is not None:
        target_user.office_circle_id = u.office_circle_id
    if u.office_division_id is not None:
        target_user.office_division_id = u.office_division_id
    if u.is_active is not None:
        target_user.is_active = u.is_active
    if u.password:
        if len(u.password) < 8:
            raise HTTPException(status_code=400, detail="Password must be at least 8 characters in length.")
        target_user.hashed_password = get_password_hash(u.password)

    db.commit()
    db.refresh(target_user)
    return target_user
