#!/usr/bin/env python3
"""
KidneyVision AI — Azure Production One-Click Deployment Script
Automates: Local Git Push -> Azure VM SSH Pull -> Docker Zero-Downtime Rebuild & Health Check
"""

import sys
import subprocess
import argparse

# Force UTF-8 on Windows stdout if possible
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

SSH_HOST = "kidneyvision-azure"
SSH_KEY_FALLBACK = r"C:\Users\LENOVO\.ssh\server_key.pem"
REMOTE_USER = "azureuser"
REMOTE_IP = "9.205.29.254"
REMOTE_DIR = "~/kidneyVision"
PUBLIC_URL = "https://kidneyvision.publicvm.com"


def log(msg, symbol="[INFO]"):
    print(f"\n{symbol}  {msg}")


def run_local(cmd, check=True):
    print(f"  [LOCAL] $ {cmd}")
    res = subprocess.run(cmd, shell=True, text=True, capture_output=True)
    if res.stdout:
        print(res.stdout.strip())
    if res.stderr and res.returncode != 0:
        print(f"  [ERROR] {res.stderr.strip()}", file=sys.stderr)
    if check and res.returncode != 0:
        sys.exit(f"Command failed with code {res.returncode}")
    return res


def run_remote(commands):
    full_cmd = f"cd {REMOTE_DIR} && " + " && ".join(commands)
    ssh_cmd = f'ssh -n {SSH_HOST} "{full_cmd}"'
    print(f"  [REMOTE] $ {full_cmd}")
    res = subprocess.run(ssh_cmd, shell=True, text=True, capture_output=True)
    if res.stdout:
        print(res.stdout.strip())
    if res.stderr:
        print(f"  [REMOTE MSG] {res.stderr.strip()}")
    if res.returncode != 0:
        # Fallback to direct key if host alias fails
        ssh_fallback = f'ssh -n -i "{SSH_KEY_FALLBACK}" -o StrictHostKeyChecking=no {REMOTE_USER}@{REMOTE_IP} "{full_cmd}"'
        res = subprocess.run(ssh_fallback, shell=True, text=True, capture_output=True)
        if res.stdout:
            print(res.stdout.strip())
        if res.returncode != 0:
            sys.exit(f"Remote command failed with code {res.returncode}")
    return res


def main():
    parser = argparse.ArgumentParser(description="Deploy KidneyVision to Azure Production")
    parser.add_argument("-m", "--message", default="", help="Git commit message")
    parser.add_argument("--frontend", action="store_true", help="Force rebuild frontend container")
    parser.add_argument("--backend", action="store_true", help="Force restart backend & run migrations")
    parser.add_argument("--ai", action="store_true", help="Force rebuild AI flask container")
    parser.add_argument("--all", action="store_true", help="Rebuild all containers")
    parser.add_argument("--rollback", action="store_true", help="Revert the last commit and redeploy previous stable version")
    parser.add_argument("--skip-push", action="store_true", help="Skip local git commit and push")
    args = parser.parse_args()

    log("KidneyVision AI — Azure Production Deployment Starting", "[START]")

    # Rollback mode: Revert last commit
    if args.rollback:
        log("ROLLBACK IN PROGRESS: Reverting the last commit to previous stable version...", "[ROLLBACK]")
        run_local("git revert HEAD --no-edit")
        log("Pushing reverted commit to GitHub (origin main)...", "[GIT]")
        run_local("git push origin main")
    elif not args.skip_push:
        # Step 1: Local Git status & push
        status_res = run_local("git status --porcelain", check=False)
        has_changes = bool(status_res.stdout.strip())

        if has_changes:
            commit_msg = args.message or "deploy: sync updates to Azure production"
            log(f"Staging and committing local changes: '{commit_msg}'", "[GIT]")
            run_local("git add .")
            run_local(f'git commit -m "{commit_msg}"')

        log("Pushing latest commits to GitHub (origin main)...", "[GIT]")
        run_local("git push origin main")

    # Step 2: Remote Pull
    log("Pulling latest changes on Azure VM...", "[PULL]")
    run_remote([
        "git pull origin main"
    ])

    # Step 3: Containers Rebuild / Updates
    rebuild_frontend = args.frontend or args.all or True  # Default rebuild frontend to reflect UI changes
    rebuild_ai = args.ai or args.all
    update_backend = args.backend or args.all or True     # Default run migrations and clear cache

    remote_actions = []

    if update_backend:
        remote_actions.extend([
            "sudo docker exec kidneyvision-backend php artisan migrate --force",
            "sudo docker exec kidneyvision-backend php artisan config:clear",
        ])

    if rebuild_frontend:
        remote_actions.extend([
            "sudo docker compose build frontend",
            "sudo docker compose up -d --no-deps frontend",
        ])

    if rebuild_ai:
        remote_actions.extend([
            "sudo docker compose build ai-service",
            "sudo docker compose up -d --no-deps ai-service",
        ])

    log("Updating production containers on Azure...", "[DOCKER]")
    run_remote(remote_actions)

    # Step 4: Health Check & Status
    log("Running health check on production endpoint...", "[HEALTH]")
    run_remote([
        "sudo docker compose ps",
        "curl -k -s -o /dev/null -w 'HTTP Status: %{http_code}\\n' https://localhost",
    ])

    log(f"Déploiement terminé avec succès !\n   Accédez au site en direct : {PUBLIC_URL}", "[SUCCESS]")


if __name__ == "__main__":
    main()
