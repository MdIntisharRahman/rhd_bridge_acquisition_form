import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey,
    Index, UniqueConstraint
)
from sqlalchemy.orm import relationship
from backend.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), index=True, nullable=False)  # SUPREME, WEBMASTER, FIELD_SAE, etc.
    designation = Column(String(255), nullable=True)
    office_zone_id = Column(Integer, ForeignKey("rhd_zones.id", ondelete="SET NULL"), nullable=True)
    office_circle_id = Column(Integer, ForeignKey("rhd_circles.id", ondelete="SET NULL"), nullable=True)
    office_division_id = Column(Integer, ForeignKey("rhd_divisions.id", ondelete="SET NULL"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Note: Supreme singleton rule is enforced in application logic and unique validation.
    
    zone = relationship("RhdZone", foreign_keys=[office_zone_id])
    circle = relationship("RhdCircle", foreign_keys=[office_circle_id])
    division = relationship("RhdDivision", foreign_keys=[office_division_id])


class RhdZone(Base):
    __tablename__ = "rhd_zones"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    metadata_json = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    circles = relationship("RhdCircle", back_populates="zone", cascade="all, delete-orphan")


class RhdCircle(Base):
    __tablename__ = "rhd_circles"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    zone_id = Column(Integer, ForeignKey("rhd_zones.id", ondelete="CASCADE"), nullable=False)
    is_active = Column(Boolean, default=True)
    metadata_json = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    zone = relationship("RhdZone", back_populates="circles")
    divisions = relationship("RhdDivision", back_populates="circle", cascade="all, delete-orphan")


class RhdDivision(Base):
    __tablename__ = "rhd_divisions"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    circle_id = Column(Integer, ForeignKey("rhd_circles.id", ondelete="CASCADE"), nullable=False)
    is_active = Column(Boolean, default=True)
    ee_name = Column(String(255), nullable=True)
    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    metadata_json = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    circle = relationship("RhdCircle", back_populates="divisions")
    roads = relationship("Road", back_populates="division")


class RoadType(Base):
    __tablename__ = "road_types"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    metadata_json = Column(Text, nullable=True)

    roads = relationship("Road", back_populates="road_type")


class Road(Base):
    __tablename__ = "roads"

    id = Column(Integer, primary_key=True, index=True)
    road_type_id = Column(Integer, ForeignKey("road_types.id", ondelete="CASCADE"), nullable=False)
    road_number = Column(String(50), index=True, nullable=False)
    road_name = Column(String(255), nullable=False)
    division_id = Column(Integer, ForeignKey("rhd_divisions.id", ondelete="SET NULL"), nullable=True)
    length_km = Column(Float, default=0.0)
    rmms_link = Column(String(255), nullable=True)
    metadata_json = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    road_type = relationship("RoadType", back_populates="roads")
    division = relationship("RhdDivision", back_populates="roads")


class BridgeAcquisition(Base):
    __tablename__ = "bridge_acquisitions"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)  # MIS-BRG-YYYY-XXXXX
    workflow_status = Column(String(50), index=True, default="DRAFT_FIELD", nullable=False)
    current_holder_role = Column(String(50), index=True, default="FIELD_SAE", nullable=False)
    current_assignee_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    zone_id = Column(Integer, ForeignKey("rhd_zones.id", ondelete="SET NULL"), nullable=True)
    circle_id = Column(Integer, ForeignKey("rhd_circles.id", ondelete="SET NULL"), nullable=True)
    division_id = Column(Integer, ForeignKey("rhd_divisions.id", ondelete="SET NULL"), nullable=True)
    assigned_bdd_division_id = Column(Integer, ForeignKey("rhd_divisions.id", ondelete="SET NULL"), nullable=True)
    assigned_bdd_sde_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    assigned_field_sde_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Prepared Design Delivery & Exchange
    prepared_design_notes = Column(Text, nullable=True)
    prepared_design_attached_at = Column(DateTime, nullable=True)
    prepared_design_attached_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    prepared_design_approved_at = Column(DateTime, nullable=True)
    dispatched_to_field_sde_at = Column(DateTime, nullable=True)
    dispatched_field_sde_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Design Execution & Bottleneck Tracking
    design_execution_state = Column(String(50), default="NOT_STARTED", index=True, nullable=False)  # NOT_STARTED, RUNNING, SUSPENDED, SENT
    bottleneck_reason = Column(String(255), nullable=True)
    bottleneck_notes = Column(Text, nullable=True)
    bottleneck_updated_at = Column(DateTime, nullable=True)
    design_completed_at = Column(DateTime, nullable=True)
    design_target_date = Column(DateTime, nullable=True)

    # Review remarks & flags
    return_reason_notes = Column(Text, nullable=True)
    flagged_sections_json = Column(Text, nullable=True)  # JSON list of flagged tab/section IDs
    
    # Road & Location (Fields 1-7)
    proposed_bridge_type = Column(String(100), nullable=True)
    road_type_id = Column(Integer, ForeignKey("road_types.id", ondelete="SET NULL"), nullable=True)
    road_type_others_name = Column(String(255), nullable=True)
    road_id = Column(Integer, ForeignKey("roads.id", ondelete="SET NULL"), nullable=True)
    road_name = Column(String(255), nullable=True)
    road_link_name_no = Column(String(255), nullable=True)
    location_chainage_gps_text = Column(String(255), nullable=True)
    chainage_km = Column(Float, nullable=True)
    chainage_m = Column(Float, nullable=True)
    location_google_map_link = Column(String(500), nullable=True)
    location_lat_lng = Column(String(100), nullable=True)
    bridge_name = Column(String(255), nullable=True)
    river_channel_name = Column(String(255), nullable=True)
    channel_width_m = Column(Float, nullable=True)

    # Navigational Clearance (Field 8)
    nav_clearance_authority = Column(String(50), nullable=True)  # BIWTA, BWDB, Local, Railway, Others
    nav_clearance_class = Column(String(50), nullable=True)      # Class-I, Class-II, General, etc.
    nav_vertical_clearance_m = Column(Float, nullable=True)
    nav_horizontal_clearance_m = Column(Float, nullable=True)
    nav_others_note = Column(Text, nullable=True)

    # Existing Bridge & Reference Datum (Fields 9-12, 20)
    existing_bridge_length = Column(String(100), nullable=True)
    existing_span_arrangement = Column(String(100), nullable=True)
    reference_datum_type = Column(String(50), default="PWD", nullable=False)  # PWD, SOB, BIWTA, BWDB, Local, MSL, TBM
    reference_benchmark_location = Column(String(255), nullable=True)
    reference_benchmark_map_link = Column(String(500), nullable=True)
    reference_benchmark_lat_lng = Column(String(100), nullable=True)
    existing_mid_span_girder_bottom_rl = Column(Float, nullable=True)
    existing_foundation_type = Column(String(100), nullable=True)  # Open Foundation, Pile, Well, Shal Balli, Others, N/A
    has_existing_foundation_utility_layout = Column(String(10), default="No", nullable=True)  # Yes / No

    # Hydrological & River Survey Data (Fields 13-19, 21, 22)
    highest_flood_level_hfl = Column(Float, nullable=True)
    standard_high_water_level_shwl = Column(Float, nullable=True)
    lowest_water_level_lwl = Column(Float, nullable=True)
    highest_tide_level_htl = Column(Float, nullable=True)
    lowest_tide_level_ltl = Column(Float, nullable=True)
    survey_time_water_level = Column(Float, nullable=True)
    survey_date = Column(String(50), nullable=True)
    river_tidal_type = Column(String(50), default="Not Tidal", nullable=True)  # Tidal / Not Tidal
    tidal_dry_season_htl = Column(Float, nullable=True)
    tidal_dry_season_ltl = Column(Float, nullable=True)
    tidal_rainy_season_htl = Column(Float, nullable=True)
    tidal_rainy_season_ltl = Column(Float, nullable=True)
    stream_flow_direction = Column(String(255), nullable=True)
    zero_chainage_reference_point = Column(String(255), nullable=True)
    zero_chainage_map_link = Column(String(500), nullable=True)
    zero_chainage_lat_lng = Column(String(100), nullable=True)
    cross_road_at_approach = Column(String(100), nullable=True)

    # Proposed Bridge Design & Ancillary Works (Fields 24, 27-30 & Structural Extras)
    proposed_alignment = Column(String(100), default="New Alignment", nullable=True)  # New Alignment / For Existing Bridge
    proposed_existing_alignment_offset = Column(String(100), nullable=True)  # At the same alignment, Upstream, Downstream
    electrification_work_required = Column(String(10), default="No", nullable=True)
    proposed_bridge_length_m = Column(Float, nullable=True)
    proposed_span_arrangement_m = Column(String(100), nullable=True)
    proposed_mid_span_bottom_rl = Column(Float, nullable=True)
    pier_protective_work_required = Column(String(100), nullable=True)
    proposed_max_height_approach_road = Column(String(100), nullable=True)
    ancillary_work_required = Column(String(255), nullable=True)
    remarks = Column(Text, nullable=True)

    # BMS Chainage & GPS
    bms_chainage = Column(String(100), nullable=True)
    bms_google_map_link = Column(String(500), nullable=True)
    bms_lat_lng = Column(String(100), nullable=True)
    total_borehole_count = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    zone = relationship("RhdZone", foreign_keys=[zone_id])
    circle = relationship("RhdCircle", foreign_keys=[circle_id])
    division = relationship("RhdDivision", foreign_keys=[division_id])
    road = relationship("Road", foreign_keys=[road_id])
    creator = relationship("User", foreign_keys=[created_by_id])
    assignee = relationship("User", foreign_keys=[current_assignee_user_id])


class CulvertAcquisition(Base):
    __tablename__ = "culvert_acquisitions"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)  # MIS-CLV-YYYY-XXXXX
    workflow_status = Column(String(50), index=True, default="DRAFT_FIELD", nullable=False)
    current_holder_role = Column(String(50), index=True, default="FIELD_SAE", nullable=False)
    current_assignee_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    zone_id = Column(Integer, ForeignKey("rhd_zones.id", ondelete="SET NULL"), nullable=True)
    circle_id = Column(Integer, ForeignKey("rhd_circles.id", ondelete="SET NULL"), nullable=True)
    division_id = Column(Integer, ForeignKey("rhd_divisions.id", ondelete="SET NULL"), nullable=True)
    assigned_bdd_division_id = Column(Integer, ForeignKey("rhd_divisions.id", ondelete="SET NULL"), nullable=True)
    assigned_bdd_sde_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    assigned_field_sde_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Prepared Design Delivery & Exchange
    prepared_design_notes = Column(Text, nullable=True)
    prepared_design_attached_at = Column(DateTime, nullable=True)
    prepared_design_attached_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    prepared_design_approved_at = Column(DateTime, nullable=True)
    dispatched_to_field_sde_at = Column(DateTime, nullable=True)
    dispatched_field_sde_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Design Execution & Bottleneck Tracking
    design_execution_state = Column(String(50), default="NOT_STARTED", index=True, nullable=False)  # NOT_STARTED, RUNNING, SUSPENDED, SENT
    bottleneck_reason = Column(String(255), nullable=True)
    bottleneck_notes = Column(Text, nullable=True)
    bottleneck_updated_at = Column(DateTime, nullable=True)
    design_completed_at = Column(DateTime, nullable=True)
    design_target_date = Column(DateTime, nullable=True)

    return_reason_notes = Column(Text, nullable=True)
    flagged_sections_json = Column(Text, nullable=True)

    # Road & Location (a-e)
    road_type_id = Column(Integer, ForeignKey("road_types.id", ondelete="SET NULL"), nullable=True)
    road_type_others_name = Column(String(255), nullable=True)
    road_id = Column(Integer, ForeignKey("roads.id", ondelete="SET NULL"), nullable=True)
    road_name = Column(String(255), nullable=True)
    culvert_name = Column(String(255), nullable=True)
    location_chainage_lrp_gps = Column(String(255), nullable=True)
    chainage_km = Column(Float, nullable=True)
    chainage_m = Column(Float, nullable=True)
    location_google_map_link = Column(String(500), nullable=True)
    location_lat_lng = Column(String(100), nullable=True)

    # Environmental Flags (f-h)
    is_flash_flood_prone = Column(String(10), default="No", nullable=True)  # Yes / No
    flash_flood_description = Column(Text, nullable=True)
    is_haor_area = Column(String(10), default="No", nullable=True)
    is_tidal_area = Column(String(10), default="No", nullable=True)

    # Reference Benchmark (Section 2)
    reference_datum_type = Column(String(50), default="PWD", nullable=False)  # MSL, SOB, PWD, TBM
    reference_benchmark_location = Column(String(255), nullable=True)
    reference_benchmark_map_link = Column(String(500), nullable=True)
    reference_benchmark_lat_lng = Column(String(100), nullable=True)

    # Cross Road & Navigational Clearance
    cross_road_at_approach = Column(String(100), nullable=True)
    nav_clearance_required = Column(String(10), default="No", nullable=True)

    # Hydrological Data (Section 6)
    highest_flood_level_hfl = Column(Float, nullable=True)
    lowest_water_level_lwl = Column(Float, nullable=True)
    standard_high_water_level_shwl = Column(Float, nullable=True)
    highest_tide_level_htl = Column(Float, nullable=True)
    lowest_tide_level_ltl = Column(Float, nullable=True)

    # Existing Culvert Geometry (Section 7)
    existing_culvert_type = Column(String(100), default="None", nullable=True)  # Rectangular Culvert, Pipe Culvert, Slab Culvert, Arch Culvert, Other, None
    # Rectangular Culvert fields
    no_of_vent = Column(Integer, nullable=True)
    length_of_each_vent_m = Column(Float, nullable=True)
    total_length_m = Column(Float, nullable=True)  # auto-calc: no_of_vent * length_of_each_vent_m
    height_m = Column(Float, nullable=True)
    width_m = Column(Float, nullable=True)
    top_slab_thickness_mm = Column(Float, nullable=True)
    side_wall_thickness_mm = Column(Float, nullable=True)
    bottom_slab_thickness_mm = Column(Float, nullable=True)
    existing_structure_condition = Column(String(255), nullable=True)
    foundation_condition = Column(String(255), nullable=True)
    existing_remarks = Column(Text, nullable=True)

    # Pipe Culvert fields
    pipe_outer_dia_m = Column(Float, nullable=True)
    pipe_thickness_mm = Column(Float, nullable=True)
    pipe_length_m = Column(Float, nullable=True)
    pipe_remarks = Column(Text, nullable=True)

    # Slab Culvert fields
    slab_thickness_mm = Column(Float, nullable=True)
    slab_length_m = Column(Float, nullable=True)
    slab_width_m = Column(Float, nullable=True)
    slab_remarks = Column(Text, nullable=True)

    # Arch Culvert fields
    arch_length_m = Column(Float, nullable=True)
    arch_width_m = Column(Float, nullable=True)
    arch_dia_m = Column(Float, nullable=True)
    arch_thickness_mm = Column(Float, nullable=True)
    arch_remarks = Column(Text, nullable=True)

    # Other Existing Culvert fields
    other_length_m = Column(Float, nullable=True)
    other_width_m = Column(Float, nullable=True)
    other_remarks = Column(Text, nullable=True)

    existing_culvert_general_note = Column(Text, nullable=True)

    # Proposed Culvert Alignment & Geometry (Section 8)
    proposed_alignment = Column(String(100), default="New Alignment", nullable=True)  # New Alignment / For Existing Culvert
    proposed_existing_alignment_offset = Column(String(100), nullable=True)  # At the same alignment, Upstream, Downstream
    proposed_culvert_category = Column(String(100), default="New Culvert", nullable=True)  # New Culvert, Widening Culvert, Not Applicable
    
    # New Culvert sub-types
    proposed_new_sub_type = Column(String(100), nullable=True)  # Rectangular Box Culvert vs Other
    proposed_no_of_vent = Column(Integer, nullable=True)
    proposed_length_each_vent_m = Column(Float, nullable=True)
    proposed_total_length_m = Column(Float, nullable=True)  # auto-calc
    proposed_clear_height_m = Column(Float, nullable=True)
    proposed_clear_width_m = Column(Float, nullable=True)
    proposed_remarks = Column(Text, nullable=True)

    proposed_other_length_m = Column(Float, nullable=True)
    proposed_other_width_m = Column(Float, nullable=True)
    proposed_carriage_width_m = Column(Float, nullable=True)

    # Widening Culvert sub-types
    proposed_widening_side = Column(String(100), nullable=True)  # Upstream Side, Downstream Side, Both Side
    proposed_extension_carriage_width_m = Column(Float, nullable=True)
    proposed_widening_remarks = Column(Text, nullable=True)

    total_borehole_count = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    zone = relationship("RhdZone", foreign_keys=[zone_id])
    circle = relationship("RhdCircle", foreign_keys=[circle_id])
    division = relationship("RhdDivision", foreign_keys=[division_id])
    road = relationship("Road", foreign_keys=[road_id])
    creator = relationship("User", foreign_keys=[created_by_id])
    assignee = relationship("User", foreign_keys=[current_assignee_user_id])


