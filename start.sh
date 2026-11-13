#!/usr/bin/env bash
# ==============================================================================
# RHD-ADDS: Universal Linux, macOS & VPS Application Launcher
# Roads and Highways Department (RHD), Bangladesh
# Bridge Management Wing / Bridge Design Circle
# ==============================================================================

set -e

# Change directory to project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

# Terminal ANSI Styling
CLR_RESET="\033[0m"
CLR_BOLD="\033[1m"
CLR_CYAN="\033[38;5;51m"
CLR_BLUE="\033[38;5;39m"
CLR_MINT="\033[38;5;48m"
CLR_AMBER="\033[38;5;214m"
CLR_RED="\033[38;5;196m"
CLR_SLATE="\033[38;5;244m"
CLR_WHITE="\033[38;5;255m"

echo -e "\n${CLR_BLUE}╭─────────────────────────────────────────────────────────────╮${CLR_RESET}"
echo -e "${CLR_BLUE}│${CLR_RESET}  ${CLR_BOLD}${CLR_CYAN}⚡ RHD-ADDS${CLR_RESET} ${CLR_SLATE}::${CLR_RESET} ${CLR_BOLD}${CLR_WHITE}Universal Linux & VPS Server Launcher${CLR_RESET}    ${CLR_BLUE}│${CLR_RESET}"
echo -e "${CLR_BLUE}│${CLR_RESET}  ${CLR_SLATE}Roads & Highways Department · Automated Design Data System${CLR_RESET}  ${CLR_BLUE}│${CLR_RESET}"
echo -e "${CLR_BLUE}│${CLR_RESET}  ${CLR_SLATE}Bridge Management Wing / Bridge Design Circle${CLR_RESET}               ${CLR_BLUE}│${CLR_RESET}"
echo -e "${CLR_BLUE}╰─────────────────────────────────────────────────────────────╯${CLR_RESET}\n"

# 1. Exhaustive Python Interpreter Detection
PYTHON_BIN=""
CANDIDATES=(
    "./backend/.venv/bin/python"
    "./backend/.venv/Scripts/python.exe"
    "./.venv/bin/python"
    "./.venv/Scripts/python.exe"
    "$(command -v python3 2>/dev/null)"
    "$(command -v python 2>/dev/null)"
    "/c/Python314/python.exe"
    "/c/Python313/python.exe"
    "/c/Python312/python.exe"
    "/c/Python311/python.exe"
    "/c/Python310/python.exe"
    "/mnt/c/Python314/python.exe"
    "/mnt/c/Python313/python.exe"
    "/mnt/c/Python312/python.exe"
    "/mnt/c/Python311/python.exe"
    "/mnt/c/Python310/python.exe"
    "/d/Python Environment/Python314/python.exe"
    "/mnt/d/Python Environment/Python314/python.exe"
    "/usr/bin/python3"
    "/usr/local/bin/python3"
    "/opt/homebrew/bin/python3"
    "/usr/bin/python3.14"
    "/usr/bin/python3.13"
    "/usr/bin/python3.12"
    "/usr/bin/python3.11"
    "$HOME/.pyenv/shims/python3"
    "$HOME/.local/bin/python3"
)

for cand in "${CANDIDATES[@]}"; do
    if [ -n "$cand" ] && [ -f "$cand" ]; then
        if "$cand" -c "import sys" &>/dev/null; then
            PYTHON_BIN="$cand"
            break
        fi
    fi
done

if [ -z "$PYTHON_BIN" ]; then
    echo -e "${CLR_RED}${CLR_BOLD}[ERROR]${CLR_RESET} Python was not found in PATH or standard installation locations (e.g. C:/Python314, /usr/bin/python3)."
    echo -e "Please install Python 3.10+ or run with: PYTHON_BIN=/path/to/python ./start.sh"
    exit 1
fi

echo -e "${CLR_CYAN}▶${CLR_RESET} Detected Python: ${CLR_BOLD}${PYTHON_BIN}${CLR_RESET}"

