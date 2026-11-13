# RHD Bridge & Culvert Design Data Acquisition System (OBDDAS / OBCDAS) — Antigravity Engineering Prompt Suite

## Execution Strategy: Single Prompt vs. 4-Phase Modular Sequence

Because the Roads and Highways Department (RHD) Online Bridge & Culvert Design Data Acquisition System spans **two complex engineering forms (33+ fields each)**, **cascading administrative hierarchies (Zone → Circle → Division → Road Type → Road Number)**, **conditional hydraulic/structural sub-forms**, **multi-file upload slots**, and **PDF/ZIP export pipelines**, a single prompt often hits LLM output token limits—causing the AI coding agent to stub out form fields with `// TODO: add remaining fields` or simplify validation logic.

To save your time while guaranteeing 100% production fidelity, this document gives you **both**:
1. **The 4-Phase Modular Prompt Sequence (Recommended for Zero-Truncation Production Quality)**: Four copy-paste prompts you feed into Antigravity sequentially. Each phase forces Antigravity to write every single database column, API endpoint, and form field without cutting corners.
2. **The Consolidated Single-Shot Master Prompt (Fast-Track Option)**: A complete, self-contained mega-prompt at the end of this document if you want Antigravity to scaffold and wire the entire stack in one continuous run.

---

## Core Design Manifesto (Enforced Across All Prompts)

Every prompt below enforces these strict visual and architectural rules:
* **Zero AI Slop**: No generic SaaS marketing hero banners, no floating decorative blobs, no glassmorphism, no gradients, no drop-shadowed cards (`shadow-lg` / `shadow-xl`), and **strictly NO "Cards inside Cards" nesting**.
* **Zero Rounded Corners (`0px` Border Radius)**: Every UI element—buttons, inputs, selects, tables, tabs, modals, badges, file dropzones, and containers—must enforce `rounded-none` (`border-radius: 0px !important`).
* **Architectural Blueprint / Swiss Engineering Grid**: Layout is constructed like a high-precision CAD / structural engineering instrument panel using exposed `1px solid` hairline structural borders (`border-slate-300`), crisp tabular grid lines, visible section index codes (`[SEC-01]`, `[HYD-06]`), and high-density scannable rows.
* **Festive yet Comfortable Precision Color Palette**:
  * **Canvas & Structural Surfaces**: Crisp Drafting Paper Alabaster (`#F8FAFC`) and Pure White (`#FFFFFF`) panels separated by exposed structural hairlines (`#CBD5E1`), paired with a Deep Gunmetal Slate (`#0F172A`) command header and sidebar.
  * **Primary Engineering Accent**: RHD Cobalt Blueprint Blue (`#0284C7` / `#0369A1`) for active states, primary actions, and structural focus rings.
  * **Festive High-Visibility Engineering Accents**: Survey Vermeil / International Engineering Orange (`#EA580C`) for primary CTA highlights and active step indicators; Theodolite Emerald (`#059669`) for validated/approved states; Caution Amber (`#D97706`) for drafts/pending reviews; and Crimson (`#DC2626`) for structural alerts.
* **Typography**: `Space Grotesk` or `IBM Plex Sans` for crisp structural headers and form labels; `JetBrains Mono` or `IBM Plex Mono` (`tabular-nums`) for all chainages, GPS coordinates, Reduced Levels (`R.L. in m PWD`), span arrangements (`15 + 30 + 15`), and submission codes (`MIS-JBT-19-00017`).

---

## Option A: 4-Phase Modular Prompt Sequence (Recommended)

### Phase 1 Prompt: FastAPI Backend, Relational Schema, RHD Master Data Seeding & ZIP/PDF Export Engine

Copy and paste the following into Antigravity first:

