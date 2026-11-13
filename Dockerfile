# Multi-Stage Dockerfile for RHD ADDS (Automated Design Data System)
# Stage 1: Build Frontend SPA
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Stage 2: Production Python Backend & Unified Server
FROM python:3.12-slim AS runner

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    ENVIRONMENT=production \
    PORT=8787 \
    HOST=0.0.0.0

# Install system dependencies (for psycopg2, reportlab graphics, and networking)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy backend, launcher scripts, and seed data
COPY backend/ /app/backend/
COPY start.py /app/start.py
COPY rhd_master_hierarchy_seed.json /app/rhd_master_hierarchy_seed.json

# Copy built frontend SPA from Stage 1 into frontend/dist
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Expose production port
EXPOSE 8787

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8787/api/health || exit 1

# Start unified production server
CMD ["python", "start.py", "--prod", "--host", "0.0.0.0", "--port", "8787"]
