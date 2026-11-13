import re
import json
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.config import settings
from backend.database import get_db
from backend.models import BridgeAcquisition, CulvertAcquisition, BoreholeLog, User
from backend.schemas import BoreholeLogCreate, BoreholeLogResponse
from backend.auth import get_current_user
from backend.security import validate_spt_value, validate_bangladesh_coordinates

router = APIRouter(prefix="/webmap", tags=["Webmap & Borelog GIS Integration"])

class CoordinateExtractRequest(BaseModel):
    input_text: str

class CoordinateExtractResponse(BaseModel):
    lat: Optional[float] = None
    lng: Optional[float] = None
    chainage: Optional[str] = None
    chainage_km: Optional[float] = None
    chainage_m: Optional[float] = None
    formatted_coords: Optional[str] = None
    webmap_link: Optional[str] = None

@router.post("/extract-coordinates", response_model=CoordinateExtractResponse)
def extract_coordinates(req: CoordinateExtractRequest):
    text = req.input_text.strip()
    lat = None
    lng = None
    chainage = None
    chainage_km = None
    chainage_m = None

    # 1. Regex for webmap.rhdbridge.com or google maps query params (?lat=23.123&lng=90.456)
    m_url = re.search(r'[?&]lat=([0-9.-]+)&lng=([0-9.-]+)', text)
    if m_url:
        lat = float(m_url.group(1))
        lng = float(m_url.group(2))

    # 2. Regex for google maps /@23.123,90.456
    if not lat:
        m_at = re.search(r'@([0-9.-]+),([0-9.-]+)', text)
        if m_at:
            lat = float(m_at.group(1))
            lng = float(m_at.group(2))

    # 3. Regex for comma separated lat,lng: "23.4567, 90.8765" or "23.4567,90.8765"
    if not lat:
        m_raw = re.search(r'([0-9]{1,2}\.[0-9]+)\s*,\s*([0-9]{1,3}\.[0-9]+)', text)
        if m_raw:
            lat = float(m_raw.group(1))
            lng = float(m_raw.group(2))

    # 4. Chainage extraction: e.g., "Ch 194+210" or "Ch 12+450" or "194+210"
    m_ch = re.search(r'(?:Ch|Chainage)?\s*([0-9]+)\+([0-9]+(?:\.[0-9]+)?)', text, re.IGNORECASE)
    if m_ch:
        chainage = f"Ch {m_ch.group(1)}+{m_ch.group(2)}"
        try:
            chainage_km = float(m_ch.group(1))
            chainage_m = float(m_ch.group(2))
        except Exception:
            pass

    formatted = f"{lat:.6f}, {lng:.6f}" if lat and lng else None
    webmap_link = f"{settings.WEBMAP_BASE_URL}/?lat={lat:.6f}&lng={lng:.6f}" if lat and lng else None

    return CoordinateExtractResponse(
        lat=lat,
        lng=lng,
        chainage=chainage,
        chainage_km=chainage_km,
        chainage_m=chainage_m,
        formatted_coords=formatted,
        webmap_link=webmap_link
    )

@router.get("/features.geojson")
@router.get("/geojson")
def get_webmap_features_geojson(db: Session = Depends(get_db)):
    bridges = db.query(BridgeAcquisition).all()
    culverts = db.query(CulvertAcquisition).all()

    features = []

    for b in bridges:
        if b.location_lat_lng:
            try:
                parts = [float(p.strip()) for p in b.location_lat_lng.split(",")]
                if len(parts) == 2:
                    lat, lng = parts[0], parts[1]
                    features.append({
                        "type": "Feature",
                        "geometry": {
                            "type": "Point",
                            "coordinates": [lng, lat]
                        },
                        "properties": {
                            "id": b.id,
                            "type": "BRIDGE",
                            "code": b.code,
                            "name": b.bridge_name or "Unnamed Bridge",
                            "road_name": b.road_name or "N/A",
                            "chainage": b.location_chainage_gps_text or "N/A",
                            "channel": b.river_channel_name or "N/A",
                            "channel_width_m": b.channel_width_m,
                            "workflow_status": b.workflow_status,
                            "total_boreholes": b.total_borehole_count,
                            "webmap_url": f"{settings.WEBMAP_BASE_URL}/?code={b.code}&lat={lat}&lng={lng}"
                        }
                    })
            except Exception:
                pass

    for c in culverts:
        if c.location_lat_lng:
            try:
                parts = [float(p.strip()) for p in c.location_lat_lng.split(",")]
                if len(parts) == 2:
                    lat, lng = parts[0], parts[1]
                    features.append({
                        "type": "Feature",
                        "geometry": {
                            "type": "Point",
                            "coordinates": [lng, lat]
                        },
                        "properties": {
                            "id": c.id,
                            "type": "CULVERT",
                            "code": c.code,
                            "name": c.culvert_name or "Unnamed Culvert",
                            "road_name": c.road_name or "N/A",
                            "chainage": c.location_chainage_lrp_gps or "N/A",
                            "culvert_type": c.existing_culvert_type or "N/A",
                            "workflow_status": c.workflow_status,
                            "total_boreholes": c.total_borehole_count,
                            "webmap_url": f"{settings.WEBMAP_BASE_URL}/?code={c.code}&lat={lat}&lng={lng}"
                        }
                    })
            except Exception:
                pass

    return {
        "type": "FeatureCollection",
        "features": features
    }

