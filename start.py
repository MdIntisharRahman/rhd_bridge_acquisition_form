#!/usr/bin/env python3
"""
RHD ADDS (System for Coordinated Exchange of Design Data) — Universal Server Launcher & Orchestrator
Roads and Highways Department (RHD), Bangladesh
Bridge Management Wing / Bridge Design Circle

Supports:
  - Local PC Development (Windows, macOS, Linux) with concurrent Vite HMR
  - VPS & Headless Server Deployment (Ubuntu, Debian, CentOS, Docker, Systemd)
  - Seamless auto-fallback to SQLite when PostgreSQL is not installed or stopped
  - Single-port production mode (--prod) serving prebuilt SPA bundle from FastAPI
  - Auto-detection and installation of missing dependencies (--install)
"""

import os
import sys
import time
import socket
import shutil
import signal
import argparse
import subprocess

# Prevent OpenBLAS / MKL thread crashes in multi-process environments
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"

# Force UTF-8 on Windows terminal stdout
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

IS_WINDOWS = sys.platform.startswith("win")
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
FRONTEND_DIR = os.path.join(ROOT_DIR, "frontend")
FRONTEND_DIST = os.path.join(FRONTEND_DIR, "dist")

# Enable ANSI Escape colors on Windows console
if IS_WINDOWS:
    try:
        import ctypes
        kernel32 = ctypes.windll.kernel32
        handle = kernel32.GetStdHandle(-11)  # STD_OUTPUT_HANDLE
        mode = ctypes.c_ulong()
        if kernel32.GetConsoleMode(handle, ctypes.byref(mode)):
            kernel32.SetConsoleMode(handle, mode.value | 0x0004)
    except Exception:
        pass