# Self-heal backend/.venv if pyvenv.cfg was cloned from another machine with different Python paths
if [ -f "./backend/.venv/pyvenv.cfg" ]; then
    VENV_PY="./backend/.venv/bin/python"
    [ -f "./backend/.venv/Scripts/python.exe" ] && VENV_PY="./backend/.venv/Scripts/python.exe"
    if ! "$VENV_PY" -c "import sys" &>/dev/null; then
        echo -e "${CLR_AMBER}[i]${CLR_RESET} Healing virtual environment configuration to match host Python..."
        "$PYTHON_BIN" -c "import os, sys; vdir=os.path.abspath('backend/.venv'); cfg=os.path.join(vdir, 'pyvenv.cfg'); open(cfg, 'w').write(f'home = {os.path.dirname(sys.executable)}\ninclude-system-site-packages = false\nversion = {sys.version.split()[0]}\nexecutable = {sys.executable}\ncommand = {sys.executable} -m venv {vdir}\n')" 2>/dev/null || true
        if "$VENV_PY" -c "import sys" &>/dev/null; then
            PYTHON_BIN="$VENV_PY"
        fi
    else
        PYTHON_BIN="$VENV_PY"
    fi
fi

# Export Python directory into PATH so dependencies and child processes resolve cleanly
PY_DIR="$(dirname "$PYTHON_BIN")"
export PATH="$PY_DIR:$PY_DIR/Scripts:$PATH"

# 2. Check / Create Virtual Environment if missing
if [ ! -d "./backend/.venv" ] && [ ! -d "./.venv" ]; then
    echo -e "${CLR_AMBER}[i]${CLR_RESET} No virtual environment found. Initializing './backend/.venv'..."
    "$PYTHON_BIN" -m venv "./backend/.venv" || true
    if [ -f "./backend/.venv/bin/python" ]; then
        PYTHON_BIN="./backend/.venv/bin/python"
        echo -e "${CLR_CYAN}↳${CLR_RESET} Installing backend requirements..."
        "$PYTHON_BIN" -m pip install --upgrade pip >/dev/null 2>&1 || true
        "$PYTHON_BIN" -m pip install -r backend/requirements.txt || true
    fi
fi

# 3. Check PostgreSQL status (Kickstart if available, else start.py uses SQLite)
is_pg_listening() {
    if command -v pg_isready &>/dev/null; then
        pg_isready -h 127.0.0.1 -p 5432 -t 2 &>/dev/null
    else
        "$PYTHON_BIN" -c "import socket; s = socket.socket(); s.settimeout(1); res = s.connect_ex(('127.0.0.1', 5432)); s.close(); exit(0 if res == 0 else 1)" &>/dev/null
    fi
}

echo -ne "${CLR_CYAN}▶${CLR_RESET} Probing database service on port 5432... "
if is_pg_listening; then
    echo -e "${CLR_MINT}${CLR_BOLD}[ ONLINE ✓ ]${CLR_RESET}"
else
    echo -e "${CLR_AMBER}[ NOT RUNNING ]${CLR_RESET}"
    if command -v systemctl &>/dev/null; then
        echo -e "  ${CLR_SLATE}↳ Attempting 'sudo systemctl start postgresql'...${CLR_RESET}"
        sudo systemctl start postgresql 2>/dev/null || true
    elif command -v service &>/dev/null; then
        sudo service postgresql start 2>/dev/null || true
    fi

    if is_pg_listening; then
        echo -e "  ${CLR_MINT}${CLR_BOLD}✓ PostgreSQL started successfully.${CLR_RESET}"
    else
        echo -e "  ${CLR_MINT}${CLR_BOLD}✓ Auto-fallback:${CLR_RESET} ${CLR_SLATE}Using embedded SQLite database (rhd_adds_fallback.db).${CLR_RESET}"
    fi
fi

# 4. Check if running on a VPS or production environment
if [ -z "$DISPLAY" ] && ! command -v npm &>/dev/null; then
    echo -e "${CLR_CYAN}▶${CLR_RESET} Headless / VPS environment detected (no desktop npm dev server required)."
    echo -e "  ${CLR_SLATE}FastAPI will directly serve the unified production application bundle.${CLR_RESET}"
    EXTRA_FLAGS="--prod"
else
    EXTRA_FLAGS=""
fi

# 5. Hand over to Python orchestrator
echo -e "\n${CLR_CYAN}▶${CLR_RESET} Executing master ${CLR_BOLD}start.py${CLR_RESET} orchestrator...\n"
exec "$PYTHON_BIN" start.py $EXTRA_FLAGS "$@"
