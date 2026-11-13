import os
import re
import json
import logging
from sqlalchemy import text
from sqlalchemy.orm import Session
from backend.database import engine, SessionLocal, Base
from backend.models import (
    User, RhdZone, RhdCircle, RhdDivision, RoadType, Road,
    BridgeAcquisition, CulvertAcquisition, WorkflowAuditLog
)
from backend.auth import get_password_hash
from backend.config import settings

logger = logging.getLogger("rhd_adds.seed")

def seed_database(seed_file_path: str = None):
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    if not seed_file_path:
        seed_file_path = os.path.join(os.path.dirname(__file__), "rhd_master_hierarchy_seed.json")
        if not os.path.exists(seed_file_path):
            seed_file_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "rhd_master_hierarchy_seed.json")

    logger.info("Checking RHD master hierarchy seed from %s", seed_file_path)
    if not os.path.exists(seed_file_path):
        logger.error("Seed file not found at %s", seed_file_path)
        db.close()
        return

    with open(seed_file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # 1. Seed Road Types
    road_type_map = {}
    for rt in data.get("road_types", []):
        existing = db.query(RoadType).filter(RoadType.code == rt["code"]).first()
        if not existing:
            existing = RoadType(code=rt["code"], name=rt["name"], description=rt.get("description"))
            db.add(existing)
            db.flush()
        road_type_map[rt["code"]] = existing.id

    # 2. Seed Zones, Circles, Divisions (Synchronizing exact hierarchy)
    division_map = {}
    valid_circle_ids = set()
    valid_div_ids = set()

    # Preempt UNIQUE constraint collisions during renumbering by temporarily prefixing existing codes
    db.execute(text("UPDATE rhd_divisions SET code = 'TMP_' || id || '_' || code WHERE code NOT LIKE 'TMP_%'"))
    db.execute(text("UPDATE rhd_circles SET code = 'TMP_' || id || '_' || code WHERE code NOT LIKE 'TMP_%' AND code != 'CIR_BDC'"))
    db.flush()

    for z in data.get("zones", []):
        zone_obj = db.query(RhdZone).filter(RhdZone.code == z["code"]).first()
        if not zone_obj:
            zone_obj = RhdZone(code=z["code"], name=z["name"])
            db.add(zone_obj)
            db.flush()
        else:
            zone_obj.name = z["name"]

        for c in z.get("circles", []):
            circle_obj = db.query(RhdCircle).filter(
                RhdCircle.name == c["name"],
                RhdCircle.zone_id == zone_obj.id
            ).first()
            if not circle_obj:
                circle_obj = db.query(RhdCircle).filter(RhdCircle.code == c["code"]).first()
            if not circle_obj:
                circle_obj = RhdCircle(code=c["code"], name=c["name"], zone_id=zone_obj.id)
                db.add(circle_obj)
                db.flush()
            else:
                circle_obj.code = c["code"]
                circle_obj.name = c["name"]
                circle_obj.zone_id = zone_obj.id
                db.flush()
            valid_circle_ids.add(circle_obj.id)

            for d in c.get("divisions", []):
                div_obj = db.query(RhdDivision).filter(
                    RhdDivision.name == d["name"],
                    RhdDivision.circle_id == circle_obj.id
                ).first()
                if not div_obj:
                    div_obj = db.query(RhdDivision).filter(RhdDivision.name == d["name"]).first()
                if not div_obj:
                    div_obj = RhdDivision(code=d["code"], name=d["name"], circle_id=circle_obj.id)
                    db.add(div_obj)
                    db.flush()
                else:
                    div_obj.code = d["code"]
                    div_obj.name = d["name"]
                    div_obj.circle_id = circle_obj.id
                    db.flush()
                division_map[d["name"]] = div_obj.id
                valid_div_ids.add(div_obj.id)

    # Prune stale divisions not in the 64-field/4-tech master seed
    stale_divs = db.query(RhdDivision).filter(~RhdDivision.id.in_(valid_div_ids)).all()
    for s_div in stale_divs:
        db.query(User).filter(User.office_division_id == s_div.id).delete()
        db.delete(s_div)
    db.flush()

    # Prune stale circles
    stale_circles = db.query(RhdCircle).filter(~RhdCircle.id.in_(valid_circle_ids)).all()
    for s_circ in stale_circles:
        db.delete(s_circ)
    db.flush()

    # 3. Seed Roads (Complete 968 National, Regional, and Zilla Roads Network)
    for r in data.get("roads", []):
        existing = db.query(Road).filter(Road.road_number == r["road_number"]).first()
        r_type_id = road_type_map.get(r.get("road_type_code", "N"), 1)
        target_div_name = r.get("division_name")
        if target_div_name == "Cumilla":
            target_div_name = "Comilla"
        elif target_div_name == "Chattogram South":
            target_div_name = "Chattogram"
        elif target_div_name == "Coxsbazar":
            target_div_name = "Cox's Bazar"
        div_id = division_map.get(target_div_name)

        if not existing:
            new_road = Road(
                road_type_id=r_type_id,
                road_number=r["road_number"],
                road_name=r["road_name"],
                division_id=div_id,
                length_km=r.get("length_km", 0.0)
            )
            db.add(new_road)
        else:
            existing.road_name = r["road_name"]
            existing.road_type_id = r_type_id
            if r.get("length_km"):
                existing.length_km = r.get("length_km")
            if not existing.division_id and div_id:
                existing.division_id = div_id

    # 4. Seed Users (Strict Singleton Supreme verification & Hierarchy Linking)
    user_map = {}
    default_password_hash = get_password_hash("rhd123")
    
    # Uninitiate provisional SE and ACE accounts per institutional directive
    uninitiated_usernames = ["bdc_se", "bmw_ace", "field_se", "field_ace"]
    for uname in uninitiated_usernames:
        puser = db.query(User).filter(User.username == uname).first()
        if puser:
            logger.info("De-initiating provisional account: %s", uname)
            db.delete(puser)
    
    # Remove any stale/legacy div_* accounts to keep directory clean
    stale_div_users = db.query(User).filter(User.username.like("div_%")).all()
    for sdu in stale_div_users:
        db.delete(sdu)
    db.flush()

    # Pre-fetch Design Divisions for exact linkage of BDD accounts
    bdd_div_1 = db.query(RhdDivision).filter(RhdDivision.name.ilike("%Bridge Design Division-1%")).first() or \
                db.query(RhdDivision).filter(RhdDivision.code.in_(["BDD_1", "DIV_065", "DIV_072"])).first()
    bdd_div_2 = db.query(RhdDivision).filter(RhdDivision.name.ilike("%Bridge Design Division-2%")).first() or \
                db.query(RhdDivision).filter(RhdDivision.code.in_(["BDD_2", "DIV_066", "DIV_073"])).first()
    bdd_div_3 = db.query(RhdDivision).filter(RhdDivision.name.ilike("%Bridge Design Division-3%")).first() or \
                db.query(RhdDivision).filter(RhdDivision.code.in_(["BDD_3", "DIV_067", "DIV_074"])).first()

    design_user_map = {
        "bdd_ee_1": bdd_div_1,
        "bdd_sde_1": bdd_div_1,
        "bdd_ee_2": bdd_div_2,
        "bdd_sde_2": bdd_div_2,
        "bdd_ee_3": bdd_div_3,
        "bdd_sde_3": bdd_div_3,
    }

    dhaka_div = db.query(RhdDivision).filter(RhdDivision.name == "Dhaka").first() or \
                db.query(RhdDivision).filter(RhdDivision.name.ilike("%Dhaka%")).first()

    for u in data.get("users", []):
        # Do not initiate SE or ACE accounts for now
        if u.get("role") in [settings.ROLE_BDC_SE, settings.ROLE_BMW_ACE, settings.ROLE_FIELD_SE, settings.ROLE_FIELD_ACE]:
            continue
        if u.get("username") in uninitiated_usernames:
            continue

        assigned_div = design_user_map.get(u["username"])
        if not assigned_div and u["username"] in ["field_sae", "field_sde", "field_ee"]:
            assigned_div = dhaka_div

        div_id = assigned_div.id if assigned_div else None
        circle_id = assigned_div.circle_id if assigned_div else None
        zone_id = assigned_div.circle.zone_id if (assigned_div and assigned_div.circle) else None

        existing_user = db.query(User).filter(User.username == u["username"]).first()
        if not existing_user:
            # Singleton Supreme verification
            if u["role"] == settings.ROLE_SUPREME:
                existing_supreme = db.query(User).filter(User.role == settings.ROLE_SUPREME).first()
                if existing_supreme:
                    logger.warning("Supreme role already held by %s. Skipping duplicate Supreme.", existing_supreme.username)
                    continue

            user_obj = User(
                username=u["username"],
                email=u["email"],
                hashed_password=default_password_hash,
                full_name=u["full_name"],
                role=u["role"],
                designation=u.get("designation"),
                office_division_id=div_id,
                office_circle_id=circle_id,
                office_zone_id=zone_id,
                is_active=True
            )
            db.add(user_obj)
            db.flush()
            user_map[u["role"]] = user_obj
        else:
            existing_user.office_division_id = div_id
            existing_user.office_circle_id = circle_id
            existing_user.office_zone_id = zone_id
            existing_user.full_name = u["full_name"]
            existing_user.designation = u.get("designation")
            existing_user.role = u["role"]
            existing_user.is_active = True
            user_map[u["role"]] = existing_user

    # 4b. Seed Division-Level Accounts (At least an EE and an SDE for every division)
    all_divisions = db.query(RhdDivision).order_by(RhdDivision.id).all()
    created_ee_accounts = 0
    created_sde_accounts = 0
    
    used_ee_usernames = set([u.username for u in db.query(User.username).filter(User.username.like("ee_%")).all()])
    used_sde_usernames = set([u.username for u in db.query(User.username).filter(User.username.like("sde_%")).all()])
    used_ee_usernames.update(["bdd_ee_1", "bdd_ee_2", "bdd_ee_3"])
    used_sde_usernames.update(["bdd_sde_1", "bdd_sde_2", "bdd_sde_3"])

    for div in all_divisions:
        circle = div.circle
        zone_id = circle.zone_id if circle else None
        circle_id = div.circle_id
        
        # Check if it's one of the 3 Bridge Design Divisions (already seeded as bdd_ee_1..3)
        if "Bridge Design Division-1" in div.name or div.code in ["BDD_1", "DIV_065", "DIV_072"]:
            continue
        elif "Bridge Design Division-2" in div.name or div.code in ["BDD_2", "DIV_066", "DIV_073"]:
            continue
        elif "Bridge Design Division-3" in div.name or div.code in ["BDD_3", "DIV_067", "DIV_074"]:
            continue

        clean_name = re.sub(r'[^a-zA-Z0-9]+', '_', div.name.lower()).strip('_')
        clean_circle = re.sub(r'[^a-zA-Z0-9]+', '_', circle.name.lower()).strip('_') if circle else ""
        
        # --- 1. Division Executive Engineer (EE) Account ---
        existing_ee = db.query(User).filter(
            User.office_division_id == div.id, 
            User.role.in_([settings.ROLE_FIELD_EE, settings.ROLE_BDD_EE])
        ).first()

        if not existing_ee:
            ee_username = f"ee_{clean_name}"
            if ee_username in used_ee_usernames:
                ee_username = f"ee_{clean_name}_{clean_circle}"
            if ee_username in used_ee_usernames:
                ee_username = f"ee_{clean_name}_{div.code.lower()}"
                
            email_ee = f"{ee_username}@rhd.gov.bd"
            ee_user = User(
                username=ee_username,
                email=email_ee,
                hashed_password=default_password_hash,
                full_name=f"Executive Engineer, {div.name} Division",
                role=settings.ROLE_FIELD_EE,
                designation=f"Executive Engineer, {div.name} Division",
                office_division_id=div.id,
                office_circle_id=circle_id,
                office_zone_id=zone_id,
                is_active=True
            )
            db.add(ee_user)
            used_ee_usernames.add(ee_username)
            created_ee_accounts += 1
        else:
            used_ee_usernames.add(existing_ee.username)

        # --- 2. Division Sub-Divisional Engineer (SDE) Account ---
        existing_sde = db.query(User).filter(
            User.office_division_id == div.id, 
            User.role.in_([settings.ROLE_FIELD_SDE, settings.ROLE_BDD_SDE])
        ).first()

        if not existing_sde:
            sde_username = f"sde_{clean_name}"
            if sde_username in used_sde_usernames:
                sde_username = f"sde_{clean_name}_{clean_circle}"
            if sde_username in used_sde_usernames:
                sde_username = f"sde_{clean_name}_{div.code.lower()}"

            email_sde = f"{sde_username}@rhd.gov.bd"
            sde_user = User(
                username=sde_username,
                email=email_sde,
                hashed_password=default_password_hash,
                full_name=f"Sub-Divisional Engineer, {div.name} Sub-Division",
                role=settings.ROLE_FIELD_SDE,
                designation=f"Sub-Divisional Engineer, {div.name} Sub-Division",
                office_division_id=div.id,
                office_circle_id=circle_id,
                office_zone_id=zone_id,
                is_active=True
            )
            db.add(sde_user)
            used_sde_usernames.add(sde_username)
            created_sde_accounts += 1
        else:
            used_sde_usernames.add(existing_sde.username)

    db.flush()
    if created_ee_accounts > 0 or created_sde_accounts > 0:
        logger.info("Seeded %d EE accounts and %d SDE accounts across all RHD divisions.", created_ee_accounts, created_sde_accounts)

    # 5. Pre-seed Sample Bridge and Culvert Submissions across Workflow States
    sample_bridge = db.query(BridgeAcquisition).filter(BridgeAcquisition.code == "MIS-BRG-2026-00001").first()
    if not sample_bridge:
        road_obj = db.query(Road).filter(Road.road_number == "N1").first()
        div_obj = db.query(RhdDivision).filter(RhdDivision.code == "DIV_001").first()
        creator = user_map.get("FIELD_SAE") or db.query(User).first()
        
        sample_bridge = BridgeAcquisition(
            code="MIS-BRG-2026-00001",
            workflow_status="FORWARDED_TO_BDC_SE",
            current_holder_role="BDC_SE",
            created_by_id=creator.id if creator else None,
            proposed_bridge_type="PC Girder Bridge",
            road_type_id=1,
            road_id=road_obj.id if road_obj else 1,
            road_name="Dhaka (Jatrabari)-Comilla (Mainamati)-Chittagong-Teknaf Road",
            road_link_name_no="N1-Link-04",
            location_chainage_gps_text="Ch 194+210 to Ch 194+275 (Kagazpur Bridge)",
            location_google_map_link="https://webmap.rhdbridge.com/?lat=23.4567&lng=90.8765&code=MIS-BRG-2026-00001",
            location_lat_lng="23.456700, 90.876500",
            bridge_name="Kagazpur Major Bridge",
            river_channel_name="Meghna Branch Canal",
            channel_width_m=65.0,
            nav_clearance_authority="BIWTA",
            nav_clearance_class="Class-II",
            nav_vertical_clearance_m=12.20,
            nav_horizontal_clearance_m=76.22,
            reference_datum_type="MSL",
            reference_benchmark_location="BM on East Abutment of Existing Bridge (Ch 194+200)",
            reference_benchmark_lat_lng="23.456650, 90.876480",
            existing_mid_span_girder_bottom_rl=8.45,
            existing_bridge_length="45.0m",
            existing_span_arrangement="15m + 15m + 15m",
            existing_foundation_type="Pile",
            has_existing_foundation_utility_layout="Yes",
            highest_flood_level_hfl=7.80,
            standard_high_water_level_shwl=6.90,
            lowest_water_level_lwl=2.10,
            highest_tide_level_htl=6.50,
            lowest_tide_level_ltl=2.30,
            survey_time_water_level=4.20,
            survey_date="15/10/2026",
            river_tidal_type="Tidal",
            tidal_dry_season_htl=4.50,
            tidal_dry_season_ltl=1.80,
            tidal_rainy_season_htl=6.50,
            tidal_rainy_season_ltl=2.30,
            stream_flow_direction="North to South (Downstream to Meghna)",
            zero_chainage_reference_point="Zero BM at Jatrabari Intersection",
            zero_chainage_lat_lng="23.710400, 90.435200",
            cross_road_at_approach="Yes, Shown In Drawing",
            proposed_alignment="New Alignment",
            proposed_existing_alignment_offset="Upstream",
            electrification_work_required="Yes",
            proposed_bridge_length_m=65.0,
            proposed_span_arrangement_m="20m + 25m + 20m",
            proposed_mid_span_bottom_rl=10.20,
            pier_protective_work_required="Required (Fender piles & stone pitching)",
            proposed_max_height_approach_road="3.5m",
            ancillary_work_required="Bank revetment 50m U/S & D/S, Solar lighting",
            remarks="Heavy commercial corridor. Requires high-strength concrete girder design.",
            bms_chainage="Ch 194+210",
            bms_google_map_link="https://webmap.rhdbridge.com/?lat=23.4567&lng=90.8765",
            bms_lat_lng="23.456700, 90.876500",
            total_borehole_count=4
        )
        db.add(sample_bridge)
        db.flush()

        # Add sample audit logs
        log1 = WorkflowAuditLog(
            acquisition_type="BRIDGE",
            acquisition_id=sample_bridge.id,
            actor_name="Md. Tareq Hasan",
            actor_role="FIELD_SAE",
            actor_office="Sub-Assistant Engineer, Dhaka Road Division",
            from_status="DRAFT_FIELD",
            to_status="PENDING_FIELD_EE_AUTH",
            action="FORWARD_TO_EE",
            endorsement_note="Initial survey completed with river soundings and chainage benchmarking."
        )
        log2 = WorkflowAuditLog(
            acquisition_type="BRIDGE",
            acquisition_id=sample_bridge.id,
            actor_name="Engr. Shamim Ahmed",
            actor_role="FIELD_EE",
            actor_office="Executive Engineer, Dhaka Road Division",
            from_status="PENDING_FIELD_EE_AUTH",
            to_status="FORWARDED_TO_FIELD_SE",
            action="EE_AUTHORIZATION",
            endorsement_note="Verified on site. Soil report and EE demand letter attached."
        )
        log3 = WorkflowAuditLog(
            acquisition_type="BRIDGE",
            acquisition_id=sample_bridge.id,
            actor_name="Engr. Mahbubur Rahman",
            actor_role="FIELD_SE",
            actor_office="Superintending Engineer, Dhaka Road Circle",
            from_status="FORWARDED_TO_FIELD_SE",
            to_status="FORWARDED_TO_FIELD_ACE",
            action="SE_ENDORSEMENT",
            endorsement_note="Recommended for immediate design acquisition."
        )
        log4 = WorkflowAuditLog(
            acquisition_type="BRIDGE",
            acquisition_id=sample_bridge.id,
            actor_name="Engr. AKM Fazlul Haque",
            actor_role="FIELD_ACE",
            actor_office="Additional Chief Engineer, Dhaka Zone",
            from_status="FORWARDED_TO_FIELD_ACE",
            to_status="FORWARDED_TO_BMW_ACE",
            action="ZONE_ACE_ENDORSEMENT",
            endorsement_note="Endorsed and forwarded to Bridge Management Wing."
        )
        db.add_all([log1, log2, log3, log4])

    # Sample Culvert
    sample_culvert = db.query(CulvertAcquisition).filter(CulvertAcquisition.code == "MIS-CLV-2026-00001").first()
    if not sample_culvert:
        road_obj = db.query(Road).filter(Road.road_number == "R110").first()
        creator = user_map.get("FIELD_SAE") or db.query(User).first()
        
        sample_culvert = CulvertAcquisition(
            code="MIS-CLV-2026-00001",
            workflow_status="PENDING_FIELD_EE_AUTH",
            current_holder_role="FIELD_EE",
            created_by_id=creator.id if creator else None,
            road_type_id=2,
            road_id=road_obj.id if road_obj else 2,
            road_name="Dhaka-Demra Road",
            culvert_name="Demra Irrigation Culvert",
            location_chainage_lrp_gps="Ch 12+450 (GPS: 23.7250, 90.4910)",
            location_google_map_link="https://webmap.rhdbridge.com/?lat=23.7250&lng=90.4910&code=MIS-CLV-2026-00001",
            location_lat_lng="23.725000, 90.491000",
            is_flash_flood_prone="No",
            is_haor_area="No",
            is_tidal_area="Yes",
            reference_datum_type="MSL",
            reference_benchmark_location="TBM on concrete guide post at Ch 12+400",
            reference_benchmark_lat_lng="23.724900, 90.490900",
            cross_road_at_approach="Yes, Shown In Drawing",
            nav_clearance_required="No",
            highest_flood_level_hfl=5.80,
            lowest_water_level_lwl=1.20,
            standard_high_water_level_shwl=5.10,
            highest_tide_level_htl=4.90,
            lowest_tide_level_ltl=1.50,
            existing_culvert_type="Rectangular Culvert",
            no_of_vent=2,
            length_of_each_vent_m=3.5,
            total_length_m=7.0,
            height_m=2.5,
            width_m=7.5,
            top_slab_thickness_mm=300.0,
            side_wall_thickness_mm=350.0,
            bottom_slab_thickness_mm=350.0,
            existing_structure_condition="Severely distressed top slab, exposed rebars",
            foundation_condition="Scouring observed at downstream apron",
            existing_remarks="Culvert capacity insufficient during heavy monsoon discharge.",
            proposed_alignment="For Existing Culvert",
            proposed_existing_alignment_offset="At the same alignment",
            proposed_culvert_category="New Culvert",
            proposed_new_sub_type="Rectangular Box Culvert",
            proposed_no_of_vent=3,
            proposed_length_each_vent_m=4.5,
            proposed_total_length_m=13.5,
            proposed_clear_height_m=3.0,
            proposed_clear_width_m=13.5,
            proposed_remarks="Construct 3-vent RCC box culvert with RCC drop walls and CC block protection.",
            total_borehole_count=2
        )
        db.add(sample_culvert)
        db.flush()

        log_clv = WorkflowAuditLog(
            acquisition_type="CULVERT",
            acquisition_id=sample_culvert.id,
            actor_name="Md. Tareq Hasan",
            actor_role="FIELD_SAE",
            actor_office="Sub-Assistant Engineer, Dhaka Road Division",
            from_status="DRAFT_FIELD",
            to_status="PENDING_FIELD_EE_AUTH",
            action="FORWARD_TO_EE",
            endorsement_note="Demra culvert acquisition form completed. Awaiting EE authorization."
        )
        db.add(log_clv)

    db.commit()
    db.close()
    logger.info("Database seeding completed successfully.")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    seed_database()
