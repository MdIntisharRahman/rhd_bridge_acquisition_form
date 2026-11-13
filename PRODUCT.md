# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Field Engineers (SAE / SDE):** Sub-Assistant Engineers and Sub-Divisional Engineers operating across 75 field divisions in Bangladesh. Operating on rugged laptops, field tablets, and mobile devices under variable field conditions to capture primary geometric, hydraulic, structural, and geotechnical data for bridges and culverts.
- **Divisional, Circle & Zonal Endorsers (EE / SE / ACE):** Executive Engineers, Superintending Engineers, and Additional Chief Engineers who audit, endorse, or return submissions with technical directives across an 8-tier chain of command.
- **Headquarters Bridge Designers & Reviewers (BMW / BDC):** Specialized structural, hydraulic, and geotechnical engineers in the Bridge Management Wing (BMW) and Bridge Design Circle (BDC) at RHD Headquarters (Sarak Bhaban, Dhaka). Working on high-resolution multi-monitor desktop workstations, laptops, and mobile review interfaces to scrutinize design parameters.
- **Infrastructure & System Operators (Webmaster / Supreme):** Webmaster manages network master data and sync; Supreme exercises singleton constitutional governance, cross-jurisdiction audits, and administrative overrides.

## Product Purpose

Eliminate fragmented, paper-based, and legacy web-form data collection for bridge and culvert construction and reconstruction across Bangladesh's national road network. RHD ADDS provides an authoritative, instrument-grade digital acquisition workspace and hierarchical endorsement pipeline that transforms raw field measurements into validated, ISO-compliant structural design dossiers and live GIS layers.

## Positioning

RHD ADDS is a specialized civil and structural engineering acquisition instrument deeply integrated with national road GIS infrastructure (`https://webmap.rhdbridge.com`). Unlike generic form builders or general-purpose asset management tools, RHD ADDS enforces structural engineering physics at the point of entry:
- Validates 0–40 borehole subsoil strata with automated SPT N-value blow-count analysis and early termination rules.
- Enforces zero-tolerance BIWTA navigational clearance envelopes.
- Auto-computes hydraulic waterway openings and barrel geometry for culvert widening.
- Enforces an authentic, immutable 8-tier ministerial chain of command.
- Packages complete ISO ReportLab PDF datasheets, multi-sheet analytical Excel models, and 6-subfolder engineering ZIP archives on demand.

## Operating Context

- **Field Environment:** Remote national, regional, and zilla road crossings, riverbanks, and embankment borrow pits across Bangladesh. Harsh tropical sunlight, dust, humidity, intermittent cellular connectivity; accessed via rugged field laptops, tablets, and mobile devices.
- **Headquarters Review:** Sarak Bhaban engineering offices. High-density data review, dual-screen setups cross-referencing satellite imagery, catchment basin maps, and boring logs.
- **Ecosystem Integration:** Bidirectional synchronisation with the RHD Webmap GIS platform (`https://webmap.rhdbridge.com`) for reverse geocoding, chainage verification, and geotechnical borelog layers.
- **Reference Specifications:** Technical compliance anchored directly to the RHD Technical Standards Repository (`D:\My Works\PC Work files\Update Spex\Updated Technical Specification_24`), specifically Division 4 (Foundations) and Division 5 (Structures).

## Capabilities and Constraints

- **8-Stage Ministerial State Machine:**
  1. `FIELD_SUBMISSION` (SAE / SDE)
  2. `DIVISION_VERIFICATION` (Executive Engineer)
  3. `CIRCLE_ENDORSEMENT` (Superintending Engineer)
  4. `ZONE_APPROVAL` (Additional Chief Engineer)
  5. `BMW_REVIEW` (Bridge Management Wing)
  6. `BDC_DESIGN_SCRUTINY` (Bridge Design Circle)
  7. `WEBMASTER_FINAL_ARCHIVE` (Webmaster)
  8. `SUPREME_AUDIT` (Supreme Governor)
- **Fluid Engineering Workspaces:**
  - *Bridge Acquisition:* 6 fluid tabs (General & Geodetic, Hydraulics & Morphology, Existing Structure & Geometry, Navigational & Environmental, Geotechnical & Subsoil, Attachments & Signatures).
  - *Culvert Acquisition:* 6 fluid tabs (General & Administrative, Hydraulic Catchment & Flow, Geometry & Barrel Configuration with auto-calculated widening, Construction & Materials, Geotechnical & Bedding, Attachments & Submission).
- **Geotechnical Standards:**
  - Dynamic support for 0 to 40 boreholes per bridge site.
  - 56-character UID convention (`{Zone}_{Circle}_{Division}_{RoadCode}_{KM}_{StructureType}_{BH_No}`).
  - Borelog termination rule: Borelog investigation depth may terminate early upon encountering 3 consecutive 50 SPT readings.
  - USCS soil strata categorization, ground water table tracking, and SPT N-value depth profiling.
- **Navigational Standards:** Zero-tolerance compliance with BIWTA Standard Navigational Classification (Classes I, II, III, IV) for vertical and horizontal bridge clearances.
- **Nomenclature & Role Security:** The term "Admin" is strictly forbidden across code, user interface, API endpoints, and documentation. System governance is restricted exclusively to `SUPREME` (singleton constraint) and `WEBMASTER`.
- **Aesthetic Floor:** Webmap-aligned Glassmorphism & Festive UI: Frosted glass panels (backdrop-blur-md), friendly rounded geometry (rounded-xl, rounded-2xl), vibrant action buttons (Azure Blue, Emerald Green, Tomato Orange, Ocean Teal, Regal Violet), and typographic hierarchy (Outfit for display, SmartGothic & ClanPro for subheads, Inter for body, and JetBrains Mono selectively for coordinates and chainages).

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