```text
You are a Principal Full-Stack Systems Architect building the modernized "Online Bridge & Culvert Design Data Acquisition System (OBDDAS)" for the Bridge Design Circle, Roads and Highways Department (RHD), Bangladesh.

We are scrapping a legacy jQuery/PHP/AdminLTE application and building a rock-solid, modern full-stack application using:
- Backend: Python FastAPI, SQLAlchemy 2.0 (async or sync with SQLite/PostgreSQL support), Pydantic v2, ReportLab/WeasyPrint (or structured HTML-to-PDF) for engineering datasheet export, and standard `zipfile` streaming for attachment bundles.
- Frontend (to be built in Phase 2-4): React (JavaScript, Vite), Tailwind CSS, Lucide Icons, React Hook Form.

### PHASE 1 OBJECTIVE
Build the complete, production-ready `/backend` service with zero placeholder stubs, complete database models, RHD master data seeding, file attachment management, and export endpoints.

### 1. USER ROLES & WORKFLOW LIFECYCLE
Support JWT authentication and role-based access control for 3 roles:
1. `road_division_user` (Executive Engineer / Road Division Entry User): Creates, edits, uploads files, saves as `Draft`, or submits (`Sent to Bridge Division`) by selecting a target Bridge Design Engineer.
2. `bridge_design_reviewer` (Bridge Design Circle Engineer, e.g., Bridge Design Division 1, 2, 3, Bridge Cons. & Main.): Views assigned submissions, downloads form data PDF and attachment ZIP, adds technical review notes, and transitions status to `Under Review`, `Returned for Correction`, or `Approved / Complete`.
3. `admin`: Manages RHD master data (Zones, Circles, Divisions, Roads) and user accounts.

### 2. RHD HIERARCHY & MASTER DATA SEEDING (`seed.py`)
Create tables and pre-seed realistic RHD Bangladesh hierarchy data extracted from the RHD system:
- `RhdZone`: e.g., Dhaka, Chattogram, Comilla, Sylhet, Rajshahi, Rangpur, Khulna, Barishal, Mymensingh, Gopalgonj, Technical Services Dhaka, 4-Laning of Dhaka-Chattogram Highway Project, 3rd Shitalakhya Bridge Construction Project.
- `RhdCircle`: Linked to Zone (e.g., Bridge Design Circle Sarak Bhaban Tejgaon Dhaka, Bridge Cons. & Maintenance Circle, Road Design and Safety Circle, Dhaka, Comilla, Chattogram, Sylhet, Bogura, Barishal, Rangamati, etc.).
- `RhdDivision`: Linked to Circle (e.g., Bridge Design Division-1, Bridge Design Division-2, Bridge Design Division-3, Sarak Bhaban Tejgaon Dhaka; Comilla; Chattogram; Sylhet; Cox's Bazar; Brahmanbaria; Feni; Noakhali; Soil Investigation Dhaka; etc.).
- `RoadType`: `National Highway` (Code: N), `Regional Highway` (Code: R), `Zilla Road` (Code: Z), `Others`.
- `Road`: Linked to `RoadType`, with `road_number` (e.g., `N1`, `N2`, `N3`, `N4`, `N5`, `N8`, `R110`, `R140`, `Z1031`) and `road_name` (e.g., `Dhaka (Jatrabari)-Comilla (Mainamati)-Chittagong-Teknaf Road`, `Dhaka (Katchpur)-Bhairab-Jagadishpur-Shaistaganj-Sylhet-Tamabil-Jaflong Road`, etc.). Include an endpoint `POST /api/master/zones`, `/circles`, `/divisions`, `/roads` so users can also add missing entries via a quick modal.
- `Users`: Seed default test accounts for:
  - Road User (`road_user` / `rhd123` - Demo Road Design User)
  - Bridge Design Reviewers (`eebdd1` [Bridge Design Division-1], `yousuf_bdd2` [Bridge Design Division-2], `kaoser_bdd3` [Bridge Design Division-3], `khurshid_bcm1` [Bridge Cons. & Main.-1], `demo_bridge` [Bridge Design])
  - Admin (`admin` / `admin123`)

### 3. COMPLETE BRIDGE ACQUISITION MODEL (`BridgeAcquisition`)
Implement every field required by the RHD Bridge Acquisition specification (no omissions):
- System Metadata: `id`, `code` (auto-generated format `MIS-BRG-YYYY-XXXXX`), `status` (`Draft`, `Sent to Bridge Division`, `Under Review`, `Returned for Correction`, `Complete`), `created_by_id`, `assigned_bridge_engineer_id`, `reviewer_remarks`, `created_at`, `updated_at`.
- Administrative & Road Identification:
  - `proposed_bridge_type` (String)
  - `zone_id`, `circle_id`, `division_id` (Optional/Linked for filtering)
  - `road_type_id` (FK) & `road_type_others_name` (String, active when Road Type is `Others`)
  - `road_id` (FK) & `road_name` (Auto-filled from Road or custom when `Others`)
  - `road_link_name_no` (Field 4: Name of Road Link with Link No)
  - `location_chainage_gps_text` (Field 5: Location of Bridge with Chainage and GPS text, e.g., `Kagazpur Ch 194+210 to Ch 194+275`)
  - `location_google_map_link` (Field 5.1 URL) & `location_lat_lng` (String `lat,lng`)
  - `bridge_name` (Field 6: Name of the Bridge / Structure)
  - `river_channel_name` (Field 7: Name of River/Channel)
  - `channel_width_m` (Field 7.1: Width of the Channel in m)
- Navigational Clearance (Field 8):
  - `nav_clearance_authority` (`BIWTA`, `BWDB`, `Local`, `Railway`, `Others`, `None`)
  - `nav_clearance_class` (For BIWTA: `Class-I` [V:18.30m, H:76.22m], `Class-II` [V:12.20m, H:76.22m], `Class-III` [V:7.62m, H:30.48m], `Class-IV` [V:5.00m, H:20.00m], `Others`; For Railway: `General` [V:7.25m, H:30.50m], `Others`; For BWDB/Local/Others: custom)
  - `nav_vertical_clearance_m` (Float)
  - `nav_horizontal_clearance_m` (Float)
  - `nav_others_note` (String)
- Existing Bridge & Reference Datum (Fields 9, 10, 11, 12, 20):
  - `existing_bridge_length` (Field 9.1)
  - `existing_span_arrangement` (Field 9.2, e.g., `16+31+16`)
  - `reference_datum_type` (Field 20: `PWD`, `SOB`, `BIWTA`, `BWDB`, `Local`, `MSL`, `TBM` — default `PWD`; dynamically sets unit suffix `in m <DATUM>` across all R.L. fields)
  - `reference_benchmark_location` (Field 20 text)
  - `reference_benchmark_map_link` (Field 20.1) & `reference_benchmark_lat_lng` (Field 20.2)
  - `existing_mid_span_girder_bottom_rl` (Field 10: in m Datum)
  - `existing_foundation_type` (Field 11: `Open Foundation`, `Pile`, `Well`, `Shal Balli`, `Others`, `Not Applicable`)
  - `has_existing_foundation_utility_layout` (Field 12: Boolean `Yes`/`No` for Existing Foundation Layout & ROW Utilities)
- Hydrological & River Survey Data (Fields 13–19, 21, 22):
  - `highest_flood_level_hfl` (Field 13: in m Datum)
  - `standard_high_water_level_shwl` (Field 14: in m Datum)
  - `lowest_water_level_lwl` (Field 15: in m Datum)
  - `highest_tide_level_htl` (Field 15.1: in m Datum, optional)
  - `lowest_tide_level_ltl` (Field 15.2: in m Datum, optional)
  - `survey_time_water_level` (Field 16: in m Datum)
  - `survey_date` (Field 17: Date `DD/MM/YYYY`)
  - `river_tidal_type` (Field 18: `Tidal` or `Not Tidal`)
  - `tidal_dry_season_htl`, `tidal_dry_season_ltl`, `tidal_rainy_season_htl`, `tidal_rainy_season_ltl` (Field 18.a & 18.b: active when `Tidal`)
  - `stream_flow_direction` (Field 19: e.g., `From left to right` / `North to South`)
  - `zero_chainage_reference_point` (Field 21)
  - `zero_chainage_map_link` (Field 21.1) & `zero_chainage_lat_lng` (Field 21.2)
  - `cross_road_at_approach` (Field 22: `Shown In Drawing`, `Not Shown In Drawing`, `Not Applicable`)
- Proposed Bridge Design & Ancillary Works (Fields 24, 27–30 & Extra RHD Fields):
  - `proposed_alignment` (Field 24: `New Alignment` or `For Existing Bridge`)
  - `proposed_existing_alignment_offset` (Field 24.a: `At the same alignment`, `Upstream of the existing bridge`, `Downstream of the existing bridge`)
  - `electrification_work_required` (Field 27: `Yes` / `No`)
  - `proposed_bridge_length_m` (Field 28: Float/String)
  - `proposed_span_arrangement_m` (Field 29: e.g., `15+30+15`)
  - `proposed_mid_span_bottom_rl` (Field 30: in m Datum)
  - `pier_protective_work_required` (`Yes`, `No`, `Not Applicable`)
  - `proposed_max_height_approach_road` (`Yes`, `No`, `Not Applicable`, plus numeric height if applicable)
  - `ancillary_work_required` (`Yes`, `No`, `Not Applicable` — Electrification, Bank Protection)
  - `remarks` (Text)
  - `bms_chainage`, `bms_google_map_link`, `bms_lat_lng` (BMS Chainage & GPS Info section)
  - `total_borehole_count` (0 to 40)

### 4. COMPLETE CULVERT ACQUISITION MODEL (`CulvertAcquisition`)
Implement every field required by the RHD Culvert Acquisition specification:
- System Metadata: `id`, `code` (`MIS-CLV-YYYY-XXXXX`), `status`, `created_by_id`, `assigned_bridge_engineer_id`, `reviewer_remarks`, `created_at`, `updated_at`.
- Administrative & Location (Section a–h):
  - `zone_id` (a.1), `circle_id` (a.2), `division_id` (a.3)
  - `road_type_id` (b.1), `road_type_others_name` (b.1.1), `road_id` (b.2), `road_name` (b.3), `culvert_name`
  - `location_chainage_lrp_gps` (c)
  - `location_google_map_link` (e.1) & `location_lat_lng` (e.2)
  - `is_flash_flood_prone` (f: `Yes`/`No`) & `flash_flood_description` (f.1)
  - `is_haor_area` (g: `Yes`/`No`)
  - `is_tidal_area` (h: `Yes`/`No`)
- Reference Benchmark Data (Section 2):
  - `reference_datum_type` (2.1: `MSL`, `SOB`, `PWD`, `TBM`)
  - `reference_benchmark_location` (2.2)
  - `reference_benchmark_map_link` (2.2.1) & `reference_benchmark_lat_lng` (2.2.2)
- Plane Table & Navigational Clearance (Sections 4 & 5):
  - `cross_road_at_approach` (4.b: `Shown In Drawing`, `Not Shown In Drawing`, `Not Applicable`)
  - `nav_clearance_required` (5: `Yes`/`No`)
- Hydrological Data (Section 6 — all with dynamic unit `in m <DATUM>`):
  - `highest_flood_level_hfl` (6.1), `lowest_water_level_lwl` (6.2), `standard_high_water_level_shwl` (6.3), `highest_tide_level_htl` (6.4), `lowest_tide_level_ltl` (6.5)
- Existing Culvert Information (Conditional by `existing_culvert_type`):
  - `existing_culvert_type`: `Rectangular Culvert`, `Pipe Culvert`, `Slab Culvert`, `Arch Culvert`, `Other`, `None`
  - Rectangular fields: `no_of_vent`, `length_of_each_vent_m`, `total_length_m` (auto-calculated `no_of_vent * length_of_each_vent_m`), `height_m`, `width_m`, `top_slab_thickness_mm`, `side_wall_thickness_mm`, `bottom_slab_thickness_mm`, `existing_structure_condition`, `foundation_condition`, `remarks`
  - Pipe fields: `pipe_outer_dia`, `pipe_thickness`, `pipe_length`, `remarks`
  - Slab fields: `slab_thickness`, `slab_length`, `slab_width`, `remarks`
  - Arch fields: `arch_length`, `arch_width`, `arch_dia`, `arch_thickness`, `remarks`
  - Other fields: `other_length`, `other_width`, `remarks`
  - `existing_culvert_general_note` (Section c Remarks)
- Alignment & Proposed Culvert Information (Section 8 & Proposed Culvert):
  - `proposed_alignment` (8: `New Alignment` or `For Existing Culvert`)
  - `proposed_existing_alignment_offset` (8.a: `At the same alignment`, `Upstream of the existing Culvert`, `Downstream of the existing Culvert`)
  - `proposed_culvert_category`: `New Culvert`, `Widening Culvert`, `Not Applicable`
  - When `New Culvert` -> `proposed_new_sub_type` (`Rectangular Box Culvert` or `Other`):
    - If `Rectangular Box Culvert`: `prop_no_of_vent`, `prop_length_of_each_vent_m`, `prop_total_length_m` (auto-calculated), `prop_clear_height_m`, `prop_clear_width_m`, `prop_remarks`
    - If `Other`: `prop_other_length`, `prop_other_width`, `prop_other_carriage_width`
  - When `Widening Culvert` -> `proposed_widening_side` (`Upstream Side`, `Downstream Side`, `Both Side`):
    - `widening_upstream_carriage_width`, `widening_downstream_carriage_width`
- Borehole Array (`BoreholeEntry` child table linked to either Bridge or Culvert acquisition, supporting 0 to 40 boreholes):
  - `borehole_index` (1..40), `borehole_number_label`, `chainage_location`, `google_map_link`, `lat_lng`, `rl_ground_bed_level`, `file_path`

### 5. MULTI-SLOT ATTACHMENT & DIRECTIONAL PHOTO SYSTEM (`AcquisitionAttachment`)
Create a unified attachment table and upload endpoints supporting categorized slots:
- `DEMAND_LETTER`: Specifically enforces the 3 officer types (`Attachment for ACE`, `Attachment for SE`, `Attachment for EE`) where uploading one removes that officer option from the remaining dropdown until all 3 are uploaded.
- `NAVIGATIONAL_CLEARANCE` (Field 8.2 / Culvert 5)
- `EXISTING_FOUNDATION_LAYOUT` (Bridge Field 12)
- `SOIL_INVESTIGATION_REPORT` (Bridge Field 23 / Culvert Soil Report with EE sign & seal)
- `SITE_PLAN_PLANE_TABLE_MAP` (Bridge Field 25 / Culvert 4.a)
- `CHANNEL_CROSS_SECTIONS` (Bridge Field 26: >=3 cross sections at CL, 10m U/S, 10m D/S; Culvert Field 3: 1.50m interval)
- `HYDRO_MORPHOLOGICAL_STUDY` (Bridge Field 31)
- `EXISTING_STRUCTURE_PHOTOS` (Roadside both ends, Channel side both ends, Damaged portions)
- `BMS_CHAINAGE_ATTACHMENT` (Bridge BMS section)
- `SITE_PHOTO_EAST`, `SITE_PHOTO_WEST`, `SITE_PHOTO_NORTH`, `SITE_PHOTO_SOUTH` (4 directional site image slots)
- `EXTENSION_DIAGRAM_EAST`, `EXTENSION_DIAGRAM_WEST`, `EXTENSION_DIAGRAM_NORTH`, `EXTENSION_DIAGRAM_SOUTH` (4 directional extension diagram image slots for Culvert)

### 6. EXPORT & UTILITY ENDPOINTS
- `GET /api/bridge-acquisitions/{id}/export-pdf` & `GET /api/culvert-acquisitions/{id}/export-pdf`: Generates a clean, tabular engineering specification sheet containing all form fields, coordinates, and metadata (matching the legacy "Download Form" action).
- `GET /api/bridge-acquisitions/{id}/export-zip` & `GET /api/culvert-acquisitions/{id}/export-zip`: Streams a `.zip` archive of all uploaded documents, reports, and directional images for that record (matching the legacy "Download ZIP" action).
- `POST /api/utils/parse-map-url`: Utility endpoint (also mirrored on frontend) that extracts `lat,lng` from Google Maps URLs (`/@@(-?\d+\.\d+),(-?\d+\.\d+)/` or `?q=(-?\d+\.\d+),(-?\d+\.\d+)`).

Deliver all backend code, `requirements.txt`, database initialization/seeding on startup, and verify that the FastAPI server starts cleanly with Swagger docs at `/docs`.
```

