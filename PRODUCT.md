# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Field Engineers (SAE / SDE):** Sub-Assistant Engineers and Sub-Divisional Engineers operating across 75 field divisions in Bangladesh. Operating on rugged laptops, field tablets, and mobile devices under variable field conditions to capture primary geometric, hydraulic, structural, and geotechnical data for bridges and culverts.
- **Divisional Executive Engineers (FIELD_EE):** Executive Engineers in field divisions who review, authorize, and transmit structural acquisition dossiers directly to central Bridge Design Divisions.
- **Central Bridge Design Divisions (BDD_EE / BDD_SDE):** Specialized structural, hydraulic, and geotechnical engineers in Bridge Design Divisions 1, 2, and 3 under the Bridge Design Circle (BDC), Sarak Bhaban, Tejgaon, Dhaka. Working on desktop workstations and mobile review interfaces to formulate, model, vet, and deliver official engineering packages.
- **Infrastructure & System Operators (Webmaster / Supreme):** Webmaster coordinates cross-platform GIS sync and NAS data storage; Supreme exercises singleton constitutional governance, cross-jurisdiction audits, and administrative overrides.

## Product Purpose

Eliminate fragmented, paper-based, and legacy web-form data collection for bridge and culvert construction and reconstruction across Bangladesh's national road network. RHD DESC (Data Exchange System for Coordination) provides an authoritative, instrument-grade digital acquisition workspace, Nextcloud NAS staging repository, and direct peer engineering pipeline that transforms raw field measurements into validated, ISO-compliant structural design dossiers, deliverables, and live GIS layers.

## Positioning

RHD DESC is a specialized civil and structural engineering acquisition instrument deeply integrated with national road GIS infrastructure (`https://webmap.rhdbridge.com`) and a Nextcloud-powered Network Assisted Server (NAS). Unlike generic form builders or general-purpose asset management tools, RHD DESC enforces structural engineering physics at the point of entry:
- Validates 0–40 borehole subsoil strata with automated SPT N-value blow-count analysis and early termination rules.
- Enforces zero-tolerance BIWTA navigational clearance envelopes.
- Auto-computes hydraulic waterway openings and barrel geometry for culvert widening.
- Staged NAS folder synchronization (`Zone/Circle/Division/demand/` and `deliverables/`) with automated JSON manifest generation.
- Enforces an authentic, streamlined peer EE-to-EE engineering workflow.
- Packages complete ISO ReportLab PDF datasheets, multi-sheet analytical Excel models, and 6-subfolder engineering ZIP archives on demand.

## Operating Context

- **Field Environment:** Remote national, regional, and zilla road crossings, riverbanks, and embankment borrow pits across Bangladesh. Harsh tropical sunlight, dust, humidity, intermittent cellular connectivity; accessed via rugged field laptops, tablets, and mobile devices.
- **Headquarters Review:** Sarak Bhaban engineering offices. High-density data review, dual-screen setups cross-referencing satellite imagery, catchment basin maps, and boring logs.
- **Ecosystem Integration:** Bidirectional synchronisation with the RHD Webmap GIS platform (`https://webmap.rhdbridge.com`) for reverse geocoding, chainage verification, geotechnical borelog layers, and dynamic Demands GIS layers.
- **Reference Specifications:** Technical compliance anchored directly to the RHD Technical Standards Repository (`D:\My Works\PC Work files\Update Spex\Updated Technical Specification_24`), specifically Division 4 (Foundations) and Division 5 (Structures).

## Capabilities and Constraints

- **7-Stage Peer EE-to-EE Workflow:**
  1. `DRAFT_FIELD` (Field SAE / SDE survey entry)
  2. `PENDING_FIELD_EE_AUTH` (Field Executive Engineer verification & sign-off)
  3. `TRANSMITTED_TO_BDD_EE` (Transmission to central Bridge Design Division EE 1, 2, or 3)
  4. `ASSIGNED_TO_BDD_SDE` (Sub-divisional structural modeling & calculation)
  5. `DESIGN_PREPARED_PENDING_EE` (Division EE vetting of drawings, calculation reports, and BOQ)
  6. `DESIGN_APPROVED_COMPLETE` (Handover of vetted design package to field division)
  7. `DISPATCHED_TO_FIELD_SDE` (Field execution and construction handover)
- **Fluid Engineering Workspaces:**
  - *Bridge Acquisition:* 6 fluid tabs (General & Geodetic, Hydraulics & Morphology, Existing Structure & Geometry, Navigational & Environmental, Geotechnical & Subsoil, Attachments & Signatures).
  - *Culvert Acquisition:* 6 fluid tabs (General & Administrative, Hydraulic Catchment & Flow, Geometry & Barrel Configuration with auto-calculated widening, Construction & Materials, Geotechnical & Bedding, Attachments & Submission).