class WorkflowAuditLog(Base):
    __tablename__ = "workflow_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    acquisition_type = Column(String(20), index=True, nullable=False)  # BRIDGE / CULVERT
    acquisition_id = Column(Integer, index=True, nullable=False)
    actor_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    actor_name = Column(String(255), nullable=True)
    actor_role = Column(String(50), nullable=False)
    actor_office = Column(String(255), nullable=True)
    from_status = Column(String(50), nullable=False)
    to_status = Column(String(50), nullable=False)
    action = Column(String(100), nullable=False)
    endorsement_note = Column(Text, nullable=True)
    demand_letter_id = Column(Integer, ForeignKey("attachments.id", ondelete="SET NULL"), nullable=True)
    flagged_sections_json = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    actor = relationship("User", foreign_keys=[actor_id])


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True, index=True)
    acquisition_type = Column(String(20), index=True, nullable=False)  # BRIDGE / CULVERT
    acquisition_id = Column(Integer, index=True, nullable=False)
    slot_code = Column(String(100), index=True, nullable=False)        # demand_letter_ace, soil_report, cross_section, etc.
    file_name = Column(String(255), nullable=False)
    stored_file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, default=0)
    mime_type = Column(String(100), nullable=True)
    demand_officer_type = Column(String(20), nullable=True)            # ACE, SE, EE (for deduplicating demand letters)
    uploaded_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)

    uploader = relationship("User", foreign_keys=[uploaded_by_id])


