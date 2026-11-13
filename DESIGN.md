---
name: RHD ADDS (System for Coordinated Exchange of Design Data)
description: Precision civil & structural engineering acquisition instrument and hierarchical ministerial endorsement pipeline for Bangladesh Roads and Highways Department
colors:
  primary: "#025ec7"
  azure: "#429afe"
  mint: "#15db7c"
  yellow: "#ffff2d"
  orange: "#e95a24"
  navy: "#00225a"
  slate: "#5b6b7a"
  midnight: "#001139"
  canvas: "#f8fafc"
  border: "#d5dbe7"
  cyan: "#01c1f2"
  cobalt: "#034081"
  neutral-bg: "#f8fafc"
  neutral-card: "rgba(255, 255, 255, 0.72)"
  neutral-border: "rgba(255, 255, 255, 0.88)"
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
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-azure:
    backgroundColor: "{colors.azure}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-mint:
    backgroundColor: "{colors.mint}"
    textColor: "{colors.midnight}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
---

## Overview

RHD ADDS (System for Coordinated Exchange of Design Data) is an authoritative civil and structural engineering acquisition instrument for the Roads and Highways Department (RHD), Government of the People's Republic of Bangladesh. The visual architecture pairs a double-beveled glassmorphism aesthetic with high-density tabular precision, designed for bright daylight field conditions on tablets and dual-monitor engineering scrutiny at Sarak Bhaban, Dhaka.

## Colors

The palette balances government institutional authority with vibrant engineering clarity:
- **Primary / Cobalt (`#025ec7`, `#034081`)**: Structural authority, primary actions, and navigational markers.
- **Azure (`#429afe`)**: Interactive states, input focus halos, and active selections.
- **Mint (`#15db7c`)**: Approved ministerial endorsements, valid verification states, and complete dossiers.
- **Orange / Tomato (`#e95a24`)**: Required revisions, returns for correction, and critical alerts.
- **Navy & Midnight (`#00225a`, `#001139`)**: High-contrast typography, strict headers, and high-readability label text.
- **Canvas (`#f8fafc` to `#f1f5f9`)**: Daylight paper-like background with subtle architectural desk watermark.

## Typography

Typography enforces data scanability and numerical precision:
- **Display**: Outfit (Geometric, modern authority for top bar and brand titles).
- **Headlines & Subheads**: ITC Stone Sans / ClanPro (Structural engineering section heads).
- **Body & Controls**: SmartGothic / Samsung Sans (High-density readability for inputs and tables).
- **Numbers & Coordinates**: Tabular-nums with SmartGothic / JetBrains Mono strictly for GPS coordinates, chainages, and borehole depths.

## Layout

- **Top Precision Command Bar**: 64px glass header featuring live user profile, instant role switcher, and dynamic division badge.
- **Collapsible Technical Sidebar**: Collapsible left navigation rail (`Ctrl+B` toggle) with direct shortcuts to Registries, Consoles, and Workspaces.
- **6-Tab Engineering Workspaces**: Tabular workspaces for Bridge and Culvert dossiers with smooth vertical pane transitions and breadcrumb steppers.
- **Fixed Jurisdiction Grid**: 3-column Administrative Jurisdiction grid (Zone, Circle, Division) locked to the officer's posting.

## Elevation & Depth

- **Ambient Canvas**: Base architectural desk layer softened by a translucent whitish veil (`rgba(255, 255, 255, 0.26)` with `3px` blur) and calm ambient light.
- **Double-Beveled Glass Panels**: Multi-layered specular highlights (`inset 0 1.5px 1.5px 0 rgba(209, 209, 209, 0.98)`), frosted backdrops (`backdrop-blur-md`), and soft ambient shadows.
- **Elevated Interactive Controls**: Tactile button elevation, active state depress transitions, and distinct focus rings.

## Shapes

- Inputs and controls use clean `7px` to `8px` rounded corners (`rounded-lg`).
- Cards and containers use `12px` to `16px` curvature (`rounded-xl`, `rounded-2xl`).
- Status badges and pill indicators use `rounded-full`.

## Components

- **Engineering Inputs**: Frosted translucent input fields with explicit engineering units (`m`, `mm`, `m³/s`, `kN/m²`). Spin arrows removed for cleaner presentation.
- **Radio 27**: Custom radio selector with inset rings and fluid selection animation.
- **Unified Side Flow Panel**: Sticky right-hand workflow tracker displaying stage completeness, dossier state, and ministerial sign-off controls.
- **SPT Geotechnical Grid**: Interactive 40-borehole strata table with auto-calculating N-values and early termination indicator.

## Do's and Don'ts

### Do's
- Always display explicit engineering units next to numeric fields.
- Keep background colors calm and non-intrusive so text and numbers remain 100% legible.
- Lock administrative jurisdiction to the user's division profile for field accounts.
- Enforce strict tabular numeral alignment (`font-variant-numeric: tabular-nums`).

### Don'ts
- Do not use the forbidden term "Admin"; governance is strictly `SUPREME` and `WEBMASTER`.
- Do not use neon or saturated gradient fills behind data entry forms.
- Do not allow field engineers to modify assigned division/circle/zone boundaries.
- Do not use generic consumer SaaS rounded pill buttons for engineering action triggers.
