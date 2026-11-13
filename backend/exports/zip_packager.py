import io
import os
import zipfile
from backend.exports.pdf_generator import generate_acquisition_pdf
from backend.exports.excel_generator import generate_acquisition_excel
from backend.security import sanitize_filename

def package_acquisition_zip(item, acq_type: str, audit_logs=None, attachments=None, boreholes=None) -> bytes:
    buffer = io.BytesIO()

    with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        # 1. 01_Datasheet_PDF
        pdf_bytes = generate_acquisition_pdf(item, acq_type, audit_logs, attachments)
        zip_file.writestr(f"01_Datasheet_PDF/{item.code}_Engineering_Datasheet.pdf", pdf_bytes)

        # 2. Excel Technical Schedule
        excel_bytes = generate_acquisition_excel(item, acq_type, audit_logs, boreholes)
        zip_file.writestr(f"01_Datasheet_PDF/{item.code}_Engineering_Schedule.xlsx", excel_bytes)

        # Map attachment slots to clean engineering folders
        folder_mapping = {
            "demand_letter": "02_Demand_Letters_ACE_SE_EE",
            "demand_letter_ace": "02_Demand_Letters_ACE_SE_EE",
            "demand_letter_se": "02_Demand_Letters_ACE_SE_EE",
            "demand_letter_ee": "02_Demand_Letters_ACE_SE_EE",
            "soil_report": "03_Soil_and_Borelog_Reports",
            "borelog": "03_Soil_and_Borelog_Reports",
            "site_plan": "04_Cross_Sections_and_Site_Plans",
            "cross_section": "04_Cross_Sections_and_Site_Plans",
            "plane_table": "04_Cross_Sections_and_Site_Plans",
            "hydro_morphological": "05_Hydro_Morphological_and_Nav_Clearance",
            "nav_clearance": "05_Hydro_Morphological_and_Nav_Clearance",
            "foundation_layout": "04_Cross_Sections_and_Site_Plans",
            "site_photo_east": "06_Directional_Site_and_Extension_Photos",
            "site_photo_west": "06_Directional_Site_and_Extension_Photos",
            "site_photo_north": "06_Directional_Site_and_Extension_Photos",
            "site_photo_south": "06_Directional_Site_and_Extension_Photos",
            "existing_structure_photo": "06_Directional_Site_and_Extension_Photos",
            "extension_diagram": "06_Directional_Site_and_Extension_Photos"
        }

        # 3. Add uploaded attachments if file exists on disk
        if attachments:
            for att in attachments:
                target_folder = folder_mapping.get(att.slot_code, "06_Directional_Site_and_Extension_Photos")
                clean_att_name = sanitize_filename(att.file_name)
                if os.path.exists(att.file_path):
                    with open(att.file_path, "rb") as f:
                        file_data = f.read()
                    zip_file.writestr(f"{target_folder}/{clean_att_name}", file_data)
                else:
                    # Write placeholder metadata if physical file was cleared
                    meta_note = f"File: {clean_att_name}\nSlot: {att.slot_code}\nSize: {att.file_size} bytes\nUploaded At: {att.uploaded_at}"
                    zip_file.writestr(f"{target_folder}/{clean_att_name}.txt", meta_note.encode("utf-8"))

        # Create README manifest
        readme_content = f"""RHD ONLINE BRIDGE & CULVERT DESIGN DATA ACQUISITION DOSSIER
======================================================================
Dossier Code: {item.code}
Structure Type: {acq_type}
Status: {item.workflow_status}
Road: {getattr(item, 'road_name', 'N/A')}
Location / Chainage: {getattr(item, 'location_chainage_gps_text', None) or getattr(item, 'location_chainage_lrp_gps', 'N/A')}
Coordinates: {item.location_lat_lng or 'N/A'}
Webmap Deep Link: https://webmap.rhdbridge.com/?code={item.code}

DOSSIER DIRECTORY STRUCTURE:
----------------------------------------------------------------------
/01_Datasheet_PDF/
    {item.code}_Engineering_Datasheet.pdf
    {item.code}_Engineering_Schedule.xlsx
/02_Demand_Letters_ACE_SE_EE/
/03_Soil_and_Borelog_Reports/
/04_Cross_Sections_and_Site_Plans/
/05_Hydro_Morphological_and_Nav_Clearance/
/06_Directional_Site_and_Extension_Photos/

Roads and Highways Department (RHD), Bangladesh
Bridge Design Circle, Sarak Bhaban, Tejgaon, Dhaka
"""
        zip_file.writestr("DOSSIER_MANIFEST.txt", readme_content.encode("utf-8"))

    buffer.seek(0)
    return buffer.getvalue()
