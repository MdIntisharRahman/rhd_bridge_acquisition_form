import os
import re
import json
import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.config import settings
from backend.database import get_db
from backend.models import BridgeAcquisition, CulvertAcquisition, Attachment, WorkflowAuditLog, RhdDivision, RhdZone
from backend.services.nas_storage import nas_storage
from backend.jurisdiction import get_vested_design_division

logger = logging.getLogger("rhd_adds.webmap_exchange")

router = APIRouter(prefix="/exchange/webmap", tags=["Webmap Interoperability"])

# Palette sourced from sources/navy-benim-steelblue-arctic-ice.jpg
COLOR_DEMAND = "#112047"      # Deep Navy
COLOR_PROCESSING = "#1c508c"  # Denim Blue
COLOR_DELIVERED = "#3699c2"   # Steel Blue
COLOR_ARCTIC_ICE = "#95d4e5"  # Arctic Ice Accent
COLOR_ARCTIC_WASH = "#e7f0f5" # Pale Arctic Wash

# Stage criteria based on workflow and execution state
STAGE_DEMAND = "demand"
STAGE_PROCESSING = "processing"
STAGE_DELIVERED = "delivered"

def resolve_demand_stage(item: BridgeAcquisition | CulvertAcquisition) -> str:
    """
    Determines whether a demand is in Demand, Processing, or Delivered stage:
    - Demand: Unaccepted / newly submitted field demand awaiting acceptance into Bridge Design Division.
    - Processing: Once accepted into Bridge Design Division, undergoing modeling/vetting.
    - Delivered: Approved and dispatched back to the field.
    """
    wf = (item.workflow_status or "").upper()
    exec_state = (getattr(item, "design_execution_state", None) or "").upper()

    if wf in ("DESIGN_APPROVED_COMPLETE", "DISPATCHED_TO_FIELD_SDE") or exec_state == "SENT":
        return STAGE_DELIVERED

    if wf in (
        "TRANSMITTED_TO_BDD_EE",
        "ASSIGNED_TO_BDD_SDE",
        "DESIGN_PREPARED_PENDING_EE",
        "FORWARDED_TO_BDC_SE",
        "FORWARDED_TO_FIELD_SE",
        "FORWARDED_TO_FIELD_ACE",
        "FORWARDED_TO_BMW_ACE",
        "ASSIGNED_TO_BDD_EE"
    ) or exec_state == "RUNNING":
        return STAGE_PROCESSING

    return STAGE_DEMAND

def get_item_bdd_division(item: BridgeAcquisition | CulvertAcquisition, db: Session) -> int:
    """Returns the Bridge Design Division (1, 2, or 3) vested with this demand."""
    if item.assigned_bdd_division_id in (1, 2, 3):
        return item.assigned_bdd_division_id
    vested = get_vested_design_division(
        db,
        zone_id=item.zone_id,
        circle_id=item.circle_id,
        division_id=item.division_id
    )
    return vested if vested in (1, 2, 3) else 1

def parse_coordinates(item: BridgeAcquisition | CulvertAcquisition) -> tuple[float, float]:
    """Extracts valid [lng, lat] for GeoJSON coordinates."""
    candidates = [
        getattr(item, "location_lat_lng", None),
        getattr(item, "bms_lat_lng", None),
        getattr(item, "reference_benchmark_lat_lng", None)
    ]
    for c in candidates:
        if c and isinstance(c, str) and "," in c:
            try:
                parts = c.split(",")
                lat = float(parts[0].strip())
                lng = float(parts[1].strip())
                if 20.0 <= lat <= 27.0 and 88.0 <= lng <= 93.0:
                    return (lng, lat)
            except Exception:
                continue

    # Fallbacks based on division or default coordinates
    if item.division and item.division.name:
        div_name = item.division.name.lower()
        if "dhaka" in div_name:
            return (90.4125, 23.8103)
        if "gazipur" in div_name:
            return (90.4289, 23.9999)
        if "barishal" in div_name or "barisal" in div_name:
            return (90.3699, 22.7010)
        if "chattogram" in div_name or "chittagong" in div_name:
            return (91.8317, 22.3384)
        if "sylhet" in div_name:
            return (91.8687, 24.8949)
        if "comilla" in div_name or "cumilla" in div_name:
            return (91.1809, 23.4607)

    return (90.4125, 23.8103)  # Central Dhaka default

