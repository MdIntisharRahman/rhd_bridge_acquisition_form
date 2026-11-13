# Acquisition of Data for Design of Structures for BMW (ADDS) —  Antigravity Engineering Prompt Suite

## Execution Strategy: Single Prompt vs. 4-Phase Modular Sequence

Because the Roads and Highways Department (RHD) Online Bridge & Culvert Design Data Acquisition System spans **two complex engineering forms (33+ fields each)**, **an 8-tier official RHD institutional chain of command**, **Webmap GIS & Borelog integration (`https://webmap.rhdbridge.com`)**, **PostgreSQL JSON-driven master seeding**, and **automated engineering dossier exports**, a single prompt can sometimes hit LLM output token limits—causing an AI coding agent to stub out form fields with `// TODO: add remaining fields`.

To give you maximum speed without sacrificing engineering completeness, this updated document provides **both**:
1. **Option A — The 4-Phase Modular Prompt Sequence (Recommended for Zero-Truncation Production Quality)**: Four copy-paste prompts you feed into Antigravity sequentially so every single PostgreSQL table, RHD role transition, fluid tab, and form field is written in full.
2. **Option B — The Consolidated Single-Shot Master Prompt (Fast-Track Option)**: A complete, self-contained mega-prompt at the end of this document if you want Antigravity to scaffold and wire the entire stack in one continuous run.

*(Note: A companion `rhd_master_hierarchy_seed.json` file containing all **14 RHD Zones**, **83 Circles**, **202 Divisions**, Road Types, and the complete RHD Role Hierarchy has also been generated for your project repository.)*

---

## Core Design & Architecture Manifesto (Enforced Across All Prompts)

* **Check the Proejcts**: Check the projects of D-System-47-Webmap and D-System-47-RHDCES in the codebase memory for reference. The corresponding projects are now live on `webmap.rhdbridge.com` and `estimate.rhdbridge.com` respectively.
* **Zero AI Slop**: No generic SaaS marketing hero banners, no floating decorative blobs, no gradients, no drop-shadowed cards (`shadow-lg` / `shadow-xl`), and **strictly NO "Cards inside Cards" nesting**. Glassmorphism can be a go to visual, if it does appeal to the view. Check out `webmap.rhdbridge.com` and `estimate.rhdbridge.com` for more. 
* **Zero Rounded Corners (`0px` Border Radius to the Point of Insanity)**: Every UI element—buttons, inputs, selects, fluid tabs, tables, modals, badges, file dropzones, and containers—must enforce `rounded-none` (`border-radius: 0px !important`).
* **Architectural Blueprint / Swiss Engineering Grid**: Layout is constructed like a high-precision CAD / structural engineering instrument panel using exposed `1px solid` hairline structural borders (`border-slate-300`), crisp tabular grid lines, visible section index codes (`[SEC-01]`, `[HYD-06]`), and high-density scannable rows.
* **Fluid Tab-to-Tab Form Navigation**: Separate multi-tab workspace where switching between tabs is instant, state-persistent, and keyboard-accessible (`Alt + Left/Right`), with live completion and validation indicators on every tab header.
* **Festive yet Comfortable Precision Color Palette**:
  * **Canvas & Structural Surfaces**: Crisp Drafting Paper Alabaster (`#F8FAFC`) and Pure White (`#FFFFFF`) panels separated by exposed structural hairlines (`#CBD5E1`), paired with a Deep Gunmetal Slate (`#0F172A`) command header and sidebar.
  * **Primary Engineering Accent**: RHD Cobalt Blueprint Blue (`#0284C7` / `#0369A1`) for active states, primary actions, and structural focus rings.
  * **Festive High-Visibility Engineering Accents**: Survey Vermeil / International Engineering Orange (`#EA580C`) for primary CTA highlights and active tab indicators; Theodolite Emerald (`#059669`) for authorized/approved states; Caution Amber (`#D97706`) for pending endorsements; and Crimson (`#DC2626`) for `Returned for Correction` alerts.
* **Typography**: `Space Grotesk` or `IBM Plex Sans` for crisp structural headers and form labels; `JetBrains Mono` or `IBM Plex Mono` (`tabular-nums`) for all chainages, GPS coordinates, Reduced Levels (`R.L. in m PWD`), span arrangements (`15 + 30 + 15`), and submission codes (`MIS-JBT-19-00017`).

---

## Option A: 4-Phase Modular Prompt Sequence (Recommended) (Accepted)
### Phase 1 Prompt: FastAPI + PostgreSQL Backend, Official RHD Chain of Command, JSON Seed Loader & Global Best-Practice Dossier Exports

Copy and paste the following into Antigravity first:

```text
You are a Principal Full-Stack Systems Architect building the modernized "Online Bridge & Culvert Design Data Acquisition System (OBDDAS / OBCDAS)" for the Bridge Design Circle, Roads and Highways Department (RHD), Bangladesh.

We are scrapping a legacy jQuery/PHP/AdminLTE application and building a rock-solid, modern full-stack application using:
- **Backend**: Python FastAPI, SQLAlchemy 2.0 + Alembic with **PostgreSQL** (`asyncpg` / `psycopg2-binary`), Pydantic v2, WeasyPrint/ReportLab for ISO-style Engineering Datasheet PDF generation, `openpyxl` for Excel/CSV schedule export, GeoJSON export for GIS, and streaming `.zip` dossier packaging.
- **Frontend** (built in Phases 2–4): React (JavaScript, Vite), Tailwind CSS, Lucide Icons, React Hook Form.

### PHASE 1 OBJECTIVE
Build the complete, production-ready `/backend` service backed by **PostgreSQL** with zero placeholder stubs, complete database models, external JSON master-data seeding (`rhd_master_hierarchy_seed.json`), full RHD institutional workflow state machine, Webmap GIS/Borelog integration hooks (`https://webmap.rhdbridge.com`), and global best-practice engineering export endpoints.

### 1. TERMINOLOGY & GOVERNANCE ROLES (STRICT REQUIREMENT)
**NEVER use the word "Admin" anywhere in the codebase, database, UI, or API.** It is replaced by:
1. **`SUPREME` ("Supreme")**: A strictly enforced **singleton user account** (exact database constraint: only 1 user in the system can ever hold the `SUPREME` role). `Supreme` possesses unrestricted system-wide authority, can override any workflow state, inspect system audit logs, and has a dedicated **Supreme Background Task & Operations Console** to trigger/monitor background jobs (e.g., PostgreSQL backups, JSON hierarchy re-syncs, bulk Webmap GIS synchronization, orphan file cleanup, and batch PDF/ZIP regeneration).
2. **`WEBMASTER` ("Webmaster")**: Replaces "Admin". Manages user accounts, role assignments, office postings, and live CRUD updates to the RHD Master Hierarchy (Zones, Circles, Divisions, Roads) with ability to import/export the master `rhd_master_hierarchy_seed.json` schema.

