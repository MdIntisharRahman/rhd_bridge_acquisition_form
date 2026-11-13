import json
import datetime
from typing import Optional, List, Tuple
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from backend.config import settings
from backend.models import (
    User, BridgeAcquisition, CulvertAcquisition, WorkflowAuditLog, Attachment
)
from backend.schemas import WorkflowTransitionRequest
from backend.jurisdiction import get_vested_design_division

# Streamlined Peer EE-to-EE Workflow States (SE and ACE Abrogated)
STATUS_DRAFT_FIELD = "DRAFT_FIELD"
STATUS_PENDING_FIELD_EE_AUTH = "PENDING_FIELD_EE_AUTH"
STATUS_PASS_TO_FIELD_SDE = "PASS_TO_FIELD_SDE"
STATUS_TRANSMITTED_TO_BDD_EE = "TRANSMITTED_TO_BDD_EE"
STATUS_ASSIGNED_TO_BDD_SDE = "ASSIGNED_TO_BDD_SDE"
STATUS_DESIGN_PREPARED_PENDING_EE = "DESIGN_PREPARED_PENDING_EE"
STATUS_DESIGN_APPROVED_COMPLETE = "DESIGN_APPROVED_COMPLETE"
STATUS_DISPATCHED_TO_FIELD_SDE = "DISPATCHED_TO_FIELD_SDE"
STATUS_RETURNED_FOR_CORRECTION = "RETURNED_FOR_CORRECTION"

# Legacy state aliases for seamless backward compatibility
LEGACY_INTERMEDIATE_STATES = [
    "FORWARDED_TO_FIELD_SE",
    "FORWARDED_TO_FIELD_ACE",
    "FORWARDED_TO_BMW_ACE",
    "FORWARDED_TO_BDC_SE",
    "ASSIGNED_TO_BDD_EE"
]

PEER_EE_WORKFLOW_STEPS = [
    {"stage": 1, "status": STATUS_DRAFT_FIELD, "role": "FIELD_SAE", "title": "Field Data Acquisition"},
    {"stage": 2, "status": STATUS_PENDING_FIELD_EE_AUTH, "role": "FIELD_EE", "title": "Field Division EE Authorization"},
    {"stage": 3, "status": STATUS_TRANSMITTED_TO_BDD_EE, "role": "BDD_EE", "title": "Bridge Design Division EE Review"},
    {"stage": 4, "status": STATUS_ASSIGNED_TO_BDD_SDE, "role": "BDD_SDE", "title": "Design Preparation & Modeling"},
    {"stage": 5, "status": STATUS_DESIGN_PREPARED_PENDING_EE, "role": "BDD_EE", "title": "Prepared Design Vetting"},
    {"stage": 6, "status": STATUS_DESIGN_APPROVED_COMPLETE, "role": "FIELD_EE", "title": "Design Approved & Transmitted to Field"},
    {"stage": 7, "status": STATUS_DISPATCHED_TO_FIELD_SDE, "role": "FIELD_SDE", "title": "Field SDE Execution & Archival"}
]