@router.get("/layers")
def get_webmap_layers_catalog():
    """
    Returns layer metadata for the Webmap portal under the 'Demands' tab.
    Nine distinct layers: 3 per Bridge Design Division (1, 2, and 3)
    covering Demand, Processing, and Delivered.
    """
    layers = []
    bdd_configs = [
        (1, "Design Division-1"),
        (2, "Design Division-2"),
        (3, "Design Division-3")
    ]
    stage_configs = [
        ("Demand", STAGE_DEMAND, COLOR_DEMAND),
        ("Processing", STAGE_PROCESSING, COLOR_PROCESSING),
        ("Delivered", STAGE_DELIVERED, COLOR_DELIVERED)
    ]

    for bdd_num, bdd_name in bdd_configs:
        for stage_title, stage_slug, color in stage_configs:
            layer_name = f"{stage_title} ({bdd_name})"
            table_slug = f"demand_bdd_{bdd_num}_{stage_slug}"
            layers.append({
                "filename": f"{table_slug}.geojson",
                "name": layer_name,
                "table": table_slug,
                "tab": "Demands",
                "show_first": False,
                "type": "Vector",
                "datatype": "Demands",
                "transparency": None,
                "color": color,
                "bdd_division": bdd_num,
                "stage": stage_slug,
                "search_on": "[code, Tracking Code], [name, Structure Name], [road_name, Road]"
            })

    return layers

@router.get("/geojson/{layer_table}")
def get_webmap_layer_geojson(layer_table: str, db: Session = Depends(get_db)):
    """
    Constructs GeoJSON FeatureCollection for a specific layer table.
    Format: demand_bdd_{bdd_num}_{stage}
    Example: demand_bdd_1_demand, demand_bdd_2_processing, demand_bdd_3_delivered
    """
    m = re.match(r"^demand_bdd_([123])_(demand|processing|delivered)$", layer_table.lower())
    if not m:
        raise HTTPException(status_code=400, detail=f"Invalid demand layer table name: {layer_table}")

    target_bdd = int(m.group(1))
    target_stage = m.group(2)

    # Color selection
    color_map = {
        STAGE_DEMAND: COLOR_DEMAND,
        STAGE_PROCESSING: COLOR_PROCESSING,
        STAGE_DELIVERED: COLOR_DELIVERED
    }
    layer_color = color_map.get(target_stage, COLOR_DEMAND)

    # Query all bridges and culverts
    bridges = db.query(BridgeAcquisition).all()
    culverts = db.query(CulvertAcquisition).all()

    features = []

    def process_item(item, acq_type: str):
        bdd = get_item_bdd_division(item, db)
        if bdd != target_bdd:
            return

        stage = resolve_demand_stage(item)
        if stage != target_stage:
            return

        lng, lat = parse_coordinates(item)

        # Cross-reference NAS demand manifest if available
        nas_json_data = nas_storage.get_demand_json(item) or {}
        envelope = nas_json_data.get("nas_envelope") or {}
        road_info = nas_json_data.get("road_network") or {}
        attachments = nas_json_data.get("attachments") or []

        road_name = (
            road_info.get("road_name") 
            or getattr(item, "road_name", None) 
            or (item.road.road_name if getattr(item, "road", None) else "RHD Road Network")
        )
        road_num = (
            road_info.get("road_number") 
            or (item.road.road_number if getattr(item, "road", None) else None)
        )
        if road_num and road_name and road_num not in road_name:
            display_road = f"{road_num}: {road_name}"
        else:
            display_road = road_name or "RHD Road Network"

        chainage_text = (
            road_info.get("chainage_text") 
            or getattr(item, "location_chainage_gps_text", None) 
            or getattr(item, "location_chainage_lrp_gps", None) 
            or (f"Ch {item.chainage_km:g}+{item.chainage_m:03g}" if getattr(item, "chainage_km", None) is not None else "Chainage Not Specified")
        )

        structure_name = (
            getattr(item, "bridge_name", None) 
            or getattr(item, "culvert_name", None) 
            or f"{acq_type.title()} at {chainage_text}"
        )

        div_name = item.division.name if item.division else "Unassigned Division"
        circle_name = item.circle.name if item.circle else (item.division.circle.name if item.division and item.division.circle else "Unassigned Circle")
        zone_name = item.zone.name if item.zone else (item.circle.zone.name if item.circle and item.circle.zone else "Unassigned Zone")

        # Preview URL (opens preview iframe) and full ADDS URL (for direct action)
        adds_url = f"{settings.WEBMAP_BASE_URL.replace('webmap.', 'acqform.')}/acquisitions/{acq_type.lower()}/{item.id}"
        preview_url = f"/api/exchange/webmap/preview/{acq_type.lower()}/{item.id}"

        feature = {
            "type": "Feature",
            "id": f"{acq_type}_{item.id}",
            "geometry": {
                "type": "Point",
                "coordinates": [lng, lat]
            },
            "properties": {
                "name": structure_name,
                "title": structure_name,
                "code": item.code,
                "tracking_code": item.code,
                "acquisition_type": acq_type,
                "design_division": f"Bridge Design Division {target_bdd}",
                "field_division": div_name,
                "field_circle": circle_name,
                "field_zone": zone_name,
                "road_name": display_road,
                "chainage": chainage_text,
                "stage": target_stage.title(),
                "workflow_status": item.workflow_status,
                "design_execution_state": getattr(item, "design_execution_state", "NOT_STARTED"),
                "attachments_count": len(attachments),
                "color": layer_color,
                "f_class_color": layer_color,
                "preview_url": preview_url,
                "adds_dossier_url": adds_url,
                "keys": (
                    "[code, Tracking Code], "
                    "[name, Structure Name], "
                    "[road_name, Road], "
                    "[chainage, Chainage], "
                    "[stage, Stage], "
                    "[design_division, Design Office], "
                    "[field_division, Field Division], "
                    "[workflow_status, Workflow State], "
                    f"[preview_url, View Demand Dossier => [format:JSON, imodal:demand-preview-modal]]"
                )
            }
        }
        features.append(feature)

    for b in bridges:
        process_item(b, "BRIDGE")
    for c in culverts:
        process_item(c, "CULVERT")

    return {
        "type": "FeatureCollection",
        "features": features
    }

