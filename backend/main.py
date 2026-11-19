import os
import asyncio
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, FileResponse, StreamingResponse

from backend.config import settings
from backend.database import engine, SessionLocal, Base, run_auto_schema_migrations
from backend.seed import seed_database
from backend.routers import auth, master, bridge, culvert, webmap, exports, supreme, pipeline, nas
from backend.services.nas_storage import nas_storage
from backend.models import Attachment
from backend.security import sanitize_filename

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("rhd_adds")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="RHD System for Coordinated Exchange of Design Data (RHD ADDS) for the Bridge Design Circle, Roads and Highways Department, Bangladesh.",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# Standard Security Headers Middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(self)"
        
        # Defense-in-depth CSP allowing trusted OSM and RHD GIS sources
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://webmap.rhdbridge.com; "
            "connect-src 'self' https://webmap.rhdbridge.com http://localhost:* ws://localhost:*; "
            "font-src 'self' data:; "
            "frame-ancestors 'none';"
        )
        response.headers["Content-Security-Policy"] = csp
        return response

app.add_middleware(SecurityHeadersMiddleware)

# Strict CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Secure Upload Serving (Guards against Path Traversal, Null Bytes, and MIME sniffing)
@app.get("/uploads/{filename:path}")
def serve_upload(filename: str):
    if ".." in filename or filename.startswith("/") or "\\" in filename:
        raise HTTPException(status_code=400, detail="Invalid path traversal attempt.")
        
    clean_name = sanitize_filename(filename)
    
    # Check 1: Primary uploads directory
    file_path = os.path.join(settings.UPLOAD_DIR, clean_name)
    real_path = os.path.realpath(file_path)
    real_upload_dir = os.path.realpath(settings.UPLOAD_DIR)
    
    if real_path.startswith(real_upload_dir) and os.path.exists(real_path) and os.path.isfile(real_path):
        return FileResponse(
            real_path,
            headers={
                "X-Content-Type-Options": "nosniff",
                "Content-Disposition": f'inline; filename="{clean_name}"'
            }
        )

    # Check 2: Staged NAS directory hierarchy
    if os.path.exists(settings.NAS_STAGING_DIR):
        real_nas_dir = os.path.realpath(settings.NAS_STAGING_DIR)
        for root, _, files in os.walk(settings.NAS_STAGING_DIR):
            if clean_name in files:
                candidate = os.path.join(root, clean_name)
                candidate_real = os.path.realpath(candidate)
                if candidate_real.startswith(real_nas_dir) and os.path.isfile(candidate_real):
                    return FileResponse(
                        candidate_real,
                        headers={
                            "X-Content-Type-Options": "nosniff",
                            "Content-Disposition": f'inline; filename="{clean_name}"'
                        }
                    )
    
    raise HTTPException(status_code=404, detail="Requested engineering attachment not found.")

@app.get("/api/attachments/{att_id}/download")
def download_attachment(att_id: int):
    """Direct, secure download and preview endpoint for any uploaded engineering attachment."""
    db = SessionLocal()
    try:
        att = db.query(Attachment).filter(Attachment.id == att_id).first()
        if not att:
            raise HTTPException(status_code=404, detail="Attachment record not found")
        
        # Verify file on disk
        target_path = att.file_path
        if not target_path or not os.path.exists(target_path):
            # Check legacy upload dir
            if att.stored_file_name:
                alt = os.path.join(settings.UPLOAD_DIR, att.stored_file_name)
                if os.path.exists(alt):
                    target_path = alt
            # Check NAS staging
            if (not target_path or not os.path.exists(target_path)) and os.path.exists(settings.NAS_STAGING_DIR) and att.stored_file_name:
                for root, _, files in os.walk(settings.NAS_STAGING_DIR):
                    if att.stored_file_name in files:
                        target_path = os.path.join(root, att.stored_file_name)
                        break

        if not target_path or not os.path.exists(target_path):
            raise HTTPException(status_code=404, detail="Physical file not found in storage.")

        clean_display_name = sanitize_filename(att.file_name or "downloaded_document.pdf")
        return FileResponse(
            target_path,
            media_type=att.mime_type or "application/octet-stream",
            headers={
                "X-Content-Type-Options": "nosniff",
                "Content-Disposition": f'inline; filename="{clean_display_name}"'
            }
        )
    finally:
        db.close()