### 2. OFFICIAL RHD INSTITUTIONAL CHAIN OF COMMAND & STATUS LIFECYCLE
Implement the exact RHD multi-tier routing and endorsement state machine, recording an immutable `WorkflowAuditLog` entry (actor, role, office, timestamp, action, digital endorsement note) at every transition:
- **Stage 1 — Field Initiation (`DRAFT_FIELD`)**:
  - Initiated by **`FIELD_SAE`** (*Sub-Assistant Engineer, Field Division*) or **`FIELD_SDE`** (*Sub-Divisional Engineer, Field Division*). They fill out the Bridge or Culvert Acquisition Form, attach survey files/photos, link/enter Borelog data, and forward to the Field Executive Engineer (`PENDING_FIELD_EE_AUTH`).
- **Stage 2 — Field Division Authorization (`FORWARDED_TO_FIELD_SE`)**:
  - **`FIELD_EE`** (*Executive Engineer, Field Division*) reviews, attaches the EE Demand Letter & signed Soil Investigation Report, and **Authorizes** the form, forwarding it to the Superintending Engineer (Field Circle).
- **Stage 3 — Field Circle Endorsement (`FORWARDED_TO_FIELD_ACE`)**:
  - **`FIELD_SE`** (*Superintending Engineer, Field Circle*) endorses (attaches SE Demand Letter) and forwards to the Additional Chief Engineer (Field Zone).
- **Stage 4 — Field Zone Endorsement (`FORWARDED_TO_BMW_ACE`)**:
  - **`FIELD_ACE`** (*Additional Chief Engineer, Field Zone*) endorses (attaches ACE Demand Letter) and forwards to the Additional Chief Engineer (Bridge Management Wing).
- **Stage 5 — Bridge Management Wing Routing (`FORWARDED_TO_BDC_SE`)**:
  - **`BMW_ACE`** (*Additional Chief Engineer, Bridge Management Wing*) routes the dossier to the Superintending Engineer (Bridge Design Circle).
- **Stage 6 — Bridge Design Circle Assignment (`ASSIGNED_TO_BDD_EE`)**:
  - **`BDC_SE`** (*Superintending Engineer, Bridge Design Circle*) assigns the acquisition file to a specific **`BDD_EE`** (*Executive Engineer, Bridge Design Division - 1, 2, or 3*).
- **Stage 7 — Design Division Review & SDE Assignment (`ASSIGNED_TO_BDD_SDE`)**:
  - **`BDD_EE`** (*Executive Engineer, Bridge Design Division - 1, 2, or 3*) reviews the engineering submission and assigns it to a **`BDD_SDE`** (*Sub-Divisional Engineer, Design Division - 1, 2, or 3*).
- **Stage 8 — Return for Correction / Additional Field Data (`RETURNED_FOR_CORRECTION`) OR Final Design Verification (`DESIGN_APPROVED_COMPLETE`)**:
  - Either **`BDD_EE`** (*Executive Engineer, Bridge Design Division 1/2/3*) or **`BDD_SDE`** (*Sub-Divisional Engineer, Design Division 1/2/3*) can decide based on field conditions to **Resend / Return the form for Correction or Additional Data** (flagging specific sections/fields with technical remarks back to the Field Division SAE/SDE/EE), OR mark the acquisition **Design Data Verified & Complete**.

### 3. POSTGRESQL MASTER DATA SCHEMA & DYNAMIC JSON SEEDING (`rhd_master_hierarchy_seed.json`)
- Store RHD master hierarchy in PostgreSQL tables (`rhd_zones`, `rhd_circles`, `rhd_divisions`, `road_types`, `roads`) with a general, extensible schema (`id`, `code`, `name`, `parent_id`, `is_active`, `metadata_json`, `updated_at`) so Webmasters or Supreme can modify them anytime via UI or JSON upload.
- On startup (or via Webmaster/Supreme trigger), seed PostgreSQL from `rhd_master_hierarchy_seed.json` (containing all 14 RHD Zones, 83 Circles, 202 Divisions, Road Types `National Highway`/`Regional Highway`/`Zilla Road`/`Others`, and sample Roads).
- Seed test users for every single role in the chain of command (`supreme`, `webmaster`, `field_sae`, `field_sde`, `field_ee`, `field_se`, `field_ace`, `bmw_ace`, `bdc_se`, `bdd_ee_1`, `bdd_sde_1`) so the entire approval chain can be tested immediately.

### 4. COMPLETE BRIDGE ACQUISITION MODEL (`BridgeAcquisition`)
Implement every field required by the RHD Bridge Acquisition specification (no omissions):
- Metadata: `id`, `code` (`MIS-BRG-YYYY-XXXXX`), `workflow_status`, `current_holder_role`, `current_assignee_user_id`, `created_by_id`, `zone_id`, `circle_id`, `division_id`, `return_reason_notes`, `created_at`, `updated_at`.
- Road & Location (Fields 1–7):
  - `proposed_bridge_type`, `road_type_id` (1), `road_type_others_name` (1.1), `road_id` (2), `road_name` (3), `road_link_name_no` (4), `location_chainage_gps_text` (5), `location_google_map_link` (5.1), `location_lat_lng`, `bridge_name` (6), `river_channel_name` (7), `channel_width_m` (7.1).
- Navigational Clearance (Field 8):
  - `nav_clearance_authority` (`BIWTA`, `BWDB`, `Local`, `Railway`, `Others`), `nav_clearance_class` (BIWTA `Class-I` [V:18.30m, H:76.22m], `Class-II` [V:12.20m, H:76.22m], `Class-III` [V:7.62m, H:30.48m], `Class-IV` [V:5.00m, H:20.00m], `Others`; Railway `General` [V:7.25m, H:30.50m], `Others`), `nav_vertical_clearance_m`, `nav_horizontal_clearance_m`, `nav_others_note`.
- Existing Bridge & Reference Datum (Fields 9–12, 20):
  - `existing_bridge_length` (9.1), `existing_span_arrangement` (9.2), `reference_datum_type` (20: `PWD`, `SOB`, `BIWTA`, `BWDB`, `Local`, `MSL`, `TBM` — dynamically sets unit suffix `in m <DATUM>`), `reference_benchmark_location` (20), `reference_benchmark_map_link` (20.1), `reference_benchmark_lat_lng` (20.2), `existing_mid_span_girder_bottom_rl` (10), `existing_foundation_type` (11: `Open Foundation`, `Pile`, `Well`, `Shal Balli`, `Others`, `Not Applicable`), `has_existing_foundation_utility_layout` (12: `Yes`/`No`).
