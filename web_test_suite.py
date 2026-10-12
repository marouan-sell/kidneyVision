#!/usr/bin/env python3
"""
KidneyVision AI — Automated Live Web & API Test Suite
Tests all pages, assets, APIs, authentication, prediction pipeline, and UI integrity
against the deployed Azure production environment (http://9.205.29.254).
"""

import sys
import os
import time
import json
import uuid
import requests
from pathlib import Path

BASE_URL = os.environ.get("TARGET_URL", "http://9.205.29.254").rstrip("/")
SAMPLES_DIR = Path(__file__).resolve().parent / "data" / "samples"

class TestReporter:
    def __init__(self):
        self.results = []

    def record(self, category: str, test_name: str, passed: bool, details: str = "", duration_ms: float = 0):
        self.results.append({
            "category": category,
            "name": test_name,
            "passed": passed,
            "details": details,
            "duration_ms": round(duration_ms, 2)
        })
        icon = "[PASS]" if passed else "[FAIL]"
        print(f"{icon} [{category}] {test_name} ({round(duration_ms, 1)}ms)")
        if not passed and details:
            print(f"      -> Reason: {details}")

    def summary(self):
        total = len(self.results)
        passed = sum(1 for r in self.results if r["passed"])
        failed = total - passed
        print("\n" + "=" * 70)
        print(f"TEST SUMMARY: {total} executed | {passed} passed | {failed} failed")
        print("=" * 70)
        return {"total": total, "passed": passed, "failed": failed, "results": self.results}

reporter = TestReporter()

def timed_get(url, **kwargs):
    t0 = time.time()
    resp = requests.get(url, timeout=15, **kwargs)
    dt = (time.time() - t0) * 1000
    return resp, dt

def timed_post(url, **kwargs):
    t0 = time.time()
    resp = requests.post(url, timeout=40, **kwargs)
    dt = (time.time() - t0) * 1000
    return resp, dt

def test_static_routes():
    print("\n--- Testing Public SPA Web Pages & Assets ---")
    routes = [
        ("/", "Landing Page"),
        ("/login", "Login Page"),
        ("/register", "Registration Page"),
        ("/guest", "Guest Analysis Page"),
        ("/forgot-password", "Forgot Password Page"),
        ("/privacy", "Privacy Policy Page"),
        ("/terms", "Terms of Service Page"),
        ("/dashboard", "Portal Dashboard (Client-side fallback)"),
        ("/analysis", "Portal Analysis (Client-side fallback)"),
        ("/history", "Portal History (Client-side fallback)"),
        ("/reports", "Portal Reports (Client-side fallback)"),
        ("/settings", "Portal Settings (Client-side fallback)"),
        ("/help", "Portal Help (Client-side fallback)"),
    ]

    for path, name in routes:
        url = f"{BASE_URL}{path}"
        try:
            r, dt = timed_get(url)
            has_root = '<div id="root">' in r.text or '<div id="app">' in r.text or '<title>' in r.text
            passed = r.status_code == 200 and has_root
            reporter.record("SPA Pages", f"{name} ({path})", passed, 
                            f"HTTP {r.status_code}, content-type={r.headers.get('content-type')}", dt)
        except Exception as e:
            reporter.record("SPA Pages", f"{name} ({path})", False, str(e), 0)

    # Test static assets from index.html
    try:
        r, dt = timed_get(f"{BASE_URL}/")
        import re
        scripts = re.findall(r'src="(/assets/[^"]+)"', r.text)
        styles = re.findall(r'href="(/assets/[^"]+)"', r.text)
        for s in scripts + styles:
            s_url = f"{BASE_URL}{s}"
            sr, sdt = timed_get(s_url)
            reporter.record("Assets", f"Bundle asset {s}", sr.status_code == 200, f"HTTP {sr.status_code}, size={len(sr.content)} bytes", sdt)
    except Exception as e:
        reporter.record("Assets", "Index asset discovery", False, str(e), 0)