class Style:
    RESET = "\033[0m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    CYAN = "\033[38;5;51m"
    BLUE = "\033[38;5;39m"
    MINT = "\033[38;5;48m"
    AMBER = "\033[38;5;214m"
    RED = "\033[38;5;196m"
    SLATE = "\033[38;5;244m"
    WHITE = "\033[38;5;255m"

# Track child processes for clean teardown
active_processes = []

def is_working_python(py_path):
    """Verify that the given python binary can actually execute code."""
    if not py_path or not os.path.isfile(py_path):
        return False
    try:
        res = subprocess.run([py_path, "-c", "import sys"], capture_output=True, timeout=3)
        return res.returncode == 0
    except Exception:
        return False

def self_heal_venv(venv_dir, base_py):
    """Repair stale home/executable in pyvenv.cfg if cloned or moved between PCs."""
    cfg_path = os.path.join(venv_dir, "pyvenv.cfg")
    if not os.path.isfile(cfg_path) or not is_working_python(base_py):
        return False
    try:
        base_home = os.path.dirname(os.path.abspath(base_py))
        new_lines = []
        with open(cfg_path, "r", encoding="utf-8", errors="ignore") as f:
            for line in f:
                if line.strip().startswith("home ="):
                    new_lines.append(f"home = {base_home}\n")
                elif line.strip().startswith("executable ="):
                    new_lines.append(f"executable = {base_py}\n")
                elif line.strip().startswith("command ="):
                    new_lines.append(f"command = {base_py} -m venv {venv_dir}\n")
                else:
                    new_lines.append(line)
        with open(cfg_path, "w", encoding="utf-8") as f:
            f.writelines(new_lines)
        venv_py = os.path.join(venv_dir, "Scripts", "python.exe") if IS_WINDOWS else os.path.join(venv_dir, "bin", "python")
        return is_working_python(venv_py)
    except Exception:
        return False

def find_python():
    """Locate appropriate python binary across virtual environments, PATH, and standard system paths."""
    venv_candidates = [
        os.path.join(BACKEND_DIR, ".venv", "Scripts", "python.exe"),
        os.path.join(BACKEND_DIR, ".venv", "bin", "python"),
        os.path.join(ROOT_DIR, ".venv", "Scripts", "python.exe"),
        os.path.join(ROOT_DIR, ".venv", "bin", "python"),
    ]

    # Check if a venv already exists and works
    for v_py in venv_candidates:
        if is_working_python(v_py):
            _inject_path(v_py)
            return v_py

    # Base python candidates
    system_candidates = [
        sys.executable,
        shutil.which("python3"),
        shutil.which("python"),
        shutil.which("py"),
    ]

    # Windows root and AppData standard paths
    if IS_WINDOWS:
        for drive in ("C", "D", "E", "F"):
            for ver in ("314", "313", "312", "311", "310", "39"):
                system_candidates.append(f"{drive}:\\Python{ver}\\python.exe")
                system_candidates.append(f"{drive}:\\Python Environment\\Python{ver}\\python.exe")
                system_candidates.append(f"{drive}:\\Python\\python.exe")
        
        local_appdata = os.environ.get("LOCALAPPDATA", "")
        user_profile = os.environ.get("USERPROFILE", "")
        prog_files = os.environ.get("ProgramFiles", "C:\\Program Files")
        prog_files_x86 = os.environ.get("ProgramFiles(x86)", "C:\\Program Files (x86)")

        for ver in ("314", "313", "312", "311", "310", "39"):
            if local_appdata:
                system_candidates.append(os.path.join(local_appdata, "Programs", "Python", f"Python{ver}", "python.exe"))
            if user_profile:
                system_candidates.append(os.path.join(user_profile, "AppData", "Local", "Programs", "Python", f"Python{ver}", "python.exe"))
            system_candidates.append(os.path.join(prog_files, f"Python{ver}", "python.exe"))
            system_candidates.append(os.path.join(prog_files_x86, f"Python{ver}", "python.exe"))
    else:
        system_candidates.extend([
            "/usr/bin/python3",
            "/usr/local/bin/python3",
            "/opt/homebrew/bin/python3",
            "/opt/python/bin/python3",
            "/usr/bin/python3.14",
            "/usr/bin/python3.13",
            "/usr/bin/python3.12",
            os.path.expanduser("~/.local/bin/python3"),
            os.path.expanduser("~/.pyenv/shims/python3"),
        ])

    base_python = None
    for cand in system_candidates:
        if is_working_python(cand):
            base_python = cand
            break

    # If base python is found, attempt to heal local virtualenv if it was broken
    if base_python:
        for venv_dir in [os.path.join(BACKEND_DIR, ".venv"), os.path.join(ROOT_DIR, ".venv")]:
            if os.path.isdir(venv_dir):
                if self_heal_venv(venv_dir, base_python):
                    v_py = os.path.join(venv_dir, "Scripts", "python.exe") if IS_WINDOWS else os.path.join(venv_dir, "bin", "python")
                    _inject_path(v_py)
                    return v_py
        _inject_path(base_python)
        return base_python

    # Fallback to sys.executable
    _inject_path(sys.executable)
    return sys.executable

def _inject_path(py_path):
    if not py_path:
        return
    pydir = os.path.dirname(os.path.abspath(py_path))
    scripts_dir = os.path.join(pydir, "Scripts" if IS_WINDOWS else "bin")
    path_parts = os.environ.get("PATH", "").split(os.pathsep)
    if pydir not in path_parts:
        os.environ["PATH"] = pydir + os.pathsep + os.environ.get("PATH", "")
    if os.path.isdir(scripts_dir) and scripts_dir not in path_parts:
        os.environ["PATH"] = scripts_dir + os.pathsep + os.environ.get("PATH", "")

def find_npm():
    """Locate npm executable."""
    return shutil.which("npm.cmd" if IS_WINDOWS else "npm") or shutil.which("npm")

def is_port_busy(port, host="127.0.0.1"):
    """Check if TCP port is already occupied."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(0.8)
            return s.connect_ex((host, port)) == 0
    except Exception:
        return False

def check_postgres_listening(host="127.0.0.1", port=5432):
    """Probe if PostgreSQL is accepting TCP connections."""
    # 1. Probe via pg_isready if available
    pg_isready = shutil.which("pg_isready")
    if pg_isready:
        try:
            res = subprocess.run([pg_isready, "-h", host, "-p", str(port), "-t", "2"],
                                 stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=3)
            if res.returncode == 0:
                return True
        except Exception:
            pass

    # 2. Raw TCP socket probe
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(1.2)
            return s.connect_ex((host, port)) == 0
    except Exception:
        return False

def attempt_kickstart_postgres():
    """Attempt to start local PostgreSQL service if installed."""
    if check_postgres_listening():
        return True

    print(f"   {Style.SLATE}↳ Checking if local PostgreSQL service can be started...{Style.RESET}")

    # Windows Service Start
    if IS_WINDOWS:
        for svc in ["postgresql-x64-18", "postgresql-x64-17", "postgresql-x64-16", "postgresql"]:
            try:
                subprocess.run(["net", "start", svc], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=4)
                time.sleep(1.5)
                if check_postgres_listening():
                    return True
            except Exception:
                pass

    # Linux systemctl / service
    elif shutil.which("systemctl"):
        try:
            subprocess.run(["sudo", "systemctl", "start", "postgresql"],
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=4)
            time.sleep(1.5)
            if check_postgres_listening():
                return True
        except Exception:
            pass

    return check_postgres_listening()

def ensure_dependencies(python_bin, auto_install=False):
    """Verify backend and frontend dependencies are present."""
    # 1. Backend python modules check
    test_code = "import fastapi, uvicorn, sqlalchemy, pydantic, jose, openpyxl, reportlab"
    res = subprocess.run([python_bin, "-c", test_code], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    if res.returncode != 0:
        print(f"   {Style.AMBER}⚡ Python dependencies missing in environment.{Style.RESET}")
        req_file = os.path.join(BACKEND_DIR, "requirements.txt")
        if auto_install or "--install" in sys.argv:
            print(f"   {Style.CYAN}↳ Installing requirements from {req_file}...{Style.RESET}")
            subprocess.run([python_bin, "-m", "pip", "install", "-r", req_file], check=True)
        else:
            print(f"   {Style.SLATE}Run '{python_bin} -m pip install -r backend/requirements.txt' or use '--install'.{Style.RESET}")

    # 2. Frontend node_modules check
    npm_bin = find_npm()
    node_modules = os.path.join(FRONTEND_DIR, "node_modules")
    if npm_bin and not os.path.exists(node_modules):
        if auto_install or "--install" in sys.argv:
            print(f"   {Style.CYAN}↳ Running 'npm install' in frontend directory...{Style.RESET}")
            cmd = ["cmd.exe", "/c", "npm", "install"] if IS_WINDOWS else ["npm", "install"]
            subprocess.run(cmd, cwd=FRONTEND_DIR, check=True)
        else:
            print(f"   {Style.SLATE}Notice: frontend/node_modules missing. (Run 'npm install' or pass '--install'){Style.RESET}")

def ensure_frontend_build():
    """Ensure frontend/dist bundle exists for single-port / production mode."""
    index_html = os.path.join(FRONTEND_DIST, "index.html")
    if not os.path.exists(index_html):
        print(f"   {Style.AMBER}⚡ Frontend production bundle (frontend/dist) not found.{Style.RESET}")
        npm_bin = find_npm()
        if npm_bin:
            print(f"   {Style.CYAN}↳ Executing 'npm run build' to generate production bundle...{Style.RESET}")
            cmd = ["cmd.exe", "/c", "npm", "run", "build"] if IS_WINDOWS else ["npm", "run", "build"]
            subprocess.run(cmd, cwd=FRONTEND_DIR, check=True)
            print(f"   {Style.MINT}✓ Production bundle successfully created at frontend/dist.{Style.RESET}")
        else:
            print(f"   {Style.RED}⚠️  npm not available to build frontend.{Style.RESET}")

def cleanup(sig=None, frame=None):
    """Graceful termination handler for all child processes."""
    print(f"\n{Style.AMBER}⚡ Shutting down RHD-ADDS services...{Style.RESET}")
    for p, name in active_processes:
        if p.poll() is None:
            print(f"   {Style.SLATE}↳ Stopping {Style.BOLD}{name}{Style.RESET}{Style.SLATE} (PID {p.pid})...{Style.RESET}")
            try:
                if IS_WINDOWS:
                    subprocess.call(["taskkill", "/F", "/T", "/PID", str(p.pid)],
                                    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                else:
                    p.terminate()
            except Exception:
                pass
    print(f"{Style.MINT}✓ All services stopped cleanly.{Style.RESET}\n")
    sys.exit(0)

# Register shutdown signals
signal.signal(signal.SIGINT, cleanup)
signal.signal(signal.SIGTERM, cleanup)

def main():
    parser = argparse.ArgumentParser(
        description="RHD ADDS — Universal Development & Production Server Runner"
    )
    parser.add_argument("--prod", "--production", action="store_true",
                        help="Run in single-port production mode (FastAPI serves built SPA on port 8787/PORT). Recommended for VPS/Docker.")
    parser.add_argument("--dev", action="store_true",
                        help="Force development mode (FastAPI backend on 8787 + Vite HMR on 5173).")
    parser.add_argument("--host", default=os.getenv("HOST", "0.0.0.0"),
                        help="Host IP to bind (default: 0.0.0.0 for VPS/network access, or 127.0.0.1 for local only).")
    parser.add_argument("--port", type=int, default=int(os.getenv("PORT", "8787")),
                        help="Backend/Unified HTTP port (default: 8787, or set PORT env var).")
    parser.add_argument("--sqlite", action="store_true",
                        help="Force local SQLite database mode (rhd_adds_fallback.db), skipping PostgreSQL check.")
    parser.add_argument("--install", action="store_true",
                        help="Auto-check and install any missing python/npm dependencies before launching.")
    parser.add_argument("--build", action="store_true",
                        help="Force a fresh 'npm run build' of the frontend client before starting.")
    args = parser.parse_args()

    # Determine mode:
    # 1. Explicit --prod or --dev
    # 2. Environment variable ENVIRONMENT=production
    # 3. If npm is not installed or on a headless VPS without display, default to --prod
    npm_bin = find_npm()
    is_prod = args.prod or (os.getenv("ENVIRONMENT") == "production") or (not args.dev and not npm_bin)

    print(f"""{Style.BLUE}╭─────────────────────────────────────────────────────────────╮
│  {Style.CYAN}⚡ RHD-ADDS{Style.RESET} {Style.SLATE}::{Style.RESET} {Style.BOLD}{Style.WHITE}Universal Server Launcher{Style.RESET}                      {Style.BLUE}│
│  {Style.DIM}Roads and Highways Department · System for Coordinated Exchange of Design Data{Style.RESET}   {Style.BLUE}│
│  {Style.SLATE}Bridge Management Wing / Bridge Design Circle{Style.RESET}               {Style.BLUE}│
╰─────────────────────────────────────────────────────────────╯{Style.RESET}""")

    python_bin = find_python()
    print(f"   {Style.SLATE}Python Interpreter:{Style.RESET} {python_bin}")
    print(f"   {Style.SLATE}Execution Mode:{Style.RESET}     {Style.BOLD}{Style.CYAN}{'PRODUCTION (Single-Port SPA)' if is_prod else 'DEVELOPMENT (Vite HMR + FastAPI)'}{Style.RESET}")
    print(f"   {Style.SLATE}Binding Interface:{Style.RESET}  {Style.BOLD}{args.host}:{args.port}{Style.RESET}")

    # 1. Dependency checks
    if args.install:
        ensure_dependencies(python_bin, auto_install=True)

    # 2. Database verification & auto-fallback
    print(f"\n{Style.CYAN}◆ [1/3]{Style.RESET} {Style.BOLD}Database Verification & Initialization{Style.RESET}")
    if args.sqlite:
        print(f"   {Style.MINT}✓{Style.RESET} SQLite mode explicitly forced by user flag (--sqlite).")
        os.environ["DATABASE_URL"] = "sqlite:///./rhd_adds_fallback.db"
    else:
        db_url = os.getenv("DATABASE_URL", "postgresql+psycopg2://postgres:postgres@localhost:5432/rhd_adds")
        if "postgresql" in db_url:
            pg_host = "127.0.0.1"
            pg_port = 5432
            try:
                from urllib.parse import urlparse
                clean_url = db_url.split("://", 1)[-1]
                parsed = urlparse("http://" + clean_url)
                if parsed.hostname:
                    pg_host = parsed.hostname
                if parsed.port:
                    pg_port = parsed.port
            except Exception:
                pass

            pg_active = check_postgres_listening(host=pg_host, port=pg_port)
            if not pg_active and pg_host in ("127.0.0.1", "localhost", ""):
                pg_active = attempt_kickstart_postgres()

            if pg_active:
                print(f"   {Style.MINT}✓{Style.RESET} Primary PostgreSQL database active on {pg_host}:{pg_port}.")
            else:
                print(f"   {Style.AMBER}↳ PostgreSQL is not responding on {pg_host}:{pg_port}.{Style.RESET}")
                print(f"   {Style.MINT}✓{Style.RESET} Seamless auto-fallback: utilizing embedded SQLite engine (rhd_adds_fallback.db).")
                os.environ["DATABASE_URL"] = "sqlite:///./rhd_adds_fallback.db"
        else:
            print(f"   {Style.MINT}✓{Style.RESET} Utilizing custom database URL: {db_url.split('@')[-1]}")

    # Run DB Table Creation & Seeding
    try:
        sys.path.insert(0, ROOT_DIR)
        from backend.database import engine, Base
        from backend.seed import seed_database
        Base.metadata.create_all(bind=engine)
        seed_database()
        print(f"   {Style.MINT}✓{Style.RESET} Database schema and administrative seed accounts verified.")
    except Exception as e:
        print(f"   {Style.AMBER}↳ Database initialization note: {e}{Style.RESET}")

    # 3. Port check
    if is_port_busy(args.port, args.host if args.host != "0.0.0.0" else "127.0.0.1"):
        print(f"   {Style.RED}⚠️  ERROR: Port {args.port} is already in use by another application.{Style.RESET}")
        print(f"   {Style.SLATE}Please free port {args.port} or specify another with '--port <number>'.{Style.RESET}")
        sys.exit(1)

    # 4. Handle production build if necessary
    if is_prod or args.build:
        print(f"\n{Style.CYAN}◆ [2/3]{Style.RESET} {Style.BOLD}Verifying Production Client Build{Style.RESET}")
        if args.build or not os.path.exists(os.path.join(FRONTEND_DIST, "index.html")):
            ensure_frontend_build()
        else:
            print(f"   {Style.MINT}✓{Style.RESET} Pre-compiled production bundle detected in frontend/dist.")
    else:
        print(f"\n{Style.CYAN}◆ [2/3]{Style.RESET} {Style.BOLD}Preparing Development Services{Style.RESET}")

    # 5. Launch FastAPI Application
    print(f"\n{Style.CYAN}◆ [3/3]{Style.RESET} {Style.BOLD}Launching FastAPI Server Engine...{Style.RESET}")
    backend_env = os.environ.copy()
    backend_env["PYTHONPATH"] = ROOT_DIR
    backend_env["HOST"] = args.host
    backend_env["PORT"] = str(args.port)

    uvicorn_cmd = [
        python_bin, "-m", "uvicorn", "backend.main:app",
        "--host", args.host,
        "--port", str(args.port)
    ]
    if not is_prod:
        uvicorn_cmd.append("--reload")

    p_backend = subprocess.Popen(uvicorn_cmd, cwd=ROOT_DIR, env=backend_env)
    active_processes.append((p_backend, "Backend (FastAPI Engine)"))
    time.sleep(1.5)

    # 6. Launch Vite Development Server (if in development mode)
    if not is_prod and npm_bin:
        vite_port = 5173
        print(f"   {Style.CYAN}↳ Launching Vite Development Server (HMR) on port {vite_port}...{Style.RESET}")
        frontend_env = os.environ.copy()
        frontend_env["VITE_API_URL"] = f"http://127.0.0.1:{args.port}/api"
        frontend_env["VITE_API_TARGET"] = f"http://127.0.0.1:{args.port}"

        frontend_cmd = ["cmd.exe", "/c", "npm", "run", "dev"] if IS_WINDOWS else ["npm", "run", "dev"]
        p_frontend = subprocess.Popen(frontend_cmd, cwd=FRONTEND_DIR, env=frontend_env)
        active_processes.append((p_frontend, "Frontend (React Vite Dev Server)"))

    # Summary Display
    display_host = "localhost" if args.host in ("0.0.0.0", "127.0.0.1") else args.host
    print(f"""
{Style.BLUE}╭─────────────────────────────────────────────────────────────╮
│  {Style.MINT}●{Style.RESET} {Style.BOLD}{Style.WHITE}RHD-ADDS APPLICATION IS LIVE & RUNNING{Style.RESET}                     {Style.BLUE}│
├─────────────────────────────────────────────────────────────┤""")

    if not is_prod and npm_bin:
        print(f"""│  {Style.CYAN}✦{Style.RESET} {Style.BOLD}Frontend Client (Vite HMR):{Style.RESET}   {Style.BLUE}http://{display_host}:5173{Style.RESET}            {Style.BLUE}│
│  {Style.CYAN}✦{Style.RESET} {Style.BOLD}Backend API & Static Host:{Style.RESET}    {Style.BLUE}http://{display_host}:{args.port}{Style.RESET}            {Style.BLUE}│""")
    else:
        print(f"""│  {Style.CYAN}✦{Style.RESET} {Style.BOLD}Unified Application URL:{Style.RESET}      {Style.BLUE}http://{display_host}:{args.port}{Style.RESET}            {Style.BLUE}│
│  {Style.CYAN}✦{Style.RESET} {Style.BOLD}Mode:{Style.RESET}                         {Style.MINT}Production (Single-Port SPA){Style.RESET}   {Style.BLUE}│""")

    print(f"""│  {Style.CYAN}✦{Style.RESET} {Style.BOLD}Interactive API Docs:{Style.RESET}         {Style.BLUE}http://{display_host}:{args.port}/api/docs{Style.RESET}   {Style.BLUE}│
│  {Style.CYAN}✦{Style.RESET} {Style.BOLD}System Health Status:{Style.RESET}         {Style.BLUE}http://{display_host}:{args.port}/api/health{Style.RESET} {Style.BLUE}│
│                                                             │
│  {Style.SLATE}Press {Style.BOLD}[Ctrl+C]{Style.RESET}{Style.SLATE} anytime to initiate safe shutdown.{Style.RESET}           {Style.BLUE}│
╰─────────────────────────────────────────────────────────────╯{Style.RESET}
""")

    # Keep master process alive and monitor children
    try:
        while True:
            time.sleep(1)
            for p, name in active_processes:
                if p.poll() is not None:
                    print(f"{Style.AMBER}⚠️  Process {name} terminated with code {p.returncode}. Initiating shutdown.{Style.RESET}")
                    cleanup()
    except KeyboardInterrupt:
        cleanup()

if __name__ == "__main__":
    main()