---

### Phase 2 Prompt: Precision Engineering Design System, App Shell & Acquisition Registries

Once Phase 1 is complete, copy and paste Phase 2 into Antigravity:

```text
Now build Phase 2 in `/frontend` (React + Vite + JavaScript + Tailwind CSS + Lucide Icons) connected to the FastAPI backend.

### STRICT VISUAL & ANTI-AI-SLOP DIRECTIVES (MANDATORY)
1. **NO AI SLOP**: Do NOT generate generic SaaS gradients, floating glassmorphic panels, decorative blobs, or nested "Cards inside Cards" (`div.card > div.card`).
2. **ZERO ROUNDED CORNERS (`0px` EVERYWHERE)**: Every component in the application—buttons, inputs, selects, tabs, tables, badges, modals, dropzones, and layout panes—MUST use `rounded-none` (`border-radius: 0px !important`). Configure Tailwind and global CSS so `border-radius` is globally `0px`.
3. **SWISS CAD / BLUEPRINT GRID AESTHETIC**:
   - Design the UI like a high-precision structural engineering workstation (inspired by Bentley MicroStation, Autodesk Civil 3D, and Swiss typographic grids).
   - Use exposed `1px solid` structural borders (`border-slate-300`) where adjacent panels share hairline borders (`border-collapse` / `-ml-px -mt-px`) rather than floating cards with drop shadows.
   - Section headers must look like technical drawing title blocks: uppercase tracking, monospace index tags (`[SEC-01]`, `[HYD-06]`), left accent bars (`border-l-4 border-sky-600` or `border-l-4 border-orange-600`), and high-contrast slate backgrounds (`bg-slate-100`).
4. **FESTIVE YET COMFORTABLE ENGINEERING COLOR PALETTE**:
   - Primary Structural Header & Sidebar: Deep Gunmetal (`#0F172A`) with crisp slate hairlines (`#1E293B`).
   - Workspace Canvas: Drafting Paper Alabaster (`#F8FAFC`) with pure white (`#FFFFFF`) data cells.
   - Engineering Cobalt (`#0284C7`): Active navigation, Bridge module theme, and input focus borders.
   - Festive Survey Orange (`#EA580C`): Culvert module theme, primary action highlights, and active step markers.
   - Theodolite Emerald (`#059669`): Completed/Approved status badges and upload success bars.
   - Caution Amber (`#D97706`): Draft / Under Review indicators.
