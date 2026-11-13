@echo off
setlocal
title RHD-ADDS Universal Server Launcher
cd /d "%~dp0"

echo ========================================================================
echo    RHD-ADDS: Automated Design Data System (Universal Windows Launcher)
echo    Roads and Highways Department (RHD), Bangladesh
echo ========================================================================
echo.

set "PYTHON_EXE="

:: 0. Check if user specified PYTHON_EXE or PYTHON environment variable
if defined PYTHON_EXE (
    call :try_py "%PYTHON_EXE%"
    if defined PYTHON_EXE goto :python_found
)
if defined PYTHON (
    call :try_py "%PYTHON%"
    if defined PYTHON_EXE goto :python_found
)

:: 1. Check local virtual environments (verify it can execute without broken host pointer)
call :try_py "%~dp0backend\.venv\Scripts\python.exe"
if defined PYTHON_EXE goto :python_found
call :try_py "%~dp0.venv\Scripts\python.exe"
if defined PYTHON_EXE goto :python_found

:: 2. Check Windows PATH via where
for /f "delims=" %%I in ('where.exe python 2^>nul') do (
    call :try_py "%%I"
    if defined PYTHON_EXE goto :python_found
)
for /f "delims=" %%I in ('where.exe py 2^>nul') do (
    call :try_py "%%I"
    if defined PYTHON_EXE goto :python_found
)

:: 3. Exhaustive search across common drive roots and custom folders
call :try_py "C:\Python314\python.exe"
if defined PYTHON_EXE goto :python_found
call :try_py "C:\Python313\python.exe"
if defined PYTHON_EXE goto :python_found
call :try_py "C:\Python312\python.exe"
if defined PYTHON_EXE goto :python_found
call :try_py "C:\Python311\python.exe"
if defined PYTHON_EXE goto :python_found
call :try_py "C:\Python310\python.exe"
if defined PYTHON_EXE goto :python_found

call :try_py "D:\Python Environment\Python314\python.exe"
if defined PYTHON_EXE goto :python_found
call :try_py "D:\Python Environment\Python313\python.exe"
if defined PYTHON_EXE goto :python_found
call :try_py "D:\Python Environment\Python312\python.exe"
if defined PYTHON_EXE goto :python_found
call :try_py "D:\Python314\python.exe"
if defined PYTHON_EXE goto :python_found
call :try_py "D:\Python313\python.exe"
if defined PYTHON_EXE goto :python_found
call :try_py "D:\Python312\python.exe"
if defined PYTHON_EXE goto :python_found

call :try_py "E:\Python314\python.exe"
if defined PYTHON_EXE goto :python_found
call :try_py "E:\Python313\python.exe"
if defined PYTHON_EXE goto :python_found
call :try_py "E:\Python Environment\Python314\python.exe"
if defined PYTHON_EXE goto :python_found

:: 4. Check AppData Local Programs
if defined LOCALAPPDATA (
    call :try_py "%LOCALAPPDATA%\Programs\Python\Python314\python.exe"
    if defined PYTHON_EXE goto :python_found
    call :try_py "%LOCALAPPDATA%\Programs\Python\Python313\python.exe"
    if defined PYTHON_EXE goto :python_found
    call :try_py "%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
    if defined PYTHON_EXE goto :python_found
    call :try_py "%LOCALAPPDATA%\Programs\Python\Python311\python.exe"
    if defined PYTHON_EXE goto :python_found
    call :try_py "%LOCALAPPDATA%\Programs\Python\Python310\python.exe"
    if defined PYTHON_EXE goto :python_found
)

if defined USERPROFILE (
    call :try_py "%USERPROFILE%\AppData\Local\Programs\Python\Python314\python.exe"
    if defined PYTHON_EXE goto :python_found
    call :try_py "%USERPROFILE%\AppData\Local\Programs\Python\Python313\python.exe"
    if defined PYTHON_EXE goto :python_found
    call :try_py "%USERPROFILE%\AppData\Local\Programs\Python\Python312\python.exe"
    if defined PYTHON_EXE goto :python_found
)

