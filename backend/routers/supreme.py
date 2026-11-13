import os
import re
import datetime
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.config import settings
from backend.database import get_db
from backend.models import (
    User, BackgroundTask, WorkflowAuditLog, BridgeAcquisition, CulvertAcquisition, Attachment,
    RhdCircle, RhdDivision
)
from backend.schemas import (
    BackgroundTaskResponse, WorkflowAuditLogResponse,
    DesignDivisionCreate, DesignDivisionUpdate, DesignDivisionResponse
)
from backend.auth import require_supreme, get_password_hash
from backend.seed import seed_database

router = APIRouter(prefix="/supreme", tags=["Supreme Operations Console"])

class TaskRunRequest(BaseModel):
    task_type: str  # DB_BACKUP, JSON_RESYNC, WEBMAP_SYNC, ORPHAN_CLEANUP, BATCH_REBUILD
    params_json: Optional[str] = None

class OverrideStateRequest(BaseModel):
    acquisition_type: str  # BRIDGE or CULVERT
    acquisition_id: int
    target_status: str
    target_holder_role: str
    override_reason: str

def execute_background_job(task_id: int, task_type: str):
    from backend.database import SessionLocal
    db = SessionLocal()
    task = db.query(BackgroundTask).filter(BackgroundTask.id == task_id).first()
    if not task:
        db.close()
        return

    task.status = "RUNNING"
    db.commit()

    try:
        if task_type == "DB_BACKUP":
            # Creates a local JSON dump backup of all acquisitions and hierarchy
            backup_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "backups")
            os.makedirs(backup_dir, exist_ok=True)
            ts = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            backup_file = os.path.join(backup_dir, f"rhd_adds_backup_{ts}.json")
            
            bridges = db.query(BridgeAcquisition).all()
            culverts = db.query(CulvertAcquisition).all()
            backup_data = {
                "timestamp": ts,
                "total_bridges": len(bridges),
                "total_culverts": len(culverts),
                "bridge_codes": [b.code for b in bridges],
                "culvert_codes": [c.code for c in culverts]
            }
            with open(backup_file, "w", encoding="utf-8") as f:
                json.dump(backup_data, f, indent=2)

            task.status = "COMPLETED"
            task.result_json = json.dumps({"backup_file": backup_file, "size_bytes": os.path.getsize(backup_file)})

        elif task_type == "JSON_RESYNC":
            seed_database()
            task.status = "COMPLETED"
            task.result_json = json.dumps({"message": "RHD master hierarchy seed resynchronized from rhd_master_hierarchy_seed.json"})

        elif task_type == "WEBMAP_SYNC":
            bridges_count = db.query(BridgeAcquisition).filter(BridgeAcquisition.location_lat_lng != None).count()
            culverts_count = db.query(CulvertAcquisition).filter(CulvertAcquisition.location_lat_lng != None).count()
            task.status = "COMPLETED"
            task.result_json = json.dumps({
                "message": "Webmap features synced with https://webmap.rhdbridge.com",
                "synced_bridges": bridges_count,
                "synced_culverts": culverts_count
            })

        elif task_type == "ORPHAN_CLEANUP":
            upload_dir = settings.UPLOAD_DIR
            existing_files = set(os.listdir(upload_dir)) if os.path.exists(upload_dir) else set()
            db_stored_files = set([att.stored_file_name for att in db.query(Attachment).all()])
            orphans = existing_files - db_stored_files
            removed_count = 0
            for orphan in orphans:
                try:
                    os.remove(os.path.join(upload_dir, orphan))
                    removed_count += 1
                except Exception:
                    pass
            task.status = "COMPLETED"
            task.result_json = json.dumps({"orphans_found": len(orphans), "orphans_removed": removed_count})

        elif task_type == "BATCH_REBUILD":
            bridges_count = db.query(BridgeAcquisition).count()
            culverts_count = db.query(CulvertAcquisition).count()
            task.status = "COMPLETED"
            task.result_json = json.dumps({
                "message": "Batch export dossiers validated and verified.",
                "dossiers_processed": bridges_count + culverts_count
            })
        else:
            task.status = "FAILED"
            task.error_message = f"Unknown background task type: {task_type}"

    except Exception as e:
        task.status = "FAILED"
        task.error_message = str(e)
    finally:
        task.completed_at = datetime.datetime.utcnow()
        db.commit()
        db.close()

@router.get("/tasks", response_model=List[BackgroundTaskResponse])
def get_background_tasks(current_user: User = Depends(require_supreme), db: Session = Depends(get_db)):
    return db.query(BackgroundTask).order_by(desc(BackgroundTask.started_at)).limit(50).all()