5. **TYPOGRAPHY**:
   - Load Google Fonts: `IBM Plex Sans` (UI & labels) and `JetBrains Mono` (all codes, chainages, coordinates, R.L. elevations, dimensions, and live clock).

### PHASE 2 DELIVERABLES
1. **Top Command Bar & Technical Sidebar**:
   - Top bar displaying `RHD // BRIDGE DESIGN CIRCLE — DATA ACQUISITION SYSTEM (OBDDAS v2)`, active user role badge, live ticking engineering clock (`YYYY-MM-DD // HH:MM:SS UTC+6`), quick role-switcher (for testing Road User vs. Bridge Design Reviewer vs. Admin), Profile modal (edit name, avatar, password), and Sign Out.
   - Left technical navigation rail with instant filter search (`Search modules...`) and links to:
     - `[01] Command Dashboard & Analytics`
     - `[02] Bridge Acquisition Registry & Entry`
     - `[03] Culvert Acquisition Registry & Entry`
     - `[04] Bridge Design Circle Review Queue`
     - `[05] RHD Master Hierarchy & Road Directory`
     - `[06] Interactive Engineering User Manual`
2. **Command Dashboard (`/home`)**:
   - Flat, edge-to-edge structural metric strip showing total acquisitions, Drafts, Sent to Bridge Division, Returned for Correction, and Approved (broken down by Bridge vs. Culvert).
   - Quick-launch action bar to start a new Bridge or Culvert Acquisition or filter by RHD Zone/Circle/Division.
3. **Acquisition Form List Registries (Bridge List & Culvert List)**:
   - High-density, sortable, searchable, paginated engineering data table (10 / 25 / 50 / 100 entries, multi-column search, Status filter, Road Type filter).
   - Columns matching RHD requirements: `#`, `Code` (monospace), `Type of Road`, `Road Number`, `Name of the Road`, `Name of the Bridge / Culvert`, `Location with Chainage & GPS` (with clickable Google Map deep link), `Added By & Assigned Bridge Engineer`, `Status` (sharp rectangular badge), and the **3 Mandatory Action Buttons**:
     1. **Download Form PDF** (triggers `/export-pdf` download)
     2. **Inspect Full Details** (opens a sharp, blueprint-style full-screen or large technical drawer showing all 33+ fields and embedded image previews)
     3. **Download Attachments ZIP** (triggers `/export-zip` bundle download)
     - Plus **Edit** button if status is `Draft` or `Returned for Correction`.
```

---

### Phase 3 Prompt: Bridge Acquisition Multi-Section Engineering Form (All 33+ Fields)

Once Phase 2 is ready, copy and paste Phase 3 into Antigravity:

```text
Now build Phase 3: The complete **Bridge Acquisition Entry & Edit Form** (`/bridge_acquisition_form`) with 100% field parity with the RHD specification.

### LAYOUT & UX RULES
- **NO "Cards inside Cards"**: Organize the form into a **6-Stage Technical Blueprint Stepper** (with a toggle to "View All Sections on Single Page" for power users). Each section uses a flat structural grid where label/input cells are separated by `1px solid #CBD5E1` borders—never nested rounded boxes.
- **Sticky Engineering Action Bar**: Fixed at the bottom of the viewport showing live completion percentage, current Reference Datum badge (e.g., `DATUM: m PWD`), `Save as Draft` button, `Status` selector (`Draft` vs `Send To Bridge Division`), conditional `Bridge Design Engineer` selector (enabled & required when status is `Send To Bridge Division`), and `SUBMIT ACQUISITION`.
- **Bidirectional Google Maps & Coordinate Sync**: Create a reusable `<GpsCoordinateInput />` component used across Location (5.1), Reference Benchmark (20.1), Zero Chainage (21.1), BMS Chainage, and Boreholes. Pasting a Google Maps URL automatically extracts `lat,lng` via regex; typing `lat,lng` automatically updates the Google Maps URL and provides a one-click `Open in Google Maps ↗` link plus an inline interactive Leaflet/OpenStreetMap pin preview.
- **Reusable Multi-File Attachment Slot (`<EngineeringAttachmentSlot />`)**: Replaces the clunky legacy jQuery upload with a crisp, zero-radius tabular upload row: File selector, required Attachment Name input (or officer dropdown for Demand Letters), instant upload progress bar, preview thumbnail/file link, and delete button.

### IMPLEMENT ALL 6 SECTIONS & 33+ FIELDS VERBATIM
1. **[SEC-01] Demand Letter & Road Identification**:
   - **Demand Letter Upload**: Dropdown for `Attachment Name` (`Attachment for ACE`, `Attachment for SE`, `Attachment for EE`). Once an officer's letter is uploaded, remove that option from the dropdown until all 3 are uploaded (matching legacy `remove_demand()` logic).
   - `Proposed Bridge Type` (Text input)
   - `1) Type of Road` (`National Highway`, `Regional Highway`, `Zilla Road`, `Others`) -> dynamically enables `1.1) Others` text input if `Others` is chosen.
   - `2) Road Number` (Searchable combobox chained to `Type of Road`)
   - `3) Name of the Road` (Auto-filled read-only when a standard Road Number is selected; editable when `Others` is selected)
   - `4) Name of Road Link with Link No`
   - `5) Location of the Bridge with Chainage and GPS` (e.g., `Kagazpur Ch 194+210  long 91.2334 lat 24.334`)
   - `5.1) Location of the Bridge with GPS` (`Google Map Link` + `Latitude,Longitude` bidirectional sync)
   - `6) Name of the Bridge (Structure)`
   - `7) Name of River/Channel` & `7.1) Width of the Channel (m)`

