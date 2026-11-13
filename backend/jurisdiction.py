import json
import logging
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from backend.models import RhdZone, RhdCircle, RhdDivision

logger = logging.getLogger("rhd_adds.jurisdiction")

# Official RHD Territorial Duty Distribution for Bridge Design Divisions
# Division 1: Dhaka, Mymensingh, Rangpur Zone
# Division 2: Sylhet, Comilla (Comilla), Chittagong (Chattogram) Zone
# Division 3: The Rest (Khulna, Barishal, Rajshahi, Gopalganj, etc.)
DEFAULT_DUTY_DISTRIBUTION = {
    1: ["Dhaka", "Mymensingh", "Rangpur"],
    2: ["Sylhet", "Cumilla", "Comilla", "Chattogram", "Chittagong"],
    3: ["Khulna", "Barishal", "Rajshahi", "Gopalganj"]  # Plus default catch-all
}

def resolve_zone_for_hierarchy(
    db: Session,
    zone_id: Optional[int] = None,
    zone_name: Optional[str] = None,
    circle_id: Optional[int] = None,
    division_id: Optional[int] = None
) -> Optional[RhdZone]:
    """
    Traces and resolves the RhdZone given any part of the RHD administrative hierarchy.
    """
    if zone_id:
        z = db.query(RhdZone).filter(RhdZone.id == zone_id).first()
        if z:
            return z

    if division_id:
        div = db.query(RhdDivision).filter(RhdDivision.id == division_id).first()
        if div and div.circle:
            if div.circle.zone:
                return div.circle.zone
            elif div.circle.zone_id:
                return db.query(RhdZone).filter(RhdZone.id == div.circle.zone_id).first()

    if circle_id:
        cir = db.query(RhdCircle).filter(RhdCircle.id == circle_id).first()
        if cir and cir.zone:
            return cir.zone
        elif cir and cir.zone_id:
            return db.query(RhdZone).filter(RhdZone.id == cir.zone_id).first()

    if zone_name:
        z = db.query(RhdZone).filter(RhdZone.name.ilike(f"%{zone_name.strip()}%")).first()
        if z:
            return z

    return None

def get_vested_design_division(
    db: Session,
    zone_id: Optional[int] = None,
    zone_name: Optional[str] = None,
    circle_id: Optional[int] = None,
    division_id: Optional[int] = None
) -> Optional[RhdDivision]:
    """
    Determines which Bridge Design Division (BDD-1, BDD-2, or BDD-3) is vested with
    deliberation and design responsibility for a demand, according to its originating zone.
    
    Rules:
    - Dhaka, Mymensingh, Rangpur Zone -> Design Division 1
    - Sylhet, Comilla, Chittagong Zone -> Design Division 2
    - Khulna, Barishal, Rajshahi, Gopalganj, and the Rest -> Design Division 3
    """
    zone = resolve_zone_for_hierarchy(db, zone_id=zone_id, zone_name=zone_name, circle_id=circle_id, division_id=division_id)
    zone_str = zone.name if zone else (zone_name or "")
    zone_clean = zone_str.lower()

    target_bdd_number = 3  # Default catch-all is Design Division 3

    # Check Custom Mappings from RhdDivision metadata if configured
    design_divs = db.query(RhdDivision).filter(RhdDivision.name.ilike("%Bridge Design Division%")).all()
    for d in design_divs:
        if d.metadata_json:
            try:
                meta = json.loads(d.metadata_json)
                assigned_zones = [z.lower() for z in meta.get("assigned_zones", [])]
                if any(az in zone_clean for az in assigned_zones):
                    return d
            except Exception:
                pass

    # Standard Statutory Duty Distribution
    if any(k.lower() in zone_clean for k in DEFAULT_DUTY_DISTRIBUTION[1]):
        target_bdd_number = 1
    elif any(k.lower() in zone_clean for k in DEFAULT_DUTY_DISTRIBUTION[2]):
        target_bdd_number = 2
    else:
        target_bdd_number = 3

    # Retrieve corresponding RhdDivision record
    target_div = db.query(RhdDivision).filter(
        RhdDivision.name.ilike(f"%Bridge Design Division-{target_bdd_number}%")
    ).first()

    if not target_div:
        target_div = db.query(RhdDivision).filter(
            RhdDivision.code.ilike(f"%BDD_{target_bdd_number}%")
        ).first()

    if not target_div:
        # Fallback to any design division
        target_div = db.query(RhdDivision).filter(
            RhdDivision.name.ilike("%Bridge Design Division%")
        ).first()

    return target_div

def auto_populate_acquisition_hierarchy_and_vesting(
    item_dict: Dict[str, Any],
    db: Session
) -> Dict[str, Any]:
    """
    Enriches bridge or culvert creation payload with accurate zone_id, circle_id,
    and automatic vesting of assigned_bdd_division_id based on territorial duty distribution.
    """
    div_id = item_dict.get("division_id")
    cir_id = item_dict.get("circle_id")
    zn_id = item_dict.get("zone_id")
    zn_name = item_dict.get("zone_name")

    # If division_id is present, deduce circle_id and zone_id if missing
    if div_id:
        div = db.query(RhdDivision).filter(RhdDivision.id == div_id).first()
        if div:
            if not cir_id and div.circle_id:
                item_dict["circle_id"] = div.circle_id
                cir_id = div.circle_id
            if div.circle and not zn_id:
                item_dict["zone_id"] = div.circle.zone_id
                zn_id = div.circle.zone_id

    # If zone_name string was provided without zone_id
    if not zn_id and zn_name:
        z = db.query(RhdZone).filter(RhdZone.name.ilike(f"%{zn_name.strip()}%")).first()
        if z:
            item_dict["zone_id"] = z.id
            zn_id = z.id

    # If assigned_bdd_division_id is not manually specified, auto-assign to vested Design Division
    if not item_dict.get("assigned_bdd_division_id"):
        vested_bdd = get_vested_design_division(
            db,
            zone_id=zn_id,
            zone_name=zn_name,
            circle_id=cir_id,
            division_id=div_id
        )
        if vested_bdd:
            item_dict["assigned_bdd_division_id"] = vested_bdd.id
            logger.info(
                "Auto-vested demand into %s (ID %d) for zone %s.",
                vested_bdd.name, vested_bdd.id, zn_name or zn_id
            )

    return item_dict

def get_jurisdiction_duty_matrix(db: Session) -> List[Dict[str, Any]]:
    """
    Returns full territorial jurisdiction matrix for UI dashboards and Supreme console.
    """
    zones = db.query(RhdZone).filter(RhdZone.code != "TECH_SERVICES").order_by(RhdZone.name).all()
    matrix = []

    for z in zones:
        vested_bdd = get_vested_design_division(db, zone_id=z.id, zone_name=z.name)
        matrix.append({
            "zone_id": z.id,
            "zone_name": z.name,
            "zone_code": z.code,
            "vested_division_id": vested_bdd.id if vested_bdd else None,
            "vested_division_name": vested_bdd.name if vested_bdd else "Unassigned",
            "vested_division_code": vested_bdd.code if vested_bdd else None
        })

    return matrix
