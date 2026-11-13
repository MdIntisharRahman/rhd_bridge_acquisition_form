from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import BridgeAcquisition, CulvertAcquisition, Attachment, WorkflowAuditLog, BoreholeLog, User
from backend.exports.pdf_generator import generate_acquisition_pdf
from backend.exports.excel_generator import generate_acquisition_excel
from backend.exports.zip_packager import package_acquisition_zip
from backend.auth import get_current_user

router = APIRouter(prefix="/acquisitions", tags=["Engineering Export Suite"])

def _fetch_record_and_data(acq_type: str, id: int, db: Session):
    acq_type_upper = acq_type.upper()
    if acq_type_upper == "BRIDGE":
        item = db.query(BridgeAcquisition).filter(BridgeAcquisition.id == id).first()
    elif acq_type_upper == "CULVERT":
        item = db.query(CulvertAcquisition).filter(CulvertAcquisition.id == id).first()
    else:
        raise HTTPException(status_code=400, detail="Invalid acquisition type. Must be 'bridge' or 'culvert'")

    if not item:
        raise HTTPException(status_code=404, detail=f"{acq_type_upper} acquisition record #{id} not found")

    audit_logs = db.query(WorkflowAuditLog).filter(
        WorkflowAuditLog.acquisition_type == acq_type_upper,
        WorkflowAuditLog.acquisition_id == id
    ).order_by(WorkflowAuditLog.timestamp).all()

    attachments = db.query(Attachment).filter(
        Attachment.acquisition_type == acq_type_upper,
        Attachment.acquisition_id == id
    ).all()

    boreholes = db.query(BoreholeLog).filter(
        BoreholeLog.acquisition_type == acq_type_upper,
        BoreholeLog.acquisition_id == id
    ).order_by(BoreholeLog.borehole_no).all()

    return item, acq_type_upper, audit_logs, attachments, boreholes

@router.get("/{acq_type}/{id}/export-pdf")
def export_pdf(acq_type: str, id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item, acq_type_upper, audit_logs, attachments, _ = _fetch_record_and_data(acq_type, id, db)
    pdf_bytes = generate_acquisition_pdf(item, acq_type_upper, audit_logs, attachments)

    filename = f"{item.code}_Engineering_Datasheet.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/{acq_type}/{id}/export-excel")
def export_excel(acq_type: str, id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item, acq_type_upper, audit_logs, _, boreholes = _fetch_record_and_data(acq_type, id, db)
    excel_bytes = generate_acquisition_excel(item, acq_type_upper, audit_logs, boreholes)

    filename = f"{item.code}_Engineering_Schedule.xlsx"
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/{acq_type}/{id}/export-zip")
def export_zip(acq_type: str, id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item, acq_type_upper, audit_logs, attachments, boreholes = _fetch_record_and_data(acq_type, id, db)
    zip_bytes = package_acquisition_zip(item, acq_type_upper, audit_logs, attachments, boreholes)

    filename = f"{item.code}_Engineering_Dossier.zip"
    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