2. **[SEC-02] Navigational Clearance (Fields 8 & 8.2)**:
   - `8) Navigational Clearance Required` radio selector (`BIWTA`, `BWDB`, `Local`, `Railway`, `Others`).
   - Conditional Sub-Grid:
     - If `BIWTA`: Class selector (`Class-I` -> auto-fills `V: 18.30 m`, `H: 76.22 m`; `Class-II` -> `V: 12.20 m`, `H: 76.22 m`; `Class-III` -> `V: 7.62 m`, `H: 30.48 m`; `Class-IV` -> `V: 5.00 m`, `H: 20.00 m`; `Others` -> manual V & H inputs).
     - If `Railway`: Type selector (`General` -> auto-fills `V: 7.25 m`, `H: 30.50 m`; `Others` -> manual V & H).
     - If `BWDB` or `Local`: Type badge + manual `V (Vertical) m` and `H (Horizontal) m` inputs.
     - If `Others`: `Note` text input + manual `V (m)` and `H (m)` inputs.
   - `8.2) Navigational Clearance [Attachment]` multi-file upload slot.

3. **[SEC-03] Existing Bridge, Foundation & Reference Datum (Fields 9–12, 20)**:
   - `9.1) Length of the existing bridge (m)` & `9.2) Span arrangement of the existing bridge` (e.g., `16+31+16`)
   - `20) Reference Bench mark or datum` selector (`PWD`, `SOB`, `BIWTA`, `BWDB`, `Local`) + Benchmark Location input. Changing this selector dynamically updates the unit suffix (`in m PWD`, `in m SOB`, etc.) on ALL Reduced Level (R.L.) and water level inputs across the entire form!
   - `20.1) Reference Benchmark Google Map Link` & `20.2) Latitude,Longitude`
   - `10) Bottom R.L. of the mid span girder of the existing bridge` (with dynamic `in m <DATUM>` addon)
   - `11) Existing Foundation` (`Open Foundation`, `Pile`, `Well`, `Shal Balli`, `Others`, `Not Applicable`)
   - `12) Existing Foundation Layout (Position, Shape, Dimension etc. with chainage) & ROW Utilities (Gas, Water, Internet, Phone, Electricity)`: Radio `Yes` / `No`. When `Yes`, reveals multi-file upload slot.

4. **[SEC-04] Hydrological, Tidal & Approach Survey Data (Fields 13–19, 21–23)**:
   - `13) Highest Flood Level (From Water Development Board)` (`in m <DATUM>`)
   - `14) Standard High Water Level` (`in m <DATUM>`)
   - `15) Lowest Water Level` (`in m <DATUM>`)
   - `15.1) Highest Tide Level (Where Applicable)` & `15.2) Lowest Tide Level (Where Applicable)` (`in m <DATUM>`)
   - `16) Water level at the time of Survey` (`in m <DATUM>`)
   - `17) Survey Date` (`DD/MM/YYYY` date picker)
   - `18) Type of River/Channel` (`Tidal` / `Not Tidal`). When `Tidal` is selected, reveal the 4-field **Water Level Information for Tidal River** strip:
     - `a) At Dry Season`: `HTL` and `LTL`
     - `b) At Rainy Season`: `HTL` and `LTL`
   - `19) Direction of stream flow`
   - `21) Reference point of zero chainage of Road` + `21.1) Google Map Link` + `21.2) Latitude,Longitude`
   - `22) Existence of any cross road falling at the approach of the bridge` (`Yes, Shown In Drawing`, `Yes, But Not Shown In Drawing`, `Not Applicable`)
   - `23) Soil investigation report with sign and seal of EE` (multi-file upload slot)

5. **[SEC-05] Proposed Bridge Design, Site Plans & Ancillary Works (Fields 24–31)**:
   - `24) Proposed alignment of bridge` (`New Alignment` / `For Existing Bridge`) -> enables `24.a) For Existing Bridge` (`At the same alignment`, `Upstream of the existing bridge`, `Downstream of the existing bridge`) when `For Existing Bridge` is selected.
   - `25) Site plan of proposed bridge (showing Hat-Bazar, Town etc., location pictures, Google Map with GPS)` (multi-file upload slot)
   - `26) At least 3 cross sections with road chainage Reduced Level (at proposed centre line, 10 m upstream, 10 m downstream; 3 m interval for river width <=100m, 5 m interval for >100m)` (multi-file upload slot)
   - `27) Electrification work required?` (`Yes` / `No`)
   - `28) Proposed Length of Bridge (m)`
   - `29) Proposed Span arrangement of the Bridge (m)` (e.g., `15 + 30 + 15`)
   - `30) Mid Span Bottom R.L. for proposed Bridge` (`in m <DATUM>`)
   - `31) Hydro-Morphological Study Report` (multi-file upload slot)
   - Additional Structural Requirements Grid:
     - `Requirement of Pier Protective Work` (`Yes`, `No`, `Not Applicable`)
     - `Proposed Maximum Height of Approach Road (m)` (`Yes`, `No`, `Not Applicable`)
     - `Ancillary Work (Electrification, Bank Protection Required)` (`Yes`, `No`, `Not Applicable`)
     - `Remarks (if any)`

6. **[SEC-06] Directional Site Photos, BMS Chainage & Dynamic Borehole Array (Fields 32–33)**:
   - **Proposed Structure Site Location Pictures**: 4-column flat technical grid for `East Side`, `West Side`, `North Side`, and `South Side` with instant image preview, aspect-ratio-preserved thumbnail, and replace/remove controls.
   - **Photos of Existing Bridge/Culvert**: Multi-file upload slot with specification checklist (`(i) View from roadside both ends`, `(ii) View from channel side both ends`, `(iii) Image of damaged portions`).
   - **BMS Chainage & GPS Info**: Multi-file upload slot + `Google Map Link` + `Latitude,Longitude` + `Chainage` input.
   - **Borehole NOS Dynamic Array**: Stepper counter (`-` / `+` from `0` to `40`). Incrementing or decrementing dynamically adds/removes rows in a flat engineering table where each Borehole row has: `Borehole #`, `Chainage / Location`, `Google Map Link`, `Latitude,Longitude` (auto-extracted), `Ground/Bed R.L. (m)`, and `Borehole Log Attachment`.
   - **Submission Routing (Fields 32 & 33)**: `Status` (`Draft` vs `Send To Bridge Division`) and `Bridge Design` engineer assignee dropdown.