- **Network Assisted Server (NAS) Staging:**
  - Standardized folder hierarchy across all 10 zones, circles, and 75 divisions.
  - Dedicated `demand` subfolder for field surveys, geotechnical reports, and automated `<Tracking_Code>_demand.json` manifests.
  - Dedicated `deliverables` subfolder for finalized CAD drawings, calculation sheets, BOQ spreadsheets, and approval memos.
- **Geotechnical Standards:**
  - Dynamic support for 0 to 40 boreholes per bridge site.
  - 56-character UID convention (`{Zone}_{Circle}_{Division}_{RoadCode}_{KM}_{StructureType}_{BH_No}`).
  - Borelog termination rule: Borelog investigation depth may terminate early upon encountering 3 consecutive 50 SPT readings.
  - USCS soil strata categorization, ground water table tracking, and SPT N-value depth profiling.
- **Navigational Standards:** Zero-tolerance compliance with BIWTA Standard Navigational Classification (Classes I, II, III, IV) for vertical and horizontal bridge clearances.
- **Nomenclature & Role Security:** The term "Admin" is strictly forbidden across code, user interface, API endpoints, and documentation. System governance is restricted exclusively to `SUPREME` (singleton constraint) and `WEBMASTER`.
- **Aesthetic Floor:** Navy / Denim / Steel Blue / Arctic Ice Palette: Deep Navy (`#112047`) structural anchors, Denim Blue (`#1c508c`) active tabs, Steel Blue (`#3699c2`) secondary accents, Arctic Ice (`#95d4e5`) luminous badges, and high-contrast accessible typography (`Outfit`, `ITC Stone Sans`, `SmartGothic`, and `JetBrains Mono`).

## Brand Commitments

- **Official Name:** RHD ADDS (System for Coordinated Exchange of Design Data).
- **Institutional Owner:** Roads and Highways Department (RHD), Ministry of Road Transport and Bridges, Government of the People's Republic of Bangladesh.
- **Color Palette & Visual Tone:** Webmap Festive Palette: Vibrant Azure (`#025ec7`), Forest Emerald (`#089a2d`), Tomato Orange (`#ff6347`), Deep Teal (`#077b9f`), Royal Violet (`#9400d3`), Slateblue (`#6a5acd`), Frosted Glass panels (`rgba(255, 255, 255, 0.85)`), and Slate (`#1e293b`).

## Evidence on Hand

- **RHD Administrative & Road Hierarchy:** Comprehensive seed dataset (`backend/rhd_master_hierarchy_seed.json`) comprising 11 zones, 24 circles, 75 divisions, and 120 verified roads extracted from the national GIS database.
- **Technical Specifications Library:** `D:\My Works\PC Work files\Update Spex\Updated Technical Specification_24` containing Divisions 1 through 8 and the Road Safety Features Manual.
- **Geotechnical UID Specification:** `TheNamingConventionForTheBorelogs.md` defining the 56-character UID structure for soil strata and GIS layering.
- **Production GIS Services:** Live GIS portal running at `https://webmap.rhdbridge.com`.
- **Relational Data Store:** PostgreSQL 18 database `rhd_adds` running locally on `localhost:5432`.

## Product Principles

1. **Engineering Precision Over Interface Decoration:** Every element serves data scanability, calculation accuracy, and structural clarity. No rounded pill buttons, cards-inside-cards, or consumer SaaS fluff; every field displays explicit engineering units (m, mm, m³/s, kN/m²).
2. **Immutable Chain of Command:** An engineering sign-off is a legally binding ministerial act. All state progressions, returns for correction, and audit logs are permanently stored with cryptographic actor attribution and immutable timestamps.
3. **Point-of-Entry Geotechnical & Hydraulic Validation:** Prevent flawed structural assumptions at the source. Validate SPT blow counts, early termination limits, water levels, and navigational envelopes dynamically before endorsement.
4. **Autonomous Dossier Completeness:** Every structure record must stand as an autonomous engineering dossier, exportable at any point as an ISO ReportLab PDF datasheet, an openpyxl multi-tab calculation model, or a 6-folder ZIP archive.

## Accessibility & Inclusion

- High-contrast visual readability engineered for outdoor sunlight conditions on rugged tablets and mobile browsers.
- Rapid keyboard-only numeric data entry with tabular monospace alignment (`font-mono`, `tabular-nums`) for structural dimensions and borehole depths.
