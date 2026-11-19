import os
import re
import json
import uuid
import logging
import datetime
from typing import Optional, Tuple, Dict, Any, List
from fastapi import UploadFile, HTTPException, status
from sqlalchemy.orm import Session

from backend.config import settings
from backend.security import sanitize_filename, validate_upload

logger = logging.getLogger("rhd_adds.nas")

def _clean_folder_name(name: Optional[str], default: str = "Unassigned") -> str:
    """Normalize administrative hierarchy names into safe filesystem directory names."""
    if not name or not name.strip():
        return default
    # Replace slashes, backslashes, colons and illegal chars with underscores
    clean = re.sub(r'[\\/*?:"<>|]+', '_', name.strip())
    clean = re.sub(r'\s+', '_', clean)
    clean = re.sub(r'_+', '_', clean).strip('._ ')
    return clean or default

class NASStorageManager:
    """
    Precision Network Attached Storage (NAS) service for RHD ADDS.
    Implements institutional folder hierarchy:
      [Designated Zone] / [Circle] / [Division] / demand /
      [Designated Zone] / [Circle] / [Division] / deliverables /
    Prepares local staging root and provides Nextcloud WebDAV adaptor readiness.
    """

    def __init__(self, staging_dir: Optional[str] = None):
        self.staging_dir = staging_dir or getattr(
            settings, 
            "NAS_STAGING_DIR", 
            os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "storage", "nas")
        )
        os.makedirs(self.staging_dir, exist_ok=True)

    def get_acquisition_hierarchy(self, item) -> Dict[str, str]:
        """Resolve Zone, Circle, Division names from acquisition record."""
        zone_name = item.zone.name if getattr(item, "zone", None) else None
        circle_name = item.circle.name if getattr(item, "circle", None) else None
        division_name = item.division.name if getattr(item, "division", None) else None

        zone_dir = _clean_folder_name(zone_name, "Unassigned_Zone")
        circle_dir = _clean_folder_name(circle_name, "Unassigned_Circle")
        division_dir = _clean_folder_name(division_name, "Unassigned_Division")

        rel_base = os.path.join(zone_dir, circle_dir, division_dir).replace("\\", "/")
        rel_demand = os.path.join(rel_base, "demand").replace("\\", "/")
        rel_deliverables = os.path.join(rel_base, "deliverables").replace("\\", "/")

        abs_demand = os.path.join(self.staging_dir, *rel_demand.split("/"))
        abs_deliverables = os.path.join(self.staging_dir, *rel_deliverables.split("/"))

        os.makedirs(abs_demand, exist_ok=True)
        os.makedirs(abs_deliverables, exist_ok=True)

        return {
            "zone_dir": zone_dir,
            "circle_dir": circle_dir,
            "division_dir": division_dir,
            "rel_base": rel_base,
            "rel_demand": rel_demand,
            "rel_deliverables": rel_deliverables,
            "abs_demand": abs_demand,
            "abs_deliverables": abs_deliverables,
        }

    def serialize_demand(self, item, db: Session) -> Dict[str, Any]:
        """Full structural JSON serialization of a demand placement."""
        from backend.models import Attachment, WorkflowAuditLog

        acq_type = "BRIDGE" if hasattr(item, "proposed_bridge_type") else "CULVERT"

        # Collect attachments
        attachments = db.query(Attachment).filter(
            Attachment.acquisition_type == acq_type,
            Attachment.acquisition_id == item.id
        ).order_by(Attachment.uploaded_at).all()

        # Collect audit logs
        audit_logs = db.query(WorkflowAuditLog).filter(
            WorkflowAuditLog.acquisition_type == acq_type,
            WorkflowAuditLog.acquisition_id == item.id
        ).order_by(WorkflowAuditLog.timestamp).all()

        # Extract all column attributes
        item_data = {}
        for col in item.__table__.columns:
            val = getattr(item, col.name, None)
            if isinstance(val, (datetime.datetime, datetime.date)):
                item_data[col.name] = val.isoformat()
            else:
                item_data[col.name] = val

        return {
            "nas_envelope": {
                "system": "RHD ADDS (Precision Acquisition & Ministerial Pipeline)",
                "schema_version": "2.0.0",
                "storage_architecture": "Nextcloud NAS Staged Hierarchy",
                "generated_at": datetime.datetime.utcnow().isoformat() + "Z",
                "acquisition_type": acq_type,
                "tracking_code": item.code,
                "current_status": item.workflow_status,
                "current_holder_role": item.current_holder_role,
            },
            "administrative_jurisdiction": {
                "zone_id": item.zone_id,
                "zone_name": item.zone.name if getattr(item, "zone", None) else None,
                "circle_id": item.circle_id,
                "circle_name": item.circle.name if getattr(item, "circle", None) else None,
                "division_id": item.division_id,
                "division_name": item.division.name if getattr(item, "division", None) else None,
            },
            "road_network": {
                "road_id": item.road_id,
                "road_number": item.road.road_number if getattr(item, "road", None) else None,
                "road_name": item.road_name,
                "road_type": item.road_type.name if getattr(item, "road_type", None) else None,
                "chainage_text": getattr(item, "location_chainage_gps_text", None) or getattr(item, "location_chainage_lrp_gps", None),
                "chainage_km": getattr(item, "chainage_km", None),
                "chainage_m": getattr(item, "chainage_m", None),
                "location_lat_lng": getattr(item, "location_lat_lng", None),
                "google_map_link": getattr(item, "location_google_map_link", None),
            },
            "dossier_data": item_data,
            "attachments": [
                {
                    "id": a.id,
                    "slot_code": a.slot_code,
                    "file_name": a.file_name,
                    "stored_file_name": a.stored_file_name,
                    "file_size": a.file_size,
                    "mime_type": a.mime_type,
                    "demand_officer_type": a.demand_officer_type,
                    "uploaded_at": a.uploaded_at.isoformat() if a.uploaded_at else None,
                    "disk_path": a.file_path,
                }
                for a in attachments
            ],
            "workflow_audit_trail": [
                {
                    "id": log.id,
                    "timestamp": log.timestamp.isoformat() if log.timestamp else None,
                    "actor_name": log.actor_name,
                    "actor_role": log.actor_role,
                    "actor_office": log.actor_office,
                    "from_status": log.from_status,
                    "to_status": log.to_status,
                    "action": log.action,
                    "endorsement_note": log.endorsement_note,
                }
                for log in audit_logs
            ]
        }

    def sync_demand_json(self, item, db: Session) -> str:
        """Writes serialized demand JSON to [Zone]/[Circle]/[Division]/demand/{code}_demand.json."""
        hierarchy = self.get_acquisition_hierarchy(item)
        payload = self.serialize_demand(item, db)

        code_slug = re.sub(r'[^a-zA-Z0-9_\-]+', '_', item.code or f"demand_{item.id}")
        json_filename = f"{code_slug}_demand.json"
        target_path = os.path.join(hierarchy["abs_demand"], json_filename)
        
        # Write primary code-based demand JSON
        with open(target_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2, ensure_ascii=False)

        # Also write/update canonical demand.json in this folder if single demand or mirror
        canonical_path = os.path.join(hierarchy["abs_demand"], "demand.json")
        try:
            with open(canonical_path, "w", encoding="utf-8") as f:
                json.dump(payload, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.debug("Mirror demand.json notice: %s", e)

        rel_path = f"{hierarchy['rel_demand']}/{json_filename}"
        logger.info("NAS demand JSON synchronized: %s", rel_path)
        return target_path

    async def save_uploaded_attachment(
        self,
        item,
        file: UploadFile,
        slot_code: str,
        demand_officer_type: Optional[str] = None
    ) -> Tuple[str, str, int, str]:
        """
        Saves uploaded file into appropriate NAS directory:
        - Survey / Field Demand files -> [Zone]/[Circle]/[Division]/demand/
        - Design packages / Deliverables -> [Zone]/[Circle]/[Division]/deliverables/
        Returns (destination_path, stored_filename, total_bytes, relative_nas_path).
        """
        hierarchy = self.get_acquisition_hierarchy(item)
        safe_orig_name, ext = validate_upload(file.filename)

        is_deliverable = (
            slot_code.startswith("deliv_") or 
            slot_code in [
                "design_package", "calc_sheet", "design_drawing", 
                "structural_model", "approved_deliverable", "deliverable_drawing", 
                "deliverable_calc", "deliverable_cad"
            ]
        )

        target_dir = hierarchy["abs_deliverables"] if is_deliverable else hierarchy["abs_demand"]
        rel_dir = hierarchy["rel_deliverables"] if is_deliverable else hierarchy["rel_demand"]

        acq_prefix = "brg" if hasattr(item, "proposed_bridge_type") else "clv"
        unique_token = uuid.uuid4().hex[:8]
        stored_name = f"{acq_prefix}_{item.id}_{slot_code}_{unique_token}{ext}"
        dest_path = os.path.join(target_dir, stored_name)

        # Stream chunks with file size enforcement
        total_size = 0
        try:
            with open(dest_path, "wb") as f:
                while True:
                    chunk = await file.read(1024 * 1024)
                    if not chunk:
                        break
                    total_size += len(chunk)
                    if total_size > settings.MAX_UPLOAD_SIZE_BYTES:
                        f.close()
                        if os.path.exists(dest_path):
                            os.remove(dest_path)
                        raise HTTPException(
                            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                            detail=f"Uploaded file exceeds limit of {settings.MAX_UPLOAD_SIZE_BYTES // (1024*1024)} MB."
                        )
                    f.write(chunk)
        except HTTPException:
            raise
        except Exception as e:
            if os.path.exists(dest_path):
                os.remove(dest_path)
            raise HTTPException(status_code=500, detail=f"NAS file storage error: {str(e)}")

        # Also place a copy or hardlink in legacy UPLOAD_DIR for backward compatibility
        try:
            legacy_dest = os.path.join(settings.UPLOAD_DIR, stored_name)
            os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
            if not os.path.exists(legacy_dest):
                import shutil
                shutil.copy2(dest_path, legacy_dest)
        except Exception as e:
            logger.debug("Legacy upload mirror notice: %s", e)

        rel_path = f"{rel_dir}/{stored_name}"
        logger.info("NAS attachment stored: %s (%d bytes)", rel_path, total_size)
        return dest_path, stored_name, total_size, rel_path

    def get_status(self, db: Session) -> Dict[str, Any]:
        """Provides high-level inspection of the staged NAS hierarchy and Nextcloud readiness."""
        total_zones = 0
        total_circles = 0
        total_divisions = 0
        total_demand_jsons = 0
        total_demand_files = 0
        total_deliverable_files = 0
        staged_tree = []

        if os.path.exists(self.staging_dir):
            for zone_entry in os.scandir(self.staging_dir):
                if zone_entry.is_dir() and not zone_entry.name.startswith("."):
                    total_zones += 1
                    zone_info = {"zone": zone_entry.name, "circles": []}
                    for circle_entry in os.scandir(zone_entry.path):
                        if circle_entry.is_dir() and not circle_entry.name.startswith("."):
                            total_circles += 1
                            circ_info = {"circle": circle_entry.name, "divisions": []}
                            for div_entry in os.scandir(circle_entry.path):
                                if div_entry.is_dir() and not div_entry.name.startswith("."):
                                    total_divisions += 1
                                    demand_dir = os.path.join(div_entry.path, "demand")
                                    deliv_dir = os.path.join(div_entry.path, "deliverables")
                                    
                                    d_jsons = [f for f in os.listdir(demand_dir) if f.endswith(".json")] if os.path.exists(demand_dir) else []
                                    d_files = [f for f in os.listdir(demand_dir) if not f.endswith(".json")] if os.path.exists(demand_dir) else []
                                    deliv_files = os.listdir(deliv_dir) if os.path.exists(deliv_dir) else []

                                    total_demand_jsons += len(d_jsons)
                                    total_demand_files += len(d_files)
                                    total_deliverable_files += len(deliv_files)

                                    circ_info["divisions"].append({
                                        "division": div_entry.name,
                                        "demand_jsons": len(d_jsons),
                                        "demand_files": len(d_files),
                                        "deliverables": len(deliv_files),
                                    })
                            zone_info["circles"].append(circ_info)
                    staged_tree.append(zone_info)

        nextcloud_url = os.getenv("NEXTCLOUD_URL", "").strip()
        nextcloud_user = os.getenv("NEXTCLOUD_USERNAME", "").strip()
        has_nextcloud_cfg = bool(nextcloud_url and nextcloud_user)

        return {
            "status": "OPERATIONAL",
            "storage_mode": "NEXTCLOUD_ACTIVE" if has_nextcloud_cfg and os.getenv("STORAGE_BACKEND") == "nextcloud" else "LOCAL_STAGING",
            "staging_dir": self.staging_dir,
            "nextcloud_ready": has_nextcloud_cfg,
            "nextcloud_url": nextcloud_url or "Not Configured (Ready for Connection)",
            "nextcloud_user": nextcloud_user or "None",
            "nextcloud_root_dir": os.getenv("NEXTCLOUD_ROOT_DIR", "/RHD_ADDS_Acquisitions"),
            "readiness_signal": "READY_FOR_NEXTCLOUD_INTEGRATION",
            "telemetry": {
                "total_zones": total_zones,
                "total_circles": total_circles,
                "total_divisions": total_divisions,
                "total_demand_jsons": total_demand_jsons,
                "total_demand_files": total_demand_files,
                "total_deliverable_files": total_deliverable_files,
                "total_staged_objects": total_demand_jsons + total_demand_files + total_deliverable_files,
            },
            "hierarchy_tree": staged_tree
        }

    def sync_all_database_records(self, db: Session) -> Dict[str, int]:
        """Scans database and ensures all bridge and culvert acquisitions have their NAS folder and JSON manifest synced."""
        from backend.models import BridgeAcquisition, CulvertAcquisition

        bridges = db.query(BridgeAcquisition).all()
        culverts = db.query(CulvertAcquisition).all()

        synced_bridges = 0
        synced_culverts = 0

        for b in bridges:
            try:
                self.sync_demand_json(b, db)
                synced_bridges += 1
            except Exception as e:
                logger.error("Failed to sync NAS JSON for bridge %s: %s", b.code, e)

        for c in culverts:
            try:
                self.sync_demand_json(c, db)
                synced_culverts += 1
            except Exception as e:
                logger.error("Failed to sync NAS JSON for culvert %s: %s", c.code, e)

        return {
            "synced_bridges": synced_bridges,
            "synced_culverts": synced_culverts,
            "total_synced": synced_bridges + synced_culverts
        }

# Global singleton
nas_storage = NASStorageManager()