:: 5. Check Program Files
call :try_py "C:\Program Files\Python314\python.exe"
if defined PYTHON_EXE goto :python_found
call :try_py "C:\Program Files\Python313\python.exe"
if defined PYTHON_EXE goto :python_found
call :try_py "C:\Program Files\Python312\python.exe"
if defined PYTHON_EXE goto :python_found
call :try_py "C:\Program Files\Python311\python.exe"
if defined PYTHON_EXE goto :python_found
call :try_py "C:\Program Files\Python310\python.exe"
if defined PYTHON_EXE goto :python_found
call :try_py "C:\Program Files (x86)\Python314\python.exe"
if defined PYTHON_EXE goto :python_found
call :try_py "C:\Program Files (x86)\Python313\python.exe"
if defined PYTHON_EXE goto :python_found
call :try_py "C:\Program Files (x86)\Python312\python.exe"
if defined PYTHON_EXE goto :python_found

:: 6. Check Windows Registry
for /f "tokens=2*" %%a in ('reg query "HKCU\Software\Python\PythonCore" /s /v "ExecutablePath" 2^>nul') do (
    call :try_py "%%b"
    if defined PYTHON_EXE goto :python_found
)
for /f "tokens=2*" %%a in ('reg query "HKLM\Software\Python\PythonCore" /s /v "ExecutablePath" 2^>nul') do (
    call :try_py "%%b"
    if defined PYTHON_EXE goto :python_found
)

:: If still not found
echo [ERROR] Python was not found in PATH or standard installation locations
echo (e.g. C:\Python314, AppData, D:\Python Environment\Python314, etc.).
echo.
echo Please install Python 3.10+ from https://www.python.org/downloads/
echo and ensure "Add Python to PATH" is checked during installation.
echo Or specify the full path manually before running:
echo    set "PYTHON_EXE=C:\Python314\python.exe" ^& start.bat
echo.
pause
exit /b 1

:try_py
if exist "%~1" (
    "%~1" -c "import sys" >nul 2>&1
    if not errorlevel 1 (
        set "PYTHON_EXE=%~1"
    )
)
exit /b

:python_found
echo [OK] Detected Python: "%PYTHON_EXE%"

:: Inject resolved Python and its Scripts directory into session PATH
for %%I in ("%PYTHON_EXE%") do set "PY_DIR=%%~dpI"
if exist "%PY_DIR%Scripts" (
    set "PATH=%PY_DIR%;%PY_DIR%Scripts;%PATH%"
) else (
    set "PATH=%PY_DIR%;%PATH%"
)

:: Self-heal backend\.venv if pyvenv.cfg was pointing to a different PC's Python path
if exist "%~dp0backend\.venv\pyvenv.cfg" (
    "%~dp0backend\.venv\Scripts\python.exe" -c "import sys" >nul 2>&1
    if errorlevel 1 (
        echo [i] Healing local virtual environment to match host Python...
        "%PYTHON_EXE%" -c "import os, sys; vdir=os.path.abspath(r'%~dp0backend\.venv'); cfg=os.path.join(vdir, 'pyvenv.cfg'); open(cfg, 'w').write(f'home = {os.path.dirname(sys.executable)}\ninclude-system-site-packages = false\nversion = {sys.version.split()[0]}\nexecutable = {sys.executable}\ncommand = {sys.executable} -m venv {vdir}\n')" >nul 2>&1
        call :try_py "%~dp0backend\.venv\Scripts\python.exe"
    )
)

:: Create virtualenv in backend\.venv if missing entirely
if not exist "%~dp0backend\.venv" if not exist "%~dp0.venv" (
    echo [i] No local virtual environment found. Initializing backend\.venv...
    "%PYTHON_EXE%" -m venv "%~dp0backend\.venv"
    if exist "%~dp0backend\.venv\Scripts\python.exe" (
        set "PYTHON_EXE=%~dp0backend\.venv\Scripts\python.exe"
        echo Installing core backend requirements...
        "%PYTHON_EXE%" -m pip install --upgrade pip >nul 2>&1
        "%PYTHON_EXE%" -m pip install -r "%~dp0backend\requirements.txt"
    )
)

:: Hand off execution to start.py orchestrator with all passed arguments
echo Launching RHD-ADDS server orchestrator...
"%PYTHON_EXE%" "%~dp0start.py" %*

if %errorlevel% neq 0 (
    echo.
    echo [i] Server exited with code %errorlevel%.
)

endlocal
