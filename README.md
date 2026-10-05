# KidneyVision AI — Clinical Kidney Ultrasound Analysis Platform

![KidneyVision AI Platform](https://img.shields.io/badge/Status-Production%20Ready-brightgreen.svg)
![Tests](https://img.shields.io/badge/Tests-106%2F106%20Passing-success.svg)
![PHP](https://img.shields.io/badge/Laravel-12.0-red.svg)
![React](https://img.shields.io/badge/React-19.0-blue.svg)
![Python](https://img.shields.io/badge/Flask%20%2F%20TensorFlow-2.21-orange.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)

**KidneyVision AI** is an enterprise-grade medical imaging and diagnostic decision-support platform engineered for nephrologists, urologists, and radiologists. It combines deep learning computer vision (**MobileNetV2 with Grad-CAM explainability**) with a robust **Laravel 12 REST API backend** and a tailored **React 19 clinical web dashboard** to analyze B-mode renal ultrasound scans, identify nephrolithiasis (kidney stones), visualize localized acoustic shadow regions, and generate verified clinical PDF reports.

---

## ⚡ Quick Start — Run the Entire Stack with One Command

You can run all three microservices (React Frontend, Laravel API, and Flask AI Service) simultaneously with the built-in Python orchestrator or Windows batch script.

### 1. Unified Python Runner (Recommended)

From the project root directory, run:

```bash
python run_project.py
```

*On Windows, you can also run:*
```cmd
run.bat
```

### Available Command-Line Options

| Option | Description | Example |
| :--- | :--- | :--- |
| *(default)* | Starts all 3 services, streams live logs, performs health checks, and opens browser | `python run_project.py` |
| `--kill-existing` | Automatically releases ports `3000`, `5000`, or `8000` if previously locked | `python run_project.py --kill-existing` |
| `--no-browser` | Runs services without opening the web browser automatically | `python run_project.py --no-browser` |

> **Graceful Shutdown**: Press **`Ctrl + C`** in your terminal at any time. The runner uses process-tree termination to cleanly stop Node, PHP, and Flask/TensorFlow without leaving background orphan processes.

### 🌐 Service Endpoints

Once launched, the runner displays a live status banner and the following endpoints become available:

| Service | Port | Endpoint URL | Description |
| :--- | :--- | :--- | :--- |
| **Clinical Web App** | `3000` | [http://localhost:3000](http://localhost:3000) | Responsive React 19 Clinical Portal |
| **Laravel Backend API** | `8000` | [http://127.0.0.1:8000/api](http://127.0.0.1:8000/api) | Authentication, Database & Reports API |
| **AI Microservice** | `5000` | [http://127.0.0.1:5000/health](http://127.0.0.1:5000/health) | MobileNetV2 + Grad-CAM Inference Engine |

---

## 🎯 User Guide — Everything You Can Do on the Website

The platform is designed around realistic clinical workflows for nephrologists, emergency clinicians, and radiologists. Here is everything a user can do on the web platform:

### 1. Quick Guest Ultrasound Triage (`/guest`)
- **No Sign-In Required**: Designed for rapid ER or bedside triage.
- **Drag & Drop Scan**: Drop any B-mode renal ultrasound image.
- **Instant Inference**: Runs the neural network and returns the diagnostic outcome (Normal vs Stone Detected), confidence score %, and Grad-CAM heatmap visualization.
- **Direct Portal Upgrade**: Easily register or sign in to save the scan, link it to a patient record, and export a signed PDF report.

### 2. Clinician Account & Authentication (`/login`, `/register`)
- **Doctor Sign-In**: Login with clinical credentials (email and password).
- **Default Account**: You can sign in using `marouan.sellami@outlook.com` or register a new clinician profile.
- **Session Security**: Session tokens are cryptographically secured using Laravel Sanctum cookies.
- **Self-Service Password Recovery (`/forgot-password`)**: Clinicians can reset credentials via verified email reset links.

### 3. Clinical Intelligence Dashboard (`/dashboard`)
- **High-Level KPI Metric Cards**:
  - *Total Scans Analyzed*: Overall caseload tracked by the clinician.
  - *Positive Stone Detection Rate*: Percentage of analyzed scans flagged with nephrolithiasis.
  - *Average AI Confidence*: Mean neural network certainty across all evaluated scans.
  - *Normal Renal Scans*: Volume of clean scans without calculi.
- **Diagnostic Distribution Visualizers**: Interactive charts displaying positive vs normal scan proportions and weekly/monthly caseload volume.
- **Recent Patient Activity Table**: Quick glance at the latest analyzed patients, dates, diagnostic badges, and direct links to scan details.
- **Quick Action Bar**: One-click buttons to launch a new analysis or jump to patient history.

### 4. Running a New Ultrasound Scan Analysis (`/analysis`)
- **Sample Scans Ready for Testing**:
  Two verified sample ultrasound scans are included in the repository for immediate testing:
  - `data/samples/sample_normal.jpg` — Clean renal parenchyma scan without calculi.
  - `data/samples/sample_stone.jpg` — Ultrasound scan exhibiting hyper-reflective calculus with posterior acoustic shadow.
- **Clinical Patient Details**:
  - *Patient ID*: Hospital MRN / Patient identifier (e.g. `PAT-2026-0814`).
  - *Patient Name*: Full name of the patient.
  - *Age & Biological Sex*: Demographic details for clinical context.
  - *Anatomical Scan Location*: Select Left Kidney, Right Kidney, or Unspecified.
- **Medical Image Validation Guardrails**:
  - Automatically validates file dimensions, contrast levels, and dark-background ultrasound characteristics.
  - Rejects non-medical photos (such as selfies, landscapes, or color diagrams) with clear diagnostic error feedback.
- **Live 5-Stage Neural Pipeline**:
  Visual step-by-step progress tracking:
  1. *Uploading Scan* — Encrypted streaming to backend pipeline.
  2. *Spatial Preprocessing* — 224x224 RGB normalization and acoustic background checks.
  3. *MobileNetV2 Inference* — Deep neural evaluation of renal parenchyma.
  4. *Grad-CAM Heatmap Generation* — Synthesizing spatial feature activation map.
  5. *Diagnostic Report Ready* — Audit logging and result caching.
- **Diagnostic Outcome Card**:
  - Prominent status indicator: **`NEPHROLITHIASIS DETECTED`** (Red alert with risk level) or **`NORMAL RENAL SCAN`** (Green badge).
  - Neural network confidence rating (e.g. `99.8% Confidence`).
  - Actionable clinical recommendations and triage urgency guidance (Routine, Elevated, or Immediate Urology Consult).
- **Interactive Grad-CAM Heatmap Visualizer**:
  - **Dual View Modes**: Toggle between *Raw Ultrasound Scan* and *Grad-CAM Attention Heatmap*.
  - **Explainability Focus**: Visualizes exactly which regions of the ultrasound (hyper-echoic foci and posterior acoustic shadows) influenced the AI's diagnostic classification.
- **Clinician Assessment & Assessment Notes**:
  - Dedicated notes editor where the doctor can write observations (e.g., *"4mm non-obstructing calculus in lower pole with mild caliectasis"*).
  - Ability to save clinical assessment notes directly to the patient's permanent database record.
- **Instant Clinical PDF Report**:
  - *Preview Modal*: Opens a responsive in-browser modal rendering the official PDF report.
  - *One-Click Download*: Saves the signed clinical PDF directly to your computer.

### 5. Patient Scan History & Longitudinal Archive (`/history`)
- **Searchable Patient Database**: Search instantly by Patient Name or Medical Record Number (MRN).
- **Multi-Criteria Filtering**: Filter scans by diagnosis outcome (`All`, `Stone Detected`, `Normal`) or date range.
- **Data Table Overview**: Displays Patient ID, Name, Age, Sex, Scan Date, Anatomical Location, AI Diagnosis, and Confidence Score.
- **Deep-Dive Scan Modal**: Click any patient row to open the full inspection modal with scan images, Grad-CAM overlays, and doctor notes.
- **One-Click Re-Download**: Download previously generated clinical PDF reports on demand.
- **Record Management**: Option to securely delete or purge obsolete test records.

### 6. Clinical PDF Reports Studio (`/reports`)
- **Centralized Document Archive**: View all clinical reports generated across all patient sessions.
- **Embedded Document Preview**: Inspect the full layout before printing or exporting.
- **Standardized Medical Report Layout**:
  - Official clinic/hospital header and institutional branding.
  - Patient demographics (ID, Name, Age, Sex, Examination Date).
  - Ultrasound acquisition details and anatomical scanning site.
  - Side-by-side high-resolution scan images (Original ultrasound vs Grad-CAM heatmap).
  - Quantitative AI confidence metrics and model version.
  - Clinician assessment notes and formal diagnostic findings.
  - Attending physician signature block and legal decision-support disclaimer.

### 7. Clinician Settings & Security Center (`/settings`)
- **Physician Profile & Credentials**:
  - Update Clinician Name, Hospital / Medical Center affiliation, Clinical Department (e.g., Radiology / Nephrology), and Medical License Number.
  - Details automatically appear on all exported PDF reports.
- **AI Alert Sensitivity Threshold**:
  - Interactive slider allowing clinicians to customize the detection alert sensitivity threshold (e.g., 50% to 90%).
  - Adjusts threshold for flagging suspicious hyper-echoic regions.
- **Account Security & Password Updates**:
  - Change password with mandatory verification of current password.
  - **"Revoke All Other Sessions" Button**: Instantly invalidates all active sessions on other computers/browsers in case of credential changes or suspicious activity.
- **Verifiable Audit Log**:
  - Searchable audit table logging all clinician security actions: login events, password changes, report downloads, scan evaluations, and settings modifications.
  - Includes client IP addresses, user agents, and ISO timestamps for HIPAA/clinical compliance.

### 8. Clinical Help Center & Imaging Standards (`/help`)
- **Ultrasound Image Acquisition Protocol**:
  - Transducer selection guidelines (curved-array 3.5–5 MHz probes).
  - Recommended acoustic gain and focus depth settings for kidney imaging.
  - Probe placement strategies for longitudinal and transverse kidney views.
- **Acoustic Artifact Guide**:
  - How to differentiate true kidney stones from rib shadows, bowel gas, and vascular calcifications.
- **System FAQs & Support**: Answers to common technical questions and support contact details.

---

## 🖥️ Clinical Web Application Overview

The frontend is a single-page clinical application built with **React 19, TypeScript, and Vite**, offering a modern, accessible interface tailored for diagnostic workflows.

### 1. Public Pages
- **Landing Page (`/`)**: Product showcase detailing the deep learning architecture, clinical features, model metrics, diagnostic workflow, and quick access buttons.
- **Guest Triage Mode (`/guest`)**: Rapid ultrasound scan evaluation without mandatory account sign-in, allowing instant triage and inference verification.
- **Clinician Authentication (`/login`, `/register`)**: Secure token-based authentication with Sanctum session security.
- **Credential Recovery (`/forgot-password`, `/reset-password`)**: Self-service email password recovery flow.
- **Compliance & Legal (`/privacy`, `/terms`)**: Data privacy governance, HIPAA/GDPR clinical disclosures, and terms of use.

### 2. Authenticated Clinician Portal
- **Clinical Dashboard (`/dashboard`)**: Key metrics, diagnostic distribution charts, recent scan tables, and quick action bar.
- **New Ultrasound Analysis Studio (`/analysis`)**: Drag-and-drop validation, 5-stage progress pipeline, Grad-CAM visualizer, and in-app PDF generation.
- **Patient Scan History (`/history`)**: Filterable longitudinal scan archive with search and inspection modals.
- **Clinical PDF Reports Studio (`/reports`)**: Centralized report document hub with in-app PDF preview and download.
- **Settings & Security Center (`/settings`)**: Profile credentials, custom sensitivity thresholds, session revocation, and audit logs.
- **Clinical Help Center (`/help`)**: Ultrasound scan guidelines, FAQ, and technical documentation.

---

## 🏗️ Architecture Overview

KidneyVision is organized as a unified full-stack monorepo structured into clear, decoupled layers:

```text
React Frontend
       ↓
Laravel Backend/API
       ↓
Flask AI Service
       ↓
Deep Learning Models
```

### Core Components
1. **React Frontend (`frontend-react/`)**: React 19 + TypeScript clinical dashboard providing drag-and-drop analysis, real-time stage progress indicators, interactive 3D anatomical viewer, visual Grad-CAM heatmaps, analytics trends, and in-app PDF report preview/download.
2. **Laravel Backend API (`backend-laravel/`)**: Laravel 12 REST API providing Laravel Sanctum authentication, role-based authorization, rate limiting, patient metadata management, PDF rendering via Barryvdh DomPDF, audit logging, and session revocation.
3. **Flask AI Service (`ai-flask-service/`)**: Flask 3 microservice wrapping deep learning computer vision models, medical scan validation guardrails, image preprocessing and normalization, multi-class inference, and Grad-CAM explainability maps.
4. **Deep Learning Models (`ai-flask-service/models/`)**:
   - **4-Class Diagnostic Pipeline**: SOTA ConvNeXt classification architecture trained to identify renal pathologies across 4 classes: *Normal Parenchyma*, *Nephrolithiasis (Stone)*, *Renal Cyst*, and *Kidney Tumor*.
   - **Binary Gate & Diagnostic CNNs**: Gate validation network and MobileNetV2 / ResNet50 models for ultrasound and CT image triage.
   - **Grad-CAM Localization**: Visual explainability engine generating heatmaps over predictive acoustic shadows and pathological regions.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend Web App** | React 19, TypeScript, Vite, Lucide Icons, Axios, TailwindCSS, Recharts, Plotly |
| **Backend REST API** | PHP 8.2+ / 8.3, Laravel 12, Laravel Sanctum, Barryvdh DomPDF, SQLite / MySQL |
| **AI Microservice** | Python 3.10+, Flask 3.1, TensorFlow 2.21, Keras 3, Pillow, NumPy, Gunicorn |
| **Orchestration & DevOps** | Python 3 Unified Runner (`run_project.py`), Windows Batch (`run.bat`), Docker, Docker Compose |

---

## 📂 Project Directory Structure

```text
kidneyVision/
│
├── run_project.py                # Unified multi-service Python orchestrator
├── run.bat                       # 1-Click Windows terminal launcher
│
├── frontend-react/               # React 19 TypeScript Single Page Application
│   ├── src/
│   │   ├── components/           # UI Views (Dashboard, Analysis, History, Reports, Settings)
│   │   ├── contexts/             # Auth & Global State Contexts
│   │   ├── services/             # Modular API Clients (Auth, Analysis, Reports, Health)
│   │   ├── types/                # Domain TypeScript Definitions
│   │   ├── App.tsx               # Primary Routing & Layout
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── backend-laravel/              # Laravel 12 REST API & Business Logic
│   ├── app/
│   │   ├── Http/Controllers/     # API Controllers (Analysis, Auth, Settings, Reports, Health)
│   │   ├── Models/               # Eloquent Models (User, Analysis, Report, Setting, AuditLog)
│   │   ├── Services/             # Domain Services (AiInferenceService, PdfReportService)
│   │   └── Policies/             # Authorization & IDOR Protection Policies
│   ├── config/                   # Application & CORS configurations
│   ├── database/                 # Migrations, seeders, and database.sqlite
│   ├── routes/api.php            # Public & Sanctum-protected REST endpoints
│   ├── storage/                  # Generated clinical PDF reports and stored scans
│   └── composer.json
│
├── ai-flask-service/             # Flask 3 & TensorFlow AI Inference Microservice
│   ├── app/
│   │   ├── __init__.py           # Application Factory
│   │   ├── config.py             # Preprocessing & model hyperparameters
│   │   ├── routes/               # Modular Flask Blueprints (health, predict)
│   │   ├── preprocessing/        # Medical ultrasound validator & preprocessor
│   │   ├── inference/            # Model loader & Grad-CAM heatmap generator
│   │   └── services/             # High-level inference orchestrator
│   ├── app.py                    # Clean WSGI entry point
│   ├── requirements.txt
│   └── best_model.keras          # Trained deep learning neural network
│
├── data/                         # Sample evaluation datasets & validation scans
│   └── samples/                  # Normal & Stone ultrasound samples for verification
│       ├── sample_normal.jpg     # Verified clean renal ultrasound scan
│       └── sample_stone.jpg      # Verified nephrolithiasis ultrasound scan
│
├── tests/                        # Centralized test suites & test runner
│   ├── e2e/                      # End-to-end integration & system tests
│   ├── integration/              # Functional API & subsystem tests
│   ├── security/                 # IDOR, authorization, and consistency tests
│   └── run_all_tests.php         # Master test runner (106/106 passing)
│
├── docker-compose.yml            # Multi-container orchestration
├── .env.example                  # Global environment configuration template
└── README.md                     # Project documentation
```

---

## 💻 Manual Setup & Independent Service Execution

If you prefer to run each service individually in separate terminals instead of using `run_project.py`:

### Prerequisites
- **PHP 8.2+** with `pdo_sqlite`, `mbstring`, `gd`, `fileinfo` extensions
- **Composer 2+**
- **Node.js 18+** and `npm`
- **Python 3.10+** with `pip`

### Step 1: Environment Setup
```bash
cp .env.example .env
cp frontend-react/.env.example frontend-react/.env
cp ai-flask-service/.env.example ai-flask-service/.env
cp backend-laravel/.env.example backend-laravel/.env
```

### Step 2: Terminal 1 — AI Inference Microservice
```bash
cd ai-flask-service
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python app.py
# Runs on http://127.0.0.1:5000
```

### Step 3: Terminal 2 — Laravel Backend API
```bash
cd backend-laravel
composer install
php artisan key:generate
php artisan migrate
php artisan serve --host=127.0.0.1 --port=8000
# Runs on http://127.0.0.1:8000
```

### Step 4: Terminal 3 — React Frontend Client
```bash
cd frontend-react
npm install
npm run dev
# Runs on http://localhost:3000
```

---

## 🧪 Automated Testing Suite

The repository includes a comprehensive **106-test automated verification suite** covering:
- **E2E Core Flow (Tests A–J)**: Authentication, ultrasound image upload, AI inference, database persistence, image retrieval, patient metadata, clinician notes, PDF generation & authorization, invalid file rejection, and service resilience.
- **Settings & Security**: Custom alert thresholds, physician credentials, password changes, session revocation, audit trails, and strict authorization (User A cannot access User B's scans/PDFs).

To execute the test suite against running local services:
```bash
php tests/run_all_tests.php
```

Expected Output:
```text
======================================================================
     KIDNEYVISION AI — MASTER AUTOMATED TEST SUITE
======================================================================
  [OK] PASSED: Health endpoint returns status 200
  ...
======================================================================
FINAL TEST RESULTS
======================================================================
Total Tests: 106
Passed:      106
Failed:      0
Success:     100.0%
```

To verify the frontend production build:
```bash
cd frontend-react
npm run build
```

---

## 🐳 Docker Deployment

To deploy using Docker Compose:

```bash
docker-compose up --build -d
```

Services will be mapped to:
- **Frontend Client**: `http://localhost:80`
- **Backend API**: `http://localhost:8000`
- **Flask AI Service**: `http://localhost:5000`

---

## 🛡️ Security & Privacy Architecture

- **Role-Based Access Control & Ownership Isolation**: Every analysis, ultrasound image, and PDF report is strictly scoped to the authenticated clinician. IDOR attempts return HTTP 403 Forbidden.
- **Audit Logging**: All security events (logins, password updates, session revocations, setting modifications) are recorded with timestamps, user IDs, and client IP addresses.
- **Session Protection**: Laravel Sanctum with CSRF token cookies and ability to instantly revoke all other active sessions upon credential changes.
- **Sanitized Clinical Storage**: Patient scans and clinical reports are stored with unique UUID filenames in non-public directories, accessible only through authenticated controller streams.

---

## ⚖️ Medical Disclaimer

> **IMPORTANT**: KidneyVision AI is an assistive decision-support research tool designed to support trained healthcare professionals in interpreting renal ultrasound scans. It is **NOT** a standalone medical diagnostic device and does not substitute for professional medical advice, clinical diagnosis, or treatment. All AI predictions and Grad-CAM heatmaps must be reviewed and corroborated by a licensed physician or certified radiologist.

---

## 👥 Authors & Acknowledgments

- **Development Team**: Marouan Sellami, Souhibe Bakkali, Mossab Oueld Neimia
- **Institution**: KidneyVision AI Research & Development Team

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.  
Copyright (c) 2026 Marouan Sellami.

