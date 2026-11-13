import sys
root_path = r"E:\acqform"
if root_path not in sys.path:
    sys.path.insert(0, root_path)

from backend.database import SessionLocal
from backend.models import BridgeAcquisition, CulvertAcquisition, RhdDivision, RhdZone
from backend.jurisdiction import get_vested_design_division

def backfill():
    db = SessionLocal()
    bridges = db.query(BridgeAcquisition).all()
    culverts = db.query(CulvertAcquisition).all()

    print(f"Backfilling {len(bridges)} bridges and {len(culverts)} culverts...")

    # Default division fallback if None: assign to a sample division to trace zone
    default_div = db.query(RhdDivision).filter(RhdDivision.name == "Dhaka").first()

    for b in bridges:
        if not b.division_id and default_div:
            # If bridge name mentions Dhaka / Meghna / Comilla / Chittagong, infer
            if "Kagazpur" in (b.bridge_name or "") or "Comilla" in (b.road_name or "") or "Chittagong" in (b.road_name or ""):
                # Comilla / Chittagong -> Zone 2 (Chattogram) or 3 (Comilla)
                comilla_div = db.query(RhdDivision).filter(RhdDivision.name.ilike("%Comilla%")).first()
                if comilla_div:
                    b.division_id = comilla_div.id
                    b.circle_id = comilla_div.circle_id
                    b.zone_id = comilla_div.circle.zone_id
            else:
                b.division_id = default_div.id
                b.circle_id = default_div.circle_id
                b.zone_id = default_div.circle.zone_id

        vested = get_vested_design_division(db, zone_id=b.zone_id, division_id=b.division_id)
        if vested:
            b.assigned_bdd_division_id = vested.id
            print(f"Bridge {b.code} ({b.bridge_name}) -> Vested into {vested.name} ({vested.code})")

    for c in culverts:
        if not c.division_id and default_div:
            c.division_id = default_div.id
            c.circle_id = default_div.circle_id
            c.zone_id = default_div.circle.zone_id

        vested = get_vested_design_division(db, zone_id=c.zone_id, division_id=c.division_id)
        if vested:
            c.assigned_bdd_division_id = vested.id
            print(f"Culvert {c.code} ({c.culvert_name}) -> Vested into {vested.name} ({vested.code})")

    db.commit()
    print("Backfill complete and committed!")
    db.close()

if __name__ == "__main__":
    backfill()
