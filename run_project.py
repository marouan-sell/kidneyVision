#!/usr/bin/env python3
"""
KidneyVision AI — Unified Multi-Service Runner Script
=====================================================
Starts all three KidneyVision microservices simultaneously:
  1. AI Flask Inference Microservice  (Port 5000)
  2. Laravel Backend REST API         (Port 8000)
  3. React Frontend Client            (Port 3000)

Usage:
  python run_project.py
  python run_project.py --no-browser
  python run_project.py --kill-existing
"""

import sys
import os
import time
import socket
import signal
import shutil
import threading
import subprocess
import webbrowser
import argparse
from pathlib import Path

# Configure UTF-8 stdout if possible on Windows
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Terminal ANSI Colors
GREEN = "\033[92m"
CYAN = "\033[96m"
YELLOW = "\033[93m"
MAGENTA = "\033[95m"
RED = "\033[91m"
BOLD = "\033[1m"
RESET = "\033[0m"

# Windows color support initialization
if sys.platform == "win32":
    os.system("")

ROOT_DIR = Path(__file__).resolve().parent
FLASK_DIR = ROOT_DIR / "ai-flask-service"
LARAVEL_DIR = ROOT_DIR / "backend-laravel"
FRONTEND_DIR = ROOT_DIR / "frontend-react"

PROCESSES = []
SHUTTING_DOWN = False


def log(prefix: str, msg: str, color: str = CYAN):
    print(f"{color}[{prefix}]{RESET} {msg}", flush=True)


def is_port_in_use(port: int, host: str = "127.0.0.1") -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex((host, port)) == 0


def kill_pids_on_ports(ports):
    """Finds and kills any processes holding specified ports on Windows."""
    if sys.platform != "win32":
        return
    for port in ports:
        try:
            cmd = f'netstat -ano | findstr /C:":{port} "'
            output = subprocess.check_output(cmd, shell=True, text=True, stderr=subprocess.DEVNULL)
            for line in output.splitlines():
                if "LISTENING" in line:
                    parts = line.strip().split()
                    pid = parts[-1]
                    if pid and pid != "0":
                        subprocess.run(
                            ["taskkill", "/F", "/PID", pid],
                            stdout=subprocess.DEVNULL,
                            stderr=subprocess.DEVNULL,
                        )
                        log("RUNNER", f"Freed port {port} (killed PID {pid})", YELLOW)
        except Exception:
            pass


def find_python_for_ai() -> str:
    # Prefer virtual environment in ai-flask-service
    venv_win = FLASK_DIR / "venv" / "Scripts" / "python.exe"
    venv_unix = FLASK_DIR / "venv" / "bin" / "python"
    if venv_win.exists():
        return str(venv_win)
    if venv_unix.exists():
        return str(venv_unix)
    # Check root venv
    root_win = ROOT_DIR / "venv" / "Scripts" / "python.exe"
    if root_win.exists():
        return str(root_win)
    return sys.executable


def find_php() -> str:
    # 1. Check current PATH
    php = shutil.which("php")
    if php:
        return php

    # 2. Check WinGet package location on Windows
    local_app_data = os.environ.get("LOCALAPPDATA", "")
    if local_app_data:
        winget_pattern = Path(local_app_data) / "Microsoft" / "WinGet" / "Packages"
        if winget_pattern.exists():
            matches = list(winget_pattern.glob("PHP.PHP*/**/php.exe"))
            if matches and matches[0].exists():
                php_found = str(matches[0])
                php_dir = str(matches[0].parent)
                if php_dir not in os.environ.get("PATH", ""):
                    os.environ["PATH"] = f"{php_dir};{os.environ.get('PATH', '')}"
                return php_found

    # 3. Common Laragon or XAMPP fallback locations on Windows
    common_paths = [
        Path(r"C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64\php.exe"),
        Path(r"C:\laragon\bin\php\php-8.2.0-Win32-vs16-x64\php.exe"),
        Path(r"C:\xampp\php\php.exe"),
    ]
    for p in common_paths:
        if p.exists():
            php_dir = str(p.parent)
            if php_dir not in os.environ.get("PATH", ""):
                os.environ["PATH"] = f"{php_dir};{os.environ.get('PATH', '')}"
            return str(p)

    return "php"


