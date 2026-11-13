import re
import os
import time
import unicodedata
from collections import defaultdict
from typing import Tuple, Optional
from fastapi import HTTPException, status, Request
from backend.config import settings

# --- Filename Sanitization & Path Traversal Prevention ---

_SAFE_FILENAME_CHARS = re.compile(r'[^a-zA-Z0-9_.-]')

def sanitize_filename(filename: str) -> str:
    """
    Sanitizes uploaded filenames to prevent Directory Traversal, Zip Slip,
    and filesystem injection. Strips directory paths, null bytes, and non-ASCII chars.
    Preserves file extension cleanly.
    """
    if not filename:
        return f"file_{int(time.time())}.bin"

    # Remove any directory paths (both posix and windows)
    base_name = os.path.basename(filename.replace('\\', '/'))
    stem, ext = os.path.splitext(base_name)
    
    # Normalize unicode to NFKD and drop non-ascii from stem
    clean_stem = unicodedata.normalize('NFKD', stem).encode('ascii', 'ignore').decode('ascii')
    clean_stem = _SAFE_FILENAME_CHARS.sub('_', clean_stem).strip('._ ')
    if not clean_stem:
        clean_stem = f"attachment_{int(time.time())}"
        
    # Cap stem length to 100 chars
    clean_stem = clean_stem[:100]

    # Clean extension
    clean_ext = unicodedata.normalize('NFKD', ext).encode('ascii', 'ignore').decode('ascii')
    clean_ext = _SAFE_FILENAME_CHARS.sub('', clean_ext).lower()
    if clean_ext and not clean_ext.startswith('.'):
        clean_ext = f".{clean_ext}"

    return f"{clean_stem}{clean_ext}"

def validate_upload(filename: str, file_size: Optional[int] = None) -> Tuple[str, str]:
    """
    Validates file extension and size against RHD technical standards.
    Raises HTTPException 400 if validation fails.
    Returns (sanitized_filename, extension).
    """
    safe_name = sanitize_filename(filename)
    _, ext = os.path.splitext(safe_name)
    ext_lower = ext.lower()

    # Block executable and dangerous scripts
    forbidden_exts = {
        ".exe", ".bat", ".cmd", ".sh", ".bash", ".ps1", ".vbs",
        ".py", ".pyw", ".js", ".mjs", ".jsx", ".ts", ".tsx",
        ".php", ".phtml", ".asp", ".aspx", ".jsp", ".cgi", ".pl",
        ".html", ".htm", ".xhtml", ".hta", ".svg", ".dll", ".so"
    }
    if ext_lower in forbidden_exts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Upload of executable or scripted file type '{ext_lower}' is strictly prohibited for security reasons."
        )

    if ext_lower not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension '{ext_lower}'. Allowed: {', '.join(sorted(settings.ALLOWED_EXTENSIONS))}"
        )

    if file_size is not None and file_size > settings.MAX_UPLOAD_SIZE_BYTES:
        max_mb = settings.MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum permissible size of {max_mb} MB."
        )

    return safe_name, ext_lower

# --- Banned Terminology Enforcement ---

BANNED_ADMIN_TERMS = re.compile(r'(admin|administrator|adm1n|root|superuser)', re.IGNORECASE)

def validate_no_banned_terms(value: str, field_name: str = "field"):
    """
    Enforces the RHD constitutional rule: terms containing 'admin' or variations
    are permanently forbidden in usernames, roles, and designations.
    """
    if value and BANNED_ADMIN_TERMS.search(value):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"The term 'admin' is prohibited in {field_name}. Use 'SUPREME' or 'WEBMASTER' per RHD governance."
        )

# --- Sliding Window Rate Limiter for Authentication ---

class InMemoryRateLimiter:
    def __init__(self, max_requests: int = 10, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.records = defaultdict(list)

    def check(self, key: str):
        now = time.time()
        timestamps = self.records[key]
        
        # Purge timestamps outside the window
        self.records[key] = [t for t in timestamps if now - t < self.window_seconds]
        
        if len(self.records[key]) >= self.max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many authentication attempts. Please wait {self.window_seconds} seconds before retrying.",
                headers={"Retry-After": str(self.window_seconds)}
            )
        
        self.records[key].append(now)

login_rate_limiter = InMemoryRateLimiter(
    max_requests=settings.RATE_LIMIT_LOGIN_MAX,
    window_seconds=settings.RATE_LIMIT_WINDOW_SECONDS
)

def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"

# --- Geotechnical & Spatial Input Bounds ---

def validate_bangladesh_coordinates(lat: Optional[float], lng: Optional[float]):
    """
    Sanity check for coordinates within Bangladesh territory:
    Latitudes: ~20.5 to ~26.7 N
    Longitudes: ~88.0 to ~92.7 E
    """
    if lat is not None:
        if not (19.0 <= lat <= 28.0):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Latitude {lat:.4f} is outside the geographic bounding box of Bangladesh (20.0 to 27.0 N)."
            )
    if lng is not None:
        if not (87.0 <= lng <= 94.0):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Longitude {lng:.4f} is outside the geographic bounding box of Bangladesh (88.0 to 93.0 E)."
            )

def validate_spt_value(n_val: Optional[int]):
    """
    Validates Standard Penetration Test blow count (0 to 100).
    """
    if n_val is not None:
        if n_val < 0 or n_val > 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"SPT N-value {n_val} is physically invalid. Expected range: 0 to 100 blows."
            )