- Hydrological & River Survey Data (Fields 13–19, 21, 22):
  - `highest_flood_level_hfl` (13), `standard_high_water_level_shwl` (14), `lowest_water_level_lwl` (15), `highest_tide_level_htl` (15.1), `lowest_tide_level_ltl` (15.2), `survey_time_water_level` (16), `survey_date` (17), `river_tidal_type` (18: `Tidal`/`Not Tidal`), `tidal_dry_season_htl`, `tidal_dry_season_ltl`, `tidal_rainy_season_htl`, `tidal_rainy_season_ltl` (18.a/b), `stream_flow_direction` (19), `zero_chainage_reference_point` (21), `zero_chainage_map_link` (21.1), `zero_chainage_lat_lng` (21.2), `cross_road_at_approach` (22).
- Proposed Bridge Design & Ancillary Works (Fields 24, 27–30 & Structural Extras):
  - `proposed_alignment` (24: `New Alignment` / `For Existing Bridge`), `proposed_existing_alignment_offset` (24.a: `At the same alignment`, `Upstream`, `Downstream`), `electrification_work_required` (27), `proposed_bridge_length_m` (28), `proposed_span_arrangement_m` (29), `proposed_mid_span_bottom_rl` (30), `pier_protective_work_required`, `proposed_max_height_approach_road`, `ancillary_work_required`, `remarks`, `bms_chainage`, `bms_google_map_link`, `bms_lat_lng`, `total_borehole_count` (0..40).

### 5. COMPLETE CULVERT ACQUISITION MODEL (`CulvertAcquisition`)
- Metadata & Hierarchy: `id`, `code` (`MIS-CLV-YYYY-XXXXX`), `workflow_status`, `current_holder_role`, `current_assignee_user_id`, `zone_id` (a.1), `circle_id` (a.2), `division_id` (a.3), `road_type_id` (b.1), `road_type_others_name` (b.1.1), `road_id` (b.2), `road_name` (b.3), `culvert_name`, `location_chainage_lrp_gps` (c), `location_google_map_link` (e.1), `location_lat_lng` (e.2).
- Environmental Flags: `is_flash_flood_prone` (f), `flash_flood_description` (f.1), `is_haor_area` (g), `is_tidal_area` (h).
- Reference Benchmark (Section 2): `reference_datum_type` (2.1: `MSL`, `SOB`, `PWD`, `TBM`), `reference_benchmark_location` (2.2), `reference_benchmark_map_link` (2.2.1), `reference_benchmark_lat_lng` (2.2.2).
- Cross Road & Navigational Clearance: `cross_road_at_approach` (4.b), `nav_clearance_required` (5: `Yes`/`No`).
- Hydrological Data (Section 6): `highest_flood_level_hfl` (6.1), `lowest_water_level_lwl` (6.2), `standard_high_water_level_shwl` (6.3), `highest_tide_level_htl` (6.4), `lowest_tide_level_ltl` (6.5).
- Existing Culvert Geometry (`existing_culvert_type`: `Rectangular Culvert`, `Pipe Culvert`, `Slab Culvert`, `Arch Culvert`, `Other`, `None`) with all type-specific dimension columns (including auto-calculated `total_length_m = no_of_vent * length_of_each_vent_m` for Rectangular) + `existing_culvert_general_note`.
- Proposed Culvert Alignment & Geometry: `proposed_alignment` (8), `proposed_existing_alignment_offset` (8.a), `proposed_culvert_category` (`New Culvert`, `Widening Culvert`, `Not Applicable`), `proposed_new_sub_type` (`Rectangular Box Culvert` vs `Other`), `proposed_widening_side` (`Upstream Side`, `Downstream Side`, `Both Side`), and all corresponding dimension fields.

### 6. WEBMAP (`https://webmap.rhdbridge.com`) & BORELOG INTEGRATION
- Provide REST endpoints (`/api/webmap/sync-borelogs`, `/api/webmap/features.geojson`) and a JSONB/relational `BoreholeLog` schema designed to accept the exact JSX/HTML/CSS borelog payload used on `https://webmap.rhdbridge.com` (Borehole ID, Structure Code, Chainage, Lat/Lng, Ground R.L., Water Table depth, Stratum layers with Depth From/To, Soil Classification, SPT N-values, Core Recovery, and Lab parameters) so borelogs created or viewed in OBDDAS and `webmap.rhdbridge.com` share a unified data contract.

### 7. GLOBAL BEST-PRACTICE ENGINEERING DOSSIER EXPORTS
Implement 4 industry-standard engineering export endpoints for every Bridge and Culvert record:
1. **ISO-Standard Engineering Datasheet PDF (`/export-pdf`)**: A crisp, print-ready A4 technical specification report with RHD header block, QR link to `https://webmap.rhdbridge.com`, all 33+ structured parameters grouped by engineering discipline, embedded directional site photos, and the signed Chain-of-Command Endorsement Stamp table.
2. **Structured Dossier Archive ZIP (`/export-zip`)**: Streams a `.zip` package organized into clean engineering subfolders: `/01_Datasheet_PDF/`, `/02_Demand_Letters_ACE_SE_EE/`, `/03_Soil_and_Borelog_Reports/`, `/04_Cross_Sections_and_Site_Plans/`, `/05_Hydro_Morphological_and_Nav_Clearance/`, and `/06_Directional_Site_and_Extension_Photos/`.
3. **Tabular Engineering Schedule (`.xlsx` / `.csv` via `/export-excel`)**: Exports multi-sheet workbook (Summary Parameters, Hydrological Levels, Borehole SPT Logs, Approval Audit Trail) for structural analysis software import.
4. **GIS GeoJSON Feature Feed (`/api/webmap/geojson`)**: Exposes live GeoJSON points with properties and status badges for direct layer consumption by `https://webmap.rhdbridge.com`.
```

---

### Phase 2 Prompt: Zero-Radius Swiss Engineering UI Shell, Role Command Portals & Registries

Once Phase 1 is complete, copy and paste Phase 2 into Antigravity:

```text
Now build Phase 2 in `/frontend` (React + Vite + JavaScript + Tailwind CSS + Lucide Icons) connected to the FastAPI + PostgreSQL backend.

### STRICT VISUAL & ANTI-AI-SLOP DIRECTIVES (MANDATORY)
1. **NO AI SLOP & NO "CARDS INSIDE CARDS"**: Never nest card containers inside other cards (`div.card > div.card`). Never use SaaS gradients, glassmorphism, floating blobs, or soft drop-shadows.
2. **ZERO ROUNDED CORNERS (`0px` TO THE POINT OF INSANITY)**: Every single element in the application—buttons, inputs, selects, fluid tabs, tables, badges, modals, dropzones, and layout panes—MUST use `rounded-none` (`border-radius: 0px !important`). Enforce `* { border-radius: 0px !important; }` in global CSS.
3. **SWISS CAD / BLUEPRINT GRID AESTHETIC**:
   - Design the interface like a precision civil/structural engineering instrument panel (inspired by Bentley MicroStation, Autodesk Civil 3D, and Swiss typographic grids).
   - Use exposed `1px solid` structural borders (`border-slate-300`) where adjacent cells share hairline borders (`-ml-px -mt-px`) rather than floating boxes.
   - Section headers must look like technical drawing title blocks: uppercase tracking, monospace index tags (`[SEC-01]`, `[HYD-06]`), left accent bars (`border-l-4 border-sky-600` or `border-l-4 border-orange-600`), and high-contrast slate backgrounds (`bg-slate-100`).