```

---

### Phase 4 Prompt: Culvert Acquisition Form, Reviewer Portal & Interactive Manual

Once Phase 3 is complete, copy and paste Phase 4 into Antigravity:

```text
Now complete Phase 4: Build the **Culvert Acquisition Entry & Edit Form** (`/culvert_acquisition_form`), the **Bridge Design Circle Review Portal**, and the **Interactive Engineering Manual**.

### 1. CULVERT ACQUISITION FORM (`/culvert_acquisition_form`)
Use the exact same zero-radius (`rounded-none`), no-nested-cards Swiss engineering blueprint aesthetic, accented with Festive Survey Orange (`#EA580C`). Implement all Culvert sections and dynamic rules:
- **[CLV-01] Demand Letter & Administrative Hierarchy**:
  - Demand Letter upload with ACE / SE / EE officer deduplication.
  - `a.1) Zone` (with `+` quick-add modal button), `a.2) Circles`, `a.3) Divisions`
  - `b.1) Type of Road`, `b.1.1) Others`, `b.2) Road Number`, `b.3) Name of the Road`
  - `c) Location of the Culvert with Chainage/LRP and GPS`
  - `e) Location of the Culvert with GPS` (`e.1 Google Map Link` + `e.2 Latitude,Longitude`)
  - Environmental & Flood Flags: `f) Located in flash flood-prone area (Yes/No)` -> conditionally enables `f.1) Describe the nature of the flash flood`; `g) Haor area (Yes/No)`; `h) Tidal area (Yes/No)`.
- **[CLV-02] Reference Benchmark & Channel Cross-Section**:
  - `2.1) Reference Benchmark or datum` (`MSL`, `SOB`, `PWD`, `TBM`) — dynamically updates `.acquisitionReferenceUniteLabel` (`in m MSL`, `in m PWD`, etc.) across all hydrological inputs!
  - `2.2) Location of selected Benchmark` + `2.2.1) Google Map Link` + `2.2.2) Latitude,Longitude`
  - `3) Cross-section of the channel with chainage (at least one cross-section at centerline with R.L. of channel/river bed at 1.50 m interval)` multi-file upload.
  - `4.a) Plane table survey map of proposed culvert location` multi-file upload + `4.b) Existence of any cross road falling at the approach of the culvert`.
  - `5) Navigational Clearance` (`Yes`/`No`) -> conditionally reveals multi-file upload slot when `Yes`.
- **[CLV-03] Hydrological Data & Directional Site Pictures**:
  - `6.1) Highest Flood Level`, `6.2) Lowest Water Level`, `6.3) Standard High Water Level`, `6.4) Highest Tide Level`, `6.5) Lowest Tide Level` (all displaying `in m <DATUM>`).
  - **Proposed Structure Site Location Pictures**: 4-column grid (`East Side`, `West Side`, `North Side`, `South Side`).
- **[CLV-04] Existing Culvert Geometry & Photos**:
  - `(a) Culvert Type` radio selector (`Rectangular Culvert`, `Pipe Culvert`, `Slab Culvert`, `Arch Culvert`, `Other`, `None`):
    - If `Rectangular Culvert`: `No. of Vent`, `Length of Each Vent (m)`, `Total Length (m)` (**auto-calculated** `No. of Vent * Length of Each Vent`), `Height (m)`, `Width (m)`, `Top Slab Thickness (mm)`, `Side Wall Thickness (mm)`, `Bottom Slab Thickness (mm)`, `Existing Structure Condition`, `Foundation Condition`, `Remarks`.
    - If `Pipe Culvert`: `Pipe Outer Dia`, `Thickness of Pipe`, `Pipe Length`, `Remarks`.
    - If `Slab Culvert`: `Thickness of Slab`, `Slab Length`, `Slab Width`, `Remarks`.
    - If `Arch Culvert`: `Arch Length`, `Arch Width`, `Dia of Arch`, `Arch Thickness`, `Remarks`.
    - If `Other`: `Length`, `Width`, `Remarks`.
  - **Photos of Existing Culvert** multi-file upload + `(c) Remarks (if any)` textarea.
  - **Extension Diagram**: 4-column directional image uploader (`East Side`, `West Side`, `North Side`, `South Side`).
  - **Soil Investigation Report with sign and seal of EE** multi-file upload.
- **[CLV-05] Proposed Culvert Alignment, Geometry & Borehole Array**:
  - `8) Alignment of proposed culvert` (`New Alignment` / `For Existing Culvert`) -> enables `8.a) For Existing Culvert` (`At the same alignment`, `Upstream`, `Downstream`).
  - **Proposed Culvert Type** radio (`New Culvert`, `Widening Culvert`, `Not Applicable`):
    - If `New Culvert` -> sub-selector (`Rectangular Box Culvert` vs `Other`):
      - `Rectangular Box Culvert`: `No. of Vent`, `Clear/Length of Each Vent (m)`, `Total Length (Along Traffic Direction) (m)` (**auto-calculated**), `Clear Height (m)`, `Clear Width (Perpendicular Traffic Direction) (m)`, `Remarks`.
      - `Other`: `Length (Along Traffic Direction)`, `Width (Perpendicular Traffic Direction)`, `Carriage Width`.
    - If `Widening Culvert` -> sub-selector (`Upstream Side`, `Downstream Side`, `Both Side`):
      - Reveals corresponding `Extension Carriage Width (Upstream Side)` and/or `Extension Carriage Width (Downstream Side)` inputs.
  - **Borehole NOS Dynamic Array** (`0` to `40` boreholes with GPS/Chainage/Log fields).
  - **Status & Bridge Division Assignee** (`Draft` vs `Send To Bridge Division`).

### 2. BRIDGE DESIGN CIRCLE REVIEW WORKSPACE & USER MANUAL
- Build the **Bridge Design Circle Review Queue** (`/review_queue`) where assigned Bridge Design Engineers can inspect incoming Bridge and Culvert submissions side-by-side with their uploaded drawings/photos, download the PDF datasheet or ZIP bundle, enter engineering review comments, and mark submissions `Under Review`, `Returned for Correction`, or `Complete`.
- Build an interactive, searchable **Engineering User Manual** (`/user_manual`) documenting all 33+ Bridge fields and Culvert workflows with visual diagrams.
- Perform a full end-to-end audit to verify zero rounded corners (`rounded-none`), zero nested cards, and complete working API integration.
```

---

## Option B: Consolidated Single-Shot Master Prompt (All-in-One Fast-Track)

If you prefer to paste a **single prompt** and let Antigravity build the entire project in one continuous session, copy and paste the block below:

```text
You are a Principal Full-Stack Systems Architect and Engineering UI Designer. Build a complete, production-ready web application: the modernized **"Online Bridge & Culvert Design Data Acquisition System (OBDDAS / OBCDAS)"** for the Bridge Design Circle, Roads and Highways Department (RHD), Bangladesh.

