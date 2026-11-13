import os
import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc

from backend.config import settings
from backend.database import get_db
from backend.models import (
    BridgeAcquisition, User, Attachment, WorkflowAuditLog, Road
)
from backend.schemas import (
    BridgeAcquisitionCreate, BridgeAcquisitionUpdate, BridgeAcquisitionResponse,
    WorkflowTransitionRequest, WorkflowAuditLogResponse, AttachmentResponse
)
from backend.auth import get_current_user
from backend.workflow import transition_workflow
from backend.security import validate_upload, validate_bangladesh_coordinates, sanitize_filename
from backend.jurisdiction import auto_populate_acquisition_hierarchy_and_vesting

router = APIRouter(prefix="/acquisitions/bridge", tags=["Bridge Acquisition Data System"])

def generate_bridge_code(db: Session) -> str:
    year = datetime.datetime.utcnow().year
    count = db.query(BridgeAcquisition).filter(
        BridgeAcquisition.code.like(f"MIS-BRG-{year}-%")
    ).count() + 1
    return f"MIS-BRG-{year}-{count:05d}"

@router.get("", response_model=List[BridgeAcquisitionResponse])
def list_bridge_acquisitions(
    status: Optional[str] = None,
    zone_id: Optional[int] = None,
    circle_id: Optional[int] = None,
    division_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(BridgeAcquisition)
    if status:
        query = query.filter(BridgeAcquisition.workflow_status == status)
    if zone_id:
        query = query.filter(BridgeAcquisition.zone_id == zone_id)
    if circle_id:
        query = query.filter(BridgeAcquisition.circle_id == circle_id)
    if division_id:
        query = query.filter(BridgeAcquisition.division_id == division_id)
    if search:
        query = query.filter(
            (BridgeAcquisition.code.ilike(f"%{search}%")) |
            (BridgeAcquisition.bridge_name.ilike(f"%{search}%")) |
            (BridgeAcquisition.road_name.ilike(f"%{search}%"))
        )
    return query.order_by(desc(BridgeAcquisition.created_at)).all()

@router.post("", response_model=BridgeAcquisitionResponse)
def create_bridge_acquisition(
    data: BridgeAcquisitionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    code = generate_bridge_code(db)
    item_dict = data.model_dump()
    
    # Coordinate sanity check
    if item_dict.get("location_lat_lng"):
        try:
            parts = [float(p.strip()) for p in item_dict["location_lat_lng"].split(",")]
            if len(parts) == 2:
                validate_bangladesh_coordinates(parts[0], parts[1])
        except (ValueError, IndexError):
            pass

    # Auto fill road name from road_id if available
    if item_dict.get("road_id") and not item_dict.get("road_name"):
        road = db.query(Road).filter(Road.id == item_dict["road_id"]).first()
        if road:
            item_dict["road_name"] = road.road_name

    # For field division engineers, lock jurisdiction to their official office division
    if current_user.office_division_id and current_user.role in (
        settings.ROLE_FIELD_SAE, settings.ROLE_FIELD_SDE, settings.ROLE_FIELD_EE
    ):
        item_dict["division_id"] = current_user.office_division_id

    # Automatic Territorial Duty Distribution & Vesting into Design Divisions
    item_dict = auto_populate_acquisition_hierarchy_and_vesting(item_dict, db)

    item = BridgeAcquisition(
        code=code,
        workflow_status="DRAFT_FIELD",
        current_holder_role=current_user.role if current_user.role != settings.ROLE_SUPREME else "FIELD_SAE",
        created_by_id=current_user.id,
        **item_dict
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    # Initial Audit Log
    init_log = WorkflowAuditLog(
        acquisition_type="BRIDGE",
        acquisition_id=item.id,
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        actor_role=current_user.role,
        actor_office=current_user.designation,
        from_status="NEW",
        to_status="DRAFT_FIELD",
        action="CREATE_DRAFT",
        endorsement_note="Bridge acquisition draft initiated."
    )
    db.add(init_log)
    db.commit()

    return item

@router.get("/{id}", response_model=BridgeAcquisitionResponse)
def get_bridge_acquisition(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(BridgeAcquisition).filter(BridgeAcquisition.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Bridge acquisition record not found")
    return item

@router.put("/{id}", response_model=BridgeAcquisitionResponse)
def update_bridge_acquisition(
    id: int,
    data: BridgeAcquisitionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(BridgeAcquisition).filter(BridgeAcquisition.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Bridge acquisition record not found")

    # Workflow Edit Locking: Field editing locked when escalated unless current holder, Supreme, or Webmaster
    if item.workflow_status not in ["DRAFT_FIELD", "RETURNED_FOR_CORRECTION"]:
        privileged_roles = [settings.ROLE_SUPREME, settings.ROLE_WEBMASTER, item.current_holder_role]
        if current_user.role not in privileged_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Acquisition record #{id} is locked in status '{item.workflow_status}'. Only {item.current_holder_role} or Supreme/Webmaster can modify it."
            )

    update_dict = data.model_dump(exclude_unset=True)

    # Coordinate sanity check if updated
    if update_dict.get("location_lat_lng"):
        try:
            parts = [float(p.strip()) for p in update_dict["location_lat_lng"].split(",")]
            if len(parts) == 2:
                validate_bangladesh_coordinates(parts[0], parts[1])
        except (ValueError, IndexError):
            pass

    for key, value in update_dict.items():
        setattr(item, key, value)

    item.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(item)
    return item

@router.post("/{id}/transition")
def transition_bridge_status(
    id: int,
    req: WorkflowTransitionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(BridgeAcquisition).filter(BridgeAcquisition.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Bridge acquisition record not found")

    from_status, to_status = transition_workflow(
        db=db,
        item=item,
        acq_type="BRIDGE",
        req=req,
        current_user=current_user
    )
    return {
        "success": True,
        "acquisition_id": item.id,
        "code": item.code,
        "from_status": from_status,
        "to_status": to_status,
        "current_holder_role": item.current_holder_role
    }

@router.post("/{id}/upload", response_model=AttachmentResponse)
async def upload_bridge_attachment(
    id: int,
    slot_code: str = Form(...),
    demand_officer_type: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(BridgeAcquisition).filter(BridgeAcquisition.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Bridge acquisition record not found")

    # Validate file type and extension whitelist
    safe_orig_name, ext = validate_upload(file.filename)
    stored_name = f"brg_{id}_{slot_code}_{uuid.uuid4().hex[:8]}{ext}"
    dest_path = os.path.join(settings.UPLOAD_DIR, stored_name)

    # Stream chunks with file size enforcement (prevents memory DoS)
    total_size = 0
    try:
        with open(dest_path, "wb") as f:
            while True:
                chunk = await file.read(1024 * 1024)  # 1MB chunks
                if not chunk:
                    break
                total_size += len(chunk)
                if total_size > settings.MAX_UPLOAD_SIZE_BYTES:
                    f.close()
                    if os.path.exists(dest_path):
                        os.remove(dest_path)
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"Uploaded file exceeds maximum limit of {settings.MAX_UPLOAD_SIZE_BYTES // (1024*1024)} MB."
                    )
                f.write(chunk)
    except HTTPException:
        raise
    except Exception as e:
        if os.path.exists(dest_path):
            os.remove(dest_path)
        raise HTTPException(status_code=500, detail=f"File save error: {str(e)}")

    # Check if demand officer already has an attachment and replace or append
    att = Attachment(
        acquisition_type="BRIDGE",
        acquisition_id=id,
        slot_code=slot_code,
        file_name=safe_orig_name,
        stored_file_name=stored_name,
        file_path=dest_path,
        file_size=total_size,
        mime_type=file.content_type,
        demand_officer_type=demand_officer_type,
        uploaded_by_id=current_user.id
    )
    db.add(att)
    db.commit()
    db.refresh(att)
    return att

@router.get("/{id}/attachments", response_model=List[AttachmentResponse])
def get_bridge_attachments(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Attachment).filter(
        Attachment.acquisition_type == "BRIDGE",
        Attachment.acquisition_id == id
    ).order_by(Attachment.uploaded_at).all()

@router.delete("/{id}/attachments/{att_id}")
def delete_bridge_attachment(id: int, att_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    att = db.query(Attachment).filter(
        Attachment.id == att_id,
        Attachment.acquisition_type == "BRIDGE",
        Attachment.acquisition_id == id
    ).first()
    if not att:
        raise HTTPException(status_code=404, detail="Attachment not found")

    if os.path.exists(att.file_path):
        try:
            os.remove(att.file_path)
        except Exception:
            pass

    db.delete(att)
    db.commit()
    return {"success": True, "message": "Attachment deleted."}

@router.get("/{id}/audit-logs", response_model=List[WorkflowAuditLogResponse])
def get_bridge_audit_logs(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(WorkflowAuditLog).filter(
        WorkflowAuditLog.acquisition_type == "BRIDGE",
        WorkflowAuditLog.acquisition_id == id
    ).order_by(WorkflowAuditLog.timestamp).all()