def test_health_apis():
    print("\n--- Testing Backend & AI Health Endpoints ---")
    # Backend health
    try:
        r, dt = timed_get(f"{BASE_URL}/api/health")
        passed = r.status_code == 200 and r.json().get("status") == "ok"
        reporter.record("API Health", "Backend /api/health", passed, f"Response: {r.text}", dt)
    except Exception as e:
        reporter.record("API Health", "Backend /api/health", False, str(e), 0)

    # System Health
    try:
        r, dt = timed_get(f"{BASE_URL}/api/system/health")
        data = r.json()
        passed = r.status_code == 200 and data.get("success") is True
        services = data.get("data", {}).get("services", {})
        db_ok = services.get("database", {}).get("status") == "connected"
        ai_ok = services.get("ai_service", {}).get("status") == "connected"
        reporter.record("API Health", "System Comprehensive Health", passed and db_ok and ai_ok, 
                        f"DB: {db_ok}, AI: {ai_ok}, services={list(services.keys())}", dt)
    except Exception as e:
        reporter.record("API Health", "System Comprehensive Health", False, str(e), 0)

    # Direct AI Flask health
    try:
        r, dt = timed_get(f"{BASE_URL}/ai/health")
        data = r.json()
        models = data.get("models", {})
        passed = r.status_code == 200 and models.get("gate_active") is True
        reporter.record("AI Health", "Flask /ai/health", passed, f"Models: {models}", dt)
    except Exception as e:
        reporter.record("AI Health", "Flask /ai/health", False, str(e), 0)

