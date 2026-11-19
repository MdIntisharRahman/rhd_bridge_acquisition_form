import os
from typing import List, Set, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "RHD ADDS (System for Coordinated Exchange of Design Data)"
    API_V1_STR: str = "/api"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Cryptographic Secret Key
    SECRET_KEY: str = os.getenv("SECRET_KEY", "rhd-adds-precision-engineering-secret-key-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Primary PostgreSQL with auto fallback support
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql+psycopg2://postgres:postgres@localhost:5432/rhd_adds"
    )
    SQLITE_FALLBACK_URL: str = "sqlite:///./rhd_adds_fallback.db"
    
    WEBMAP_BASE_URL: str = os.getenv("WEBMAP_BASE_URL", "https://webmap.rhdbridge.com")
    UPLOAD_DIR: str = os.getenv(
        "UPLOAD_DIR",
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
    )
    
    # Network Attached Storage (NAS) & Nextcloud Staging Architecture
    NAS_STAGING_DIR: str = os.getenv(
        "NAS_STAGING_DIR",
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "storage", "nas")
    )
    STORAGE_BACKEND: str = os.getenv("STORAGE_BACKEND", "local")  # 'local' or 'nextcloud'
    NEXTCLOUD_URL: str = os.getenv("NEXTCLOUD_URL", "")
    NEXTCLOUD_USERNAME: str = os.getenv("NEXTCLOUD_USERNAME", "")
    NEXTCLOUD_PASSWORD: str = os.getenv("NEXTCLOUD_PASSWORD", "")
    NEXTCLOUD_ROOT_DIR: str = os.getenv("NEXTCLOUD_ROOT_DIR", "/RHD_ADDS_Acquisitions")
    
    # Server binding
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8787"))
    
    # Security & Hardening Controls
    ENABLE_ROLE_SWITCHER: bool = os.getenv("ENABLE_ROLE_SWITCHER", "true").lower() in ("true", "1")
    MAX_UPLOAD_SIZE_BYTES: int = int(os.getenv("MAX_UPLOAD_SIZE_BYTES", str(25 * 1024 * 1024)))  # 25 MB
    ALLOWED_EXTENSIONS: Set[str] = {
        ".pdf", ".dwg", ".dxf", ".xlsx", ".xls", ".csv",
        ".jpg", ".jpeg", ".png", ".webp", ".txt", ".doc", ".docx"
    }
    CORS_ALLOWED_ORIGINS: Union[List[str], str] = [
        "http://localhost:8787",
        "http://127.0.0.1:8787",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://webmap.rhdbridge.com"
    ]

    @field_validator("CORS_ALLOWED_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v):
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                import json
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, tuple)):
            return list(v)
        return v
    RATE_LIMIT_LOGIN_MAX: int = int(os.getenv("RATE_LIMIT_LOGIN_MAX", "10"))  # attempts
    RATE_LIMIT_WINDOW_SECONDS: int = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))  # seconds
    
    # Official RHD Roles (Strictly NO "Admin")
    ROLE_SUPREME: str = "SUPREME"
    ROLE_WEBMASTER: str = "WEBMASTER"
    ROLE_FIELD_SAE: str = "FIELD_SAE"
    ROLE_FIELD_SDE: str = "FIELD_SDE"
    ROLE_FIELD_EE: str = "FIELD_EE"
    ROLE_FIELD_SE: str = "FIELD_SE"
    ROLE_FIELD_ACE: str = "FIELD_ACE"
    ROLE_BMW_ACE: str = "BMW_ACE"
    ROLE_BDC_SE: str = "BDC_SE"
    ROLE_BDD_EE: str = "BDD_EE"
    ROLE_BDD_SDE: str = "BDD_SDE"

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