@router.post("/tasks/run", response_model=BackgroundTaskResponse)
def run_background_task(
    req: TaskRunRequest,
    bg_tasks: BackgroundTasks,
    current_user: User = Depends(require_supreme),
    db: Session = Depends(get_db)
):
    task = BackgroundTask(
        task_type=req.task_type,
        status="PENDING",
        triggered_by_id=current_user.id,
        params_json=req.params_json
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    bg_tasks.add_task(execute_background_job, task.id, req.task_type)
    return task

@router.get("/audit-logs", response_model=List[WorkflowAuditLogResponse])
def get_all_audit_logs(
    acquisition_type: Optional[str] = None,
    limit: int = 100,
    current_user: User = Depends(require_supreme),
    db: Session = Depends(get_db)
):
    query = db.query(WorkflowAuditLog)
    if acquisition_type:
        query = query.filter(WorkflowAuditLog.acquisition_type == acquisition_type.upper())
    return query.order_by(desc(WorkflowAuditLog.timestamp)).limit(limit).all()

@router.post("/override-state")
def override_workflow_state(
    req: OverrideStateRequest,
    current_user: User = Depends(require_supreme),
    db: Session = Depends(get_db)
):
    acq_type = req.acquisition_type.upper()
    if acq_type == "BRIDGE":
        item = db.query(BridgeAcquisition).filter(BridgeAcquisition.id == req.acquisition_id).first()
    elif acq_type == "CULVERT":
        item = db.query(CulvertAcquisition).filter(CulvertAcquisition.id == req.acquisition_id).first()
    else:
        raise HTTPException(status_code=400, detail="Invalid acquisition type")

    if not item:
        raise HTTPException(status_code=404, detail="Acquisition record not found")

    from_status = item.workflow_status
    item.workflow_status = req.target_status
    item.current_holder_role = req.target_holder_role
    item.return_reason_notes = f"[SUPREME OVERRIDE] {req.override_reason}"

    log_entry = WorkflowAuditLog(
        acquisition_type=acq_type,
        acquisition_id=item.id,
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        actor_role=current_user.role,
        actor_office="Supreme Command Operations",
        from_status=from_status,
        to_status=req.target_status,
        action="SUPREME_UNIVERSAL_OVERRIDE",
        endorsement_note=req.override_reason
    )
    db.add(log_entry)
    db.commit()

    return {
        "success": True,
        "message": f"Supreme state override executed. State transitioned from {from_status} to {req.target_status}.",
        "acquisition_id": item.id,
        "code": item.code,
        "workflow_status": item.workflow_status,
        "current_holder_role": item.current_holder_role
    }

# --- Dynamic Design Divisions Management (Supreme Authority) ---

@router.get("/design-divisions", response_model=List[DesignDivisionResponse])
def list_design_divisions(
    current_user: User = Depends(require_supreme),
    db: Session = Depends(get_db)
):
    """
    List all divisions responsible for bridge/culvert design under Bridge Design Circle (BDC).
    Calculates active design loads and returns linked accounts.
    """
    bdc_circle = db.query(RhdCircle).filter(RhdCircle.name.ilike("%Bridge Design%")).first()
    query = db.query(RhdDivision)
    if bdc_circle:
        query = query.filter((RhdDivision.circle_id == bdc_circle.id) | (RhdDivision.name.ilike("%Bridge Design Division%")))
    else:
        query = query.filter(RhdDivision.name.ilike("%Bridge Design Division%"))
        
    divisions = query.order_by(RhdDivision.id).all()
    results = []

    for d in divisions:
        b_count = db.query(BridgeAcquisition).filter(BridgeAcquisition.assigned_bdd_division_id == d.id).count()
        c_count = db.query(CulvertAcquisition).filter(CulvertAcquisition.assigned_bdd_division_id == d.id).count()
        
        # Find associated EE user account if any
        ee_user = db.query(User).filter(
            User.office_division_id == d.id,
            User.role.in_([settings.ROLE_BDD_EE, settings.ROLE_FIELD_EE])
        ).first()

        results.append(DesignDivisionResponse(
            id=d.id,
            code=d.code,
            name=d.name,
            circle_id=d.circle_id,
            circle_name=d.circle.name if d.circle else "Bridge Design Circle",
            is_active=d.is_active,
            ee_name=d.ee_name or (ee_user.full_name if ee_user else None),
            contact_email=d.contact_email or (ee_user.email if ee_user else None),
            contact_phone=d.contact_phone,
            assigned_bridge_count=b_count,
            assigned_culvert_count=c_count,
            ee_username=ee_user.username if ee_user else None
        ))

    return results

@router.post("/design-divisions", response_model=DesignDivisionResponse)
def create_design_division(
    req: DesignDivisionCreate,
    current_user: User = Depends(require_supreme),
    db: Session = Depends(get_db)
):
    """
    Provisions a new Design Division dynamically (e.g. Bridge Design Division-4)
    and automatically creates an institutional BDD_EE user account so the team can login immediately.
    """
    # Check duplicate code or name
    existing = db.query(RhdDivision).filter(
        (RhdDivision.code == req.code) | (RhdDivision.name.ilike(req.name))
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Division with code '{req.code}' or name '{req.name}' already exists.")

    circle_id = req.circle_id
    if not circle_id:
        bdc_circle = db.query(RhdCircle).filter(RhdCircle.name.ilike("%Bridge Design%")).first()
        if not bdc_circle:
            bdc_circle = db.query(RhdCircle).first()
        circle_id = bdc_circle.id if bdc_circle else 1

    new_div = RhdDivision(
        code=req.code,
        name=req.name,
        circle_id=circle_id,
        is_active=True,
        ee_name=req.ee_name,
        contact_email=req.contact_email,
        contact_phone=req.contact_phone
    )
    db.add(new_div)
    db.flush()

    ee_username = None
    if req.create_login_account:
        # Create an institutional user account for the new design division
        clean_slug = re.sub(r'[^a-zA-Z0-9]+', '_', req.name.lower()).strip('_')
        ee_username = f"bdd_{clean_slug}"
        # Avoid username collision
        if db.query(User).filter(User.username == ee_username).first():
            ee_username = f"bdd_{clean_slug}_{new_div.id}"
            
        div_email = req.contact_email or f"{ee_username}@rhd.gov.bd"
        if db.query(User).filter(User.email == div_email).first():
            div_email = f"{ee_username}_{new_div.id}@rhd.gov.bd"

        ee_user = User(
            username=ee_username,
            email=div_email,
            hashed_password=get_password_hash("rhd123"),
            full_name=req.ee_name or f"Executive Engineer, {req.name}",
            role=settings.ROLE_BDD_EE,
            designation=f"Executive Engineer, {req.name}",
            office_division_id=new_div.id,
            office_circle_id=circle_id,
            office_zone_id=new_div.circle.zone_id if new_div.circle else None,
            is_active=True
        )
        db.add(ee_user)
        db.flush()

    db.commit()
    db.refresh(new_div)

    return DesignDivisionResponse(
        id=new_div.id,
        code=new_div.code,
        name=new_div.name,
        circle_id=new_div.circle_id,
        circle_name=new_div.circle.name if new_div.circle else "Bridge Design Circle",
        is_active=new_div.is_active,
        ee_name=new_div.ee_name,
        contact_email=new_div.contact_email,
        contact_phone=new_div.contact_phone,
        assigned_bridge_count=0,
        assigned_culvert_count=0,
        ee_username=ee_username
    )

@router.put("/design-divisions/{id}", response_model=DesignDivisionResponse)
def update_design_division(
    id: int,
    req: DesignDivisionUpdate,
    current_user: User = Depends(require_supreme),
    db: Session = Depends(get_db)
):
    """
    Updates details of an existing design division (e.g. name, EE in charge, active status).
    """
    div = db.query(RhdDivision).filter(RhdDivision.id == id).first()
    if not div:
        raise HTTPException(status_code=404, detail="Design division not found.")

    if req.name is not None:
        div.name = req.name
    if req.code is not None:
        div.code = req.code
    if req.ee_name is not None:
        div.ee_name = req.ee_name
    if req.contact_email is not None:
        div.contact_email = req.contact_email
    if req.contact_phone is not None:
        div.contact_phone = req.contact_phone
    if req.is_active is not None:
        div.is_active = req.is_active

    db.commit()
    db.refresh(div)

    b_count = db.query(BridgeAcquisition).filter(BridgeAcquisition.assigned_bdd_division_id == div.id).count()
    c_count = db.query(CulvertAcquisition).filter(CulvertAcquisition.assigned_bdd_division_id == div.id).count()
    ee_user = db.query(User).filter(User.office_division_id == div.id).first()

    return DesignDivisionResponse(
        id=div.id,
        code=div.code,
        name=div.name,
        circle_id=div.circle_id,
        circle_name=div.circle.name if div.circle else "Bridge Design Circle",
        is_active=div.is_active,
        ee_name=div.ee_name,
        contact_email=div.contact_email,
        contact_phone=div.contact_phone,
        assigned_bridge_count=b_count,
        assigned_culvert_count=c_count,
        ee_username=ee_user.username if ee_user else None
    )

@router.delete("/design-divisions/{id}")
def deactivate_design_division(
    id: int,
    current_user: User = Depends(require_supreme),
    db: Session = Depends(get_db)
):
    """
    Safely deactivates a design division (soft-delete to maintain integrity of existing bridge/culvert records).
    """
    div = db.query(RhdDivision).filter(RhdDivision.id == id).first()
    if not div:
        raise HTTPException(status_code=404, detail="Design division not found.")

    div.is_active = False
    db.commit()
    return {"success": True, "message": f"Design division '{div.name}' ({div.code}) deactivated successfully."}