class BoreholeLog(Base):
    __tablename__ = "borehole_logs"

    id = Column(Integer, primary_key=True, index=True)
    acquisition_type = Column(String(20), index=True, nullable=False)  # BRIDGE / CULVERT
    acquisition_id = Column(Integer, index=True, nullable=False)
    borehole_no = Column(Integer, nullable=False)                      # 1..40
    borehole_uid = Column(String(64), index=True, nullable=True)       # 56-char UID per RHD convention
    chainage = Column(String(100), nullable=True)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    ground_bed_rl = Column(Float, nullable=True)
    water_table_depth = Column(Float, nullable=True)
    remarks = Column(Text, nullable=True)
    
    # JSON structured payloads
    strata_json = Column(Text, nullable=True)   # List of {top, bottom, uscs_class, description}
    spt_json = Column(Text, nullable=True)      # List of {depth, b150, b300, b450, n_value}
    sample_json = Column(Text, nullable=True)   # List of {depth, sample_type, recovery_pct, rqd_pct}
    lab_json = Column(Text, nullable=True)      # Soil lab parameters
    attachment_file = Column(String(255), nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class BackgroundTask(Base):
    __tablename__ = "background_tasks"

    id = Column(Integer, primary_key=True, index=True)
    task_type = Column(String(100), nullable=False)  # DB_BACKUP, WEBMAP_SYNC, JSON_RESYNC, DOSSIER_REBUILD
    status = Column(String(50), default="PENDING")   # PENDING, RUNNING, COMPLETED, FAILED
    triggered_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    params_json = Column(Text, nullable=True)
    result_json = Column(Text, nullable=True)
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)

    triggered_by = relationship("User", foreign_keys=[triggered_by_id])
