import os
import logging
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import User
from backend.auth import get_current_user
from backend.services.nas_storage import nas_storage

logger = logging.getLogger("rhd_adds.nas_router")

router = APIRouter(prefix="/nas", tags=["Network Attached Storage (NAS)"])

@router.get("/status")
def get_nas_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Returns telemetry and staging status of the NAS folder hierarchy:
      [Designated Zone] / [Circle] / [Division] / demand /
      [Designated Zone] / [Circle] / [Division] / deliverables /
    Also signals readiness for Nextcloud NAS integration.
    """
    return nas_storage.get_status(db)

@router.post("/sync-all")
def sync_all_records(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Admin / Supreme command to synchronize all acquisitions in the database
    into their respective Zone / Circle / Division NAS folders.
    """
    if current_user.role not in ["SUPREME", "WEBMASTER", "BDC_SE", "BMW_ACE"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="NAS batch synchronization is restricted to high-tier governance roles."
        )
    result = nas_storage.sync_all_database_records(db)
    return {
        "success": True,
        "message": f"Successfully synchronized {result['total_synced']} demand dossiers into NAS staged hierarchy.",
        "details": result,
        "status": nas_storage.get_status(db)
    }
