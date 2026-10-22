#!/usr/bin/env python3
"""
KidneyVision AI - Stack & Model Integrity Verification Script
Checks all Docker files, AI model checkpoints, dependencies, and configuration.
"""
import os
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent

def check(title: str, condition: bool, details: str = ""):
    status = "[\033[92mPASS\033[0m]" if condition else "[\033[91mFAIL\033[0m]"
    print(f"{status} {title}")
    if details and not condition:
        print(f"       \033[93m-> {details}\033[0m")
    return condition

def main():
    print("\n" + "=" * 60)
    print("   KidneyVision AI Deployment & Integrity Validator")
    print("=" * 60 + "\n")

    all_passed = True

    # 1. Model Files Integrity
    models_dir = ROOT_DIR / "ai-flask-service" / "models"
    expected_models = [
        ("kidneyvision_master_4class_sota.pth", 50 * 1024 * 1024),  # Expect > 50MB
        ("kidney_gate_model_gpu.pth", 1 * 1024 * 1024),            # Expect > 1MB
        ("kidneyvision_convnext_sota.pth", 50 * 1024 * 1024),       # Expect > 50MB
    ]

    for model_name, min_size in expected_models:
        p = models_dir / model_name
        exists = p.exists()
        size = p.stat().st_size if exists else 0
        is_binary = size >= min_size
        all_passed &= check(
            f"AI Model: {model_name} ({size / (1024*1024):.1f} MB)",
            exists and is_binary,
            f"File missing or is an un-downloaded Git LFS pointer (size: {size} bytes, expected >= {min_size} bytes)"
        )

    # 2. Key Docker & Deployment Files
    docker_files = [
        ROOT_DIR / "docker-compose.yml",
        ROOT_DIR / "deployment" / "docker" / "Dockerfile.ai-service",
        ROOT_DIR / "deployment" / "docker" / "Dockerfile.backend",
        ROOT_DIR / "deployment" / "docker" / "Dockerfile.frontend",
        ROOT_DIR / "deployment" / "docker" / "docker-entrypoint.sh",
        ROOT_DIR / "deployment" / "nginx" / "default.conf",
        ROOT_DIR / ".env.production.example",
    ]

    for df in docker_files:
        exists = df.exists()
        all_passed &= check(
            f"Config file: {df.relative_to(ROOT_DIR)}",
            exists,
            f"Missing required deployment file: {df}"
        )

    # 3. Check AI Requirements for PyTorch
    req_path = ROOT_DIR / "ai-flask-service" / "requirements.txt"
    if req_path.exists():
        req_content = req_path.read_text(encoding="utf-8")
        has_torch = "torch" in req_content
        no_tf = "tensorflow" not in req_content.lower()
        all_passed &= check("AI Requirements: PyTorch present", has_torch, "torch missing from requirements.txt")
        all_passed &= check("AI Requirements: TensorFlow removed", no_tf, "tensorflow still found in requirements.txt")

    # 4. Check Backend Entrypoint permissions and content
    entrypoint = ROOT_DIR / "deployment" / "docker" / "docker-entrypoint.sh"
    if entrypoint.exists():
        content = entrypoint.read_text(encoding="utf-8")
        has_storage_link = "storage:link" in content
        has_migrate = "migrate" in content
        all_passed &= check("Backend Entrypoint: Automates storage:link", has_storage_link, "storage:link missing in entrypoint")
        all_passed &= check("Backend Entrypoint: Automates migrations", has_migrate, "migrate missing in entrypoint")

    # 5. Check Frontend Client Dynamic API Resolution
    client_ts = ROOT_DIR / "frontend-react" / "src" / "services" / "client.ts"
    if client_ts.exists():
        cts_content = client_ts.read_text(encoding="utf-8")
        has_origin_fallback = "window.location" in cts_content and "/api" in cts_content
        all_passed &= check("Frontend Client: Dynamic origin resolution for Nginx reverse-proxy", has_origin_fallback, "Client lacks fallback to same origin /api")

    print("\n" + "=" * 60)
    if all_passed:
        print("  \033[92m[SUCCESS] All architectural checks passed!\033[0m")
        print("  The project is ready for Docker build and Azure VM deployment.")
    else:
        print("  \033[91m[WARNING] Some architectural checks failed. Review details above.\033[0m")
    print("=" * 60 + "\n")
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())
