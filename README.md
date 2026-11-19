# RHD DESC — Data Exchange System for Coordination (Bridge & Culvert Acquisition)

[![Roads and Highways Department](https://img.shields.io/badge/RHD-Government%20of%20Bangladesh-112047?style=flat-square)](https://rhd.gov.bd)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![React 19](https://img.shields.io/badge/React-19.0-61dafb?style=flat-square&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6.0-646cff?style=flat-square&logo=vite)](https://vitejs.dev)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%7C%20SQLite%20Fallback-1c508c?style=flat-square&logo=postgresql)](https://postgresql.org)
[![Nginx](https://img.shields.io/badge/Reverse%20Proxy-Nginx%20HTTPS-009639?style=flat-square&logo=nginx)](https://nginx.org)
[![NAS](https://img.shields.io/badge/NAS%20Storage-Nextcloud%20Staged%20Hierarchy-3699c2?style=flat-square)](https://nextcloud.com)

**RHD DESC (Data Exchange System for Coordination)**, previously known as **RHD ADDS**, is the official digital asset acquisition, structural vetting, and ministerial design data exchange platform developed for the **Bridge Management Wing (BMW)** and **Bridge Design Circle (BDC)** of the **Roads and Highways Department (RHD)**, Ministry of Road Transport and Bridges, Government of the People's Republic of Bangladesh.

The platform bridges the gap between field engineering reconnaissance (sub-divisions/divisions across all 10 RHD zones) and the central structural design divisions (Bridge Design Division 1, 2, and 3) stationed at Sarak Bhaban, Tejgaon, Dhaka.

---

## 🌟 Key Functional Modules

### 1. Asset Acquisition Workspaces
- **Bridge Acquisition**: Multi-span hydraulic calculations, structural typologies (Prestressed I-Girder, RCC Box, Steel Truss), seismic zones, navigational clearances, and borehole coordination.
- **Culvert Acquisition**: Low-headroom drainage structures, slab & box culvert parameters, discharge estimations, and foundation criteria.
- **Integrated Borelog Sub-Form**: In-situ soil profiles, SPT $N$-value stratification, and geotechnical soil layer mapping.

### 2. Peer EE-to-EE Workflow & Endorsement Pipeline
Direct peer exchange between Field Executive Engineers (`FIELD_EE`) and vested Bridge Design Division Executive Engineers (`BDD_EE` 1, 2, or 3) with customary Sub-Divisional Engineer (`SDE`) verification:
1. `DRAFT_FIELD`: Initial survey entry by Field SAE / SDE.
2. `PENDING_FIELD_EE_AUTH`: Division authorization by Field Executive Engineer.
3. `TRANSMITTED_TO_BDD_EE`: Official transmission to vested central Bridge Design Division EE.
4. `ASSIGNED_TO_BDD_SDE`: Sub-divisional modeling and hydraulic computation.
5. `DESIGN_PREPARED_PENDING_EE`: Vetting of drawings, structural calculations, and BOQ.
6. `DESIGN_APPROVED_COMPLETE`: Handover of vetted design package back to field division.
7. `DISPATCHED_TO_FIELD_SDE`: Execution and construction handover.

### 3. Nextcloud-Powered Network Assisted Storage (NAS) Integration
Demands and delivered design assets are synchronized to a Nextcloud-powered Network Assisted Server (NAS) hierarchy:
- **Hierarchical Directory Scheme**:
  ```text
  /app/backend/storage/nas/
  └── <Zone_Name>/
      └── <Circle_Name>/
          └── <Division_Name>/
              ├── demand/
              │   ├── <Tracking_Code>_demand.json
              │   └── <Uploaded_Field_Surveys_and_Borelogs>
              └── deliverables/
                  └── <Approved_CAD_Drawings_BOQ_and_Reports>
  ```
- **Automated Manifest Synchronization**: For every acquisition record, the backend generates and maintains a normalized `<Tracking_Code>_demand.json` containing complete structural parameters, GPS coordinates, chainage, road IDs, attachments count, and metadata envelopes.

### 4. GIS & Spatial Webmap Interoperability API
The system exposes dedicated endpoints specifically designed for direct ingestion by the [RHD Webmap GIS Portal](https://webmap.rhdbridge.com):
- **Dynamic Demands Catalog (`/api/exchange/webmap/layers`)**: Publishes 9 demand layers categorized across Bridge Design Divisions 1, 2, and 3 for three discrete stages: `Demand`, `Processing`, and `Delivered`. Contains `"classify_with": "field_division"`, `"map_from_legends": true`, and search field configurations.
- **GeoJSON Feature Server (`/api/exchange/webmap/geojson/{layer_table}`)**: Generates real-time WGS84 GeoJSON FeatureCollections from database records and NAS manifests.
- **Interactive Dossier Preview (`/api/exchange/webmap/preview/{acq_type}/{id}`)**: Serves an iframe-embeddable preview dossier into the Webmap modal, complete with real-time status badges, attachments summary, and a quick-action link to the live DESC record.

### 5. Impeccable Color System (Navy / Denim / Steel Blue / Arctic Ice)
Designed in accordance with the official RHD visual standards:
- **Deep Navy (`#112047`)**: Foundation anchors, bridge schemes, demand unaccepted stage, and primary headers.
- **Denim Blue (`#1c508c`)**: Culvert schemes, processing stage, and active navigation controls.
- **Steel Blue (`#3699c2`)**: Delivered stage, status accents, borders, and interactive hover rings.
- **Arctic Ice (`#95d4e5`)**: Ambient pill badges, subtle borders, and highlighted pips.
- **Pale Arctic Wash (`#e7f0f5`)**: Light translucent background containers and frosted cards.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend SPA** | React 19, Vite 6, Tailwind CSS v4, Lucide Icons, Modern Backdrop Filters |
| **Backend API** | FastAPI, Uvicorn, Pydantic v2, Python-Jose (JWT Auth), ReportLab (PDF), OpenPyXL (Excel) |
| **Database** | PostgreSQL 15+ with PostGIS / Zero-Config SQLite Fallback (`rhd_adds_fallback.db`) |
| **NAS Storage** | Structured Local / Nextcloud Network Attached Storage (`nas_storage.py`) |
| **GIS Interop** | Custom Webmap REST GeoJSON Proxy & Dossier Preview Engines |
| **Deployment** | Docker Compose, Linux Systemd, Nginx TLS 1.3 Reverse Proxy |

---

## ⚙️ Environment Configuration

Copy `.env.example` (or `.env.production.example` on servers) to `.env`:

```bash
cp .env.example .env
```

| Key | Description | Default |
|---|---|---|
| `PORT` | HTTP server port | `8787` |
| `ENVIRONMENT` | Runtime mode (`development` or `production`) | `production` |
| `SECRET_KEY` | JWT signing and cryptographic token secret | *Secure Random String* |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+psycopg2://...` |
| `SQLITE_FALLBACK_URL` | SQLite fallback database path | `sqlite:////app/data/rhd_adds_fallback.db` |
| `WEBMAP_BASE_URL` | Base URL for RHD Webmap GIS services | `https://webmap.rhdbridge.com` |
| `NAS_ROOT_PATH` | Base directory for NAS staged folder hierarchy | `/app/backend/storage/nas` |
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

The application runs in production on VPS host `62.171.150.194`:

```bash
# Pull latest updates
cd /opt/acqform
git pull origin main

# Build and recreate containers
docker compose up -d --build acqform

# View live container logs
docker compose logs -f acqform
```

The application is live and secured at:
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