4. **FESTIVE YET COMFORTABLE ENGINEERING COLOR PALETTE**:
   - Primary Structural Header & Sidebar: Deep Gunmetal (`#0F172A`) with crisp slate hairlines (`#1E293B`).
   - Workspace Canvas: Drafting Paper Alabaster (`#F8FAFC`) with pure white (`#FFFFFF`) data cells.
   - Engineering Cobalt (`#0284C7`): Active navigation, Bridge module theme, and input focus borders.
   - Festive Survey Orange (`#EA580C`): Culvert module theme, primary action highlights, and active tab indicators.
   - Theodolite Emerald (`#059669`): Authorized/Verified status badges and upload bars.
   - Caution Amber (`#D97706`) & Structural Crimson (`#DC2626`): Pending Endorsement & `Returned for Correction` alerts.
5. **TYPOGRAPHY**: Load `IBM Plex Sans` (UI & labels) and `JetBrains Mono` (`tabular-nums` for all codes, chainages, coordinates, R.L. elevations, dimensions, and live clock).

### PHASE 2 DELIVERABLES
1. **Top Command Bar & Technical Sidebar**:
   - Displays `RHD // BRIDGE DESIGN CIRCLE — DATA ACQUISITION SYSTEM`, active officer's Role & Office badge (e.g., `Executive Engineer — Bridge Design Division-1` or `Supreme`), instant **Role Switcher** (allowing one-click testing across all 11 RHD roles: `Supreme`, `Webmaster`, `Field SAE`, `Field SDE`, `Field EE`, `Field SE`, `Field ACE`, `Bridge Mgmt Wing ACE`, `Bridge Design Circle SE`, `Bridge Design Division EE`, `Design Division SDE`), direct launch link to **`https://webmap.rhdbridge.com`**, and live engineering clock.
2. **Role-Specific Command Dashboards**:
   - **Field Division View (`SAE` / `SDE` / `EE`)**: Shows drafts in preparation, forms awaiting Field EE authorization, and any forms **Returned for Correction** by Bridge Design Division with highlighted reviewer remarks.
   - **Endorsement Pipeline View (`Field SE` -> `Field ACE` -> `BMW ACE` -> `BDC SE`)**: Clean queue of incoming authorized dossiers awaiting circle/zone endorsement or routing to Bridge Design Divisions 1, 2, or 3.
   - **Bridge Design Circle / Reviewer Portal (`BDC SE`, `BDD EE 1/2/3`, `BDD SDE 1/2/3`)**: Dedicated engineering review workbench showing assigned Bridge and Culvert dossiers, chain-of-command endorsement history, side-by-side attachment/drawing viewer, and action bar to **Assign to SDE**, **Return for Correction / Request Additional Field Data** (with field-level comment tags), or **Approve & Mark Complete**.
   - **Webmaster Console (`WEBMASTER`)**: Live manager for RHD Zones, Circles, Divisions, and Roads (with one-click JSON seed import/export) and User/Office assignment manager.
   - **Supreme Operations Console (`SUPREME` — Singleton Role)**: System-wide control center with background task runners (DB backup, Webmap GIS sync, bulk dossier rebuild, audit log inspector) and emergency state override tools.
3. **Acquisition Registries (Bridge List & Culvert List)**:
   - High-density engineering data tables with multi-column filtering and the **Global Best-Practice Export Suite** per row:
     1. **Engineering Datasheet PDF** (`/export-pdf`)
     2. **Structured Dossier ZIP** (`/export-zip`)
     3. **Excel Engineering Schedule** (`/export-excel`)
     4. **Open in RHD Webmap** (deep-links coordinates & structure code to `https://webmap.rhdbridge.com/?lat=...&lng=...&code=...`)
```

---

### Phase 3 Prompt: Fluid Tab-to-Tab Bridge Acquisition Workspace, Webmap GIS Sync & Plug-in Borelog Module

Once Phase 2 is ready, copy and paste Phase 3 into Antigravity:

```text
Now build Phase 3: The complete **Bridge Acquisition Entry & Review Workspace** (`/bridge_acquisition_form`) with **fluid tab-to-tab navigation**, seamless **`https://webmap.rhdbridge.com`** integration, and your reusable **Borelog JSX/HTML/CSS component slot**.

### 1. FLUID TAB-TO-TAB ARCHITECTURE (NO LONG CLUTTERED SCROLL, NO NESTED CARDS)
- Organize the 33+ Bridge fields into **6 Fluid Engineering Tabs** along a sharp, zero-radius top technical tab bar (`[TAB-01] Admin & Location`, `[TAB-02] Navigational & Existing Bridge`, `[TAB-03] Hydrological & River Survey`, `[TAB-04] Proposed Design & Alignment`, `[TAB-05] Drawings, Reports & Site Photos`, `[TAB-06] Webmap GIS & Borelog Form`).
- Switching between tabs must be instantaneous (client-side state preserved via `react-hook-form` across all tabs without page reloads), with smooth keyboard navigation (`Next Tab ->` / `<- Prev Tab`), per-tab completion counters (e.g., `8/8 Fields Valid`), and red alert indicators if a Bridge Design Engineer flagged a specific tab during `Return for Correction`.
- Maintain a persistent **Bottom Engineering Command Strip** visible across all tabs showing: Active Reference Datum (`DATUM: m PWD`), Current Workflow Stage badge, `Save Draft`, and role-appropriate Chain-of-Command action buttons (`Authorize & Forward to SE`, `Endorse & Forward`, `Assign to Design Division`, `Return for Correction`, or `Approve Design Data`).

### 2. SEAMLESS WEBMAP (`https://webmap.rhdbridge.com`) & BORELOG JSX INTEGRATION
- **Bidirectional Webmap Sync (`<WebmapCoordinateBridge />`)**:
  - For all GPS fields (Bridge Location 5.1, Reference Benchmark 20.1, Zero Chainage 21.1, BMS Chainage, and Boreholes), support pasting a Google Maps URL OR a `https://webmap.rhdbridge.com` URL to auto-extract `Latitude, Longitude` and `Chainage`.
  - Include an embedded interactive GIS split-pane / modal that can either load an interactive Leaflet/OpenStreetMap engineering base layer (with RHD road/bridge GeoJSON overlay) OR open/communicate with `https://webmap.rhdbridge.com` via URL query parameters and `window.postMessage` so clicking a point on the webmap auto-fills the form coordinates!
