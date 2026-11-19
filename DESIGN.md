---
name: RHD ADDS (Precision Design Data Acquisition & Exchange System)
description: Precision civil & structural engineering acquisition instrument and hierarchical ministerial endorsement pipeline for Bangladesh Roads and Highways Department
mode: operate
colors:
  deep-navy: "#112047"
  denim: "#1c508c"
  steel-blue: "#3699c2"
  arctic-ice: "#95d4e5"
  arctic-wash: "#e7f0f5"
  canvas-light: "#f8fafc"
  neutral-card: "rgba(255, 255, 255, 0.82)"
  neutral-border: "rgba(28, 80, 140, 0.18)"
  steel-border: "rgba(54, 153, 194, 0.35)"
  mint-endorsed: "#1e7e61"
  amber-revision: "#c05621"
typography:
  display:
    fontFamily: "Outfit, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.2
  headline:
    fontFamily: "ITC Stone Sans, ClanPro, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.3
  title:
    fontFamily: "Samsung Sans, SmartGothic, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.35
  body:
    fontFamily: "SmartGothic, ClanPro, Samsung Sans, Matterhorn, sans-serif"
    fontSize: "0.84375rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.2
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.denim}"
    hoverBackgroundColor: "{colors.deep-navy}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-secondary:
    backgroundColor: "{colors.arctic-wash}"
    textColor: "{colors.deep-navy}"
    borderColor: "{colors.steel-blue}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
---

## Overview

RHD ADDS (System for Coordinated Exchange of Design Data) is an authoritative civil and structural engineering acquisition instrument for the Roads and Highways Department (RHD), Government of the People's Republic of Bangladesh. The interface operates in **Operate Mode**—prioritizing technical scanability, tabular density, field-survey accuracy, and ministerial chain of custody.

## Palette: Navy / Denim / Steel Blue / Arctic Ice

Directly inspired by the official engineering palette (`sources/navy-benim-steelblue-arctic-ice.jpg`):
- **Deep Navy (`#112047`)**: Foundations, executive command titles, high-contrast labels, and structural anchors.
- **Denim Blue (`#1c508c`)**: Active tabs, ministerial endorsement triggers, verified state indicators, and primary action controls.
- **Steel Blue (`#3699c2`)**: Focus rings, secondary status accents, interactive navigation hovers, and table borders.
- **Arctic Ice (`#95d4e5`)**: Luminous highlight pips, subtle badges, active stepper glow, and selected card accents.
- **Arctic Wash (`#e7f0f5`)**: Glare-free daylight surface wash, frosted table headers, and neutral container fills.
- **Canvas (`#f8fafc` to `#e7f0f5`)**: Daylight architectural drafting canvas with calm gradient depth.

## Storage Architecture: Nextcloud NAS Staging

Demands and survey deliverables conform to the institutional NAS hierarchy:
`[Zone] / [Circle] / [Division] / demand /`
- `{code}_demand.json`: Full structural snapshot of the demand dossier, road chainage, coordinates, stratum borelogs, and endorsement trail.
- Uploaded survey files (soil reports, site plans, cross sections, photos, demand letters).
`[Zone] / [Circle] / [Division] / deliverables /`
- Structural calculation sheets, CAD drawings (DWG/DXF), and approved bridge design packages produced by the Bridge Design Circle.

## Typography & Scanability

- **Display**: Outfit (Geometric precision for headers and system branding).
- **Headlines & Subheads**: ITC Stone Sans / ClanPro (Structural engineering section heads).
- **Body & Inputs**: SmartGothic / Samsung Sans (Dense legibility for inputs, units, and dropdowns).
- **Numeric & Coordinate Data**: Tabular-nums with SmartGothic / JetBrains Mono strictly for GPS coordinates, chainages, and borehole depths.

## Elevation & Depth

- **Double-Beveled Glass Panels**: Translucent white panels (`rgba(255, 255, 255, 0.82)`) with specular top bevel (`inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 0.95)`) and deep navy ambient shadow (`0 20px 48px -12px rgba(17, 32, 71, 0.12)`).
- **Subtle Contrasting Borders**: Crisp `1px` borders using `rgba(28, 80, 140, 0.18)` or `#cadbe7`.
- **Active Focus Rings**: High-visibility `2px` ring in `#3699c2` with soft `4px` arctic wash diffusion.