def transition_workflow(
    db: Session,
    item: BridgeAcquisition | CulvertAcquisition,
    acq_type: str,  # "BRIDGE" or "CULVERT"
    req: WorkflowTransitionRequest,
    current_user: User
) -> Tuple[str, str]:
    from_status = item.workflow_status
    action = req.action.upper()
    endorsement_note = req.endorsement_note or ""
    flagged_json = json.dumps(req.flagged_sections) if req.flagged_sections else None
    
    # 0. Supreme Override
    if current_user.role == settings.ROLE_SUPREME and action == "OVERRIDE":
        to_status = req.return_reason or STATUS_DESIGN_APPROVED_COMPLETE
        to_holder = settings.ROLE_SUPREME
        item.workflow_status = to_status
        item.current_holder_role = to_holder
        _log_audit(db, acq_type, item.id, current_user, from_status, to_status, "SUPREME_OVERRIDE", endorsement_note, req.demand_letter_id, flagged_json)
        return from_status, to_status

    # 1. Field SAE / SDE submits to Field EE
    if from_status in [STATUS_DRAFT_FIELD, STATUS_RETURNED_FOR_CORRECTION] and action in ["SUBMIT_TO_EE", "FORWARD_TO_EE", "SUBMIT"]:
        if current_user.role not in [settings.ROLE_FIELD_SAE, settings.ROLE_FIELD_SDE, settings.ROLE_FIELD_EE]:
            raise HTTPException(status_code=403, detail="Only Field SAE, SDE or EE can submit dossier for Division EE Authorization.")
        to_status = STATUS_PENDING_FIELD_EE_AUTH
        item.current_holder_role = settings.ROLE_FIELD_EE
        item.workflow_status = to_status
        _log_audit(db, acq_type, item.id, current_user, from_status, to_status, "SUBMIT_TO_FIELD_EE", endorsement_note, req.demand_letter_id, flagged_json)
        return from_status, to_status

    # 2. Field EE passes info sheet to Field SDE (Customary verification)
    if from_status == STATUS_PENDING_FIELD_EE_AUTH and action in ["PASS_TO_FIELD_SDE", "PASS_TO_SDE", "CUSTOMARY_PASS_SDE"]:
        if current_user.role != settings.ROLE_FIELD_EE:
            raise HTTPException(status_code=403, detail="Only Field Executive Engineer (FIELD_EE) can pass dossier to Field SDE.")
        to_status = STATUS_PASS_TO_FIELD_SDE
        item.current_holder_role = settings.ROLE_FIELD_SDE
        item.workflow_status = to_status
        if req.target_assignee_user_id:
            item.assigned_field_sde_id = req.target_assignee_user_id
        _log_audit(db, acq_type, item.id, current_user, from_status, to_status, "FIELD_EE_TO_SDE_CUSTOMARY_PASS", endorsement_note, req.demand_letter_id, flagged_json)
        return from_status, to_status

    # 3. Field SDE verifies and returns to Field EE
    if from_status == STATUS_PASS_TO_FIELD_SDE and action in ["SDE_VERIFY_TO_EE", "VERIFY_TO_EE", "RETURN_TO_EE"]:
        if current_user.role not in [settings.ROLE_FIELD_SDE, settings.ROLE_FIELD_EE]:
            raise HTTPException(status_code=403, detail="Only Field SDE or Field EE can verify and return dossier to Field EE.")
        to_status = STATUS_PENDING_FIELD_EE_AUTH
        item.current_holder_role = settings.ROLE_FIELD_EE
        item.workflow_status = to_status
        _log_audit(db, acq_type, item.id, current_user, from_status, to_status, "FIELD_SDE_VERIFIED_TO_EE", endorsement_note, req.demand_letter_id, flagged_json)
        return from_status, to_status

    # 4. Field EE authorizes & transmits directly to Bridge Design Division EE (BDD-1, 2, or 3)
    if (from_status in [STATUS_PENDING_FIELD_EE_AUTH, STATUS_PASS_TO_FIELD_SDE] or from_status in LEGACY_INTERMEDIATE_STATES) and action in [
        "TRANSMIT_TO_DESIGN_EE", "AUTHORIZE_AND_TRANSMIT", "TRANSMIT_TO_BDD", "AUTHORIZE", "FORWARD_TO_SE"
    ]:
        if current_user.role != settings.ROLE_FIELD_EE and current_user.role != settings.ROLE_SUPREME:
            raise HTTPException(status_code=403, detail="Only Field Executive Engineer (FIELD_EE) can transmit dossier to Bridge Design Division EE.")
        
        # Determine target Bridge Design Division (1, 2, or 3)
        if req.target_division_id:
            item.assigned_bdd_division_id = req.target_division_id
        elif not item.assigned_bdd_division_id:
            vested = get_vested_design_division(db, zone_id=item.zone_id, division_id=item.division_id)
            if vested:
                item.assigned_bdd_division_id = vested.id
        
        to_status = STATUS_TRANSMITTED_TO_BDD_EE
        item.current_holder_role = settings.ROLE_BDD_EE
        item.workflow_status = to_status
        item.design_execution_state = "RUNNING"
        _log_audit(db, acq_type, item.id, current_user, from_status, to_status, "FIELD_EE_TO_DESIGN_EE_TRANSMIT", endorsement_note, req.demand_letter_id, flagged_json)
        return from_status, to_status

    # 5. Bridge Design Division EE assigns to Design SDE
    if (from_status in [STATUS_TRANSMITTED_TO_BDD_EE, "ASSIGNED_TO_BDD_EE", "FORWARDED_TO_BDC_SE"]) and action in ["ASSIGN_TO_BDD_SDE", "ASSIGN_TO_SDE", "ASSIGN_SDE"]:
        if current_user.role != settings.ROLE_BDD_EE and current_user.role != settings.ROLE_SUPREME:
            raise HTTPException(status_code=403, detail="Only Bridge Design Division Executive Engineer (BDD_EE) can assign to Design SDE.")
        to_status = STATUS_ASSIGNED_TO_BDD_SDE
        item.current_holder_role = settings.ROLE_BDD_SDE
        item.workflow_status = to_status
        if req.target_assignee_user_id:
            item.assigned_bdd_sde_id = req.target_assignee_user_id
            item.current_assignee_user_id = req.target_assignee_user_id
        _log_audit(db, acq_type, item.id, current_user, from_status, to_status, "BDD_EE_TO_SDE_ASSIGNMENT", endorsement_note, req.demand_letter_id, flagged_json)
        return from_status, to_status

    # 6. Bridge Design SDE attaches prepared design and submits to Design EE
    if from_status == STATUS_ASSIGNED_TO_BDD_SDE and action in ["SUBMIT_DESIGN_TO_EE", "ATTACH_AND_SUBMIT", "SUBMIT_PREPARED_DESIGN"]:
        if current_user.role not in [settings.ROLE_BDD_SDE, settings.ROLE_BDD_EE]:
            raise HTTPException(status_code=403, detail="Only Bridge Design SDE or EE can submit prepared design for vetting.")
        to_status = STATUS_DESIGN_PREPARED_PENDING_EE
        item.current_holder_role = settings.ROLE_BDD_EE
        item.workflow_status = to_status
        if req.prepared_design_notes:
            item.prepared_design_notes = req.prepared_design_notes
        item.prepared_design_attached_at = datetime.datetime.utcnow()
        item.prepared_design_attached_by_id = current_user.id
        _log_audit(db, acq_type, item.id, current_user, from_status, to_status, "BDD_SDE_PREPARED_DESIGN_SUBMISSION", endorsement_note, req.demand_letter_id, flagged_json)
        return from_status, to_status

    # 7. Bridge Design Division EE approves prepared design & transmits directly back to Field EE
    if (from_status in [STATUS_DESIGN_PREPARED_PENDING_EE, STATUS_ASSIGNED_TO_BDD_SDE, STATUS_TRANSMITTED_TO_BDD_EE, "ASSIGNED_TO_BDD_EE"]) and action in [
        "APPROVE_AND_TRANSMIT", "APPROVE", "VERIFY_COMPLETE", "APPROVE_DESIGN"
    ]:
        if current_user.role not in [settings.ROLE_BDD_EE, settings.ROLE_SUPREME]:
            raise HTTPException(status_code=403, detail="Only Bridge Design Division Executive Engineer (BDD_EE) can approve and transmit design to Field EE.")
        to_status = STATUS_DESIGN_APPROVED_COMPLETE
        item.current_holder_role = settings.ROLE_FIELD_EE  # Returns back to Field EE as completed package!
        item.workflow_status = to_status
        item.prepared_design_approved_at = datetime.datetime.utcnow()
        item.design_completed_at = datetime.datetime.utcnow()
        item.design_execution_state = "SENT"
        _log_audit(db, acq_type, item.id, current_user, from_status, to_status, "DESIGN_APPROVED_AND_TRANSMITTED_TO_FIELD", endorsement_note, req.demand_letter_id, flagged_json)
        return from_status, to_status

    # 8. Field EE dispatches approved design package to Field SDE for execution
    if from_status == STATUS_DESIGN_APPROVED_COMPLETE and action in ["DISPATCH_TO_FIELD_SDE", "DISPATCH_TO_SDE", "DISPATCH"]:
        if current_user.role != settings.ROLE_FIELD_EE and current_user.role != settings.ROLE_SUPREME:
            raise HTTPException(status_code=403, detail="Only Field Executive Engineer (FIELD_EE) can dispatch completed design to Field SDE.")
        to_status = STATUS_DISPATCHED_TO_FIELD_SDE
        item.current_holder_role = settings.ROLE_FIELD_SDE
        item.workflow_status = to_status
        item.dispatched_to_field_sde_at = datetime.datetime.utcnow()
        if req.target_assignee_user_id:
            item.dispatched_field_sde_id = req.target_assignee_user_id
        _log_audit(db, acq_type, item.id, current_user, from_status, to_status, "FIELD_EE_DISPATCH_TO_SDE", endorsement_note, req.demand_letter_id, flagged_json)
        return from_status, to_status

    # 9. Return for Correction (by BDD EE/SDE or Field EE back for field technical revision)
    if (
        from_status in [
            STATUS_TRANSMITTED_TO_BDD_EE, STATUS_ASSIGNED_TO_BDD_SDE, STATUS_DESIGN_PREPARED_PENDING_EE,
            "ASSIGNED_TO_BDD_EE", "ASSIGNED_TO_BDD_SDE",
            STATUS_PENDING_FIELD_EE_AUTH, STATUS_PASS_TO_FIELD_SDE
        ] and action in ["RETURN", "RETURN_FOR_CORRECTION"]
    ):
        if current_user.role not in [
            settings.ROLE_BDD_EE, settings.ROLE_BDD_SDE, settings.ROLE_FIELD_EE, settings.ROLE_SUPREME
        ]:
            raise HTTPException(status_code=403, detail="Only Bridge Design Engineers (BDD_EE / BDD_SDE) or Field Executive Engineers can return dossiers for correction.")
        
        to_status = STATUS_RETURNED_FOR_CORRECTION
        item.current_holder_role = settings.ROLE_FIELD_SAE if current_user.role == settings.ROLE_FIELD_EE else settings.ROLE_FIELD_EE
        item.workflow_status = to_status
        return_note = req.return_reason or endorsement_note or "Returned for technical correction"
        item.return_reason_notes = return_note
        item.flagged_sections_json = flagged_json
        
        return_action = "RETURNED_BY_FIELD_EE" if current_user.role == settings.ROLE_FIELD_EE else "RETURNED_FOR_CORRECTION"
        _log_audit(db, acq_type, item.id, current_user, from_status, to_status, return_action, return_note, req.demand_letter_id, flagged_json)
        return from_status, to_status

    raise HTTPException(
        status_code=400,
        detail=f"Invalid workflow transition: Action '{action}' is not permissible from current state '{from_status}' by role '{current_user.role}'."
    )

def _log_audit(db: Session, acq_type: str, acq_id: int, actor: User, from_status: str, to_status: str, action: str, note: str, demand_letter_id: Optional[int], flagged_json: Optional[str]):
    log_entry = WorkflowAuditLog(
        acquisition_type=acq_type,
        acquisition_id=acq_id,
        actor_id=actor.id,
        actor_name=actor.full_name,
        actor_role=actor.role,
        actor_office=actor.designation,
        from_status=from_status,
        to_status=to_status,
        action=action,
        endorsement_note=note,
        demand_letter_id=demand_letter_id,
        flagged_sections_json=flagged_json
    )
    db.add(log_entry)
    db.commit()