- **Dedicated Borelog JSX/HTML/CSS Integration (`[TAB-06]`)**:
  - Structure the Borehole section (`0` to `40` boreholes) as a clean, modular `<RhdWebmapBorelogForm />` component isolated in `/frontend/src/components/borelog/RhdWebmapBorelogForm.jsx` (and `.css`) so the user can drop in their existing JSX/HTML/CSS borelog form from `https://webmap.rhdbridge.com` directly without refactoring!
  - Out of the box, provide a full, compatible implementation of `<RhdWebmapBorelogForm />` supporting: Total Borehole counter (`0..40`), per-borehole tab selector (`BH-01`, `BH-02`...), Borehole GPS & Webmap link, Ground/Bed R.L., Water Table, dynamic soil stratum rows (Depth From/To, Soil Description, USCS/AASHTO symbol, Hatch pattern preview, SPT N-value blow counts `N1/N2/N3`, Core Recovery %, RQD %), and Borelog PDF/Image attachment.

### 3. IMPLEMENT ALL 33+ BRIDGE FIELDS ACROSS THE FLUID TABS
- **[TAB-01] Demand Letters & Road Identification**:
  - **Demand Letter Upload**: Officer dropdown (`Attachment for ACE`, `Attachment for SE`, `Attachment for EE`) that removes each uploaded officer option from the remaining list (`remove_demand()` logic).
  - `a.1) Zone`, `a.2) Circle`, `a.3) Division` (auto-linked to user's division or selectable, with Webmaster `+` quick-add modal).
  - `Proposed Bridge Type`, `1) Type of Road` (`National Highway`, `Regional Highway`, `Zilla Road`, `Others` -> `1.1 Others`), `2) Road Number` (searchable select), `3) Name of the Road` (auto-filled), `4) Name of Road Link with Link No`, `5) Location of the Bridge with Chainage and GPS`, `5.1) Location GPS & Webmap/Google Map Link`, `6) Name of the Bridge (Structure)`, `7) Name of River/Channel`, `7.1) Width of the Channel (m)`.
- **[TAB-02] Navigational Clearance & Existing Bridge/Foundation**:
  - `8) Navigational Clearance Required` radio (`BIWTA`, `BWDB`, `Local`, `Railway`, `Others`):
    - `BIWTA`: Class selector (`Class-I` -> `V: 18.30m, H: 76.22m`; `Class-II` -> `V: 12.20m, H: 76.22m`; `Class-III` -> `V: 7.62m, H: 30.48m`; `Class-IV` -> `V: 5.00m, H: 20.00m`; `Others` -> custom).
    - `Railway`: Type selector (`General` -> `V: 7.25m, H: 30.50m`; `Others` -> custom).
    - `BWDB` / `Local` / `Others`: Custom V (m), H (m), and Note input.
  - `8.2) Navigational Clearance [Attachment]` multi-file slot.
  - `9.1) Length of the existing bridge`, `9.2) Span arrangement of the existing bridge` (`16+31+16`).
  - `20) Reference Benchmark or datum` (`PWD`, `SOB`, `BIWTA`, `BWDB`, `Local`) + Benchmark Location + `20.1 Map Link` & `20.2 Lat,Long`. **Changing this datum updates the unit suffix (`in m PWD`, `in m SOB`, etc.) across all R.L. inputs in real time!**
  - `10) Bottom R.L. of mid span girder of existing bridge` (`in m <DATUM>`), `11) Existing Foundation` (`Open Foundation`, `Pile`, `Well`, `Shal Balli`, `Others`, `Not Applicable`), `12) Existing Foundation Layout & ROW Utilities (Gas, Water, Internet, Phone, Electricity)` (`Yes`/`No` -> conditional multi-file upload).
- **[TAB-03] Hydrological, Tidal & Approach Survey Data**:
  - `13) Highest Flood Level (HFL)`, `14) Standard High Water Level (SHWL)`, `15) Lowest Water Level (LWL)`, `15.1) Highest Tide Level`, `15.2) Lowest Tide Level`, `16) Water level at time of Survey` (all `in m <DATUM>`), `17) Survey Date` (`DD/MM/YYYY`).
  - `18) Type of River/Channel` (`Tidal` / `Not Tidal`) -> when `Tidal`, reveals **a) At Dry Season (`HTL`, `LTL`)** and **b) At Rainy Season (`HTL`, `LTL`)**.
  - `19) Direction of stream flow`, `21) Reference point of zero chainage of Road` (+ `21.1 Map Link` & `21.2 Lat,Long`), `22) Existence of any cross road falling at approach` (`Yes, Shown In Drawing`, `Yes, But Not Shown In Drawing`, `Not Applicable`).
- **[TAB-04] Proposed Bridge Design, Alignment & Ancillary Works**:
  - `24) Proposed alignment of bridge` (`New Alignment` / `For Existing Bridge`) -> enables `24.a) For Existing Bridge` (`At the same alignment`, `Upstream`, `Downstream`).
  - `27) Electrification work required?` (`Yes`/`No`), `28) Proposed Length of Bridge (m)`, `29) Proposed Span arrangement (m)`, `30) Mid Span Bottom R.L. for proposed Bridge` (`in m <DATUM>`).
  - `Requirement of Pier Protective Work`, `Proposed Maximum Height of Approach Road (m)`, `Ancillary Work (Electrification, Bank Protection Required)`, `Remarks (if any)`.
  - **BMS Chainage & GPS Info**: `Chainage`, `Google Map / Webmap Link`, `Latitude,Longitude`, and `BMS Attachment`.
- **[TAB-05] Engineering Reports, Cross-Sections & Directional Site Photos**:
  - `23) Soil investigation report with sign and seal of EE` (multi-file upload)
  - `25) Site plan of proposed bridge (showing Hat-Bazar, Town, etc.)` (multi-file upload)
  - `26) At least 3 cross sections with road chainage Reduced Level (CL, 10m U/S, 10m D/S; 3m interval <=100m width, 5m interval >100m width)` (multi-file upload)
  - `31) Hydro-Morphological Study Report` (multi-file upload)
  - **Proposed Structure Site Location Pictures**: 4-column flat grid (`East Side`, `West Side`, `North Side`, `South Side`) with instant image preview.
  - **Photos of Existing Structure**: Multi-file upload (`Roadside both ends`, `Channel side both ends`, `Damaged portions`).
- **[TAB-06] Webmap GIS & Borelog Integration (`0–40` Boreholes)**:
  - Interactive `<RhdWebmapBorelogForm />` + live deep-link synchronization with `https://webmap.rhdbridge.com`.