@router.get("/preview/{acq_type}/{id}", response_class=HTMLResponse)
def get_demand_iframe_preview(acq_type: str, id: int, db: Session = Depends(get_db)):
    """
    Generates a high-fidelity, responsive HTML preview page tailored for
    embedding inside Webmap's modal iframe, complete with the requested
    'Open in RHD ADDS' action button at the top.
    """
    acq_type = acq_type.upper()
    if acq_type == "BRIDGE":
        item = db.query(BridgeAcquisition).filter(BridgeAcquisition.id == id).first()
    else:
        item = db.query(CulvertAcquisition).filter(CulvertAcquisition.id == id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Demand record not found")

    bdd_num = get_item_bdd_division(item, db)
    stage = resolve_demand_stage(item)
    nas_data = nas_storage.get_demand_json(item) or {}
    attachments = nas_data.get("attachments") or []
    audit_trail = nas_data.get("workflow_audit_trail") or []

    stage_badge_colors = {
        STAGE_DEMAND: (COLOR_DEMAND, "#ffffff", "Initial Demand Queue"),
        STAGE_PROCESSING: (COLOR_PROCESSING, "#ffffff", "Design Preparation & Modeling"),
        STAGE_DELIVERED: (COLOR_DELIVERED, "#ffffff", "Completed Design Package Delivered")
    }
    bg_color, text_color, stage_label = stage_badge_colors.get(stage, (COLOR_DEMAND, "#fff", "Demand"))

    adds_full_url = f"/acquisitions/{acq_type.lower()}/{item.id}"
    structure_name = getattr(item, "bridge_name", None) or getattr(item, "culvert_name", None) or f"{acq_type} Acquisition"
    road_name = getattr(item, "road_name", None) or (item.road.road_name if getattr(item, "road", None) else "RHD Road Network")
    chainage = getattr(item, "location_chainage_gps_text", None) or getattr(item, "location_chainage_lrp_gps", None) or f"Ch {getattr(item, 'chainage_km', 0)} km"
    
    div_name = item.division.name if item.division else "Field Division"
    circle_name = item.circle.name if item.circle else (item.division.circle.name if item.division and item.division.circle else "")
    zone_name = item.zone.name if item.zone else (item.circle.zone.name if item.circle and item.circle.zone else "")

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{item.code} — Demand Preview</title>
  <link rel="stylesheet" href="/fonts/fonts.css">
  <style>
    :root {{
      --navy: #112047;
      --denim: #1c508c;
      --steelblue: #3699c2;
      --arctic-ice: #95d4e5;
      --arctic-wash: #e7f0f5;
    }}
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      font-family: 'Outfit', 'Inter', -apple-system, sans-serif;
      background: #f8fafc;
      color: #0f172a;
      line-height: 1.5;
      padding: 20px;
    }}
    .header-bar {{
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      background: #ffffff;
      padding: 16px 20px;
      border-radius: 14px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 12px rgba(17, 32, 71, 0.04);
      margin-bottom: 20px;
      position: sticky;
      top: 0;
      z-index: 50;
    }}
    .header-title-group {{
      display: flex;
      flex-direction: column;
      gap: 4px;
    }}
    .code-badge {{
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      font-weight: 700;
      color: var(--denim);
    }}
    .structure-title {{
      font-size: 18px;
      font-weight: 700;
      color: var(--navy);
    }}
    .action-btn {{
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: var(--denim);
      color: #ffffff;
      padding: 10px 18px;
      border-radius: 10px;
      text-decoration: none;
      font-weight: 600;
      font-size: 13px;
      transition: all 0.2s ease;
      box-shadow: 0 2px 6px rgba(28, 80, 140, 0.25);
    }}
    .action-btn:hover {{
      background: var(--navy);
      transform: translateY(-1px);
    }}
    .badges-row {{
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 20px;
    }}
    .pill {{
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
    }}
    .pill-stage {{
      background: {bg_color};
      color: {text_color};
    }}
    .pill-office {{
      background: #eff6ff;
      color: var(--denim);
      border: 1px solid #bfdbfe;
    }}
    .pill-status {{
      background: #f1f5f9;
      color: #334155;
      border: 1px solid #cbd5e1;
    }}
    .grid-card {{
      background: #ffffff;
      border-radius: 14px;
      border: 1px solid #e2e8f0;
      padding: 18px;
      margin-bottom: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
    }}
    .card-title {{
      font-size: 14px;
      font-weight: 700;
      color: var(--navy);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }}
    .data-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
    }}
    .data-item {{
      background: #f8fafc;
      padding: 10px 12px;
      border-radius: 8px;
      border: 1px solid #f1f5f9;
    }}
    .data-label {{
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
    }}
    .data-value {{
      font-size: 13px;
      font-weight: 600;
      color: #1e293b;
      margin-top: 2px;
    }}
    .attachments-list {{
      display: flex;
      flex-direction: column;
      gap: 8px;
    }}
    .att-item {{
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 12px;
    }}
    .att-link {{
      color: var(--denim);
      font-weight: 600;
      text-decoration: none;
    }}
    .att-link:hover {{
      text-decoration: underline;
    }}
  </style>
