import io
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    """Two-pass canvas to dynamically compute and print total page counts."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            super().showPage()
        super().save()

    def draw_page_number(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        # Header rule on pages 2+
        if self._pageNumber > 1:
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(15 * mm, 285 * mm, 195 * mm, 285 * mm)
            self.drawString(15 * mm, 287 * mm, "ROADS & HIGHWAYS DEPARTMENT // BRIDGE ACQUISITION DATA SPECIFICATION")

        # Footer on all pages
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(15 * mm, 12 * mm, 195 * mm, 12 * mm)
        self.drawString(15 * mm, 8 * mm, "RHD-ADDS (Bridge & Culvert Acquisition Decision Support System) • Official Engineering Record")
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(195 * mm, 8 * mm, page_text)
        self.restoreState()


def generate_acquisition_pdf(item, acq_type: str, audit_logs=None, attachments=None, boreholes=None) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=15 * mm,
        rightMargin=15 * mm,
        topMargin=16 * mm,
        bottomMargin=16 * mm
    )

    theme_color = colors.HexColor("#0284C7") if acq_type == "BRIDGE" else colors.HexColor("#EA580C")
    
    # Custom Swiss typography styles
    style_header = ParagraphStyle(
        'RHDHeader',
        fontName='Helvetica-Bold',
        fontSize=12.5,
        leading=15,
        alignment=1,
        textColor=colors.HexColor('#0F172A')
    )
    style_sub = ParagraphStyle(
        'RHDSub',
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        alignment=1,
        textColor=colors.HexColor('#475569')
    )
    style_title = ParagraphStyle(
        'RHDTitle',
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=13,
        alignment=1,
        textColor=theme_color
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
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor('#1E293B')
    )
    style_cell_bold = ParagraphStyle(
        'RHDCellBold',
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9.5,
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
    story.append(Paragraph("BRIDGE DESIGN CIRCLE // ROAD RESEARCH AND TRAINING CENTRE // TEJGAON, DHAKA", style_sub))
    story.append(Spacer(1, 2.5 * mm))
    doc_title = "TECHNICAL DATA ACQUISITION SPECIFICATION SHEET — BRIDGE STRUCTURE" if acq_type == "BRIDGE" else "TECHNICAL DATA ACQUISITION SPECIFICATION SHEET — CULVERT STRUCTURE"
    story.append(Paragraph(doc_title, style_title))
    story.append(Spacer(1, 1.5 * mm))
    story.append(HRFlowable(width="100%", thickness=1.5, color=theme_color, spaceBefore=1, spaceAfter=4))

    # Hierarchy details
    div_name = "N/A"
    circ_name = "N/A"
    zone_name = "N/A"
    if getattr(item, 'division', None):
        div_name = item.division.name
        if getattr(item.division, 'circle', None):
            circ_name = item.division.circle.name
            if getattr(item.division.circle, 'zone', None):
                zone_name = item.division.circle.zone.name
    elif getattr(item, 'division_name', None):
        div_name = item.division_name

    hierarchy_str = f"{div_name} Division"
    if circ_name != "N/A":
        hierarchy_str += f" • {circ_name} Circle"
    if zone_name != "N/A":
        hierarchy_str += f" • {zone_name} Zone"

    # Official Road display
    road_number = ""
    if getattr(item, 'road', None):
        road_number = getattr(item.road, 'road_number', '') or ''
    road_name_val = getattr(item, 'road_name', '') or ''
    if road_number and road_name_val:
        road_str = f"<b>{road_number}</b> — {road_name_val}"
    else:
        road_str = road_name_val or road_number or "N/A"

    # Metadata Grid
    datum_label = getattr(item, "reference_datum_type", "MSL") or "MSL"
    meta_data = [
        [
            Paragraph("<b>Dossier Code:</b>", style_cell),
            Paragraph(f"<font color='{theme_color.hexval()}'><b>{item.code}</b></font>", style_mono),
            Paragraph("<b>Workflow Status:</b>", style_cell),
            Paragraph(f"<b>{item.workflow_status}</b>", style_cell)
        ],
        [
            Paragraph("<b>Structure Name:</b>", style_cell),
            Paragraph(str(getattr(item, 'bridge_name', None) or getattr(item, 'culvert_name', 'N/A')), style_cell_bold),
            Paragraph("<b>RHD Jurisdiction:</b>", style_cell),
            Paragraph(hierarchy_str, style_cell)
        ],
        [
            Paragraph("<b>Road Number & Name:</b>", style_cell),
            Paragraph(road_str, style_cell),
            Paragraph("<b>Reference Datum:</b>", style_cell),
            Paragraph(f"<b>R.L. in m {datum_label}</b>", style_mono)
        ],
        [
            Paragraph("<b>Location / Chainage:</b>", style_cell),
            Paragraph(f"{getattr(item, 'location_chainage_gps_text', None) or getattr(item, 'location_chainage_lrp_gps', 'N/A')}", style_mono),
            Paragraph("<b>GPS Coordinates:</b>", style_cell),
            Paragraph(str(item.location_lat_lng or 'N/A'), style_mono)
        ]
    ]
    t_meta = Table(meta_data, colWidths=[35*mm, 55*mm, 35*mm, 55*mm])
    t_meta.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#F8FAFC')),
        ('BACKGROUND', (2,0), (2,-1), colors.HexColor('#F8FAFC')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 3.5 * mm))

    # Detailed Engineering Parameters Table
    story.append(Paragraph("<b>[SEC-01] TECHNICAL SPECIFICATIONS & HYDRAULIC/GEOTECHNICAL PARAMETERS</b>", style_sec))
    story.append(Spacer(1, 1.2 * mm))

    rows = []
    if acq_type == "BRIDGE":
        params = [
            ("Proposed Bridge Type", getattr(item, 'proposed_bridge_type', 'N/A')),
            ("River / Channel Name & Width", f"{getattr(item, 'river_channel_name', 'N/A')} (Width: {getattr(item, 'channel_width_m', 'N/A')} m)"),
            ("Navigational Clearance Class", f"{getattr(item, 'nav_clearance_authority', 'N/A')} — {getattr(item, 'nav_clearance_class', 'N/A')} (V: {getattr(item, 'nav_vertical_clearance_m', 'N/A')}m, H: {getattr(item, 'nav_horizontal_clearance_m', 'N/A')}m)"),
            ("Existing Bridge Length & Spans", f"Length: {getattr(item, 'existing_bridge_length', 'N/A')}; Spans: {getattr(item, 'existing_span_arrangement', 'N/A')}"),
            ("Existing Mid-Span Bottom R.L.", f"{getattr(item, 'existing_mid_span_girder_bottom_rl', 'N/A')} m {datum_label}"),
            ("Existing Foundation Type", getattr(item, 'existing_foundation_type', 'N/A')),
            ("Hydrological Levels (HFL / SHWL / LWL)", f"HFL: {getattr(item, 'highest_flood_level_hfl', 'N/A')} m | SHWL: {getattr(item, 'standard_high_water_level_shwl', 'N/A')} m | LWL: {getattr(item, 'lowest_water_level_lwl', 'N/A')} m"),
            ("Tidal Levels (HTL / LTL)", f"HTL: {getattr(item, 'highest_tide_level_htl', 'N/A')} m | LTL: {getattr(item, 'lowest_tide_level_ltl', 'N/A')} m (Tidal Type: {getattr(item, 'river_tidal_type', 'N/A')})"),
            ("Survey Water Level & Date", f"{getattr(item, 'survey_time_water_level', 'N/A')} m {datum_label} on {getattr(item, 'survey_date', 'N/A')}"),
            ("Stream Flow Direction", getattr(item, 'stream_flow_direction', 'N/A')),
            ("Benchmark Location & Coordinates", f"{getattr(item, 'reference_benchmark_location', 'N/A')} ({getattr(item, 'reference_benchmark_lat_lng', 'N/A')})"),
            ("Proposed Alignment & Offset", f"{getattr(item, 'proposed_alignment', 'N/A')} ({getattr(item, 'proposed_existing_alignment_offset', 'N/A')})"),
            ("Proposed Length & Spans", f"Length: {getattr(item, 'proposed_bridge_length_m', 'N/A')} m | Spans: {getattr(item, 'proposed_span_arrangement_m', 'N/A')} m"),
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
            ("Existing Culvert Type & Geometry", f"Type: {getattr(item, 'existing_culvert_type', 'None')} | Vents: {getattr(item, 'no_of_vent', 'N/A')} x {getattr(item, 'length_of_each_vent_m', 'N/A')}m (Total: {getattr(item, 'total_length_m', 'N/A')}m) | Height: {getattr(item, 'height_m', 'N/A')}m, Width: {getattr(item, 'width_m', 'N/A')}m"),
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
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
    ]))
    story.append(t_params)
    story.append(Spacer(1, 3.5 * mm))

    # SEC-02: Geotechnical Boreholes Summary (if present)
    if boreholes and len(boreholes) > 0:
        story.append(Paragraph("<b>[SEC-02] GEOTECHNICAL BOREHOLE INVESTIGATION DATA</b>", style_sec))
        story.append(Spacer(1, 1.2 * mm))
        bh_rows = [
            [
                Paragraph("<b>BH #</b>", style_cell_bold),
                Paragraph("<b>Depth (m)</b>", style_cell_bold),
                Paragraph(f"<b>Water Table (m {datum_label})</b>", style_cell_bold),
                Paragraph("<b>Coordinates (Lat, Lng)</b>", style_cell_bold),
                Paragraph("<b>SPT / Subsoil Strata Remarks</b>", style_cell_bold)
            ]
        ]
        for bh in boreholes:
            bh_rows.append([
                Paragraph(str(bh.borehole_no or 'BH-01'), style_mono),
                Paragraph(str(bh.depth_m or 'N/A'), style_mono),
                Paragraph(str(bh.ground_water_table_m or 'N/A'), style_mono),
                Paragraph(f"{bh.latitude or '—'}, {bh.longitude or '—'}", style_mono),
                Paragraph(str(bh.remarks or 'Standard SPT boring executed per ASTM D1586'), style_cell)
            ])
        t_bh = Table(bh_rows, colWidths=[20*mm, 25*mm, 35*mm, 45*mm, 55*mm])
        t_bh.setStyle(TableStyle([
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F1F5F9')),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('TOPPADDING', (0,0), (-1,-1), 2),
            ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ]))
        story.append(t_bh)
        story.append(Spacer(1, 3.5 * mm))

    # SEC-03: Attachments / Engineering Deliverables Dossier
    if attachments and len(attachments) > 0:
        sec_num = "03" if boreholes and len(boreholes) > 0 else "02"
        story.append(Paragraph(f"<b>[SEC-{sec_num}] ATTACHED TECHNICAL DOSSIER & DRAWINGS</b>", style_sec))
        story.append(Spacer(1, 1.2 * mm))
        att_rows = [
            [
                Paragraph("<b>Discipline / Slot</b>", style_cell_bold),
                Paragraph("<b>Original File Name</b>", style_cell_bold),
                Paragraph("<b>MIME Type</b>", style_cell_bold),
                Paragraph("<b>Uploaded On</b>", style_cell_bold)
            ]
        ]
        for a in attachments:
            up_str = a.uploaded_at.strftime("%Y-%m-%d %H:%M") if hasattr(a, 'uploaded_at') and a.uploaded_at else "Verified"
            slot_disp = (a.slot_code or "deliverable").replace("_", " ").title()
            att_rows.append([
                Paragraph(slot_disp, style_cell_bold),
                Paragraph(a.file_name or a.stored_file_name, style_cell),
                Paragraph(a.mime_type or "application/pdf", style_mono),
                Paragraph(up_str, style_mono)
            ])
        t_att = Table(att_rows, colWidths=[45*mm, 75*mm, 35*mm, 25*mm])
        t_att.setStyle(TableStyle([
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F1F5F9')),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('TOPPADDING', (0,0), (-1,-1), 2),
            ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ]))
        story.append(t_att)
        story.append(Spacer(1, 3.5 * mm))

    # SEC-04: Chain of Command Audit Trail Table
    sec_audit_num = "04" if (boreholes and len(boreholes) > 0 and attachments and len(attachments) > 0) else ("03" if (boreholes or attachments) else "02")
    story.append(Paragraph(f"<b>[SEC-{sec_audit_num}] INSTITUTIONAL CHAIN-OF-COMMAND ENDORSEMENT STAMPS</b>", style_sec))
    story.append(Spacer(1, 1.2 * mm))

    audit_rows = [
        [
            Paragraph("<b>Stage / Action</b>", style_cell_bold),
            Paragraph("<b>Officer / Role</b>", style_cell_bold),
            Paragraph("<b>Office / Division</b>", style_cell_bold),
            Paragraph("<b>Date / Time</b>", style_cell_bold),
            Paragraph("<b>Digital Endorsement Remarks</b>", style_cell_bold)
        ]
    ]

    if audit_logs and len(audit_logs) > 0:
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
            Paragraph(div_name if div_name != "N/A" else "Field Division", style_cell),
            Paragraph(datetime.utcnow().strftime("%Y-%m-%d %H:%M"), style_mono),
            Paragraph("Record initialized in RHD DESC (Data Exchange System for Coordination).", style_cell)
        ])

    t_audit = Table(audit_rows, colWidths=[35*mm, 40*mm, 35*mm, 25*mm, 45*mm])
    t_audit.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
    ]))
    story.append(t_audit)

    doc.build(story, canvasmaker=NumberedCanvas)
    buffer.seek(0)
    return buffer.getvalue()