```

---

### Phase 4 Prompt: Fluid Tab-to-Tab Culvert Acquisition Workspace, Reviewer Diff/Return Workflow & Supreme/Webmaster Consoles

Once Phase 3 is complete, copy and paste Phase 4 into Antigravity:

```text
Now complete Phase 4: Build the **Fluid Tab-to-Tab Culvert Acquisition Workspace** (`/culvert_acquisition_form`), complete the **8-Stage Chain-of-Command Endorsement & Return-for-Correction UI**, and finalize the **Webmaster** and **Supreme** management consoles.

### 1. FLUID TAB-TO-TAB CULVERT ACQUISITION WORKSPACE (`/culvert_acquisition_form`)
Use the exact same zero-radius (`rounded-none`), no-nested-cards Swiss engineering blueprint aesthetic, accented with Festive Survey Orange (`#EA580C`). Organize into **6 Fluid Tabs**:
- **[CLV-TAB-01] Demand Letter, Hierarchy & Flood/Haor Location**:
  - Demand Letter upload with ACE / SE / EE officer deduplication.
  - `a.1) Zone`, `a.2) Circles`, `a.3) Divisions`, `b.1) Type of Road`, `b.1.1) Others`, `b.2) Road Number`, `b.3) Name of the Road`, `c) Location of the Culvert with Chainage/LRP and GPS`, `e.1) Google Map / Webmap Link` & `e.2) Latitude,Longitude`.
  - Environmental & Flood Flags: `f) Flash flood-prone area (Yes/No)` -> conditionally enables `f.1) Describe the nature of the flash flood`; `g) Haor area (Yes/No)`; `h) Tidal area (Yes/No)`.
- **[CLV-TAB-02] Benchmark, Plane Table, Cross-Section & Hydrological Data**:
  - `2.1) Reference Benchmark or datum` (`MSL`, `SOB`, `PWD`, `TBM` — dynamically updates `.acquisitionReferenceUniteLabel` `in m <DATUM>` across all water level inputs), `2.2) Location of Benchmark`, `2.2.1) Map Link`, `2.2.2) Latitude,Longitude`.
  - `3) Cross-section of the channel with chainage (at least one cross-section at centerline with R.L. at 1.50 m interval)` multi-file upload.
  - `4.a) Plane table survey map of proposed culvert location` multi-file upload + `4.b) Existence of any cross road falling at approach`.
  - `5) Navigational Clearance` (`Yes`/`No` -> conditional file upload).
  - `6) Hydrological Data`: `6.1) Highest Flood Level`, `6.2) Lowest Water Level`, `6.3) Standard High Water Level`, `6.4) Highest Tide Level`, `6.5) Lowest Tide Level` (`in m <DATUM>`).
- **[CLV-TAB-03] Existing Culvert Geometry & Condition**:
  - `(a) Culvert Type` radio selector (`Rectangular Culvert`, `Pipe Culvert`, `Slab Culvert`, `Arch Culvert`, `Other`, `None`):
    - `Rectangular Culvert`: `No. of Vent`, `Length of Each Vent (m)`, **auto-calculated** `Total Length (m) = No. of Vent * Length of Each Vent`, `Height (m)`, `Width (m)`, `Top Slab Thickness (mm)`, `Side Wall Thickness (mm)`, `Bottom Slab Thickness (mm)`, `Existing Structure Condition`, `Foundation Condition`, `Remarks`.
    - `Pipe Culvert`: `Pipe Outer Dia`, `Thickness of Pipe`, `Pipe Length`, `Remarks`.
    - `Slab Culvert`: `Thickness of Slab`, `Slab Length`, `Slab Width`, `Remarks`.
    - `Arch Culvert`: `Arch Length`, `Arch Width`, `Dia of Arch`, `Arch Thickness`, `Remarks`.
    - `Other`: `Length`, `Width`, `Remarks`.
  - `(c) General Remarks` textarea.
- **[CLV-TAB-04] Proposed Culvert Alignment & Geometry**:
  - `8) Alignment of proposed culvert` (`New Alignment` / `For Existing Culvert`) -> enables `8.a) For Existing Culvert` (`At the same alignment`, `Upstream`, `Downstream`).
  - **Proposed Culvert Type** radio (`New Culvert`, `Widening Culvert`, `Not Applicable`):
    - If `New Culvert` -> sub-selector (`Rectangular Box Culvert` vs `Other`):
      - `Rectangular Box Culvert`: `No. of Vent`, `Clear/Length of Each Vent (m)`, **auto-calculated** `Total Length (Along Traffic Direction) (m)`, `Clear Height (m)`, `Clear Width (Perpendicular Traffic Direction) (m)`, `Remarks`.
      - `Other`: `Length (Along Traffic Direction)`, `Width (Perpendicular Traffic Direction)`, `Carriage Width`.
    - If `Widening Culvert` -> sub-selector (`Upstream Side`, `Downstream Side`, `Both Side`) revealing corresponding `Extension Carriage Width` inputs.
- **[CLV-TAB-05] Site Photos, Extension Diagrams & Soil Report**:
  - **Proposed Structure Site Location Pictures**: 4 directional image slots (`East`, `West`, `North`, `South`).
  - **Existing Culvert Photos**: Multi-file upload (`Roadside both ends`, `Channel side both ends`, `Damaged portions`).
  - **Extension Diagram**: 4 directional image slots (`East`, `West`, `North`, `South`).
  - **Soil Investigation Report with sign and seal of EE**: Multi-file upload.
- **[CLV-TAB-06] Webmap GIS & Borelog Integration (`0–40` Boreholes)**:
  - Embeds the shared `<RhdWebmapBorelogForm />` component synced with `https://webmap.rhdbridge.com`.

### 2. CHAIN-OF-COMMAND STEPPER & DESIGN DIVISION "RETURN FOR CORRECTION" WORKFLOW
- At the top of every dossier in the **Bridge Design Circle / Reviewer Portal**, render a sharp, horizontal **8-Step Institutional Chain-of-Command Tracker**:
  `[1. Field SAE/SDE] -> [2. Field EE Auth] -> [3. Field Circle SE] -> [4. Field Zone ACE] -> [5. Bridge Mgmt Wing ACE] -> [6. Bridge Design Circle SE] -> [7. Design Div EE (1/2/3)] -> [8. Design Div SDE (1/2/3)]`
- When logged in as **Executive Engineer (Bridge Design Division 1/2/3)** or **Sub-Divisional Engineer (Design Division 1/2/3)**, provide a dedicated **"Return for Correction / Request Additional Field Data"** modal that lets the reviewer check specific tabs/fields requiring field re-verification, attach technical instructions, and route the dossier back to the Field Division with a high-visibility Crimson status banner.
```

---

## Option B: Consolidated Single-Shot Master Prompt (All-in-One Fast-Track)

If you want to paste a **single comprehensive prompt** into Antigravity to generate the entire project in one continuous pass, copy the block below:

```text
You are a Principal Full-Stack Systems Architect and Civil Engineering UI Designer. Build a complete, production-ready web application: the modernized **"Online Bridge & Culvert Design Data Acquisition System (OBDDAS / OBCDAS)"** for the Bridge Design Circle, Roads and Highways Department (RHD), Bangladesh.