def test_auth_and_prediction():
    print("\n--- Testing Authentication & Clinical Scan Flow ---")
    session = requests.Session()
    unique_id = uuid.uuid4().hex[:8]
    test_email = f"clinician_test_{unique_id}@kidneyvision.internal"
    test_password = "Password123!Secure"
    token = None

    # 1. Register test user
    try:
        r, dt = timed_post(
            f"{BASE_URL}/api/auth/register",
            headers={"Accept": "application/json"},
            json={
                "name": f"Dr. Test Clinician {unique_id}",
                "email": test_email,
                "hospital": "Central Renal Institute",
                "password": test_password,
                "password_confirmation": test_password,
                "specialty": "Radiology"
            }
        )
        passed = r.status_code in [200, 201] and ("token" in r.text or "user" in r.text)
        if passed:
            data = r.json()
            token = data.get("token") or data.get("data", {}).get("token")
        reporter.record("Auth", "User Registration (/api/auth/register)", passed, f"HTTP {r.status_code}, email={test_email}", dt)
    except Exception as e:
        reporter.record("Auth", "User Registration", False, str(e), 0)

    # 2. Login
    try:
        r, dt = timed_post(
            f"{BASE_URL}/api/auth/login",
            headers={"Accept": "application/json"},
            json={
                "email": test_email,
                "password": test_password
            }
        )
        passed = r.status_code == 200 and ("token" in r.text or "user" in r.text)
        if passed:
            data = r.json()
            token = data.get("token") or data.get("data", {}).get("token") or token
        reporter.record("Auth", "User Login (/api/auth/login)", passed, f"HTTP {r.status_code}, token acquired={bool(token)}", dt)
    except Exception as e:
        reporter.record("Auth", "User Login", False, str(e), 0)

    if not token:
        reporter.record("Auth", "Token Guard", False, "Cannot proceed with authenticated tests without auth token", 0)
        return

    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json"
    }

    # 3. Check me / profile
    try:
        r, dt = timed_get(f"{BASE_URL}/api/auth/me", headers=headers)
        passed = r.status_code == 200
        reporter.record("Portal API", "Get Profile (/api/auth/me)", passed, f"HTTP {r.status_code}", dt)
    except Exception as e:
        reporter.record("Portal API", "Get Profile", False, str(e), 0)

    # 4. Check initial Analyses list
    try:
        r, dt = timed_get(f"{BASE_URL}/api/analyses", headers=headers)
        passed = r.status_code == 200
        data = r.json()
        analyses_count = len(data.get("data", [])) if isinstance(data.get("data"), list) else 0
        reporter.record("Portal API", "List Analyses (/api/analyses)", passed, f"HTTP {r.status_code}, initial count={analyses_count}", dt)
    except Exception as e:
        reporter.record("Portal API", "List Analyses", False, str(e), 0)

    # 5. Check Settings endpoint
    try:
        r, dt = timed_get(f"{BASE_URL}/api/settings", headers=headers)
        passed = r.status_code == 200
        reporter.record("Portal API", "Get Settings (/api/settings)", passed, f"HTTP {r.status_code}", dt)
    except Exception as e:
        reporter.record("Portal API", "Get Settings", False, str(e), 0)

    # 6. Check Audit Logs endpoint
    try:
        r, dt = timed_get(f"{BASE_URL}/api/audit-logs", headers=headers)
        passed = r.status_code == 200
        reporter.record("Portal API", "Audit Logs (/api/audit-logs)", passed, f"HTTP {r.status_code}", dt)
    except Exception as e:
        reporter.record("Portal API", "Audit Logs", False, str(e), 0)

    # 7. Upload and analyze legitimate sample image
    sample_normal = SAMPLES_DIR / "exemple_normal.png"
    if sample_normal.exists():
        try:
            with open(sample_normal, "rb") as f:
                r, dt = timed_post(
                    f"{BASE_URL}/api/predict",
                    headers={"Authorization": f"Bearer {token}", "Accept": "application/json"},
                    data={
                        "patient_name": "Test Patient John",
                        "patient_id": f"P-{unique_id}",
                        "notes": "Automated audit test sweep"
                    },
                    files={"image": ("exemple_normal.png", f, "image/png")}
                )
            passed = r.status_code in [200, 201] and ("prediction" in r.text or "diagnosis" in r.text)
            pred_data = r.json() if passed else {}
            created_analysis_id = pred_data.get("id") or pred_data.get("data", {}).get("id")
            reporter.record("Clinical Inference", "Legitimate Scan Prediction (/api/predict)", passed, 
                            f"HTTP {r.status_code}, Analysis ID={created_analysis_id}, pred={pred_data.get('prediction')}", dt)
            
            # Check if analysis detail can be fetched
            if created_analysis_id:
                dr, ddt = timed_get(f"{BASE_URL}/api/analyses/{created_analysis_id}", headers=headers)
                reporter.record("Clinical Inference", f"Fetch Analysis Detail (#{created_analysis_id})", dr.status_code == 200, f"HTTP {dr.status_code}", ddt)
        except Exception as e:
            reporter.record("Clinical Inference", "Legitimate Scan Prediction", False, str(e), 0)
    else:
        reporter.record("Clinical Inference", "Sample Scan Available", False, f"Not found at {sample_normal}", 0)

    # 8. Test Gatekeeper rejection with non-kidney / invalid image
    sample_invalid = SAMPLES_DIR / "sample_normal.jpg"
    if sample_invalid.exists():
        try:
            with open(sample_invalid, "rb") as f:
                r, dt = timed_post(
                    f"{BASE_URL}/api/predict",
                    headers={"Authorization": f"Bearer {token}", "Accept": "application/json"},
                    data={"patient_name": "Test Non Kidney"},
                    files={"image": ("sample_normal.jpg", f, "image/jpeg")}
                )
            # Expect gatekeeper rejection with 422
            passed = r.status_code == 422 and ("Gatekeeper" in r.text or "not appear to be an authentic kidney" in r.text)
            reporter.record("Clinical Safety", "Gatekeeper Screening Rejection", passed, 
                            f"HTTP {r.status_code}, gatekeeper caught invalid image properly: {passed}", dt)
        except Exception as e:
            reporter.record("Clinical Safety", "Gatekeeper Screening", False, str(e), 0)

    # 9. Logout
    try:
        r, dt = timed_post(f"{BASE_URL}/api/auth/logout", headers=headers)
        passed = r.status_code == 200
        reporter.record("Auth", "User Logout (/api/auth/logout)", passed, f"HTTP {r.status_code}", dt)
    except Exception as e:
        reporter.record("Auth", "User Logout", False, str(e), 0)

if __name__ == "__main__":
    print("=" * 70)
    print(f"KidneyVision AI — Full Live Stack Inspection: {BASE_URL}")
    print("=" * 70)
    test_static_routes()
    test_health_apis()
    test_auth_and_prediction()
    summary = reporter.summary()
    with open("live_test_results.json", "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    print(f"\nDetailed JSON report exported to live_test_results.json")
