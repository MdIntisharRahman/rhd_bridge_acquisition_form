import io
from datetime import datetime
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, mm

def generate_acquisition_pdf(item, acq_type: str, audit_logs=None, attachments=None) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=15 * mm,
        rightMargin=15 * mm,
        topMargin=15 * mm,
        bottomMargin=15 * mm
    )

    styles = getSampleStyleSheet()
    
    # Custom Swiss typography styles
    style_header = ParagraphStyle(
        'RHDHeader',
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        alignment=1,
        textColor=colors.HexColor('#0F172A')
    )
    style_sub = ParagraphStyle(
        'RHDSub',
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        alignment=1,
        textColor=colors.HexColor('#475569')
    )
    style_title = ParagraphStyle(
        'RHDTitle',
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        alignment=1,
        textColor=colors.HexColor('#0284C7') if acq_type == 'BRIDGE' else colors.HexColor('#EA580C')
    )
    style_sec = ParagraphStyle(
        'RHDSecHeader',
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11,
        textColor=colors.HexColor('#0F172A')
    )
    style_cell = ParagraphStyle(
        'RHDCell',
        fontName='Helvetica',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#1E293B')
    )
    style_cell_bold = ParagraphStyle(
        'RHDCellBold',
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#0F172A')
    )
    style_mono = ParagraphStyle(
        'RHDMono',
        fontName='Courier',
        fontSize=7.5,
        leading=9,
        textColor=colors.HexColor('#0F172A')
    )

    story = []

    # Title Block Header
    story.append(Paragraph("GOVERNMENT OF THE PEOPLE'S REPUBLIC OF BANGLADESH", style_sub))
    story.append(Paragraph("ROADS AND HIGHWAYS DEPARTMENT", style_header))
    story.append(Paragraph("BRIDGE DESIGN CIRCLE // sarok bhaban, tejgaon, dhaka", style_sub))
    story.append(Spacer(1, 3 * mm))
    doc_title = "TECHNICAL DATA ACQUISITION SPECIFICATION SHEET — BRIDGE STRUCTURE" if acq_type == "BRIDGE" else "TECHNICAL DATA ACQUISITION SPECIFICATION SHEET — CULVERT STRUCTURE"
    story.append(Paragraph(doc_title, style_title))
    story.append(Spacer(1, 2 * mm))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0284C7" if acq_type == "BRIDGE" else "#EA580C"), spaceBefore=1, spaceAfter=4))

    # Metadata Grid
    datum_label = getattr(item, "reference_datum_type", "PWD") or "PWD"
    meta_data = [
        [
            Paragraph("<b>Dossier Code:</b>", style_cell),
            Paragraph(f"<font color='#0284C7'><b>{item.code}</b></font>", style_mono),
            Paragraph("<b>Workflow Status:</b>", style_cell),
            Paragraph(f"<b>{item.workflow_status}</b>", style_cell)
        ],
        [
            Paragraph("<b>Structure Name:</b>", style_cell),
            Paragraph(str(getattr(item, 'bridge_name', None) or getattr(item, 'culvert_name', 'N/A')), style_cell_bold),
            Paragraph("<b>Reference Datum:</b>", style_cell),
            Paragraph(f"<b>R.L. in m {datum_label}</b>", style_mono)
        ],
        [
            Paragraph("<b>Road Number & Name:</b>", style_cell),
            Paragraph(f"{getattr(item, 'road_name', 'N/A')}", style_cell),
            Paragraph("<b>Location / Chainage:</b>", style_cell),
            Paragraph(f"{getattr(item, 'location_chainage_gps_text', None) or getattr(item, 'location_chainage_lrp_gps', 'N/A')}", style_mono)
        ],
        [
            Paragraph("<b>GPS Coordinates:</b>", style_cell),
            Paragraph(str(item.location_lat_lng or 'N/A'), style_mono),
            Paragraph("<b>Webmap Deep Link:</b>", style_cell),
            Paragraph(f"https://webmap.rhdbridge.com/?code={item.code}", style_mono)
        ]
    ]
    t_meta = Table(meta_data, colWidths=[35*mm, 55*mm, 35*mm, 55*mm])
    t_meta.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#F8FAFC')),
        ('BACKGROUND', (2,0), (2,-1), colors.HexColor('#F8FAFC')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 4 * mm))

    # Detailed Engineering Parameters Table
    story.append(Paragraph("<b>[SEC-01] TECHNICAL SPECIFICATIONS & SURVEY PARAMETERS</b>", style_sec))
    story.append(Spacer(1, 1.5 * mm))

    rows = []
    if acq_type == "BRIDGE":
        params = [
            ("Proposed Bridge Type", getattr(item, 'proposed_bridge_type', 'N/A')),
            ("River / Channel Name & Width", f"{getattr(item, 'river_channel_name', 'N/A')} (Width: {getattr(item, 'channel_width_m', 'N/A')} m)"),
            ("Navigational Clearance Authority & Class", f"{getattr(item, 'nav_clearance_authority', 'N/A')} — {getattr(item, 'nav_clearance_class', 'N/A')} (V: {getattr(item, 'nav_vertical_clearance_m', 'N/A')}m, H: {getattr(item, 'nav_horizontal_clearance_m', 'N/A')}m)"),
            ("Existing Bridge Length & Span Arrangement", f"Length: {getattr(item, 'existing_bridge_length', 'N/A')}; Spans: {getattr(item, 'existing_span_arrangement', 'N/A')}"),
            ("Existing Mid-Span Bottom R.L.", f"{getattr(item, 'existing_mid_span_girder_bottom_rl', 'N/A')} m {datum_label}"),
            ("Existing Foundation Type", getattr(item, 'existing_foundation_type', 'N/A')),
            ("Hydrological Levels (HFL / SHWL / LWL)", f"HFL: {getattr(item, 'highest_flood_level_hfl', 'N/A')} m | SHWL: {getattr(item, 'standard_high_water_level_shwl', 'N/A')} m | LWL: {getattr(item, 'lowest_water_level_lwl', 'N/A')} m"),
            ("Tidal Levels (HTL / LTL)", f"HTL: {getattr(item, 'highest_tide_level_htl', 'N/A')} m | LTL: {getattr(item, 'lowest_tide_level_ltl', 'N/A')} m (Tidal Type: {getattr(item, 'river_tidal_type', 'N/A')})"),
            ("Survey Water Level & Date", f"{getattr(item, 'survey_time_water_level', 'N/A')} m {datum_label} on {getattr(item, 'survey_date', 'N/A')}"),
            ("Stream Flow Direction", getattr(item, 'stream_flow_direction', 'N/A')),
            ("Benchmark Location & Coordinates", f"{getattr(item, 'reference_benchmark_location', 'N/A')} ({getattr(item, 'reference_benchmark_lat_lng', 'N/A')})"),
            ("Proposed Alignment & Offset", f"{getattr(item, 'proposed_alignment', 'N/A')} ({getattr(item, 'proposed_existing_alignment_offset', 'N/A')})"),
            ("Proposed Length & Span Arrangement", f"Length: {getattr(item, 'proposed_bridge_length_m', 'N/A')} m | Spans: {getattr(item, 'proposed_span_arrangement_m', 'N/A')} m"),
            ("Proposed Mid-Span Bottom R.L.", f"{getattr(item, 'proposed_mid_span_bottom_rl', 'N/A')} m {datum_label}"),
            ("Pier Protection & Approach Road Height", f"Protection: {getattr(item, 'pier_protective_work_required', 'N/A')} | Max Height: {getattr(item, 'proposed_max_height_approach_road', 'N/A')} m"),
            ("Electrification & Ancillary Works", f"Electrification: {getattr(item, 'electrification_work_required', 'N/A')} | Ancillary: {getattr(item, 'ancillary_work_required', 'N/A')}"),
            ("BMS Chainage & Total Boreholes", f"BMS: {getattr(item, 'bms_chainage', 'N/A')} | Boreholes: {getattr(item, 'total_borehole_count', 0)}")
        ]
    else:
        params = [
            ("Culvert Alignment & Category", f"{getattr(item, 'proposed_alignment', 'N/A')} — {getattr(item, 'proposed_culvert_category', 'N/A')} ({getattr(item, 'proposed_existing_alignment_offset', 'N/A')})"),
            ("Environmental Context", f"Flash Flood: {getattr(item, 'is_flash_flood_prone', 'No')} | Haor: {getattr(item, 'is_haor_area', 'No')} | Tidal: {getattr(item, 'is_tidal_area', 'No')}"),
            ("Hydrological Levels (HFL / SHWL / LWL)", f"HFL: {getattr(item, 'highest_flood_level_hfl', 'N/A')} m | SHWL: {getattr(item, 'standard_high_water_level_shwl', 'N/A')} m | LWL: {getattr(item, 'lowest_water_level_lwl', 'N/A')} m"),
            ("Existing Culvert Type & Geometry", f"Type: {getattr(item, 'existing_culvert_type', 'None')} | Vents: {getattr(item, 'no_of_vent', 'N/A')} x {getattr(item, 'length_of_each_vent_m', 'N/A')}m (Total: {getattr(item, 'total_length_m', 'N/A')}m) | Clear Height: {getattr(item, 'height_m', 'N/A')}m, Width: {getattr(item, 'width_m', 'N/A')}m"),
            ("Existing Slab / Wall Dimensions", f"Top: {getattr(item, 'top_slab_thickness_mm', 'N/A')}mm | Side: {getattr(item, 'side_wall_thickness_mm', 'N/A')}mm | Bottom: {getattr(item, 'bottom_slab_thickness_mm', 'N/A')}mm"),
            ("Existing Condition & Remarks", f"Structure: {getattr(item, 'existing_structure_condition', 'N/A')} | Foundation: {getattr(item, 'foundation_condition', 'N/A')}"),
            ("Proposed Culvert Type & Geometry", f"Type: {getattr(item, 'proposed_new_sub_type', 'N/A')} | Vents: {getattr(item, 'proposed_no_of_vent', 'N/A')} x {getattr(item, 'proposed_length_each_vent_m', 'N/A')}m (Total: {getattr(item, 'proposed_total_length_m', 'N/A')}m) | Height: {getattr(item, 'proposed_clear_height_m', 'N/A')}m, Width: {getattr(item, 'proposed_clear_width_m', 'N/A')}m"),
            ("Widening Scope (If Applicable)", f"Side: {getattr(item, 'proposed_widening_side', 'N/A')} | Extension Width: {getattr(item, 'proposed_extension_carriage_width_m', 'N/A')}m"),
            ("Benchmark Location & Coordinates", f"{getattr(item, 'reference_benchmark_location', 'N/A')} ({getattr(item, 'reference_benchmark_lat_lng', 'N/A')})"),
            ("Cross Road at Approach & Boreholes", f"Cross Road: {getattr(item, 'cross_road_at_approach', 'N/A')} | Boreholes: {getattr(item, 'total_borehole_count', 0)}")
        ]

    for label, val in params:
        rows.append([
            Paragraph(f"<b>{label}</b>", style_cell),
            Paragraph(str(val), style_cell)
        ])

    t_params = Table(rows, colWidths=[65*mm, 115*mm])
    t_params.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#F8FAFC')),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
    ]))
    story.append(t_params)
    story.append(Spacer(1, 4 * mm))

    # Chain of Command Audit Trail Table
    story.append(Paragraph("<b>[SEC-02] INSTITUTIONAL CHAIN-OF-COMMAND ENDORSEMENT STAMPS</b>", style_sec))
    story.append(Spacer(1, 1.5 * mm))

    audit_rows = [
        [
            Paragraph("<b>Stage / Action</b>", style_cell_bold),
            Paragraph("<b>Officer / Role</b>", style_cell_bold),
            Paragraph("<b>Office / Division</b>", style_cell_bold),
            Paragraph("<b>Date / Time</b>", style_cell_bold),
            Paragraph("<b>Digital Endorsement Remarks</b>", style_cell_bold)
        ]
    ]

    if audit_logs:
        for log in audit_logs:
            ts_str = log.timestamp.strftime("%Y-%m-%d %H:%M") if hasattr(log.timestamp, 'strftime') else str(log.timestamp)
            audit_rows.append([
                Paragraph(log.action or log.to_status, style_mono),
                Paragraph(f"{log.actor_name or 'Officer'}<br/><font color='#64748B'>{log.actor_role}</font>", style_cell),
                Paragraph(str(log.actor_office or 'RHD'), style_cell),
                Paragraph(ts_str, style_mono),
                Paragraph(str(log.endorsement_note or '—'), style_cell)
            ])
    else:
        audit_rows.append([
            Paragraph("INITIAL_RECORD", style_mono),
            Paragraph("Authorized Field Officer", style_cell),
            Paragraph("Field Division", style_cell),
            Paragraph(datetime.utcnow().strftime("%Y-%m-%d"), style_mono),
            Paragraph("Record initialized in RHD ADDS System.", style_cell)
        ])

    t_audit = Table(audit_rows, colWidths=[35*mm, 40*mm, 35*mm, 25*mm, 45*mm])
    t_audit.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_audit)

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