### TECH STACK
- **Frontend**: React (JavaScript, Vite), Tailwind CSS, Lucide Icons, React Hook Form.
- **Backend**: Python FastAPI, SQLAlchemy 2.0 + **PostgreSQL** (`psycopg2-binary` / `asyncpg`, with graceful fallback if local PG env is not yet started), Pydantic v2, PDF Engineering Datasheet Generator, Excel Schedule Exporter (`openpyxl`), GeoJSON GIS feed, and streaming `.zip` Dossier Packager.
- **GIS & Borelog Ecosystem Integration**: Seamless coordinate, map layer, and Borelog form integration with **`https://webmap.rhdbridge.com`**.

======================================================================
1. STRICT VISUAL & ANTI-AI-SLOP DESIGN MANIFESTO (NON-NEGOTIABLE)
======================================================================
- **ZERO AI SLOP**: Absolutely NO generic SaaS landing pages, NO gradients, NO glassmorphism, NO floating decorative blobs, NO soft drop shadows (`shadow-lg`/`shadow-xl`), and **STRICTLY NO "Cards inside Cards" (`div.card > div.card`) nesting**.
- **ZERO ROUNDED CORNERS (`0px` TO THE POINT OF INSANITY)**: Every single element—buttons, inputs, selects, fluid tabs, tables, badges, alerts, modals, image previews, and layout containers—MUST have `border-radius: 0px !important` (`rounded-none`). Add `* { border-radius: 0px !important; }` to global CSS.
- **SWISS CAD / STRUCTURAL BLUEPRINT GRID**:
  - Construct layouts using exposed `1px solid` structural hairlines (`#CBD5E1`) where adjacent cells share borders (`-ml-px -mt-px`) like a technical engineering drawing block or Bentley/AutoCAD Civil 3D workspace.
  - **Fluid Tab-to-Tab Form UX**: Organize both forms into separate, ultra-responsive **Fluid Engineering Tabs** (`[TAB-01]` through `[TAB-06]`) with zero page reloads, instant keyboard tab switching, and live per-tab field validation counters.
- **FESTIVE YET COMFORTABLE PRECISION COLOR PALETTE**:
  - Command Header & Sidebar: Deep Gunmetal Slate (`#0F172A`) with `#1E293B` hairlines.
  - Workspace Surface: Crisp Drafting Alabaster (`#F8FAFC`) and Pure White (`#FFFFFF`) data cells.
  - Primary Engineering Cobalt (`#0284C7`): Bridge module theme, active states, focus rings.
  - Festive Survey Vermeil / International Orange (`#EA580C`): Culvert module theme, primary submit CTAs, active tab markers.
  - Theodolite Emerald (`#059669`): Authorized/Verified status & completed uploads.
  - Caution Amber (`#D97706`) & Structural Crimson (`#DC2626`): Pending Endorsements & `Returned for Correction` alerts.
- **TYPOGRAPHY**: `IBM Plex Sans` for UI/labels and `JetBrains Mono` (`tabular-nums`) for all structure codes (`MIS-JBT-19-00017`), chainages (`Ch 194+210`), coordinates, Reduced Levels (`in m PWD`), and dimensions.

======================================================================
2. RHD INSTITUTIONAL CHAIN OF COMMAND & SYSTEM ROLES (NO "ADMIN" TERM!)
======================================================================
1. **Forbidden Term**: NEVER use the word "Admin" anywhere in the UI or code.
2. **System Authorities**:
   - **`SUPREME` ("Supreme")**: Strictly a **singleton account** (only 1 user in the database can hold this role). Has unrestricted rights, workflow overrides, and a **Supreme Background Task Console** to run/monitor background tasks (DB backup, JSON hierarchy sync, `webmap.rhdbridge.com` bulk sync, dossier batch builds).
   - **`WEBMASTER` ("Webmaster")**: Manages users, office postings, and live CRUD / JSON import-export of the RHD Master Hierarchy (`Zones`, `Circles`, `Divisions`, `Roads`).
3. **8-Tier RHD Engineering Chain of Command & Status Lifecycle**:
   - **Step 1 (`DRAFT_FIELD`)**: Initiated by **Sub-Assistant Engineer (Field Division)** (`FIELD_SAE`) or **Sub-Divisional Engineer (Field Division)** (`FIELD_SDE`).
   - **Step 2 (`PENDING_FIELD_EE_AUTH` -> `FORWARDED_TO_FIELD_SE`)**: Authorized by **Executive Engineer (Field Division)** (`FIELD_EE`).
   - **Step 3 (`FORWARDED_TO_FIELD_ACE`)**: Endorsed by **Superintending Engineer (Field Circle)** (`FIELD_SE`).
   - **Step 4 (`FORWARDED_TO_BMW_ACE`)**: Endorsed by **Additional Chief Engineer (Field Zone)** (`FIELD_ACE`).
   - **Step 5 (`FORWARDED_TO_BDC_SE`)**: Routed by **Additional Chief Engineer (Bridge Management Wing)** (`BMW_ACE`).
   - **Step 6 (`ASSIGNED_TO_BDD_EE`)**: Routed by **Superintending Engineer (Bridge Design Circle)** (`BDC_SE`) to **Executive Engineer (Bridge Design Division - 1, 2, or 3)** (`BDD_EE`).
   - **Step 7 (`ASSIGNED_TO_BDD_SDE`)**: Assigned by `BDD_EE` to **Sub-Divisional Engineer (Design Division - 1, 2, or 3)** (`BDD_SDE`).
   - **Step 8 (`RETURNED_FOR_CORRECTION` or `DESIGN_APPROVED_COMPLETE`)**: Either the **Design Executive Engineer (`BDD_EE`)** or **Design Sub-Divisional Engineer (`BDD_SDE`)** can return the form to the Field Division for correction / additional field data (with flagged tabs and technical notes) OR approve it as complete.
4. **JSON Master Seed (`rhd_master_hierarchy_seed.json`)**:
   - Load RHD Zones, Circles, Divisions, Road Types (`National Highway`, `Regional Highway`, `Zilla Road`, `Others`), Roads (`N1`, `N2`, etc.), and role test accounts from a modifiable `rhd_master_hierarchy_seed.json` file into PostgreSQL, and expose Webmaster UI controls to edit or re-upload the JSON seed at any time.