# Mount production frontend build if available
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(master.router, prefix=settings.API_V1_STR)
app.include_router(bridge.router, prefix=settings.API_V1_STR)
app.include_router(culvert.router, prefix=settings.API_V1_STR)
app.include_router(webmap.router, prefix=settings.API_V1_STR)
app.include_router(exports.router, prefix=settings.API_V1_STR)
app.include_router(supreme.router, prefix=settings.API_V1_STR)
app.include_router(pipeline.router, prefix=settings.API_V1_STR)
app.include_router(nas.router, prefix=settings.API_V1_STR)

@app.on_event("startup")
def on_startup():
    logger.info("Initializing RHD ADDS Backend...")
    try:
        run_auto_schema_migrations(engine)
        seed_database()
        logger.info("RHD Master Hierarchy and Seed Accounts initialized successfully.")
        
        # Synchronize NAS directory structure and demand JSON manifests
        db = SessionLocal()
        try:
            nas_storage.sync_all_database_records(db)
            logger.info("NAS staged folder hierarchy and demand JSONs synchronized.")
        finally:
            db.close()
    except Exception as e:
        logger.error("Startup database seeding encountered error: %s", e)

def get_no_cache_index():
    index_file = os.path.join(frontend_dist, "index.html")
    if os.path.exists(index_file):
        response = FileResponse(index_file)
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        return response
    return None

@app.get("/")
def root():
    resp = get_no_cache_index()
    if resp:
        return resp
    return {
        "system": settings.PROJECT_NAME,
        "department": "Roads and Highways Department (RHD), Bangladesh",
        "wing": "Bridge Management Wing / Bridge Design Circle",
        "version": "2.0.0",
        "status": "OPERATIONAL",
        "docs": "/api/docs",
        "webmap_url": settings.WEBMAP_BASE_URL
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "HEALTHY",
        "database": str(engine.url).split("@")[-1],
        "port": settings.PORT,
        "roles_enforced": [
            settings.ROLE_SUPREME,
            settings.ROLE_WEBMASTER,
            settings.ROLE_FIELD_SAE,
            settings.ROLE_FIELD_SDE,
            settings.ROLE_FIELD_EE,
            settings.ROLE_FIELD_SE,
            settings.ROLE_FIELD_ACE,
            settings.ROLE_BMW_ACE,
            settings.ROLE_BDC_SE,
            settings.ROLE_BDD_EE,
            settings.ROLE_BDD_SDE
        ]
    }

@app.get("/api/dev/live-reload")
async def live_reload_sse():
    """Lightweight real-time SSE event stream notifying the browser whenever frontend bundle rebuilds."""
    async def event_generator():
        index_file = os.path.join(frontend_dist, "index.html")
        last_mtime = os.path.getmtime(index_file) if os.path.exists(index_file) else 0
        try:
            while True:
                await asyncio.sleep(0.4)
                if os.path.exists(index_file):
                    current_mtime = os.path.getmtime(index_file)
                    if current_mtime > last_mtime:
                        last_mtime = current_mtime
                        yield "data: reload\n\n"
        except asyncio.CancelledError:
            pass

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@app.get("/{full_path:path}")
def serve_spa(full_path: str):
    # Exclude internal routes
    if full_path.startswith("api/") or full_path == "api" or full_path.startswith("uploads/") or full_path.startswith("assets/"):
        raise HTTPException(status_code=404, detail="Not Found")
    
    file_path = os.path.join(frontend_dist, full_path)
    real_path = os.path.realpath(file_path)
    real_frontend_dir = os.path.realpath(frontend_dist)
    if not real_path.startswith(real_frontend_dir):
        raise HTTPException(status_code=403, detail="Access denied")

    if os.path.exists(real_path) and os.path.isfile(real_path):
        resp = FileResponse(real_path)
        # If it is html, do not cache
        if real_path.endswith(".html"):
            resp.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0"
        return resp

    # Static asset fallback restriction: don't serve index.html for missing file extensions (.py, .env, .db, etc.)
    _, ext = os.path.splitext(full_path)
    if ext:
        raise HTTPException(status_code=404, detail="File not found")

    resp = get_no_cache_index()
    if resp:
        return resp
    return {
        "detail": "Frontend bundle not found. Please build frontend with 'npm run build'."
    }
