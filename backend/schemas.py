from pydantic import BaseModel, EmailStr, Field, computed_field
from typing import Optional, List, Any, Dict
from datetime import datetime

# --- Auth & User Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    role: str
    designation: Optional[str] = None
    office_zone_id: Optional[int] = None
    office_circle_id: Optional[int] = None
    office_division_id: Optional[int] = None
    office_zone_name: Optional[str] = None
    office_circle_name: Optional[str] = None
    office_division_name: Optional[str] = None
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    designation: Optional[str] = None
    office_zone_id: Optional[int] = None
    office_circle_id: Optional[int] = None
    office_division_id: Optional[int] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

class UserResponse(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Hierarchy Schemas ---
class DivisionBase(BaseModel):
    code: str
    name: str
    circle_id: int
    is_active: bool = True
    metadata_json: Optional[str] = None

class DivisionResponse(DivisionBase):
    id: int
    class Config:
        from_attributes = True

class CircleBase(BaseModel):
    code: str
    name: str
    zone_id: int
    is_active: bool = True
    metadata_json: Optional[str] = None

class CircleResponse(CircleBase):
    id: int
    divisions: List[DivisionResponse] = []
    class Config:
        from_attributes = True

class ZoneBase(BaseModel):
    code: str
    name: str
    is_active: bool = True
    metadata_json: Optional[str] = None

class ZoneResponse(ZoneBase):
    id: int
    circles: List[CircleResponse] = []
    class Config:
        from_attributes = True

class RoadTypeBase(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    is_active: bool = True

class RoadTypeResponse(RoadTypeBase):
    id: int
    class Config:
        from_attributes = True

class RoadBase(BaseModel):
    road_type_id: int
    road_number: str
    road_name: str
    division_id: Optional[int] = None
    length_km: Optional[float] = 0.0
    rmms_link: Optional[str] = None

class RoadResponse(RoadBase):
    id: int
    class Config:
        from_attributes = True

# --- Bridge Acquisition Schemas ---
class BridgeAcquisitionBase(BaseModel):
    # Road & Location
    proposed_bridge_type: Optional[str] = None
    zone_id: Optional[int] = None
    circle_id: Optional[int] = None
    division_id: Optional[int] = None
    road_type_id: Optional[int] = None
    road_type_others_name: Optional[str] = None
    road_id: Optional[int] = None
    road_name: Optional[str] = None
    road_link_name_no: Optional[str] = None
    location_chainage_gps_text: Optional[str] = None
    chainage_km: Optional[float] = None
    chainage_m: Optional[float] = None
    location_google_map_link: Optional[str] = None
    location_lat_lng: Optional[str] = None
    bridge_name: Optional[str] = None
    river_channel_name: Optional[str] = None
    channel_width_m: Optional[float] = None

    # Navigational Clearance
    nav_clearance_authority: Optional[str] = None
    nav_clearance_class: Optional[str] = None
    nav_vertical_clearance_m: Optional[float] = None
    nav_horizontal_clearance_m: Optional[float] = None
    nav_others_note: Optional[str] = None

    # Existing Bridge & Reference Datum
    existing_bridge_length: Optional[str] = None
    existing_span_arrangement: Optional[str] = None
    reference_datum_type: Optional[str] = "PWD"
    reference_benchmark_location: Optional[str] = None
    reference_benchmark_map_link: Optional[str] = None
    reference_benchmark_lat_lng: Optional[str] = None
    existing_mid_span_girder_bottom_rl: Optional[float] = None
    existing_foundation_type: Optional[str] = None
    has_existing_foundation_utility_layout: Optional[str] = "No"

    # Hydrological & River Survey Data
    highest_flood_level_hfl: Optional[float] = None
    standard_high_water_level_shwl: Optional[float] = None
    lowest_water_level_lwl: Optional[float] = None
    highest_tide_level_htl: Optional[float] = None
    lowest_tide_level_ltl: Optional[float] = None
    survey_time_water_level: Optional[float] = None
    survey_date: Optional[str] = None
    river_tidal_type: Optional[str] = "Not Tidal"
    tidal_dry_season_htl: Optional[float] = None
    tidal_dry_season_ltl: Optional[float] = None
    tidal_rainy_season_htl: Optional[float] = None
    tidal_rainy_season_ltl: Optional[float] = None
    stream_flow_direction: Optional[str] = None
    zero_chainage_reference_point: Optional[str] = None
    zero_chainage_map_link: Optional[str] = None
    zero_chainage_lat_lng: Optional[str] = None
    cross_road_at_approach: Optional[str] = None

    # Proposed Bridge Design
    proposed_alignment: Optional[str] = "New Alignment"
    proposed_existing_alignment_offset: Optional[str] = None
    electrification_work_required: Optional[str] = "No"
    proposed_bridge_length_m: Optional[float] = None
    proposed_span_arrangement_m: Optional[str] = None
    proposed_mid_span_bottom_rl: Optional[float] = None
    pier_protective_work_required: Optional[str] = None
    proposed_max_height_approach_road: Optional[str] = None
    ancillary_work_required: Optional[str] = None
    remarks: Optional[str] = None

    # BMS Chainage & GPS
    bms_chainage: Optional[str] = None
    bms_google_map_link: Optional[str] = None
    bms_lat_lng: Optional[str] = None
    total_borehole_count: Optional[int] = 0
    prepared_design_notes: Optional[str] = None

class BridgeAcquisitionCreate(BridgeAcquisitionBase):
    pass

class BridgeAcquisitionUpdate(BridgeAcquisitionBase):
    pass

class BridgeAcquisitionResponse(BridgeAcquisitionBase):
    id: int
    code: str
    workflow_status: str
    current_holder_role: str
    current_assignee_user_id: Optional[int] = None
    created_by_id: Optional[int] = None
    assigned_bdd_division_id: Optional[int] = None
    assigned_bdd_sde_id: Optional[int] = None
    assigned_field_sde_id: Optional[int] = None
    prepared_design_notes: Optional[str] = None
    prepared_design_attached_at: Optional[datetime] = None
    prepared_design_attached_by_id: Optional[int] = None
    prepared_design_approved_at: Optional[datetime] = None
    dispatched_to_field_sde_at: Optional[datetime] = None
    dispatched_field_sde_id: Optional[int] = None
    design_execution_state: Optional[str] = "NOT_STARTED"
    bottleneck_reason: Optional[str] = None
    bottleneck_notes: Optional[str] = None
    bottleneck_updated_at: Optional[datetime] = None
    design_completed_at: Optional[datetime] = None
    design_target_date: Optional[datetime] = None
    return_reason_notes: Optional[str] = None
    flagged_sections_json: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Culvert Acquisition Schemas ---
class CulvertAcquisitionBase(BaseModel):
    zone_id: Optional[int] = None
    circle_id: Optional[int] = None
    division_id: Optional[int] = None
    road_type_id: Optional[int] = None
    road_type_others_name: Optional[str] = None
    road_id: Optional[int] = None
    road_name: Optional[str] = None
    culvert_name: Optional[str] = None
    location_chainage_lrp_gps: Optional[str] = None
    chainage_km: Optional[float] = None
    chainage_m: Optional[float] = None
    location_google_map_link: Optional[str] = None
    location_lat_lng: Optional[str] = None

    is_flash_flood_prone: Optional[str] = "No"
    flash_flood_description: Optional[str] = None
    is_haor_area: Optional[str] = "No"
    is_tidal_area: Optional[str] = "No"

    reference_datum_type: Optional[str] = "PWD"
    reference_benchmark_location: Optional[str] = None
    reference_benchmark_map_link: Optional[str] = None
    reference_benchmark_lat_lng: Optional[str] = None

    cross_road_at_approach: Optional[str] = None
    nav_clearance_required: Optional[str] = "No"

    highest_flood_level_hfl: Optional[float] = None
    lowest_water_level_lwl: Optional[float] = None
    standard_high_water_level_shwl: Optional[float] = None
    highest_tide_level_htl: Optional[float] = None
    lowest_tide_level_ltl: Optional[float] = None

    existing_culvert_type: Optional[str] = "None"
    no_of_vent: Optional[int] = None
    length_of_each_vent_m: Optional[float] = None
    total_length_m: Optional[float] = None
    height_m: Optional[float] = None
    width_m: Optional[float] = None
    top_slab_thickness_mm: Optional[float] = None
    side_wall_thickness_mm: Optional[float] = None
    bottom_slab_thickness_mm: Optional[float] = None
    existing_structure_condition: Optional[str] = None
    foundation_condition: Optional[str] = None
    existing_remarks: Optional[str] = None

    pipe_outer_dia_m: Optional[float] = None
    pipe_thickness_mm: Optional[float] = None
    pipe_length_m: Optional[float] = None
    pipe_remarks: Optional[str] = None

    slab_thickness_mm: Optional[float] = None
    slab_length_m: Optional[float] = None
    slab_width_m: Optional[float] = None
    slab_remarks: Optional[str] = None

    arch_length_m: Optional[float] = None
    arch_width_m: Optional[float] = None
    arch_dia_m: Optional[float] = None
    arch_thickness_mm: Optional[float] = None
    arch_remarks: Optional[str] = None

    other_length_m: Optional[float] = None
    other_width_m: Optional[float] = None
    other_remarks: Optional[str] = None
    existing_culvert_general_note: Optional[str] = None

    proposed_alignment: Optional[str] = "New Alignment"
    proposed_existing_alignment_offset: Optional[str] = None
    proposed_culvert_category: Optional[str] = "New Culvert"

    proposed_new_sub_type: Optional[str] = None
    proposed_no_of_vent: Optional[int] = None
    proposed_length_each_vent_m: Optional[float] = None
    proposed_total_length_m: Optional[float] = None
    proposed_clear_height_m: Optional[float] = None
    proposed_clear_width_m: Optional[float] = None
    proposed_remarks: Optional[str] = None

    proposed_other_length_m: Optional[float] = None
    proposed_other_width_m: Optional[float] = None
    proposed_carriage_width_m: Optional[float] = None

    proposed_widening_side: Optional[str] = None
    proposed_extension_carriage_width_m: Optional[float] = None
    proposed_widening_remarks: Optional[str] = None

    total_borehole_count: Optional[int] = 0
    prepared_design_notes: Optional[str] = None

class CulvertAcquisitionCreate(CulvertAcquisitionBase):
    pass

class CulvertAcquisitionUpdate(CulvertAcquisitionBase):
    pass

class CulvertAcquisitionResponse(CulvertAcquisitionBase):
    id: int
    code: str
    workflow_status: str
    current_holder_role: str
    current_assignee_user_id: Optional[int] = None
    created_by_id: Optional[int] = None
    assigned_bdd_division_id: Optional[int] = None
    assigned_bdd_sde_id: Optional[int] = None
    assigned_field_sde_id: Optional[int] = None
    prepared_design_notes: Optional[str] = None
    prepared_design_attached_at: Optional[datetime] = None
    prepared_design_attached_by_id: Optional[int] = None
    prepared_design_approved_at: Optional[datetime] = None
    dispatched_to_field_sde_at: Optional[datetime] = None
    dispatched_field_sde_id: Optional[int] = None
    design_execution_state: Optional[str] = "NOT_STARTED"
    bottleneck_reason: Optional[str] = None
    bottleneck_notes: Optional[str] = None
    bottleneck_updated_at: Optional[datetime] = None
    design_completed_at: Optional[datetime] = None
    design_target_date: Optional[datetime] = None
    return_reason_notes: Optional[str] = None
    flagged_sections_json: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Workflow Schemas ---
class WorkflowTransitionRequest(BaseModel):
    action: str  # SUBMIT_TO_EE, TRANSMIT_TO_DESIGN_EE, PASS_TO_FIELD_SDE, SDE_VERIFY_TO_EE, ASSIGN_TO_BDD_SDE, SUBMIT_DESIGN_TO_EE, APPROVE_AND_TRANSMIT, DISPATCH_TO_FIELD_SDE, RETURN, OVERRIDE
    endorsement_note: Optional[str] = None
    demand_letter_id: Optional[int] = None
    target_assignee_user_id: Optional[int] = None
    target_division_id: Optional[int] = None
    prepared_design_notes: Optional[str] = None
    flagged_sections: Optional[List[str]] = None  # e.g., ['TAB-01', 'TAB-03']
    return_reason: Optional[str] = None

class WorkflowAuditLogResponse(BaseModel):
    id: int
    acquisition_type: str
    acquisition_id: int
    actor_id: Optional[int]
    actor_name: Optional[str]
    actor_role: str
    actor_office: Optional[str]
    from_status: str
    to_status: str
    action: str
    endorsement_note: Optional[str]
    demand_letter_id: Optional[int]
    flagged_sections_json: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True

# --- Attachment & Borehole Schemas ---
class AttachmentResponse(BaseModel):
    id: int
    acquisition_type: str
    acquisition_id: int
    slot_code: str
    file_name: str
    stored_file_name: Optional[str] = None
    file_path: str
    file_size: int
    mime_type: Optional[str] = None
    demand_officer_type: Optional[str] = None
    uploaded_at: datetime

    @computed_field
    def download_url(self) -> str:
        return f"/uploads/{self.stored_file_name}" if self.stored_file_name else ""

    class Config:
        from_attributes = True

class BoreholeLogBase(BaseModel):
    acquisition_type: str
    acquisition_id: int
    borehole_no: int
    borehole_uid: Optional[str] = None
    chainage: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    ground_bed_rl: Optional[float] = None
    water_table_depth: Optional[float] = None
    remarks: Optional[str] = None
    strata_json: Optional[str] = None
    spt_json: Optional[str] = None
    sample_json: Optional[str] = None
    lab_json: Optional[str] = None
    attachment_file: Optional[str] = None

class BoreholeLogCreate(BoreholeLogBase):
    pass

class BoreholeLogResponse(BoreholeLogBase):
    id: int
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Background Task Schemas ---
class BackgroundTaskCreate(BaseModel):
    task_type: str
    params_json: Optional[str] = None

class BackgroundTaskResponse(BaseModel):
    id: int
    task_type: str
    status: str
    triggered_by_id: Optional[int]
    params_json: Optional[str]
    result_json: Optional[str]
    started_at: datetime
    completed_at: Optional[datetime]
    error_message: Optional[str]

    class Config:
        from_attributes = True

# --- Design Division Management & Bottleneck Schemas ---
class DesignDivisionCreate(BaseModel):
    name: str
    code: str
    circle_id: Optional[int] = None
    ee_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    create_login_account: bool = True

class DesignDivisionUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    ee_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    is_active: Optional[bool] = None

class DesignDivisionResponse(BaseModel):
    id: int
    code: str
    name: str
    circle_id: int
    circle_name: str
    is_active: bool
    ee_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    assigned_bridge_count: int = 0
    assigned_culvert_count: int = 0
    ee_username: Optional[str] = None

    class Config:
        from_attributes = True

class DesignDemandStatusUpdate(BaseModel):
    design_execution_state: str  # RUNNING, SUSPENDED, SENT, NOT_STARTED
    bottleneck_reason: Optional[str] = None
    bottleneck_notes: Optional[str] = None
    design_target_date: Optional[datetime] = None

class DesignDemandItemResponse(BaseModel):
    id: int
    code: str
    acquisition_type: str  # BRIDGE or CULVERT
    structure_name: str
    structure_type: Optional[str] = None
    road_name: Optional[str] = None
    chainage_km: Optional[float] = None
    chainage_m: Optional[float] = None
    location_chainage_gps_text: Optional[str] = None
    zone_name: Optional[str] = None
    circle_name: Optional[str] = None
    division_name: Optional[str] = None
    field_division_id: Optional[int] = None
    assigned_bdd_division_id: Optional[int] = None
    assigned_bdd_division_name: Optional[str] = None
    assigned_bdd_sde_id: Optional[int] = None
    assigned_bdd_sde_name: Optional[str] = None
    workflow_status: str
    current_holder_role: str
    design_execution_state: str  # RUNNING, SUSPENDED, SENT, NOT_STARTED
    bottleneck_reason: Optional[str] = None
    bottleneck_notes: Optional[str] = None
    bottleneck_updated_at: Optional[datetime] = None
    design_completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