def find_npm() -> str:
    npm = shutil.which("npm.cmd") if sys.platform == "win32" else shutil.which("npm")
    return npm if npm else "npm"


def setup_environments():
    log("RUNNER", "Checking configuration & environment files...", BOLD)

    # 1. Root .env
    root_env = ROOT_DIR / ".env"
    root_example = ROOT_DIR / ".env.example"
    if not root_env.exists() and root_example.exists():
        shutil.copy(root_example, root_env)
        log("RUNNER", "Created root .env from .env.example", GREEN)

    # 2. Flask .env
    flask_env = FLASK_DIR / ".env"
    flask_example = FLASK_DIR / ".env.example"
    if not flask_env.exists() and flask_example.exists():
        shutil.copy(flask_example, flask_env)
        log("RUNNER", "Created ai-flask-service .env", GREEN)

    # 3. Laravel .env & SQLite DB
    laravel_env = LARAVEL_DIR / ".env"
    laravel_example = LARAVEL_DIR / ".env.example"
    if not laravel_env.exists() and laravel_example.exists():
        shutil.copy(laravel_example, laravel_env)
        log("RUNNER", "Created backend-laravel .env", GREEN)

    db_file = LARAVEL_DIR / "database" / "database.sqlite"
    if not db_file.exists():
        db_file.parent.mkdir(parents=True, exist_ok=True)
        db_file.touch()
        log("RUNNER", f"Initialized SQLite database at {db_file}", GREEN)

    # 4. Frontend .env
    frontend_env = FRONTEND_DIR / ".env"
    frontend_example = FRONTEND_DIR / ".env.example"
    if not frontend_env.exists() and frontend_example.exists():
        shutil.copy(frontend_example, frontend_env)
        log("RUNNER", "Created frontend-react .env", GREEN)


def stream_output(pipe, prefix: str, color: str):
    try:
        for line in iter(pipe.readline, ""):
            if not line:
                break
            line_str = line.strip()
            if line_str:
                log(prefix, line_str, color)
    except Exception:
        pass
    finally:
        pipe.close()


def kill_proc(proc):
    try:
        if sys.platform == "win32":
            subprocess.run(
                ["taskkill", "/F", "/T", "/PID", str(proc.pid)],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
        else:
            proc.terminate()
            try:
                proc.wait(timeout=3)
            except subprocess.TimeoutExpired:
                proc.kill()
    except Exception:
        pass


def shutdown_all(*args):
    global SHUTTING_DOWN
    if SHUTTING_DOWN:
        return
    SHUTTING_DOWN = True
    print("\n")
    log("RUNNER", "Stopping all KidneyVision AI microservices...", YELLOW)
    for p in PROCESSES:
        kill_proc(p)
    log("RUNNER", "All services stopped cleanly. Goodbye!", GREEN)
    sys.exit(0)


def wait_for_service(url: str, timeout: int = 45) -> bool:
    import urllib.request
    start_time = time.time()
    while time.time() - start_time < timeout:
        if SHUTTING_DOWN:
            return False
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "KidneyVisionRunner/1.0"})
            with urllib.request.urlopen(req, timeout=2) as response:
                if response.status in (200, 301, 302, 304):
                    return True
        except Exception:
            time.sleep(1)
    return False


def monitor_readiness(open_browser: bool):
    time.sleep(2)
    log("RUNNER", "Waiting for services to become available...", CYAN)

    ai_ready = wait_for_service("http://127.0.0.1:5000/health", timeout=35)
    backend_ready = wait_for_service("http://127.0.0.1:8000/api/health", timeout=35)
    frontend_ready = wait_for_service("http://localhost:3000", timeout=35)

    if SHUTTING_DOWN:
        return

    banner = (
        f"\n{BOLD}{GREEN}========================================================================{RESET}\n"
        f"{BOLD}        KIDNEYVISION AI — ALL SERVICES ARE RUNNING!{RESET}\n"
        f"{BOLD}{GREEN}========================================================================{RESET}\n"
        f"  {CYAN}* React Clinical Dashboard:{RESET}   {BOLD}http://localhost:3000{RESET}\n"
        f"  {MAGENTA}* Laravel Backend API:{RESET}        {BOLD}http://127.0.0.1:8000/api{RESET}\n"
        f"  {YELLOW}* Flask AI Inference Engine:{RESET}  {BOLD}http://127.0.0.1:5000/health{RESET}\n"
        f"{BOLD}{GREEN}========================================================================{RESET}\n"
        f"  Press {BOLD}Ctrl + C{RESET} in this terminal anytime to cleanly shut down all services.\n"
    )
    print(banner, flush=True)

    if open_browser and frontend_ready:
        try:
            webbrowser.open("http://localhost:3000")
        except Exception:
            pass


