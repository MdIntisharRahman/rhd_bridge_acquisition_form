import os
import uuid
import json
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
from backend.services.nas_storage import nas_storage
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
    # Creation authorization: Only field division survey personnel or system admins can originate bridge acquisition placements
    allowed_field_creators = [
        settings.ROLE_FIELD_SAE,
        settings.ROLE_FIELD_SDE,
        settings.ROLE_FIELD_EE,
        settings.ROLE_SUPREME,
        settings.ROLE_WEBMASTER,
    ]
    if current_user.role not in allowed_field_creators:
        raise HTTPException(
            status_code=403,
            detail="Creating new bridge acquisition records is strictly reserved for Field Division personnel (FIELD_SAE, FIELD_SDE, FIELD_EE) or System Administrators. Design Division and review roles cannot originate field survey records."
        )

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

    try:
        nas_storage.sync_demand_json(item, db)
    except Exception as e:
        logger.debug("NAS sync notice on create: %s", e)

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

    # 1. Field Division Jurisdiction Check:
    # Edits to field survey data on a demand placement are strictly reserved for field personnel inside the corresponding division (or Supreme/Webmaster)
    if current_user.role not in [settings.ROLE_SUPREME, settings.ROLE_WEBMASTER]:
        allowed_field_roles = [settings.ROLE_FIELD_SAE, settings.ROLE_FIELD_SDE, settings.ROLE_FIELD_EE]
        if current_user.role not in allowed_field_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Modifying field survey data is strictly restricted to Field Division personnel. Role '{current_user.role}' cannot alter field division data."
            )
        if item.division_id is not None:
            if not current_user.office_division_id or current_user.office_division_id != item.division_id:
                div_name = item.division.name if item.division else f"ID {item.division_id}"
                raise HTTPException(
                    status_code=403,
                    detail=f"Editing is strictly reserved for field personnel inside the corresponding division ({div_name}). Your profile belongs to division ID: {current_user.office_division_id}."
                )

    # 2. Workflow Edit Locking: Field editing locked when escalated unless current holder, Supreme, or Webmaster
    if item.workflow_status not in ["DRAFT_FIELD", "RETURNED_FOR_CORRECTION"]:
        privileged_roles = [settings.ROLE_SUPREME, settings.ROLE_WEBMASTER, item.current_holder_role]
        if current_user.role not in privileged_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Acquisition record #{id} is locked in status '{item.workflow_status}'. Only {item.current_holder_role} or Supreme/Webmaster can modify it."
            )

    update_dict = data.model_dump(exclude_unset=True)

    # Prevent non-admin users from altering division, circle or zone on an established placement
    if current_user.role not in [settings.ROLE_SUPREME, settings.ROLE_WEBMASTER]:
        update_dict.pop("division_id", None)
        update_dict.pop("circle_id", None)
        update_dict.pop("zone_id", None)

    # Coordinate sanity check if updated
    if update_dict.get("location_lat_lng"):
        try:
            parts = [float(p.strip()) for p in update_dict["location_lat_lng"].split(",")]
            if len(parts) == 2:
                validate_bangladesh_coordinates(parts[0], parts[1])
        except (ValueError, IndexError):
            pass

    # Track field-by-field changes brought to this demand placement
    changed_fields = {}
    for key, new_val in update_dict.items():
        if not hasattr(item, key):
            continue
        old_val = getattr(item, key)
        if old_val == new_val:
            continue
        if old_val is None and (new_val == "" or new_val == [] or new_val == {}):
            continue
        if isinstance(old_val, float) and isinstance(new_val, (int, float)):
            if round(old_val, 4) == round(float(new_val), 4):
                continue
        old_str = old_val.isoformat() if hasattr(old_val, "isoformat") else str(old_val) if old_val is not None else None
        new_str = new_val.isoformat() if hasattr(new_val, "isoformat") else str(new_val) if new_val is not None else None
        if old_str != new_str:
            changed_fields[key] = {
                "old": old_str,
                "new": new_str
            }

    for key, value in update_dict.items():
        setattr(item, key, value)

    item.updated_at = datetime.datetime.utcnow()

    # Save edit audit log to permanently track modifications over time
    if changed_fields:
        summary_keys = list(changed_fields.keys())
        preview = ", ".join(summary_keys[:5])
        if len(summary_keys) > 5:
            preview += f" (+{len(summary_keys) - 5} more)"

        edit_log = WorkflowAuditLog(
            acquisition_type="BRIDGE",
            acquisition_id=item.id,
            actor_id=current_user.id,
            actor_name=current_user.full_name or current_user.username,
            actor_role=current_user.role,
            actor_office=current_user.designation or (item.division.name if item.division else None),
            from_status=item.workflow_status,
            to_status=item.workflow_status,
            action="PLACEMENT_EDITED",
            endorsement_note=f"Demand placement updated by {current_user.role}: modified {len(changed_fields)} field(s) [{preview}]",
            flagged_sections_json=json.dumps(changed_fields),
            timestamp=datetime.datetime.utcnow()
        )
        db.add(edit_log)

    db.commit()
    db.refresh(item)

    try:
        nas_storage.sync_demand_json(item, db)
    except Exception as e:
        logger.debug("NAS sync notice on update: %s", e)

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

    try:
        nas_storage.sync_demand_json(item, db)
    except Exception as e:
        logger.debug("NAS sync notice on transition: %s", e)

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

    dest_path, stored_name, total_size, rel_path = await nas_storage.save_uploaded_attachment(
        item=item,
        file=file,
        slot_code=slot_code,
        demand_officer_type=demand_officer_type
    )

    # Check if demand officer already has an attachment and replace or append
    att = Attachment(
        acquisition_type="BRIDGE",
        acquisition_id=id,
        slot_code=slot_code,
        file_name=file.filename,
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

    try:
        nas_storage.sync_demand_json(item, db)
    except Exception as e:
        logger.debug("NAS sync notice on attachment upload: %s", e)

    return att

@router.get("/{id}/attachments", response_model=List[AttachmentResponse])
def get_bridge_attachments(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Attachment).filter(
        Attachment.acquisition_type == "BRIDGE",
        Attachment.acquisition_id == id
    ).order_by(Attachment.uploaded_at).all()

@router.delete("/{id}/attachments/{att_id}")
def delete_bridge_attachment(id: int, att_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(BridgeAcquisition).filter(BridgeAcquisition.id == id).first()
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

    if item:
        try:
            nas_storage.sync_demand_json(item, db)
        except Exception as e:
            logger.debug("NAS sync notice on attachment delete: %s", e)

    return {"success": True, "message": "Attachment deleted."}

@router.get("/{id}/audit-logs", response_model=List[WorkflowAuditLogResponse])
def get_bridge_audit_logs(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(WorkflowAuditLog).filter(
        WorkflowAuditLog.acquisition_type == "BRIDGE",
        WorkflowAuditLog.acquisition_id == id
    ).order_by(WorkflowAuditLog.timestamp).all()