We are replacing a legacy PHP/jQuery/AdminLTE system with a modern, high-precision stack:
- **Frontend**: React (JavaScript, Vite), Tailwind CSS, Lucide Icons, React Hook Form.
- **Backend**: Python FastAPI, SQLAlchemy 2.0 (SQLite default, PostgreSQL-ready), Pydantic v2, PDF Datasheet Generator, and ZIP Archive Streamer.

======================================================================
1. STRICT VISUAL & ANTI-AI-SLOP DESIGN MANIFESTO (NON-NEGOTIABLE)
======================================================================
- **ZERO AI SLOP**: Absolutely NO generic SaaS landing pages, NO gradients, NO glassmorphism, NO floating decorative blobs, NO heavy drop shadows (`shadow-lg`/`shadow-xl`), and **STRICTLY NO "Cards inside Cards" (`div.card > div.card`) nesting**.
- **ZERO ROUNDED CORNERS (`0px` EVERYWHERE)**: Every single element—buttons, inputs, selects, tables, tabs, badges, alerts, modals, image previews, and layout containers—MUST have `border-radius: 0px !important` (`rounded-none`).
- **SWISS CAD / STRUCTURAL BLUEPRINT GRID**:
  - Construct layouts using exposed `1px solid` structural hairlines (`#CBD5E1` in light mode) where adjacent cells share borders (`-ml-px -mt-px`) like a technical engineering drawing block or Bentley/AutoCAD Civil 3D workspace.
  - Section headers must be styled as full-width structural bands (`bg-slate-100 border-y border-slate-300 border-l-4 border-l-sky-600`) with monospace index codes (`[BRG-SEC-01]`, `[CLV-SEC-04]`).
- **FESTIVE YET COMFORTABLE PRECISION COLOR PALETTE**:
  - Shell & Navigation: Deep Gunmetal Slate (`#0F172A`) with `#1E293B` grid hairlines.
  - Workspace Surface: Crisp Drafting Alabaster (`#F8FAFC`) and Pure White (`#FFFFFF`) input cells.
  - Primary Engineering Cobalt (`#0284C7`): Bridge module theme, active states, focus rings.
  - Festive Survey Vermeil / International Orange (`#EA580C`): Culvert module theme, primary submit CTAs, active step markers.
  - Theodolite Emerald (`#059669`): Approved/Complete status & verified uploads.
  - Caution Amber (`#D97706`): Draft / Returned for Correction status.
- **TYPOGRAPHY**: Use `IBM Plex Sans` for UI/labels and `JetBrains Mono` (`tabular-nums`) for all structure codes (`MIS-JBT-19-00017`), chainages (`Ch 194+210`), coordinates, Reduced Levels (`in m PWD`), and dimensions.

======================================================================
2. CORE ARCHITECTURE, ROLES & RHD MASTER HIERARCHY
======================================================================
1. **Roles & Workflow**:
   - `Road Division User`: Creates/edits Bridge & Culvert acquisitions, uploads multi-file attachments, saves as `Draft`, or selects `Send To Bridge Division` and assigns a specific Bridge Design Engineer (e.g., `Abdur Rahman Kaoser [Bridge Design Division-3]`, `Abul Barkot Md. Khurshid Alam [Bridge Cons. & Main.-1]`, `Mohammed Yousuf [Bridge Design Division-2]`, `Md. Golam Mostofa [Bridge Cons. & Main-2]`, `Swapna Begum [Bridge Cons. & Main.-4]`, `eebdd1 [Bridge Design Division-1]`, `Demo Bridge Design User`).
   - `Bridge Design Reviewer`: Reviews assigned forms, downloads the PDF datasheet or ZIP attachment bundle, writes review remarks, and marks submissions `Under Review`, `Returned for Correction`, or `Complete`.
   - `Admin`: Manages RHD Zones, Circles, Divisions, and Road Master lists.
2. **Pre-Seeded RHD Hierarchy (`seed.py`)**:
   - Seed realistic RHD Zones (Dhaka, Chattogram, Comilla, Sylhet, Rajshahi, Rangpur, Khulna, Barishal, Mymensingh, 4-Laning Dhaka-Chattogram Highway Project, 3rd Shitalakhya Bridge Project, Technical Services Dhaka), Circles (Bridge Design Circle Sarak Bhaban, Road Design & Safety Circle, Comilla, Chattogram, Dhaka, Sylhet, etc.), Divisions (Bridge Design Division 1/2/3, Comilla, Chattogram, Dhaka, Sylhet, Cox's Bazar, Feni, etc.), Road Types (`National Highway`, `Regional Highway`, `Zilla Road`, `Others`), and Roads (`N1 Dhaka-Chittagong-Teknaf`, `N2 Dhaka-Sylhet-Tamabil`, `N3`, `N4`, `N5`, `N8`, `R110`, `Z1031`, etc.), plus demo records so the tables are immediately populated.

======================================================================
3. COMPLETE BRIDGE ACQUISITION MODULE (ALL 33+ FIELDS, NO STUBS)
======================================================================
Build both the **Bridge Acquisition List Table** (with PDF datasheet download, Full Details modal/drawer, and ZIP attachment bundle download) and the **Bridge Acquisition Entry Form** containing every field below:
- **Demand Letter**: Multi-file uploader with `Attachment Name` dropdown (`Attachment for ACE`, `Attachment for SE`, `Attachment for EE`) that removes each officer option once uploaded.
- **Proposed Bridge Type** (Text)
- **1) Type of Road** (`National Highway`, `Regional Highway`, `Zilla Road`, `Others`) -> enables **1.1) Others** text input when `Others` is selected.
- **2) Road Number** (Searchable select chained to Type of Road) -> auto-populates **3) Name of the Road** (read-only unless `Others`).
- **4) Name of Road Link with Link No**
- **5) Location of the Bridge with Chainage and GPS** + **5.1) Location with GPS** (`Google Map Link` + `Latitude,Longitude` with automatic regex extraction `/@@(-?\d+\.\d+),(-?\d+\.\d+)/` and bidirectional link builder).
- **6) Name of the Bridge (Structure)**, **7) Name of River/Channel**, **7.1) Width of the Channel (m)**.
- **8) Navigational Clearance Required**: Radio (`BIWTA`, `BWDB`, `Local`, `Railway`, `Others`).
  - `BIWTA`: Class dropdown (`Class-I` -> V:18.30m, H:76.22m; `Class-II` -> V:12.20m, H:76.22m; `Class-III` -> V:7.62m, H:30.48m; `Class-IV` -> V:5.00m, H:20.00m; `Others` -> custom V & H).
  - `Railway`: Type dropdown (`General` -> V:7.25m, H:30.50m; `Others` -> custom).
  - `BWDB` / `Local` / `Others`: Custom V (m), H (m), and Note input.
  - **8.2) Navigational Clearance [Attachment]** multi-file uploader.