def main():
    parser = argparse.ArgumentParser(description="Run all KidneyVision AI microservices.")
    parser.add_argument(
        "--no-browser",
        action="store_true",
        help="Do not open the web browser automatically",
    )
    parser.add_argument(
        "--kill-existing",
        action="store_true",
        help="Automatically terminate any existing processes using ports 3000, 5000, or 8000",
    )
    args = parser.parse_args()

    # Register exit handlers
    signal.signal(signal.SIGINT, shutdown_all)
    signal.signal(signal.SIGTERM, shutdown_all)

    print(f"\n{BOLD}{CYAN}=== KidneyVision AI Platform Orchestrator ==={RESET}\n")

    setup_environments()

    ports_map = {
        5000: "AI Flask Microservice",
        8000: "Laravel Backend API",
        3000: "React Frontend",
    }

    if args.kill_existing:
        kill_pids_on_ports(list(ports_map.keys()))

    # Port availability check
    for port, name in ports_map.items():
        if is_port_in_use(port):
            log(
                "WARN",
                f"Port {port} ({name}) is in use! If a conflict occurs, pass --kill-existing to free it.",
                YELLOW,
            )

    ai_python = find_python_for_ai()
    php_bin = find_php()
    npm_bin = find_npm()

    log("RUNNER", f"Python (AI):    {ai_python}", CYAN)
    log("RUNNER", f"PHP (Laravel):  {php_bin}", CYAN)
    log("RUNNER", f"NPM (Frontend): {npm_bin}", CYAN)

    # 1. Start AI Flask Service
    log("RUNNER", "Starting AI Flask Microservice on http://127.0.0.1:5000 ...", YELLOW)
    proc_flask = subprocess.Popen(
        [ai_python, "app.py"],
        cwd=str(FLASK_DIR),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )
    PROCESSES.append(proc_flask)
    threading.Thread(
        target=stream_output,
        args=(proc_flask.stdout, "AI-FLASK", YELLOW),
        daemon=True,
    ).start()

    # 2. Start Laravel Backend API
    log("RUNNER", "Starting Laravel Backend API on http://127.0.0.1:8000 ...", MAGENTA)
    proc_laravel = subprocess.Popen(
        [php_bin, "artisan", "serve", "--host=127.0.0.1", "--port=8000"],
        cwd=str(LARAVEL_DIR),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )
    PROCESSES.append(proc_laravel)
    threading.Thread(
        target=stream_output,
        args=(proc_laravel.stdout, "BACKEND", MAGENTA),
        daemon=True,
    ).start()

    # 3. Start React Frontend Client
    log("RUNNER", "Starting React Frontend Client on http://localhost:3000 ...", CYAN)
    proc_frontend = subprocess.Popen(
        [npm_bin, "run", "dev"],
        cwd=str(FRONTEND_DIR),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )
    PROCESSES.append(proc_frontend)
    threading.Thread(
        target=stream_output,
        args=(proc_frontend.stdout, "FRONTEND", CYAN),
        daemon=True,
    ).start()

    # 4. Start health check and banner monitor
    monitor_thread = threading.Thread(
        target=monitor_readiness,
        args=(not args.no_browser,),
        daemon=True,
    )
    monitor_thread.start()

    # Keep main thread alive and watch child processes
    try:
        while True:
            for p in PROCESSES:
                code = p.poll()
                if code is not None and not SHUTTING_DOWN:
                    log("WARN", f"A service exited unexpectedly with code {code}.", RED)
            time.sleep(1)
    except KeyboardInterrupt:
        shutdown_all()


if __name__ == "__main__":
    main()
