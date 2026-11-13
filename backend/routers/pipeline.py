import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_

from backend.config import settings
from backend.database import get_db
from backend.models import (
    User, BridgeAcquisition, CulvertAcquisition, WorkflowAuditLog,
    RhdDivision, RhdCircle, RhdZone
)
from backend.schemas import (
    DesignDemandItemResponse, DesignDemandStatusUpdate
)
from backend.auth import get_current_user

router = APIRouter(prefix="/pipeline", tags=["Design Pipeline & Bottleneck Tracking"])

def _format_bridge_record(b: BridgeAcquisition, db: Session) -> DesignDemandItemResponse:
    bdd_div = db.query(RhdDivision).filter(RhdDivision.id == b.assigned_bdd_division_id).first() if b.assigned_bdd_division_id else None
    bdd_sde = db.query(User).filter(User.id == b.assigned_bdd_sde_id).first() if b.assigned_bdd_sde_id else None
    field_div = db.query(RhdDivision).filter(RhdDivision.id == b.division_id).first() if b.division_id else None
    circle = db.query(RhdCircle).filter(RhdCircle.id == b.circle_id).first() if b.circle_id else None
    zone = db.query(RhdZone).filter(RhdZone.id == b.zone_id).first() if b.zone_id else None

    # Derive default execution state if not set
    exec_state = b.design_execution_state or "NOT_STARTED"
    if exec_state == "NOT_STARTED" and b.workflow_status in ["ASSIGNED_TO_BDD_EE", "ASSIGNED_TO_BDD_SDE"]:
        exec_state = "RUNNING"
    elif b.workflow_status == "DESIGN_APPROVED_COMPLETE" and exec_state != "SUSPENDED":
        exec_state = "SENT"

    return DesignDemandItemResponse(
        id=b.id,
        code=b.code,
        acquisition_type="BRIDGE",
        structure_name=b.bridge_name or "Bridge Demand",
        structure_type=b.proposed_bridge_type or "Bridge",
        road_name=b.road_name,
        chainage_km=b.chainage_km,
        chainage_m=b.chainage_m,
        location_chainage_gps_text=b.location_chainage_gps_text,
        zone_name=zone.name if zone else None,
        circle_name=circle.name if circle else None,
        division_name=field_div.name if field_div else None,
        field_division_id=b.division_id,
        assigned_bdd_division_id=b.assigned_bdd_division_id,
        assigned_bdd_division_name=bdd_div.name if bdd_div else None,
        assigned_bdd_sde_id=b.assigned_bdd_sde_id,
        assigned_bdd_sde_name=bdd_sde.full_name if bdd_sde else None,
        workflow_status=b.workflow_status,
        current_holder_role=b.current_holder_role,
        design_execution_state=exec_state,
        bottleneck_reason=b.bottleneck_reason,
        bottleneck_notes=b.bottleneck_notes,
        bottleneck_updated_at=b.bottleneck_updated_at,
        design_completed_at=b.design_completed_at,
        created_at=b.created_at,
        updated_at=b.updated_at
    )

def _format_culvert_record(c: CulvertAcquisition, db: Session) -> DesignDemandItemResponse:
    bdd_div = db.query(RhdDivision).filter(RhdDivision.id == c.assigned_bdd_division_id).first() if c.assigned_bdd_division_id else None
    bdd_sde = db.query(User).filter(User.id == c.assigned_bdd_sde_id).first() if c.assigned_bdd_sde_id else None
    field_div = db.query(RhdDivision).filter(RhdDivision.id == c.division_id).first() if c.division_id else None
    circle = db.query(RhdCircle).filter(RhdCircle.id == c.circle_id).first() if c.circle_id else None
    zone = db.query(RhdZone).filter(RhdZone.id == c.zone_id).first() if c.zone_id else None

    exec_state = c.design_execution_state or "NOT_STARTED"
    if exec_state == "NOT_STARTED" and c.workflow_status in ["ASSIGNED_TO_BDD_EE", "ASSIGNED_TO_BDD_SDE"]:
        exec_state = "RUNNING"
    elif c.workflow_status == "DESIGN_APPROVED_COMPLETE" and exec_state != "SUSPENDED":
        exec_state = "SENT"

    return DesignDemandItemResponse(
        id=c.id,
        code=c.code,
        acquisition_type="CULVERT",
        structure_name=c.culvert_name or "Culvert Demand",
        structure_type="Box Culvert",
        road_name=c.road_name,
        chainage_km=c.chainage_km,
        chainage_m=c.chainage_m,
        location_chainage_gps_text=c.location_chainage_lrp_gps,
        zone_name=zone.name if zone else None,
        circle_name=circle.name if circle else None,
        division_name=field_div.name if field_div else None,
        field_division_id=c.division_id,
        assigned_bdd_division_id=c.assigned_bdd_division_id,
        assigned_bdd_division_name=bdd_div.name if bdd_div else None,
        assigned_bdd_sde_id=c.assigned_bdd_sde_id,
        assigned_bdd_sde_name=bdd_sde.full_name if bdd_sde else None,
        workflow_status=c.workflow_status,
        current_holder_role=c.current_holder_role,
        design_execution_state=exec_state,
        bottleneck_reason=c.bottleneck_reason,
        bottleneck_notes=c.bottleneck_notes,
        bottleneck_updated_at=c.bottleneck_updated_at,
        design_completed_at=c.design_completed_at,
        created_at=c.created_at,
        updated_at=c.updated_at
    )