# --- Borehole CRUD ---
@router.get("/borelogs/{acq_type}/{acq_id}", response_model=List[BoreholeLogResponse])
def get_borehole_logs(
    acq_type: str,
    acq_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(BoreholeLog).filter(
        BoreholeLog.acquisition_type == acq_type.upper(),
        BoreholeLog.acquisition_id == acq_id
    ).order_by(BoreholeLog.borehole_no).all()

@router.post("/borelogs/{acq_type}/{acq_id}", response_model=BoreholeLogResponse)
def save_borehole_log(
    acq_type: str,
    acq_id: int,
    data: BoreholeLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    acq_type_upper = acq_type.upper()

    # Input Validation: Coordinates, Water table, and SPT bounds
    if data.lat is not None and data.lng is not None:
        validate_bangladesh_coordinates(data.lat, data.lng)

    if data.water_table_depth is not None and data.water_table_depth < 0:
        raise HTTPException(status_code=400, detail="Water table depth cannot be negative.")

    if data.spt_json:
        try:
            spt_list = json.loads(data.spt_json)
            if isinstance(spt_list, list):
                for item in spt_list:
                    if isinstance(item, dict):
                        depth = item.get("depth")
                        n_val = item.get("n_value")
                        if depth is not None and (float(depth) < 0 or float(depth) > 200.0):
                            raise HTTPException(status_code=400, detail="Borehole SPT depth must be between 0.0 and 200.0 meters.")
                        if n_val is not None:
                            validate_spt_value(int(n_val))
        except (json.JSONDecodeError, ValueError):
            raise HTTPException(status_code=400, detail="Invalid spt_json structure or value.")
    
    # Check if this borehole_no already exists for this acquisition
    existing = db.query(BoreholeLog).filter(
        BoreholeLog.acquisition_type == acq_type_upper,
        BoreholeLog.acquisition_id == acq_id,
        BoreholeLog.borehole_no == data.borehole_no
    ).first()

    if existing:
        for k, v in data.model_dump().items():
            setattr(existing, k, v)
        db.commit()
        db.refresh(existing)
        target = existing
    else:
        new_bh = BoreholeLog(**data.model_dump())
        db.add(new_bh)
        db.commit()
        db.refresh(new_bh)
        target = new_bh

    # Update total borehole count in parent acquisition
    total_count = db.query(BoreholeLog).filter(
        BoreholeLog.acquisition_type == acq_type_upper,
        BoreholeLog.acquisition_id == acq_id
    ).count()

    if acq_type_upper == "BRIDGE":
        b_parent = db.query(BridgeAcquisition).filter(BridgeAcquisition.id == acq_id).first()
        if b_parent and b_parent.total_borehole_count < total_count:
            b_parent.total_borehole_count = total_count
            db.commit()
    elif acq_type_upper == "CULVERT":
        c_parent = db.query(CulvertAcquisition).filter(CulvertAcquisition.id == acq_id).first()
        if c_parent and c_parent.total_borehole_count < total_count:
            c_parent.total_borehole_count = total_count
            db.commit()

    return target

@router.post("/sync-borelogs")
def sync_webmap_borelog(payload: Dict[str, Any], db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Accepts the exact JSON payload format generated by the borelog entry system on https://webmap.rhdbridge.com
    and associates it with the corresponding Bridge or Culvert dossier.
    """
    code = payload.get("structure_code")
    if not code:
        raise HTTPException(status_code=400, detail="Missing structure_code in sync payload")

    target_acq = None
    acq_type = "BRIDGE"
    if "BRG" in code:
        target_acq = db.query(BridgeAcquisition).filter(BridgeAcquisition.code == code).first()
        acq_type = "BRIDGE"
    elif "CLV" in code:
        target_acq = db.query(CulvertAcquisition).filter(CulvertAcquisition.code == code).first()
        acq_type = "CULVERT"

    if not target_acq:
        raise HTTPException(status_code=404, detail=f"No acquisition record found for code: {code}")

    bh_no = payload.get("borehole_no", 1)
    bh_uid = payload.get("borehole_uid") or payload.get("UID")
    
    bh = db.query(BoreholeLog).filter(
        BoreholeLog.acquisition_type == acq_type,
        BoreholeLog.acquisition_id == target_acq.id,
        BoreholeLog.borehole_no == bh_no
    ).first()

    strata = json.dumps(payload.get("strata", []))
    spt = json.dumps(payload.get("spt", []))
    sample = json.dumps(payload.get("samples", []))
    lab = json.dumps(payload.get("lab", {}))

    if not bh:
        bh = BoreholeLog(
            acquisition_type=acq_type,
            acquisition_id=target_acq.id,
            borehole_no=bh_no,
            borehole_uid=bh_uid,
            chainage=payload.get("chainage"),
            lat=payload.get("lat"),
            lng=payload.get("lng"),
            ground_bed_rl=payload.get("ground_rl"),
            water_table_depth=payload.get("water_table"),
            remarks=payload.get("remarks"),
            strata_json=strata,
            spt_json=spt,
            sample_json=sample,
            lab_json=lab
        )
        db.add(bh)
    else:
        bh.borehole_uid = bh_uid
        bh.chainage = payload.get("chainage")
        bh.lat = payload.get("lat")
        bh.lng = payload.get("lng")
        bh.ground_bed_rl = payload.get("ground_rl")
        bh.water_table_depth = payload.get("water_table")
        bh.remarks = payload.get("remarks")
        bh.strata_json = strata
        bh.spt_json = spt
        bh.sample_json = sample
        bh.lab_json = lab

    db.commit()
    db.refresh(bh)
    return {"success": True, "message": "Borehole synchronized with Webmap ecosystem.", "borehole_id": bh.id}
