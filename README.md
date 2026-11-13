# RHD ADDS — System for Coordinated Exchange of Design Data (Bridge & Culvert Acquisition)

[![Roads and Highways Department](https://img.shields.io/badge/RHD-Government%20of%20Bangladesh-00225a?style=flat-square)](https://rhd.gov.bd)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![React 19](https://img.shields.io/badge/React-19.0-61dafb?style=flat-square&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6.0-646cff?style=flat-square&logo=vite)](https://vitejs.dev)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%7C%20SQLite%20Fallback-336791?style=flat-square&logo=postgresql)](https://postgresql.org)
[![Nginx](https://img.shields.io/badge/Reverse%20Proxy-Nginx%20HTTPS-009639?style=flat-square&logo=nginx)](https://nginx.org)

**RHD ADDS (System for Coordinated Exchange of Design Data)** is the official digital acquisition, structural vetting, and endorsement orchestration portal developed for the **Bridge Management Wing (BMW)** and **Bridge Design Circle (BDC)** of the **Roads and Highways Department (RHD)**, Ministry of Road Transport and Bridges, Bangladesh.

The platform bridges the gap between field engineering reconnaissance (sub-divisions/divisions across all 10 RHD zones) and central structural design bureaus in Sarak Bhaban, Tejgaon, Dhaka.

---

## 🌟 Key Functional Modules

### 1. Asset Acquisition Workspaces
- **Bridge Acquisition**: Multi-span hydraulic calculations, structural typologies (Prestressed I-Girder, RCC Box, Steel Truss), seismic zones, navigational clearances, and borehole coordination.
- **Culvert Acquisition**: Low-headroom drainage structures, slab & box culvert parameters, discharge estimations, and foundation criteria.
- **Integrated Borelog Sub-Form**: In-situ soil profiles, SPT $N$-value stratification, and geotechnical soil layer mapping.

### 2. Multi-Tier Chain of Command & Endorsements
- **Hierarchical Workflow**: Sub-Divisional Engineer (SDE) $\rightarrow$ Executive Engineer (EE) $\rightarrow$ Superintending Engineer (SE) $\rightarrow$ Additional Chief Engineer (ACE) $\rightarrow$ Chief Engineer (CE).
- **Formal Endorsement Dossiers**: Digital signature verification, granular correction returns with line-item remarks, and stage-by-stage revision tracking.

### 3. Design Bottleneck Matrix
- Dynamic visual matrix categorizing pending acquisition dossiers by structural difficulty, hydraulic bottleneck, environmental compliance status, and target completion timelines.

### 4. GIS & Spatial Webmap Synchronizer
- Bi-directional integration with `https://webmap.rhdbridge.com` for chainage lookup, national road corridors (N1–N8, regional R-roads, Z-roads), and WGS84 GPS coordinate projection.

### 5. Kinpaku / Crystal Architectural Interface
- Tailored institutional UI designed according to RHD design principles:
  - Deep Navy (`#00225a`), Azure (`#429afe`), Mint (`#15db7c`), and Royal Slate accents.
  - Continuous animated Chroma Horizon line with synchronized cast shadow.
  - Soothing ambient breathing backdrop and high-contrast accessible typography (`Outfit`, `ITC Stone Sans`).

---

## 🏗️ Architecture & Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend SPA** | React 19, Vite 6, Tailwind CSS v4, Lucide Icons, Modern CSS Backdrop Filters |
| **Backend API** | FastAPI, Uvicorn, Pydantic v2, Python-Jose (JWT Auth), ReportLab (PDF), OpenPyXL (Excel) |
| **Database** | PostgreSQL 15+ with PostGIS / Zero-Config SQLite Fallback (`rhd_adds_fallback.db`) |
| **Deployment** | Docker, Docker Compose, Linux Systemd, Nginx TLS 1.3 Reverse Proxy |

---

## ⚙️ Environment Configuration

Copy `.env.example` (or `.env.production.example` on servers) to `.env`:

```bash
cp .env.example .env
```

| Key | Description | Default |
|---|---|---|
| `PORT` | HTTP server port | `8787` |
| `ENVIRONMENT` | Runtime mode (`development` or `production`) | `development` |
| `SECRET_KEY` | JWT signing and cryptographic token secret | *Secure Random String* |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+psycopg2://...` |
| `SQLITE_FALLBACK_URL` | SQLite fallback database path | `sqlite:///./rhd_adds_fallback.db` |
| `WEBMAP_BASE_URL` | Base URL for RHD Webmap GIS services | `https://webmap.rhdbridge.com` |
| `CORS_ALLOWED_ORIGINS` | Permitted origins for API requests | Comma-delimited origins |

---

## 🚀 Quickstart & Local Development

The project includes an intelligent universal launcher (`start.py`):

```bash
# 1. Clone repository
git clone https://github.com/MdIntisharRahman/rhd_bridge_acquisition_form.git
cd rhd_bridge_acquisition_form

# 2. Launch Development Environment (concurrent Vite on :5173 + FastAPI on :8787)
python start.py
```

Arguments for `start.py`:
- `--prod`: Single-port production mode (FastAPI serves built frontend bundle on port 8787).
- `--install`: Automatically checks and installs any missing Python packages or npm modules.
- `--build`: Forces a fresh production rebuild of the frontend before launch.
- `--sqlite`: Forces local SQLite database mode.

---

## 🌐 Production Deployment (VPS / Headless Server)

### Option A: Docker Compose (Recommended)

```bash
# Build and run containers in background
docker compose up -d --build

# View logs
docker compose logs -f
```

### Option B: Native Systemd Service

1. Build frontend and install backend requirements:
   ```bash
   npm --prefix frontend install
   npm --prefix frontend run build
   pip install -r backend/requirements.txt
   ```
2. Copy and enable the systemd service:
   ```bash
   sudo cp deploy/rhd-acqform.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable --now rhd-acqform
   ```

---

## 🔒 Nginx & HTTPS Configuration

The production environment is configured to serve HTTPS over TLS 1.3:

1. Copy the Nginx server block:
   ```bash
   sudo cp deploy/nginx/acqform.rhdbridge.com.conf /etc/nginx/sites-available/
   sudo ln -sf /etc/nginx/sites-available/acqform.rhdbridge.com.conf /etc/nginx/sites-enabled/
   ```
2. Issue or renew Let's Encrypt certificates:
   ```bash
   sudo certbot certonly --webroot -w /var/www/certbot \
     -d acqform.rhdbridge.com -d acq.rhdbridge.com \
     --non-interactive --agree-tos
   ```
3. Test and reload Nginx:
   ```bash
   sudo nginx -t && sudo systemctl reload nginx
   ```

The application will be live at:
- **`https://acqform.rhdbridge.com`**
- **`https://acq.rhdbridge.com`**

---

## 📜 Interactive API Documentation

When the backend is active, open:
- **Swagger UI**: `/api/docs`
- **ReDoc**: `/api/redoc`
- **OpenAPI Schema**: `/api/openapi.json`

---

## 🏛️ Institutional Ownership

**Government of the People's Republic of Bangladesh**  
Roads and Highways Department (RHD)  
Bridge Management Wing / Bridge Design Circle  
Sarak Bhaban, Tejgaon, Dhaka-1208