@router.get("/design-demands", response_model=List[DesignDemandItemResponse])
def get_design_demands(
    design_state: Optional[str] = Query(None, description="RUNNING, SUSPENDED, SENT, NOT_STARTED, ALL"),
    design_division_id: Optional[int] = Query(None),
    field_division_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Unified Design Demands single view with bottleneck tracking.
    - SE, BDC and ACE, BMW, Supreme: Full view across all divisions in Bangladesh.
    - Executive Engineer and SDE of a Design Division: View all demands assigned to their division.
    - Field Division Engineers: View all demands originating from their division.
    """
    user_role = current_user.role
    is_headquarters_viewer = user_role in [
        settings.ROLE_SUPREME,
        settings.ROLE_WEBMASTER,
        settings.ROLE_BDC_SE,
        settings.ROLE_BMW_ACE
    ]

    bridge_query = db.query(BridgeAcquisition)
    culvert_query = db.query(CulvertAcquisition)

    # Scoping by Role
    if not is_headquarters_viewer:
        if user_role in [settings.ROLE_BDD_EE, settings.ROLE_BDD_SDE]:
            # Responsible for a design division
            if current_user.office_division_id:
                bridge_query = bridge_query.filter(
                    or_(
                        BridgeAcquisition.assigned_bdd_division_id == current_user.office_division_id,
                        BridgeAcquisition.assigned_bdd_sde_id == current_user.id
                    )
                )
                culvert_query = culvert_query.filter(
                    or_(
                        CulvertAcquisition.assigned_bdd_division_id == current_user.office_division_id,
                        CulvertAcquisition.assigned_bdd_sde_id == current_user.id
                    )
                )
            else:
                # Fallback: all items in BDD stages
                bridge_query = bridge_query.filter(BridgeAcquisition.workflow_status.in_(["ASSIGNED_TO_BDD_EE", "ASSIGNED_TO_BDD_SDE", "DESIGN_APPROVED_COMPLETE"]))
                culvert_query = culvert_query.filter(CulvertAcquisition.workflow_status.in_(["ASSIGNED_TO_BDD_EE", "ASSIGNED_TO_BDD_SDE", "DESIGN_APPROVED_COMPLETE"]))
        elif user_role in [settings.ROLE_FIELD_EE, settings.ROLE_FIELD_SDE, settings.ROLE_FIELD_SAE]:
            # Field division tracking their demands
            if current_user.office_division_id:
                bridge_query = bridge_query.filter(BridgeAcquisition.division_id == current_user.office_division_id)
                culvert_query = culvert_query.filter(CulvertAcquisition.division_id == current_user.office_division_id)
        elif user_role == settings.ROLE_FIELD_SE:
            if current_user.office_circle_id:
                bridge_query = bridge_query.filter(BridgeAcquisition.circle_id == current_user.office_circle_id)
                culvert_query = culvert_query.filter(CulvertAcquisition.circle_id == current_user.office_circle_id)
        elif user_role == settings.ROLE_FIELD_ACE:
            if current_user.office_zone_id:
                bridge_query = bridge_query.filter(BridgeAcquisition.zone_id == current_user.office_zone_id)
                culvert_query = culvert_query.filter(CulvertAcquisition.zone_id == current_user.office_zone_id)

    # Optional query filters
    if design_division_id:
        bridge_query = bridge_query.filter(BridgeAcquisition.assigned_bdd_division_id == design_division_id)
        culvert_query = culvert_query.filter(CulvertAcquisition.assigned_bdd_division_id == design_division_id)

    if field_division_id:
        bridge_query = bridge_query.filter(BridgeAcquisition.division_id == field_division_id)
        culvert_query = culvert_query.filter(CulvertAcquisition.division_id == field_division_id)

    if search:
        s_term = f"%{search}%"
        bridge_query = bridge_query.filter(
            or_(
                BridgeAcquisition.code.ilike(s_term),
                BridgeAcquisition.bridge_name.ilike(s_term),
                BridgeAcquisition.road_name.ilike(s_term),
                BridgeAcquisition.bottleneck_reason.ilike(s_term),
                BridgeAcquisition.bottleneck_notes.ilike(s_term)
            )
        )
        culvert_query = culvert_query.filter(
            or_(
                CulvertAcquisition.code.ilike(s_term),
                CulvertAcquisition.culvert_name.ilike(s_term),
                CulvertAcquisition.road_name.ilike(s_term),
                CulvertAcquisition.bottleneck_reason.ilike(s_term),
                CulvertAcquisition.bottleneck_notes.ilike(s_term)
            )
        )

    bridges = bridge_query.order_by(desc(BridgeAcquisition.updated_at)).all()
    culverts = culvert_query.order_by(desc(CulvertAcquisition.updated_at)).all()

    formatted_items = []
    for b in bridges:
        formatted_items.append(_format_bridge_record(b, db))
    for c in culverts:
        formatted_items.append(_format_culvert_record(c, db))

    # Apply design_state filter after computing effective state
    if design_state and design_state.upper() != "ALL":
        target_state = design_state.upper()
        formatted_items = [it for it in formatted_items if it.design_execution_state == target_state]

    # Sort most recently updated first
    formatted_items.sort(key=lambda x: x.updated_at or x.created_at, reverse=True)
    return formatted_items

@router.put("/design-demands/{acq_type}/{id}/status", response_model=DesignDemandItemResponse)
def update_design_demand_status(
    acq_type: str,
    id: int,
    req: DesignDemandStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Updates the real-time design execution state (RUNNING, SUSPENDED, SENT) and bottleneck notes.
    Authorized for BDD_EE, BDD_SDE, BDC_SE, BMW_ACE, and SUPREME.
    """
    valid_roles = [
        settings.ROLE_BDD_EE,
        settings.ROLE_BDD_SDE,
        settings.ROLE_BDC_SE,
        settings.ROLE_BMW_ACE,
        settings.ROLE_SUPREME,
        settings.ROLE_WEBMASTER
    ]
    if current_user.role not in valid_roles:
        raise HTTPException(
            status_code=403,
            detail="Only Bridge Design Circle / Division Engineers or Supreme authority can update design state and bottleneck status."
        )

    target_type = acq_type.upper()
    now = datetime.datetime.utcnow()

    if target_type == "BRIDGE":
        item = db.query(BridgeAcquisition).filter(BridgeAcquisition.id == id).first()
    elif target_type == "CULVERT":
        item = db.query(CulvertAcquisition).filter(CulvertAcquisition.id == id).first()
    else:
        raise HTTPException(status_code=400, detail="Invalid acquisition type. Must be BRIDGE or CULVERT.")

    if not item:
        raise HTTPException(status_code=404, detail="Acquisition record not found.")

    old_state = item.design_execution_state or "NOT_STARTED"
    new_state = req.design_execution_state.upper()
    if new_state not in ["RUNNING", "SUSPENDED", "SENT", "NOT_STARTED"]:
        raise HTTPException(status_code=400, detail="Invalid state. Allowed: RUNNING, SUSPENDED, SENT, NOT_STARTED.")

    item.design_execution_state = new_state
    item.bottleneck_reason = req.bottleneck_reason
    item.bottleneck_notes = req.bottleneck_notes
    item.bottleneck_updated_at = now
    if req.design_target_date:
        item.design_target_date = req.design_target_date

    if new_state == "SENT":
        item.design_completed_at = now

    # Log to WorkflowAuditLog
    audit_note = f"Design State changed from {old_state} to {new_state}."
    if req.bottleneck_reason:
        audit_note += f" Bottleneck: {req.bottleneck_reason}."
    if req.bottleneck_notes:
        audit_note += f" Awaiting: {req.bottleneck_notes}"

    audit_entry = WorkflowAuditLog(
        acquisition_type=target_type,
        acquisition_id=item.id,
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        actor_role=current_user.role,
        actor_office=current_user.designation,
        from_status=item.workflow_status,
        to_status=item.workflow_status,
        action="DESIGN_EXECUTION_STATE_UPDATE",
        endorsement_note=audit_note
    )
    db.add(audit_entry)
    db.commit()
    db.refresh(item)

    if target_type == "BRIDGE":
        return _format_bridge_record(item, db)
    return _format_culvert_record(item, db)

@router.get("/kpi-summary")
def get_pipeline_kpi_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns executive count of running, suspended (bottlenecks), sent, and total demands.
    """
    demands = get_design_demands(
        design_state="ALL",
        design_division_id=None,
        field_division_id=None,
        search=None,
        current_user=current_user,
        db=db
    )
    total = len(demands)
    running = sum(1 for d in demands if d.design_execution_state == "RUNNING")
    suspended = sum(1 for d in demands if d.design_execution_state == "SUSPENDED")
    sent = sum(1 for d in demands if d.design_execution_state == "SENT")
    not_started = sum(1 for d in demands if d.design_execution_state == "NOT_STARTED")

    return {
        "total_demands": total,
        "running_count": running,
        "suspended_count": suspended,
        "sent_count": sent,
        "not_started_count": not_started
    }