- **9.1) Length of the existing bridge** & **9.2) Span arrangement of the existing bridge** (`16+31+16`).
- **20) Reference Benchmark or datum** (`PWD`, `SOB`, `BIWTA`, `BWDB`, `Local`) + Benchmark Location + **20.1) Google Map Link** + **20.2) Latitude,Longitude**. Changing the datum dynamically updates the unit suffix (`in m PWD`, `in m SOB`, etc.) across all R.L. and water level fields!
- **10) Bottom R.L. of the mid span girder of the existing bridge** (`in m <DATUM>`).
- **11) Existing Foundation** (`Open Foundation`, `Pile`, `Well`, `Shal Balli`, `Others`, `Not Applicable`).
- **12) Existing Foundation Layout & ROW Utilities (Gas, Water, Internet, Phone, Electricity)** (`Yes`/`No` -> reveals multi-file upload when `Yes`).
- **13) Highest Flood Level (HFL)**, **14) Standard High Water Level (SHWL)**, **15) Lowest Water Level (LWL)**, **15.1) Highest Tide Level**, **15.2) Lowest Tide Level**, **16) Water level at time of Survey** (all `in m <DATUM>`), **17) Survey Date** (`DD/MM/YYYY`).
- **18) Type of River/Channel** (`Tidal` / `Not Tidal`) -> when `Tidal`, reveals **a) At Dry Season (HTL, LTL)** and **b) At Rainy Season (HTL, LTL)**.
- **19) Direction of stream flow**, **21) Reference point of zero chainage of Road** (+ **21.1 Map Link** & **21.2 Lat,Long**), **22) Existence of any cross road falling at approach** (`Yes, Shown In Drawing`, `Yes, But Not Shown In Drawing`, `Not Applicable`).
- **23) Soil investigation report with sign and seal of EE** (multi-file upload).
- **24) Proposed alignment of bridge** (`New Alignment` / `For Existing Bridge`) -> enables **24.a) For Existing Bridge** (`At the same alignment`, `Upstream`, `Downstream`).
- **25) Site plan of proposed bridge** (multi-file upload) & **26) At least 3 cross sections with road chainage Reduced Level** (multi-file upload).
- **27) Electrification work required?**, **28) Proposed Length of Bridge (m)**, **29) Proposed Span arrangement (m)**, **30) Mid Span Bottom R.L. for proposed Bridge** (`in m <DATUM>`), **31) Hydro-Morphological Study Report** (multi-file upload).
- **Additional Structural Fields**: `Requirement of Pier Protective Work`, `Proposed Maximum Height of Approach Road (m)`, `Ancillary Work (Electrification, Bank Protection Required)`, `Remarks`.
- **Site Photos & Sub-Forms**:
  - **Proposed Structure Site Location Pictures**: 4 directional image slots (`East Side`, `West Side`, `North Side`, `South Side`).
  - **Photos of Existing Structure**: Multi-file upload (Roadside both ends, Channel side both ends, Damaged portions).
  - **BMS Chainage & GPS Info**: Multi-file upload + Map Link + Lat/Lng + Chainage.
  - **Borehole NOS Dynamic Array**: Counter (`0` to `40`) that dynamically adds/removes borehole rows (Borehole No, Chainage, Google Map Link, Lat/Lng, Ground/Bed R.L., Borehole Log file).
  - **32) Status** (`Draft` / `Send To Bridge Division`) & **33) Bridge Design Assignee**.

======================================================================
4. COMPLETE CULVERT ACQUISITION MODULE (ALL FIELDS, NO STUBS)
======================================================================
Build both the **Culvert Acquisition List Table** and **Culvert Acquisition Entry Form** containing:
- **Demand Letter** (ACE / SE / EE deduplicating upload).
- **Location of the Culvert**: `a.1) Zone` (with `+` modal to add new Zone), `a.2) Circles`, `a.3) Divisions`, `b.1) Type of Road`, `b.1.1) Others`, `b.2) Road Number`, `b.3) Name of the Road`, `c) Location with Chainage/LRP and GPS`, `e.1) Google Map Link` & `e.2) Latitude,Longitude`, `f) Flash flood-prone area (Yes/No)` + `f.1) Flash flood description`, `g) Haor area (Yes/No)`, `h) Tidal area (Yes/No)`.
- **2) Reference Benchmark Data**: `2.1) Datum` (`MSL`, `SOB`, `PWD`, `TBM` — dynamically updates unit labels), `2.2) Location`, `2.2.1) Google Map Link`, `2.2.2) Latitude,Longitude`.
- **3) Channel Cross-Section (1.50m interval)** upload, **4.a) Plane Table Survey Map** upload, **4.b) Cross road at approach**, **5) Navigational Clearance (`Yes`/`No` + conditional upload)**.
- **6) Hydrological Data**: `6.1) HFL`, `6.2) LWL`, `6.3) SHWL`, `6.4) Highest Tide Level`, `6.5) Lowest Tide Level` (`in m <DATUM>`).
- **Proposed Site Location Pictures**: 4 directional image slots (`East`, `West`, `North`, `South`).
- **Existing Culvert Information**: Radio selector for `(a) Culvert Type`:
  - `Rectangular Culvert`: `No. of Vent`, `Length of Each Vent (m)`, `Total Length (m)` (**auto-calculated** `No. of Vent * Length of Each Vent`), `Height (m)`, `Width (m)`, `Top Slab Thickness (mm)`, `Side Wall Thickness (mm)`, `Bottom Slab Thickness (mm)`, `Existing Structure Condition`, `Foundation Condition`, `Remarks`.
  - `Pipe Culvert`: `Pipe Outer Dia`, `Thickness of Pipe`, `Pipe Length`, `Remarks`.
  - `Slab Culvert`: `Thickness of Slab`, `Slab Length`, `Slab Width`, `Remarks`.
  - `Arch Culvert`: `Arch Length`, `Arch Width`, `Dia of Arch`, `Arch Thickness`, `Remarks`.
  - `Other`: `Length`, `Width`, `Remarks`.
- **Existing Culvert Photos** upload, **Remarks**, **Extension Diagram** (4 directional image slots: `East`, `West`, `North`, `South`), and **Soil Investigation Report** upload.
- **8) Alignment of Proposed Culvert** (`New Alignment` / `For Existing Culvert` -> `8.a At same alignment / Upstream / Downstream`).
- **Information about Proposed Culvert**: Radio (`New Culvert`, `Widening Culvert`, `Not Applicable`):
  - If `New Culvert` -> `Rectangular Box Culvert` (`No. of Vent`, `Clear/Length of Each Vent (m)`, **auto-calculated** `Total Length (Along Traffic Direction) (m)`, `Clear Height (m)`, `Clear Width (Perpendicular Traffic Direction) (m)`, `Remarks`) OR `Other` (`Length`, `Width`, `Carriage Width`).
  - If `Widening Culvert` -> `Upstream Side`, `Downstream Side`, or `Both Side` (with corresponding `Extension Carriage Width` inputs).
- **Borehole NOS Dynamic Array** (`0` to `40`), **Status**, and **Bridge Division Assignee**.

Deliver the complete, runnable `/backend` and `/frontend` codebases with zero omitted fields and strict adherence to the zero-radius (`rounded-none`), flat engineering blueprint design system.
```
