import io
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

def generate_acquisition_excel(item, acq_type: str, audit_logs=None, boreholes=None) -> bytes:
    wb = Workbook()
    
    # Styles
    font_header = Font(name="Arial", size=11, bold=True, color="FFFFFF")
    font_bold = Font(name="Arial", size=10, bold=True, color="0F172A")
    font_regular = Font(name="Arial", size=10, color="1E293B")
    font_mono = Font(name="Courier New", size=9, color="0F172A")
    
    fill_header = PatternFill(start_color="0F172A", end_color="0F172A", fill_type="solid")
    fill_accent = PatternFill(start_color="0284C7" if acq_type == "BRIDGE" else "EA580C", end_color="0284C7" if acq_type == "BRIDGE" else "EA580C", fill_type="solid")
    fill_zebra = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")
    
    border_thin = Border(
        left=Side(style='thin', color='CBD5E1'),
        right=Side(style='thin', color='CBD5E1'),
        top=Side(style='thin', color='CBD5E1'),
        bottom=Side(style='thin', color='CBD5E1')
    )

    # 1. Sheet 1: Dossier Summary
    ws1 = wb.active
    ws1.title = "Dossier Summary"
    
    ws1.merge_cells("A1:D1")
    ws1["A1"] = f"RHD ADDS // {acq_type} SPECIFICATION: {item.code}"
    ws1["A1"].font = Font(name="Arial", size=14, bold=True, color="FFFFFF")
    ws1["A1"].fill = fill_accent
    ws1["A1"].alignment = Alignment(horizontal="center", vertical="center")
    ws1.row_dimensions[1].height = 30

    summary_rows = [
        ("Structure Code", item.code),
        ("Workflow Status", item.workflow_status),
        ("Structure Name", getattr(item, 'bridge_name', None) or getattr(item, 'culvert_name', 'N/A')),
        ("Road Name", getattr(item, 'road_name', 'N/A')),
        ("Location / Chainage", getattr(item, 'location_chainage_gps_text', None) or getattr(item, 'location_chainage_lrp_gps', 'N/A')),
        ("GPS Coordinates", str(item.location_lat_lng or 'N/A')),
        ("Reference Datum", getattr(item, 'reference_datum_type', 'PWD')),
        ("Webmap Link", f"https://webmap.rhdbridge.com/?code={item.code}"),
        ("Created At", str(item.created_at)),
        ("Last Updated", str(item.updated_at))
    ]

    for idx, (lbl, val) in enumerate(summary_rows, start=3):
        ws1[f"A{idx}"] = lbl
        ws1[f"A{idx}"].font = font_bold
        ws1[f"A{idx}"].fill = fill_zebra
        ws1[f"A{idx}"].border = border_thin
        
        ws1[f"B{idx}"] = str(val)
        ws1[f"B{idx}"].font = font_regular
        ws1[f"B{idx}"].border = border_thin
        ws1.row_dimensions[idx].height = 20

    ws1.column_dimensions["A"].width = 25
    ws1.column_dimensions["B"].width = 65

    # 2. Sheet 2: Technical Parameters
    ws2 = wb.create_sheet(title="Technical Parameters")
    ws2.append(["Parameter Code", "Engineering Parameter Description", "Specified Value", "Unit / Datum"])
    ws2.row_dimensions[1].height = 25
    for col in ["A", "B", "C", "D"]:
        ws2[f"{col}1"].font = font_header
        ws2[f"{col}1"].fill = fill_header
        ws2[f"{col}1"].alignment = Alignment(horizontal="center", vertical="center")

    datum = getattr(item, 'reference_datum_type', 'PWD') or 'PWD'
    if acq_type == "BRIDGE":
        t_params = [
            ("BRG-01", "Proposed Bridge Type", getattr(item, 'proposed_bridge_type', 'N/A'), "—"),
            ("BRG-02", "River / Channel Name", getattr(item, 'river_channel_name', 'N/A'), "—"),
            ("BRG-03", "Channel Width", getattr(item, 'channel_width_m', 'N/A'), "meters"),
            ("BRG-04", "Navigational Clearance Authority", getattr(item, 'nav_clearance_authority', 'N/A'), "—"),
            ("BRG-05", "Navigational Clearance Class", getattr(item, 'nav_clearance_class', 'N/A'), "—"),
            ("BRG-06", "Navigational Vertical Clearance", getattr(item, 'nav_vertical_clearance_m', 'N/A'), "meters"),
            ("BRG-07", "Navigational Horizontal Clearance", getattr(item, 'nav_horizontal_clearance_m', 'N/A'), "meters"),
            ("BRG-08", "Existing Bridge Length", getattr(item, 'existing_bridge_length', 'N/A'), "meters / text"),
            ("BRG-09", "Existing Span Arrangement", getattr(item, 'existing_span_arrangement', 'N/A'), "meters"),
            ("BRG-10", "Existing Mid-Span Bottom R.L.", getattr(item, 'existing_mid_span_girder_bottom_rl', 'N/A'), f"m {datum}"),
            ("BRG-11", "Existing Foundation Type", getattr(item, 'existing_foundation_type', 'N/A'), "—"),
            ("BRG-12", "Proposed Alignment", getattr(item, 'proposed_alignment', 'N/A'), "—"),
            ("BRG-13", "Proposed Length of Bridge", getattr(item, 'proposed_bridge_length_m', 'N/A'), "meters"),
            ("BRG-14", "Proposed Span Arrangement", getattr(item, 'proposed_span_arrangement_m', 'N/A'), "meters"),
            ("BRG-15", "Proposed Mid-Span Bottom R.L.", getattr(item, 'proposed_mid_span_bottom_rl', 'N/A'), f"m {datum}"),
            ("BRG-16", "Pier Protective Work", getattr(item, 'pier_protective_work_required', 'N/A'), "—"),
            ("BRG-17", "Ancillary Works", getattr(item, 'ancillary_work_required', 'N/A'), "—"),
            ("BRG-18", "Remarks", getattr(item, 'remarks', 'N/A'), "—")
        ]
    else:
        t_params = [
            ("CLV-01", "Culvert Alignment", getattr(item, 'proposed_alignment', 'N/A'), "—"),
            ("CLV-02", "Proposed Culvert Category", getattr(item, 'proposed_culvert_category', 'N/A'), "—"),
            ("CLV-03", "Existing Culvert Type", getattr(item, 'existing_culvert_type', 'N/A'), "—"),
            ("CLV-04", "Existing No. of Vents", getattr(item, 'no_of_vent', 'N/A'), "nos"),
            ("CLV-05", "Existing Length of Each Vent", getattr(item, 'length_of_each_vent_m', 'N/A'), "meters"),
            ("CLV-06", "Existing Total Length", getattr(item, 'total_length_m', 'N/A'), "meters"),
            ("CLV-07", "Existing Clear Height", getattr(item, 'height_m', 'N/A'), "meters"),
            ("CLV-08", "Existing Clear Width", getattr(item, 'width_m', 'N/A'), "meters"),
            ("CLV-09", "Proposed Culvert Type", getattr(item, 'proposed_new_sub_type', 'N/A'), "—"),
            ("CLV-10", "Proposed No. of Vents", getattr(item, 'proposed_no_of_vent', 'N/A'), "nos"),
            ("CLV-11", "Proposed Vent Length", getattr(item, 'proposed_length_each_vent_m', 'N/A'), "meters"),
            ("CLV-12", "Proposed Total Length", getattr(item, 'proposed_total_length_m', 'N/A'), "meters"),
            ("CLV-13", "Proposed Clear Height", getattr(item, 'proposed_clear_height_m', 'N/A'), "meters"),
            ("CLV-14", "Proposed Clear Width", getattr(item, 'proposed_clear_width_m', 'N/A'), "meters"),
            ("CLV-15", "Widening Scope", getattr(item, 'proposed_widening_side', 'N/A'), "—")
        ]

    for p in t_params:
        ws2.append([p[0], p[1], str(p[2]), p[3]])

    ws2.column_dimensions["A"].width = 18
    ws2.column_dimensions["B"].width = 40
    ws2.column_dimensions["C"].width = 35
    ws2.column_dimensions["D"].width = 18

    # 3. Sheet 3: Hydrological & Levels
    ws3 = wb.create_sheet(title="Hydrological & Datum Levels")
    ws3.append(["Level Code", "Hydrological Level Description", "Reduced Level (R.L.)", f"Unit ({datum})"])
    for col in ["A", "B", "C", "D"]:
        ws3[f"{col}1"].font = font_header
        ws3[f"{col}1"].fill = fill_header

    hydro_rows = [
        ("HYD-01", "Highest Flood Level (HFL)", getattr(item, 'highest_flood_level_hfl', 'N/A'), f"m {datum}"),
        ("HYD-02", "Standard High Water Level (SHWL)", getattr(item, 'standard_high_water_level_shwl', 'N/A'), f"m {datum}"),
        ("HYD-03", "Lowest Water Level (LWL)", getattr(item, 'lowest_water_level_lwl', 'N/A'), f"m {datum}"),
        ("HYD-04", "Highest Tide Level (HTL)", getattr(item, 'highest_tide_level_htl', 'N/A'), f"m {datum}"),
        ("HYD-05", "Lowest Tide Level (LTL)", getattr(item, 'lowest_tide_level_ltl', 'N/A'), f"m {datum}"),
        ("HYD-06", "Water Level at Survey", getattr(item, 'survey_time_water_level', 'N/A'), f"m {datum}")
    ]
    for hr in hydro_rows:
        ws3.append([hr[0], hr[1], str(hr[2]), hr[3]])
    ws3.column_dimensions["A"].width = 18
    ws3.column_dimensions["B"].width = 35
    ws3.column_dimensions["C"].width = 25
    ws3.column_dimensions["D"].width = 18

    # 4. Sheet 4: Borehole Logs
    ws4 = wb.create_sheet(title="Borehole Logs")
    ws4.append(["Borehole #", "UID", "Chainage", "Latitude", "Longitude", "Ground RL (m)", "Water Table (m)", "Remarks"])
    for col in ["A", "B", "C", "D", "E", "F", "G", "H"]:
        ws4[f"{col}1"].font = font_header
        ws4[f"{col}1"].fill = fill_header

    if boreholes:
        for bh in boreholes:
            ws4.append([
                bh.borehole_no,
                bh.borehole_uid or "—",
                bh.chainage or "—",
                bh.lat or 0.0,
                bh.lng or 0.0,
                bh.ground_bed_rl or 0.0,
                bh.water_table_depth or 0.0,
                bh.remarks or "—"
            ])
    ws4.column_dimensions["A"].width = 12
    ws4.column_dimensions["B"].width = 30
    ws4.column_dimensions["C"].width = 18
    ws4.column_dimensions["D"].width = 15
    ws4.column_dimensions["E"].width = 15
    ws4.column_dimensions["F"].width = 15
    ws4.column_dimensions["G"].width = 15
    ws4.column_dimensions["H"].width = 35

    # 5. Sheet 5: Chain of Command Audit Trail
    ws5 = wb.create_sheet(title="Audit Trail")
    ws5.append(["Timestamp", "Action", "Actor Name", "Actor Role", "Office", "From Status", "To Status", "Endorsement Notes"])
    for col in ["A", "B", "C", "D", "E", "F", "G", "H"]:
        ws5[f"{col}1"].font = font_header
        ws5[f"{col}1"].fill = fill_header

    if audit_logs:
        for al in audit_logs:
            ws5.append([
                str(al.timestamp),
                al.action,
                al.actor_name or "—",
                al.actor_role,
                al.actor_office or "—",
                al.from_status,
                al.to_status,
                al.endorsement_note or "—"
            ])
    ws5.column_dimensions["A"].width = 22
    ws5.column_dimensions["B"].width = 25
    ws5.column_dimensions["C"].width = 25
    ws5.column_dimensions["D"].width = 20
    ws5.column_dimensions["E"].width = 30
    ws5.column_dimensions["F"].width = 25
    ws5.column_dimensions["G"].width = 25
    ws5.column_dimensions["H"].width = 40

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return buffer.getvalue()