</head>
<body>
  <div class="header-bar">
    <div class="header-title-group">
      <span class="code-badge">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/></svg>
        {item.code}
      </span>
      <h2 class="structure-title">{structure_name}</h2>
    </div>
    <a href="{adds_full_url}" target="_blank" rel="noopener noreferrer" class="action-btn">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      Open in RHD ADDS
    </a>
  </div>

  <div class="badges-row">
    <span class="pill pill-stage">{stage_label}</span>
    <span class="pill pill-office">Bridge Design Division {bdd_num}</span>
    <span class="pill pill-office">{div_name}</span>
    <span class="pill pill-status">Status: {item.workflow_status}</span>
  </div>

  <div class="grid-card">
    <div class="card-title">Geographic & Road Alignment</div>
    <div class="data-grid">
      <div class="data-item"><div class="data-label">Road Name</div><div class="data-value">{road_name}</div></div>
      <div class="data-item"><div class="data-label">Chainage</div><div class="data-value">{chainage}</div></div>
      <div class="data-item"><div class="data-label">Field Jurisdiction</div><div class="data-value">{div_name} / {circle_name} / {zone_name}</div></div>
      <div class="data-item"><div class="data-label">Design Execution</div><div class="data-value">{getattr(item, 'design_execution_state', 'NOT_STARTED')}</div></div>
    </div>
  </div>

  <div class="grid-card">
    <div class="card-title">Technical Acquisition Parameters</div>
    <div class="data-grid">
      <div class="data-item"><div class="data-label">Structure Type</div><div class="data-value">{getattr(item, 'proposed_bridge_type', None) or getattr(item, 'culvert_type', 'RCC Box Structure')}</div></div>
      <div class="data-item"><div class="data-label">Proposed Length</div><div class="data-value">{getattr(item, 'proposed_bridge_length_m', 'Not Specified')} m</div></div>
      <div class="data-item"><div class="data-label">River / Channel</div><div class="data-value">{getattr(item, 'river_channel_name', 'None / Land Span')}</div></div>
      <div class="data-item"><div class="data-label">High Flood Level (HFL)</div><div class="data-value">{getattr(item, 'highest_flood_level_hfl', 'N/A')} m</div></div>
      <div class="data-item"><div class="data-label">Standard High Water Level (SHWL)</div><div class="data-value">{getattr(item, 'standard_high_water_level_shwl', 'N/A')} m</div></div>
      <div class="data-item"><div class="data-label">Lowest Water Level (LWL)</div><div class="data-value">{getattr(item, 'lowest_water_level_lwl', 'N/A')} m</div></div>
    </div>
  </div>

  <div class="grid-card">
    <div class="card-title">Staged Survey Documents ({len(attachments)})</div>
    <div class="attachments-list">
      {"".join([f'<div class="att-item"><span><strong>{a.get("slot_code")}:</strong> {a.get("file_name")}</span><a class="att-link" href="/api/attachments/{a.get("id")}/download" target="_blank">Download File</a></div>' for a in attachments]) if attachments else '<p style="font-size:12px; color:#64748b;">No attachments uploaded yet.</p>'}
    </div>
  </div>
</body>
</html>
"""
    return HTMLResponse(content=html_content)