======================================================================
3. BRIDGE ACQUISITION WORKSPACE (6 FLUID TABS, ALL 33+ FIELDS)
======================================================================
- **[TAB-01] Demand Letter & Road Location**: Demand Letter upload (`Attachment for ACE`, `Attachment for SE`, `Attachment for EE` with automatic option deduplication once uploaded); `Zone`, `Circle`, `Division`; `Proposed Bridge Type`; `1) Type of Road` + `1.1) Others`; `2) Road Number` -> auto-fills `3) Name of the Road`; `4) Road Link with Link No`; `5) Location with Chainage & GPS`; `5.1) Google Map / Webmap Link` & `Latitude,Longitude` (bidirectional regex extractor + `https://webmap.rhdbridge.com` deep link); `6) Name of the Bridge`; `7) Name of River/Channel`; `7.1) Width of Channel (m)`.
- **[TAB-02] Navigational Clearance & Existing Bridge**: `8) Navigational Clearance` radio (`BIWTA` Class-I [18.30/76.22], Class-II [12.20/76.22], Class-III [7.62/30.48], Class-IV [5.00/20.00], Others; `Railway` General [7.25/30.50], Others; `BWDB`; `Local`; `Others` with Note) + `8.2) Navigational Clearance Attachment`; `9.1) Existing Bridge Length`; `9.2) Existing Span Arrangement`; `20) Reference Benchmark/Datum` (`PWD`, `SOB`, `BIWTA`, `BWDB`, `Local` — dynamically updates `in m <DATUM>` suffix across all R.L. inputs!) + Location + `20.1 Map Link` & `20.2 Lat,Long`; `10) Bottom R.L. of mid span girder`; `11) Existing Foundation` (`Open`, `Pile`, `Well`, `Shal Balli`, `Others`, `N/A`); `12) Existing Foundation Layout & ROW Utilities` (`Yes`/`No` + conditional upload).
- **[TAB-03] Hydrological & River Survey**: `13) HFL`, `14) SHWL`, `15) LWL`, `15.1) HTL`, `15.2) LTL`, `16) Water level at Survey` (all `in m <DATUM>`); `17) Survey Date`; `18) Type of River` (`Tidal`/`Not Tidal` -> reveals Dry Season HTL/LTL & Rainy Season HTL/LTL); `19) Direction of stream flow`; `21) Zero Chainage Reference Point` (+ `21.1 Map Link` & `21.2 Lat,Long`); `22) Cross road at approach`.
- **[TAB-04] Proposed Design & Ancillary Works**: `24) Proposed alignment` (`New Alignment` / `For Existing Bridge` -> `24.a Same / Upstream / Downstream`); `27) Electrification required?`; `28) Proposed Length (m)`; `29) Proposed Span arrangement (m)`; `30) Proposed Mid Span Bottom R.L.`; `Pier Protective Work`; `Proposed Max Height of Approach Road (m)`; `Ancillary Work`; `Remarks`; `BMS Chainage & GPS Info` (Upload + Map Link + Lat/Long + Chainage).
- **[TAB-05] Engineering Reports & Directional Site Photos**: Multi-file uploaders for `23) Signed Soil Investigation Report`, `25) Site Plan of Proposed Bridge`, `26) >=3 Cross Sections with R.L.`, `31) Hydro-Morphological Study Report`, `Existing Structure Photos` (Roadside, Channel side, Damaged portions), and 4 directional image slots (`East`, `West`, `North`, `South`).
- **[TAB-06] Webmap GIS & Borelog Form (`0–40` Boreholes)**: Isolated `<RhdWebmapBorelogForm />` component (`RhdWebmapBorelogForm.jsx` + `.css`) designed for drop-in compatibility with the existing JSX/HTML/CSS borelog form on `https://webmap.rhdbridge.com` (supporting 0–40 boreholes, soil strata, SPT N-values, ground R.L., and live Webmap sync).

======================================================================
4. CULVERT ACQUISITION WORKSPACE (6 FLUID TABS, ALL FIELDS)
======================================================================
- **[CLV-TAB-01] Demand Letter, Hierarchy & Flood/Haor Context**: ACE/SE/EE Demand Letter; `a.1) Zone`, `a.2) Circle`, `a.3) Division`; `b.1) Road Type` + `b.1.1) Others`; `b.2) Road Number`; `b.3) Road Name`; `c) Location with Chainage/LRP & GPS`; `e.1) Map/Webmap Link` & `e.2) Lat,Long`; `f) Flash flood-prone` + `f.1) Description`; `g) Haor area`; `h) Tidal area`.
- **[CLV-TAB-02] Benchmark, Survey Maps & Hydrological Data**: `2.1) Datum` (`MSL`, `SOB`, `PWD`, `TBM` — updates unit labels), `2.2) Benchmark Location` + GPS; `3) Channel Cross-Section (1.50m interval)` upload; `4.a) Plane Table Map` upload + `4.b) Cross road at approach`; `5) Navigational Clearance` (`Yes`/`No` + upload); `6.1) HFL`, `6.2) LWL`, `6.3) SHWL`, `6.4) HTL`, `6.5) LTL`.
- **[CLV-TAB-03] Existing Culvert Geometry**: Radio selector for `Rectangular Culvert` (with auto-calculated `Total Length = No. of Vent * Length of Each Vent`, Height, Width, Top/Side/Bottom thicknesses, Structure & Foundation conditions), `Pipe Culvert`, `Slab Culvert`, `Arch Culvert`, `Other`, plus general remarks.
- **[CLV-TAB-04] Proposed Culvert Alignment & Geometry**: `8) Alignment` + `8.a) Offset`; `Proposed Culvert Type` (`New Culvert` -> `Rectangular Box Culvert` with auto-calculated Total Length OR `Other`; `Widening Culvert` -> `Upstream`, `Downstream`, or `Both Side` extension carriage widths; `Not Applicable`).
- **[CLV-TAB-05] Site Photos, Extension Diagrams & Soil Report**: 4 directional Site Photos (`East`, `West`, `North`, `South`), 4 directional Extension Diagrams (`East`, `West`, `North`, `South`), Existing Culvert Photos, and Signed Soil Investigation Report.
- **[CLV-TAB-06] Webmap GIS & Borelog Form (`0–40` Boreholes)**: Shared `<RhdWebmapBorelogForm />` synced with `https://webmap.rhdbridge.com`.

======================================================================
5. GLOBAL BEST-PRACTICE ENGINEERING EXPORTS
======================================================================
Every Bridge and Culvert dossier in the registry and reviewer portal must provide 4 one-click exports:
1. **ISO Engineering Datasheet PDF (`/export-pdf`)**: Print-ready technical datasheet with all parameters, QR code to `https://webmap.rhdbridge.com`, directional photos, and Chain-of-Command digital endorsement stamps.
2. **Structured Engineering Dossier ZIP (`/export-zip`)**: Categorized subfolders containing the PDF datasheet and all uploaded reports, drawings, and photos.
3. **Excel Engineering Schedule (`/export-excel`)**: Multi-tab `.xlsx` workbook for structural analysis use.
4. **Live Webmap Layer Sync (`/api/webmap/geojson`)**: Direct GeoJSON endpoint & deep-link launcher for `https://webmap.rhdbridge.com`.
```