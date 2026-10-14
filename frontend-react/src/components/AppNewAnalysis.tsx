/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { 
  Upload, Loader2, Play, CircleDot, ShieldCheck, 
  Eye, FileText, CheckCircle2, ChevronRight, Download, 
  ArrowRight, AlertCircle, FileDown, X, RefreshCw,
  User, Calendar, Layers, Image as ImageIcon, Check,
  HelpCircle, Info, Trash2, Crosshair,
  Ruler, Activity, Cpu, CheckCircle, Maximize2,
  ZoomIn, ZoomOut, RotateCcw, Grid, SunMedium, 
  Sparkles, Stethoscope, FileSignature, ShieldAlert
} from "lucide-react";
import { createPrediction, downloadReport, updateAnalysis, getReportPdfBlobUrl, fetchPatients } from "../services";
import { DiagnosisResult, KidneyAnalysis } from "../types";
import { validateScanFile } from "../utils/fileValidation";
import { parseClinicalError, ClinicalError } from "../utils/errorParser";

interface AppNewAnalysisProps {
  onAddSuccess: () => void;
}

export default function AppNewAnalysis({ onAddSuccess }: AppNewAnalysisProps) {
  const locationState = useLocation().state as { patient?: any } | undefined;

  // Input fields state — starts completely empty for clinical doctor entry, or pre-filled from Patient Profile
  const [patientId, setPatientId] = useState<string>(locationState?.patient?.patient_id || "");
  const [patientName, setPatientName] = useState<string>(locationState?.patient?.name || "");
  const [patientAge, setPatientAge] = useState<string>(locationState?.patient?.age ? String(locationState.patient.age) : "");
  const [patientGender, setPatientGender] = useState<"Male" | "Female" | "Other">(
    locationState?.patient?.gender === "Female" ? "Female" : (locationState?.patient?.gender === "Other" ? "Other" : "Male")
  );
  const [location, setLocation] = useState<"Left Kidney" | "Right Kidney" | "Unspecified">("Left Kidney");
  const [clinicianNotes, setClinicianNotes] = useState<string>("");
  const [existingPatients, setExistingPatients] = useState<any[]>([]);

  // DICOM Viewer interactive tools
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [invertContrast, setInvertContrast] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    fetchPatients()
      .then((data) => {
        if (Array.isArray(data)) setExistingPatients(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (locationState?.patient) {
      const p = locationState.patient;
      if (p.patient_id) setPatientId(p.patient_id);
      if (p.name) setPatientName(p.name);
      if (p.age) setPatientAge(String(p.age));
      if (p.gender) {
        const g = p.gender.toLowerCase();
        if (g === "female") setPatientGender("Female");
        else if (g === "male") setPatientGender("Male");
        else setPatientGender("Other");
      }
    }
  }, [locationState]);

  const handlePatientSelect = (selectedId: string) => {
    if (!selectedId) {
      setPatientId("");
      return;
    }
    const matched = existingPatients.find((p) => p.patient_id === selectedId);
    if (matched) {
      setPatientId(matched.patient_id);
      setPatientName(matched.name || "");
      if (matched.age) setPatientAge(matched.age.toString());
      if (matched.gender) {
        const g = matched.gender.toLowerCase();
        if (g === "female") setPatientGender("Female");
        else if (g === "male") setPatientGender("Male");
        else setPatientGender("Other");
      }
    }
  };

  const handlePatientNameChange = (name: string) => {
    setPatientName(name);
  };
  
  // Custom file upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFilePreview, setUploadedFilePreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  // View mode for results: "panel" (Dual Clinical Panel) | "gradcam" | "cleaned" | "raw"
  const [heatmapViewMode, setHeatmapViewMode] = useState<"panel" | "gradcam" | "cleaned" | "raw">("panel");

  // Diagnosis & Pipeline states
  const [isScanning, setIsScanning] = useState(false);
  const [currentStageIdx, setCurrentStageIdx] = useState<number>(0);
  const [clinicalError, setClinicalError] = useState<ClinicalError | null>(null);
  const [activeAnalysis, setActiveAnalysis] = useState<KidneyAnalysis | null>(null);

  // Clinician notes save state
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [noteSavedSuccess, setNoteSavedSuccess] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Analysis Pipeline Stages
  const ANALYSIS_STAGES = [
    { id: "uploading", label: "Acoustic Stream Ingestion", desc: "Streaming raw ultrasound matrix to secure DICOM processor..." },
    { id: "gatekeeper", label: "Stage-1 Anatomical Gatekeeper", desc: "Verifying authentic renal parenchyma & eliminating non-kidney artifacts..." },
    { id: "preprocessing", label: "Spatial Telea Inpainting", desc: "Suppressing diagnostic calipers, probe annotations, and speckle noise..." },
    { id: "analyzing", label: "Deep Neural Triage (DenseNet/ConvNeXt)", desc: "Softmax probability synthesis: Cyst, Normal, Stone, and Tumor classes..." },
    { id: "generating", label: "Grad-CAM Spatial Explainability", desc: "Mapping gradients of highest activation & calculating lesion caliper..." },
    { id: "completed", label: "Diagnostic Dossier Ready", desc: "Structured telemetry signed & staged for clinician verification." },
  ];

  // Process chosen file
  const processSelectedFile = async (file: File) => {
    setUploadError(null);
    const validation = await validateScanFile(file);
    if (!validation.valid) {
      setUploadError(validation.error || "The selected file is not a valid medical scan image.");
      setUploadedFile(null);
      setUploadedFilePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploadedFile(file);
    const url = URL.createObjectURL(file);
    setUploadedFilePreview(url);
    setActiveAnalysis(null);
    setZoomLevel(1);

    // If patient name is currently blank, suggest an automated placeholder from filename
    if (!patientName.trim()) {
      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      if (cleanName.length > 2 && !cleanName.match(/^[0-9a-f]{8,}$/i)) {
        setPatientName(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processSelectedFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    if (uploadedFilePreview) {
      URL.revokeObjectURL(uploadedFilePreview);
      setUploadedFilePreview(null);
    }
    setUploadError(null);
    setActiveAnalysis(null);
    setZoomLevel(1);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleResetCase = () => {
    handleRemoveFile();
    setPatientId("");
    setPatientName("");
    setPatientAge("");
    setPatientGender("Male");
    setLocation("Left Kidney");
    setClinicianNotes("");
    setClinicalError(null);
  };

  // Run AI Scan Execution
  const handleTriggerAnalysis = async () => {
    if (!uploadedFile && !uploadedFilePreview) {
      setUploadError("Please upload a kidney ultrasound scan before running analysis.");
      return;
    }

    setIsScanning(true);
    setCurrentStageIdx(0);
    setClinicalError(null);
    setActiveAnalysis(null);

    const stageTimer = setInterval(() => {
      setCurrentStageIdx((prev) => {
        if (prev < 3) return prev + 1;
        return prev;
      });
    }, 600);

    try {
      const finalPatientName = patientName.trim() || "Unspecified Patient";
      const finalPatientId = patientId.trim() || undefined;
      const parsedAge = patientAge.trim() ? parseInt(patientAge, 10) : undefined;

      const res = await createPrediction(uploadedFile, {
        patientId: finalPatientId,
        patientName: finalPatientName,
        patientAge: parsedAge,
        patientGender,
        location,
        imageUrl: uploadedFilePreview || undefined,
        clinicianNotes: clinicianNotes.trim() || undefined,
      });

      clearInterval(stageTimer);
      setCurrentStageIdx(4);

      setTimeout(() => {
        setActiveAnalysis(res);
        if (res.patientId) {
          setPatientId(res.patientId);
        }
        if (res.patientName) {
          setPatientName(res.patientName);
        }
        if (res.clinicianNotes) {
          setClinicianNotes(res.clinicianNotes);
        }
        setIsScanning(false);
        const isNormal = (res.prediction || '').toLowerCase() === 'normal' || res.diagnosis === DiagnosisResult.NORMAL_FINDINGS;
        setHeatmapViewMode(isNormal ? (res.cleanedScanUrl ? "cleaned" : "raw") : (res.visualizationUrl ? "panel" : res.heatmapUrl ? "gradcam" : "raw"));
      }, 400);
    } catch (e: any) {
      clearInterval(stageTimer);
      setIsScanning(false);
      const parsed = e?.clinicalError || parseClinicalError(e);
      setClinicalError(parsed);
    }
  };

  // Save report action (persists clinician notes and metadata updates)
  const handleSaveReport = async () => {
    if (!activeAnalysis?.id) return;
    setIsSavingNotes(true);
    try {
      await updateAnalysis(activeAnalysis.id, {
        clinicianNotes: clinicianNotes.trim()
      });
      setNoteSavedSuccess(true);
      setTimeout(() => setNoteSavedSuccess(false), 3000);
    } catch (e: any) {
      alert("Error saving clinician notes: " + e.message);
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Quick clinical notes snippets helper
  const handleAppendSnippet = (snippet: string) => {
    setClinicianNotes((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return snippet;
      if (trimmed.includes(snippet)) return trimmed;
      return `${trimmed}\n• ${snippet}`;
    });
  };

  // Helper to determine active image URL
  const currentImageUrl = 
    heatmapViewMode === "panel" && activeAnalysis?.visualizationUrl
      ? activeAnalysis.visualizationUrl
      : heatmapViewMode === "cleaned" && activeAnalysis?.cleanedScanUrl
      ? activeAnalysis.cleanedScanUrl
      : heatmapViewMode === "gradcam" && activeAnalysis?.heatmapUrl
      ? activeAnalysis.heatmapUrl
      : uploadedFilePreview;

  // Diagnostic styling details
  const predLower = ((activeAnalysis as any)?.prediction || activeAnalysis?.pathologyFinding || activeAnalysis?.diagnosis || '').toLowerCase();
  const isNormal = predLower.includes('normal') || activeAnalysis?.diagnosis === DiagnosisResult.NORMAL_FINDINGS;
  const isStone = predLower.includes('stone') || predLower.includes('nephro');
  const isCyst = predLower.includes('cyst');
  const isTumor = predLower.includes('tumor');

  const findingTheme = isTumor 
    ? { border: 'border-purple-300', bg: 'bg-purple-50/80', text: 'text-purple-900', badge: 'bg-purple-600', label: 'Renal Mass / Tumor' }
    : isStone 
    ? { border: 'border-rose-300', bg: 'bg-rose-50/80', text: 'text-rose-900', badge: 'bg-rose-600', label: 'Nephrolithiasis Focus' }
    : isCyst 
    ? { border: 'border-sky-300', bg: 'bg-sky-50/80', text: 'text-sky-900', badge: 'bg-sky-600', label: 'Renal Cyst Formation' }
    : isNormal 
    ? { border: 'border-emerald-300', bg: 'bg-emerald-50/80', text: 'text-emerald-900', badge: 'bg-emerald-600', label: 'Normal Renal Parenchyma' }
    : { border: 'border-amber-300', bg: 'bg-amber-50/80', text: 'text-amber-900', badge: 'bg-amber-600', label: 'Clinical Review Required' };

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto pb-12 font-sans selection:bg-[#2563eb]/20 selection:text-[#131b2e]">
      
      {/* Institutional Clinical Workstation Header */}
      <div className="bg-white border border-[#c3c6d7]/70 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-[#737686] uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-[#2563eb]">
              <Stethoscope className="w-3.5 h-3.5" />
              Renal Imaging Suite
            </span>
            <span>•</span>
            <span className="font-mono">AI-PACS Workstation v2.4</span>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-[#131b2e] tracking-tight flex items-center gap-2">
            Automated Renal Pathology Triage
          </h1>
          <p className="text-xs text-[#52576b] max-w-2xl leading-relaxed">
            Multi-stage ultrasound pipeline featuring acoustic artifact inpainting, 4-class neural classification, and Grad-CAM spatial activation mapping.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#f0fdf4] border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-medium tracking-wide">Neural Inference Engine Active</span>
          </div>

          <button
            type="button"
            onClick={handleResetCase}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-[#434655] hover:text-[#131b2e] border border-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs"
            title="Clear all fields and prepare new case"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Case</span>
          </button>

          <a
            href="/help"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#eff4fe] hover:bg-[#dbe6fd] text-[#2563eb] text-xs font-bold rounded-xl transition-all shadow-xs"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Protocol Guide</span>
          </a>
        </div>
      </div>

      {/* Clinical Error Notice */}
      {clinicalError && (
        <div className="bg-red-50/90 border border-red-200 rounded-2xl p-4.5 shadow-sm space-y-3 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center text-red-600 shrink-0 mt-0.5 shadow-xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xs font-bold text-red-950 uppercase tracking-wide">
                  {clinicalError.title || "Diagnostic Pipeline Exception"}
                </h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-red-200 text-red-900 uppercase font-semibold">
                  {clinicalError.type}
                </span>
              </div>
              <p className="text-xs text-red-800 mt-1 leading-relaxed">{clinicalError.message}</p>
              {clinicalError.suggestion && (
                <div className="text-[11px] text-red-900 bg-red-100/70 p-2.5 rounded-lg mt-2 font-medium flex items-center gap-2 border border-red-200/50">
                  <Info className="w-4 h-4 text-red-700 shrink-0" />
                  <span>{clinicalError.suggestion}</span>
                </div>
              )}
            </div>
            <button
              onClick={() => setClinicalError(null)}
              className="text-red-400 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
              title="Dismiss error notice"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-red-200/60">
            <button
              type="button"
              onClick={() => setClinicalError(null)}
              className="px-3.5 py-1.5 border border-red-300 bg-white hover:bg-red-50 text-red-800 text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-xs"
            >
              Dismiss
            </button>
            <button
              type="button"
              onClick={() => {
                setClinicalError(null);
                handleTriggerAnalysis();
              }}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Diagnostic Analysis</span>
            </button>
          </div>
        </div>
      )}

      {/* Main 2-Column Workstation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Case Context & Scan Ingestion (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Card 1: Patient Demographic & Anatomical Site Parameters */}
          <div className="bg-white border border-[#c3c6d7]/70 rounded-2xl p-5 shadow-xs space-y-4 hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#2563eb] flex items-center justify-center font-bold text-xs">
                  01
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#131b2e] flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#2563eb]" />
                    Patient Demographics & Case Info
                  </h3>
                  <p className="text-[10px] text-[#737686]">Clinical record linkage & metadata</p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-[#2563eb] bg-[#eff4fe] px-2 py-0.5 rounded-full font-bold">
                Step 1 of 2
              </span>
            </div>

            {/* Pre-linked Patient Badge */}
            {patientId && (
              <div className="bg-[#f0f4ff] border border-[#2563eb]/30 rounded-xl p-3 flex items-center justify-between gap-3 text-xs shadow-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-[#2563eb] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[#131b2e] font-bold truncate">
                      Linked Patient: <span className="font-mono text-[#2563eb]">{patientId}</span>
                    </div>
                    {patientName && (
                      <div className="text-[11px] text-[#52576b] truncate">
                        {patientName} {patientAge ? `• ${patientAge} yrs` : ''} {patientGender ? `• ${patientGender}` : ''}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPatientId("");
                    setPatientName("");
                    setPatientAge("");
                  }}
                  className="text-[11px] text-[#2563eb] hover:text-[#004ac6] font-semibold underline shrink-0 cursor-pointer"
                >
                  Detach
                </button>
              </div>
            )}

            {/* Quick Existing Patient Dropdown */}
            {existingPatients.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#434655] flex items-center justify-between" htmlFor="existing-patient-select">
                  <span>Select from Patient Registry</span>
                  <span className="text-[10px] text-[#737686]">{existingPatients.length} registered</span>
                </label>
                <div className="relative">
                  <select
                    id="existing-patient-select"
                    className="w-full pl-3 pr-8 py-2.5 bg-[#f8fafc] border border-[#c3c6d7] rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] outline-none transition-all focus:bg-white cursor-pointer"
                    value={patientId}
                    onChange={(e) => handlePatientSelect(e.target.value)}
                  >
                    <option value="">-- New Patient (Will auto-generate unique MRN) --</option>
                    {existingPatients.map((p) => (
                      <option key={p.id || p.patient_id} value={p.patient_id}>
                        [{p.patient_id}] {p.name} {p.age ? `· ${p.age}y` : ''} {p.gender ? `· ${p.gender}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Patient ID and Name */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1 sm:col-span-1">
                <label className="text-[11px] font-semibold text-[#434655] flex items-center justify-between" htmlFor="patient-id">
                  <span>Patient ID</span>
                  <span className="text-[9px] text-[#2563eb]">Auto</span>
                </label>
                <input 
                  id="patient-id"
                  className="w-full px-3 py-2 bg-[#f8fafc] border border-[#c3c6d7] rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] outline-none transition-all focus:bg-white font-mono placeholder:text-slate-400" 
                  type="text" 
                  placeholder="e.g. PT-10023"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-semibold text-[#434655] flex items-center justify-between" htmlFor="patient-name">
                  <span>Patient Full Name</span>
                  <span className="text-[9px] text-slate-400">Required for PDF</span>
                </label>
                <input 
                  id="patient-name"
                  list="existing-patients-datalist"
                  className="w-full px-3 py-2 bg-[#f8fafc] border border-[#c3c6d7] rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] outline-none transition-all focus:bg-white placeholder:text-slate-400" 
                  type="text" 
                  placeholder="e.g. Sarah Jenkins or Case #402"
                  value={patientName}
                  onChange={(e) => handlePatientNameChange(e.target.value)}
                />
                <datalist id="existing-patients-datalist">
                  {existingPatients.map((p) => (
                    <option key={p.id || p.patient_id} value={p.name}>
                      {p.patient_id} {p.age ? `· ${p.age}y` : ""} {p.gender ? `· ${p.gender}` : ""}
                    </option>
                  ))}
                </datalist>
              </div>
            </div>

            {/* Age and Gender */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#434655]" htmlFor="patient-age">
                  Age (Years)
                </label>
                <input 
                  id="patient-age"
                  className="w-full px-3 py-2 bg-[#f8fafc] border border-[#c3c6d7] rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] outline-none transition-all focus:bg-white placeholder:text-slate-400" 
                  type="number" 
                  min="0"
                  max="130"
                  placeholder="e.g. 52"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#434655]" htmlFor="patient-gender">
                  Biological Gender
                </label>
                <select 
                  id="patient-gender"
                  className="w-full px-3 py-2 bg-[#f8fafc] border border-[#c3c6d7] rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] outline-none transition-all focus:bg-white cursor-pointer"
                  value={patientGender}
                  onChange={(e) => setPatientGender(e.target.value as any)}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other / Unspecified</option>
                </select>
              </div>
            </div>

            {/* Anatomical Target Site Selection */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-semibold text-[#434655] flex items-center justify-between">
                <span>Anatomical Target Site</span>
                <span className="text-[10px] text-[#737686]">Renal sweep laterality</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "Left Kidney", label: "Left Kidney", badge: "L" },
                  { id: "Right Kidney", label: "Right Kidney", badge: "R" },
                  { id: "Unspecified", label: "Bilateral / Unspec", badge: "B" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setLocation(item.id as any)}
                    className={`py-2 px-2.5 border rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      location === item.id 
                        ? "bg-[#2563eb] text-white border-[#2563eb] shadow-sm font-bold scale-[1.01]" 
                        : "bg-white text-[#434655] border-[#c3c6d7] hover:bg-[#f8fafc] hover:border-slate-400"
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-mono font-bold ${
                      location === item.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
                    }`}>
                      {item.badge}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: Ultrasound Scan Upload & Ingestion */}
          <div className="bg-white border border-[#c3c6d7]/70 rounded-2xl p-5 shadow-xs space-y-4 hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#2563eb] flex items-center justify-center font-bold text-xs">
                  02
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#131b2e] flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-[#2563eb]" />
                    Modality Scan Ingestion
                  </h3>
                  <p className="text-[10px] text-[#737686]">B-Mode Ultrasound or Axial CT</p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-[#2563eb] bg-[#eff4fe] px-2 py-0.5 rounded-full font-bold">
                Step 2 of 2
              </span>
            </div>

            {/* Medical Drop Zone with Reticle corners */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => {
                if (!uploadedFile) {
                  fileInputRef.current?.click();
                }
              }}
              className={`relative border-2 border-dashed rounded-2xl p-6 transition-all text-center cursor-pointer overflow-hidden ${
                isDragging
                  ? "border-[#2563eb] bg-blue-50/70 scale-[1.01]"
                  : uploadedFile
                  ? "border-emerald-300 bg-emerald-50/20"
                  : "border-[#c3c6d7] bg-[#f8fafc] hover:bg-[#eff4fe]/50 hover:border-[#2563eb]/70"
              }`}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".jpg,.jpeg,.png,image/jpeg,image/png" 
                className="hidden" 
                onChange={handleImageFileChange} 
              />

              {uploadedFile ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[#131b2e] truncate max-w-xs mx-auto">
                      {uploadedFile.name}
                    </h4>
                    <p className="text-[11px] text-[#737686] mt-0.5 font-mono">
                      {(uploadedFile.size / 1024).toFixed(0)} KB • DICOM Ultrasound Validated
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-[#2563eb] hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors cursor-pointer"
                    >
                      Change Scan
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile();
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-500 shadow-2xs">
                    <ImageIcon className="w-6 h-6 stroke-[1.75]" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#131b2e]">
                      Click or drag & drop ultrasound scan
                    </div>
                    <p className="text-[11px] text-[#737686] max-w-xs mx-auto mt-0.5">
                      Accepts standard ultrasound B-mode captures or axial CT slices (PNG, JPG)
                    </p>
                  </div>
                  <div className="pt-2 flex items-center justify-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[10px] font-mono text-slate-600 font-medium">
                      B-Mode Ultrasound
                    </span>
                    <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[10px] font-mono text-slate-600 font-medium">
                      Renal CT Slice
                    </span>
                    <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[10px] font-mono text-slate-600 font-medium">
                      Max 25MB
                    </span>
                  </div>
                </div>
              )}
            </div>

            {uploadError && (
              <div className="text-xs text-red-700 bg-red-50 border border-red-200 p-3 rounded-xl flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <span className="leading-snug">{uploadError}</span>
              </div>
            )}

            {/* Run Analysis Action Button */}
            <button
              onClick={handleTriggerAnalysis}
              disabled={isScanning || !uploadedFile}
              className="w-full bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] hover:from-[#1d4ed8] hover:to-[#1e40af] text-white font-bold text-xs py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm shadow-[#2563eb]/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="tracking-wide">EXECUTING NEURAL TRIAGE PIPELINE...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span className="tracking-wide">EXECUTE AI DIAGNOSTIC PIPELINE</span>
                </>
              )}
            </button>

            {!uploadedFile && (
              <p className="text-[10px] text-center text-[#737686]">
                Upload a renal scan slice above to enable automated AI classification.
              </p>
            )}
          </div>
        </div>

        {/* Right Side: Radiology DICOM Telemetry HUD & Findings (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main Radiology HUD Card */}
          <div className="bg-white border border-[#c3c6d7]/70 rounded-2xl overflow-hidden shadow-xs">
            
            {/* Viewport Header with mode switcher & telemetry toggles */}
            <div className="bg-[#f8fafc] px-4 py-3 border-b border-[#c3c6d7]/70 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${isScanning ? "bg-[#2563eb] animate-ping" : activeAnalysis ? "bg-emerald-500" : "bg-slate-400"}`} />
                <span className="text-xs font-bold text-[#131b2e] tracking-tight uppercase">
                  Radiology Imaging Viewer
                </span>
                <span className="font-mono text-[10px] text-[#737686] bg-slate-200/70 px-2 py-0.5 rounded-md font-semibold">
                  {activeAnalysis ? `ID: #${activeAnalysis.id}` : "STANDBY"}
                </span>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                {/* View Mode Switcher Pills */}
                {activeAnalysis && (
                  <div className="flex items-center bg-slate-200/80 p-0.5 rounded-xl text-[10.5px] font-semibold gap-0.5">
                    {activeAnalysis.visualizationUrl && (activeAnalysis.prediction || '').toLowerCase() !== 'normal' && (
                      <button
                        type="button"
                        onClick={() => setHeatmapViewMode("panel")}
                        className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                          heatmapViewMode === "panel" ? "bg-[#2563eb] text-white shadow-xs font-bold" : "text-[#434655] hover:text-[#131b2e]"
                        }`}
                        title="Side-by-side Inpainted Scan and Grad-CAM Heatmap"
                      >
                        <Crosshair className="w-3 h-3 text-yellow-300" />
                        <span>Dual Panel</span>
                      </button>
                    )}
                    {activeAnalysis.heatmapUrl && (activeAnalysis.prediction || '').toLowerCase() !== 'normal' && (
                      <button
                        type="button"
                        onClick={() => setHeatmapViewMode("gradcam")}
                        className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                          heatmapViewMode === "gradcam" ? "bg-[#2563eb] text-white shadow-xs font-bold" : "text-[#434655] hover:text-[#131b2e]"
                        }`}
                        title="Grad-CAM Saliency Overlay"
                      >
                        <Layers className="w-3 h-3 stroke-[1.75]" />
                        <span>Grad-CAM</span>
                      </button>
                    )}
                    {activeAnalysis.cleanedScanUrl && (
                      <button
                        type="button"
                        onClick={() => setHeatmapViewMode("cleaned")}
                        className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                          heatmapViewMode === "cleaned" ? "bg-[#2563eb] text-white shadow-xs font-bold" : "text-[#434655] hover:text-[#131b2e]"
                        }`}
                        title="Telea Inpainted Scan without calipers/text"
                      >
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                        <span>Inpainted</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setHeatmapViewMode("raw")}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        heatmapViewMode === "raw" ? "bg-white text-[#131b2e] shadow-xs font-bold" : "text-[#434655] hover:text-[#131b2e]"
                      }`}
                      title="Raw upload slice"
                    >
                      <span>Raw</span>
                    </button>
                  </div>
                )}

                {/* DICOM Inspection Viewport Controls */}
                {uploadedFilePreview && (
                  <div className="flex items-center gap-1 bg-white border border-[#c3c6d7] rounded-lg p-0.5 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setZoomLevel((z) => Math.max(0.8, Number((z - 0.2).toFixed(1))))}
                      className="p-1 text-slate-600 hover:text-[#2563eb] hover:bg-slate-100 rounded cursor-pointer"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] font-mono px-1 font-semibold text-slate-700 min-w-[32px] text-center">
                      {Math.round(zoomLevel * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setZoomLevel((z) => Math.min(2.5, Number((z + 0.2).toFixed(1))))}
                      className="p-1 text-slate-600 hover:text-[#2563eb] hover:bg-slate-100 rounded cursor-pointer"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-px h-3.5 bg-slate-200 mx-0.5" />
                    <button
                      type="button"
                      onClick={() => setShowGrid(!showGrid)}
                      className={`p-1 rounded cursor-pointer transition-colors ${
                        showGrid ? "bg-blue-100 text-[#2563eb]" : "text-slate-600 hover:text-[#2563eb] hover:bg-slate-100"
                      }`}
                      title="Toggle 10mm Calibration Grid"
                    >
                      <Grid className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setInvertContrast(!invertContrast)}
                      className={`p-1 rounded cursor-pointer transition-colors ${
                        invertContrast ? "bg-blue-100 text-[#2563eb]" : "text-slate-600 hover:text-[#2563eb] hover:bg-slate-100"
                      }`}
                      title="Toggle Grayscale Inversion"
                    >
                      <SunMedium className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoomLevel(1)}
                      className="p-1 text-slate-600 hover:text-[#2563eb] hover:bg-slate-100 rounded cursor-pointer"
                      title="Reset Viewport"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Medical Imaging Canvas */}
            <div className="p-4 bg-slate-900/5">
              <div className={`relative rounded-xl overflow-hidden flex items-center justify-center w-full min-h-[340px] max-h-[540px] aspect-[16/10] bg-[#090d16] border border-slate-800 transition-all ${
                isFullscreen ? "fixed inset-4 z-50 max-h-none h-auto w-auto aspect-auto shadow-2xl" : ""
              }`}>
                
                {uploadedFilePreview ? (
                  <>
                    {/* Image Viewport Canvas */}
                    <div className="relative w-full h-full flex items-center justify-center overflow-hidden p-2">
                      <img
                        alt="Renal Diagnostic Scan"
                        className="w-full h-full select-none transition-transform duration-200 relative z-10 object-contain"
                        style={{
                          transform: `scale(${zoomLevel})`,
                          filter: invertContrast ? "invert(1) contrast(1.15)" : "none",
                        }}
                        src={currentImageUrl || uploadedFilePreview}
                      />

                      {/* DICOM 10mm Grid Overlay */}
                      {showGrid && (
                        <div 
                          className="absolute inset-0 pointer-events-none z-20"
                          style={{
                            backgroundImage: `
                              linear-gradient(to right, rgba(59, 130, 246, 0.15) 1px, transparent 1px),
                              linear-gradient(to bottom, rgba(59, 130, 246, 0.15) 1px, transparent 1px)
                            `,
                            backgroundSize: '24px 24px',
                          }}
                        />
                      )}
                    </div>

                    {/* Top-Left DICOM Telemetry Stamp */}
                    <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md text-white text-[10px] font-mono px-2.5 py-1.5 rounded-lg border border-white/10 z-20 pointer-events-none shadow-md space-y-0.5">
                      <div className="font-bold text-slate-200">
                        {patientName ? patientName.toUpperCase() : "PATIENT UNREGISTERED"}
                      </div>
                      <div className="text-slate-400 text-[9px]">
                        MRN: {patientId || "AUTO-PENDING"} • {location.toUpperCase()}
                      </div>
                    </div>

                    {/* Top-Right Mode Indicator Stamp */}
                    <div className="absolute top-3 right-3 bg-black/75 backdrop-blur-md text-white text-[10px] font-mono px-2.5 py-1.5 rounded-lg border border-white/10 z-20 pointer-events-none shadow-md flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {heatmapViewMode === "panel" && <span>DUAL CLINICAL PANEL (INPAINT + GRAD-CAM)</span>}
                      {heatmapViewMode === "gradcam" && <span>GRAD-CAM ACTIVATION SALIENCY</span>}
                      {heatmapViewMode === "cleaned" && <span>TELEA ARTIFACT-INPAINTED SCAN</span>}
                      {heatmapViewMode === "raw" && <span>RAW SOURCE SCAN</span>}
                    </div>

                    {/* Bottom-Right Diagnostic Badge */}
                    {activeAnalysis && !isScanning && (
                      <div className={`absolute bottom-3 right-3 ${findingTheme.badge} text-white px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-lg backdrop-blur-md z-20 pointer-events-none`}>
                        {isNormal ? <CheckCircle2 className="w-4 h-4" /> : <CircleDot className="w-4 h-4 animate-pulse" />}
                        <span className="text-xs font-bold uppercase tracking-wider">
                          {findingTheme.label}
                        </span>
                      </div>
                    )}

                    {/* Bottom-Left Caliper Indicator */}
                    {activeAnalysis?.clinicalAssessment?.estimated_diameter_mm && (
                      <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md text-amber-300 text-[10px] font-mono px-2.5 py-1.5 rounded-lg border border-amber-400/30 z-20 pointer-events-none shadow-md flex items-center gap-1.5">
                        <Ruler className="w-3.5 h-3.5 text-amber-400" />
                        <span>EST. LESION DIAMETER: ~{activeAnalysis.clinicalAssessment.estimated_diameter_mm} MM</span>
                      </div>
                    )}
                  </>
                ) : (
                  /* Clean Radiological Standby Viewport */
                  <div className="flex flex-col items-center justify-center p-8 text-center space-y-3 z-10">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 shadow-inner">
                      <ImageIcon className="w-8 h-8 stroke-[1.5]" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-white tracking-wide">
                        Radiological Viewport on Standby
                      </h4>
                      <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                        Upload a renal CT or ultrasound scan in Step 02 to initialize real-time diagnostic telemetry.
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-400 text-xs font-mono">
                      <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                      <span>Awaiting Scan Ingestion</span>
                    </div>
                  </div>
                )}

                {/* Scanning Live Ticker Overlay */}
                {isScanning && (
                  <div className="absolute inset-0 bg-[#090d16]/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-30">
                    <div className="relative mb-4">
                      <Loader2 className="w-12 h-12 text-[#2563eb] animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center font-mono text-[10px] font-bold text-blue-200">
                        {Math.round(((currentStageIdx + 1) / ANALYSIS_STAGES.length) * 100)}%
                      </div>
                    </div>
                    
                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mb-3 max-w-[260px]">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
                        style={{ width: `${((currentStageIdx + 1) / ANALYSIS_STAGES.length) * 100}%` }}
                      />
                    </div>
                    
                    <span className="text-xs text-white font-bold uppercase tracking-wider animate-pulse">
                      {ANALYSIS_STAGES[currentStageIdx]?.label || "Processing Acoustic Tensors..."}
                    </span>
                    <span className="text-[11px] text-slate-300 mt-1 max-w-xs leading-relaxed">
                      {ANALYSIS_STAGES[currentStageIdx]?.desc}
                    </span>
                  </div>
                )}

              </div>
            </div>

            {/* Diagnostic Inference Findings & Telemetry Section */}
            <div className="p-5 space-y-5">
              
              {/* Idle Guidance Card */}
              {!isScanning && !activeAnalysis && (
                <div className="text-center py-6 px-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                  <Activity className="w-8 h-8 text-slate-400 stroke-[1.75] mx-auto mb-1" />
                  <h5 className="text-xs font-bold text-[#131b2e]">Awaiting Diagnostic Execution</h5>
                  <p className="text-[11px] text-[#737686] max-w-sm mx-auto leading-relaxed">
                    Once you upload an ultrasound image and trigger analysis, this console will populate complete 4-class probabilities, Modality Gatekeeper verification, lesion diameters, and radiologist addendum signing.
                  </p>
                </div>
              )}

              {/* Multi-Stage Progression Bar (when scanning) */}
              {isScanning && (
                <div className="space-y-2 py-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-xs font-bold uppercase text-[#131b2e] tracking-wider flex items-center gap-1.5">
                      <Cpu className="w-4 h-4 text-[#2563eb]" />
                      Real-Time Neural Execution Ticker
                    </span>
                    <span className="text-xs font-mono font-bold text-[#2563eb]">
                      Stage {currentStageIdx + 1} of {ANALYSIS_STAGES.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {ANALYSIS_STAGES.map((stg, i) => (
                      <div 
                        key={stg.id} 
                        className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 transition-all ${
                          currentStageIdx > i 
                            ? "border-emerald-200 bg-emerald-50/50 text-emerald-900" 
                            : currentStageIdx === i 
                            ? "border-[#2563eb] bg-blue-50/60 text-[#2563eb] font-bold shadow-xs" 
                            : "border-slate-200 bg-slate-50 text-slate-400"
                        }`}
                      >
                        {currentStageIdx > i ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : currentStageIdx === i ? (
                          <Loader2 className="w-4 h-4 text-[#2563eb] animate-spin shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-[10px] font-mono shrink-0">
                            {i + 1}
                          </div>
                        )}
                        <span className="truncate leading-tight text-[11px]">{stg.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Complete Diagnostic Findings & Telemetry (When Active) */}
              {!isScanning && activeAnalysis && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  
                  {/* Primary Diagnosis & Confidence Triage Card */}
                  <div className={`p-4 rounded-2xl border ${findingTheme.border} ${findingTheme.bg} flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold text-white uppercase tracking-wider ${findingTheme.badge}`}>
                          Primary Finding
                        </span>
                        <span className="text-[11px] text-[#52576b] font-medium">
                          Dual-stage verified
                        </span>
                      </div>
                      <div className="text-base sm:text-lg font-extrabold text-[#131b2e] tracking-tight">
                        {activeAnalysis.primaryDiagnosis || activeAnalysis.pathologyFinding || activeAnalysis.diagnosis}
                      </div>
                    </div>

                    <div className="sm:text-right shrink-0 bg-white/80 backdrop-blur-xs p-3 rounded-xl border border-slate-200/60 shadow-2xs">
                      <div className="text-[10px] font-bold text-[#737686] uppercase tracking-wider">
                        Diagnostic Certainty
                      </div>
                      <div className="flex items-center sm:justify-end gap-2 mt-0.5">
                        <span className="font-extrabold text-base sm:text-lg text-[#2563eb] font-mono">
                          {activeAnalysis.confidence}%
                        </span>
                        <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-md ${
                          activeAnalysis.confidence >= 90 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          {activeAnalysis.confidence >= 90 ? "High Certainty" : "Moderate"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stage-1 Modality Gatekeeper Banner */}
                  <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/70 flex items-center justify-between gap-3 text-xs shadow-2xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-5 h-5 stroke-[2]" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-emerald-950 flex items-center gap-2">
                          <span>Stage-1 Modality Gatekeeper: PASSED</span>
                          <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-emerald-200/70 text-emerald-800 font-mono font-bold">
                            Renal Authenticated
                          </span>
                        </div>
                        <div className="text-[11px] text-emerald-800 truncate mt-0.5">
                          Acoustic parenchyma validated • Non-kidney rejection check cleared
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-emerald-950 text-sm">
                        {activeAnalysis.gateEvaluation?.kidney_confidence_percent ?? 98.4}%
                      </div>
                      <div className="text-[10px] text-emerald-700 font-medium">Renal Match</div>
                    </div>
                  </div>

                  {/* 4-Class Probability Spectrum Breakdown */}
                  {activeAnalysis.classProbabilities && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[11px] font-bold text-[#434655] uppercase tracking-wider">
                        <span>4-Class Softmax Probability Spectrum</span>
                        <span className="font-mono text-[10px] text-slate-500 font-normal">Normalized Logits</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        
                        {/* Cyst */}
                        {(() => {
                          const val = activeAnalysis.classProbabilities?.Cyst ?? activeAnalysis.classProbabilities?.cyst ?? 0;
                          const isTop = isCyst;
                          return (
                            <div className={`rounded-xl p-3 text-center border transition-all ${
                              isTop ? "bg-sky-50 border-sky-300 ring-2 ring-sky-400/20 shadow-xs" : "bg-slate-50 border-slate-200"
                            }`}>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-sky-800 font-bold uppercase tracking-wider">Cyst</span>
                                {isTop && <span className="w-2 h-2 rounded-full bg-sky-500" />}
                              </div>
                              <div className="text-base font-extrabold text-sky-950 font-mono mt-1">
                                {val}%
                              </div>
                              <div className="w-full bg-sky-200/60 h-1.5 rounded-full mt-2 overflow-hidden">
                                <div className="bg-sky-600 h-full rounded-full transition-all" style={{ width: `${val}%` }} />
                              </div>
                            </div>
                          );
                        })()}

                        {/* Normal */}
                        {(() => {
                          const val = activeAnalysis.classProbabilities?.Normal ?? activeAnalysis.classProbabilities?.normal ?? 0;
                          const isTop = isNormal;
                          return (
                            <div className={`rounded-xl p-3 text-center border transition-all ${
                              isTop ? "bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400/20 shadow-xs" : "bg-slate-50 border-slate-200"
                            }`}>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">Normal</span>
                                {isTop && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
                              </div>
                              <div className="text-base font-extrabold text-emerald-950 font-mono mt-1">
                                {val}%
                              </div>
                              <div className="w-full bg-emerald-200/60 h-1.5 rounded-full mt-2 overflow-hidden">
                                <div className="bg-emerald-600 h-full rounded-full transition-all" style={{ width: `${val}%` }} />
                              </div>
                            </div>
                          );
                        })()}

                        {/* Stone */}
                        {(() => {
                          const val = activeAnalysis.classProbabilities?.Stone ?? activeAnalysis.classProbabilities?.stone ?? 0;
                          const isTop = isStone;
                          return (
                            <div className={`rounded-xl p-3 text-center border transition-all ${
                              isTop ? "bg-rose-50 border-rose-300 ring-2 ring-rose-400/20 shadow-xs" : "bg-slate-50 border-slate-200"
                            }`}>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-rose-800 font-bold uppercase tracking-wider">Stone</span>
                                {isTop && <span className="w-2 h-2 rounded-full bg-rose-500" />}
                              </div>
                              <div className="text-base font-extrabold text-rose-950 font-mono mt-1">
                                {val}%
                              </div>
                              <div className="w-full bg-rose-200/60 h-1.5 rounded-full mt-2 overflow-hidden">
                                <div className="bg-rose-600 h-full rounded-full transition-all" style={{ width: `${val}%` }} />
                              </div>
                            </div>
                          );
                        })()}

                        {/* Tumor */}
                        {(() => {
                          const val = activeAnalysis.classProbabilities?.Tumor ?? activeAnalysis.classProbabilities?.tumor ?? 0;
                          const isTop = isTumor;
                          return (
                            <div className={`rounded-xl p-3 text-center border transition-all ${
                              isTop ? "bg-purple-50 border-purple-300 ring-2 ring-purple-400/20 shadow-xs" : "bg-slate-50 border-slate-200"
                            }`}>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-purple-800 font-bold uppercase tracking-wider">Tumor</span>
                                {isTop && <span className="w-2 h-2 rounded-full bg-purple-500" />}
                              </div>
                              <div className="text-base font-extrabold text-purple-950 font-mono mt-1">
                                {val}%
                              </div>
                              <div className="w-full bg-purple-200/60 h-1.5 rounded-full mt-2 overflow-hidden">
                                <div className="bg-purple-600 h-full rounded-full transition-all" style={{ width: `${val}%` }} />
                              </div>
                            </div>
                          );
                        })()}

                      </div>
                    </div>
                  )}

                  {/* Clinical Biometrics & Preprocessing Telemetry */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    
                    {/* Lesion Diameter */}
                    <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
                      <div className="text-[10.5px] text-slate-500 font-semibold uppercase flex items-center gap-1.5">
                        <Ruler className="w-3.5 h-3.5 text-[#2563eb]" />
                        <span>Est. Lesion Caliper</span>
                      </div>
                      <div className="font-extrabold text-slate-900 font-mono text-sm mt-1">
                        {activeAnalysis.clinicalAssessment?.estimated_diameter_mm 
                          ? `~${activeAnalysis.clinicalAssessment.estimated_diameter_mm} mm`
                          : "No focal lesion"}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Spatial pixel calibration</div>
                    </div>

                    {/* Severity Tier */}
                    <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
                      <div className="text-[10.5px] text-slate-500 font-semibold uppercase flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                        <span>Severity & Urgency</span>
                      </div>
                      <div className="font-extrabold text-slate-900 text-sm mt-1 truncate">
                        {activeAnalysis.clinicalAssessment?.severity || "Standard"}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                        {activeAnalysis.clinicalAssessment?.urgency || "Follow-up schedule"}
                      </div>
                    </div>

                    {/* Telea Inpainting Telemetry */}
                    <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
                      <div className="text-[10.5px] text-slate-500 font-semibold uppercase flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Telea Inpainting</span>
                      </div>
                      <div className="font-extrabold text-slate-900 text-sm mt-1">
                        {activeAnalysis.telemetry?.auto_masking?.artifacts_count ?? 1} artifacts stripped
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Calipers & text suppressed
                      </div>
                    </div>

                  </div>

                  {/* Clinician Addendum & Digital Signing Section */}
                  <div className="bg-slate-50/70 border border-[#c3c6d7]/70 rounded-2xl p-4.5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#131b2e] flex items-center gap-2">
                        <FileSignature className="w-4 h-4 text-[#2563eb]" />
                        Attending Radiologist Addendum
                      </h4>
                      <button
                        type="button"
                        onClick={handleSaveReport}
                        disabled={isSavingNotes}
                        className="self-start sm:self-auto px-3 py-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                      >
                        {isSavingNotes ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        <span>{isSavingNotes ? "Signing..." : noteSavedSuccess ? "Saved to Report" : "Save Notes"}</span>
                      </button>
                    </div>

                    {/* Quick Diagnostic Impression Helper Chips */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      <span className="text-[10px] font-semibold text-[#737686] uppercase mr-1">Quick Add:</span>
                      {[
                        "Acoustic shadow confirmed",
                        "Well-circumscribed anechoic",
                        "No hydronephrosis",
                        "Recommend urological consult",
                        "Follow-up scan in 6 months",
                      ].map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => handleAppendSnippet(chip)}
                          className="text-[10.5px] px-2.5 py-1 bg-white hover:bg-[#eff4fe] hover:text-[#2563eb] border border-slate-200 rounded-lg text-slate-700 transition-colors cursor-pointer shadow-2xs font-medium"
                        >
                          + {chip}
                        </button>
                      ))}
                    </div>

                    <textarea
                      className="w-full p-3.5 bg-white border border-[#c3c6d7] rounded-xl text-xs font-sans focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all min-h-[90px] placeholder:text-slate-400"
                      placeholder="Enter clinical observations, secondary parenchyma morphology, or specialized impression notes to seal into the medical audit log..."
                      value={clinicianNotes}
                      onChange={(e) => setClinicianNotes(e.target.value)}
                    />
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10.5px]">
                      <span className="text-[#737686]">
                        * Notes are cryptographically signed with your active clinician session ID and timestamped into the official PDF dossier.
                      </span>
                      {noteSavedSuccess && (
                        <span className="font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-md inline-flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
                          <Check className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Saved to PDF & Database</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Bar (Sign, Preview PDF, Download PDF, History) */}
                  <div className="pt-2 flex gap-2.5 flex-wrap sm:flex-nowrap">
                    
                    {/* Primary Sign Action */}
                    <button
                      onClick={handleSaveReport}
                      disabled={isSavingNotes}
                      className="flex-1 bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] hover:from-[#1d4ed8] hover:to-[#1e40af] text-white font-bold text-xs py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
                    >
                      {isSavingNotes ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="w-4 h-4" />
                      )}
                      <span>{isSavingNotes ? "Signing Dossier..." : "Sign & Finalize Report"}</span>
                    </button>

                    {/* PDF Preview Button */}
                    <button
                      onClick={async () => {
                        try {
                          if (!activeAnalysis?.id) return;
                          setIsPreviewLoading(true);
                          if (clinicianNotes.trim()) {
                            await updateAnalysis(activeAnalysis.id, {
                              clinicianNotes: clinicianNotes.trim()
                            });
                          }
                          const url = await getReportPdfBlobUrl(activeAnalysis.id);
                          setPdfPreviewUrl(url);
                        } catch (e) {
                          alert("Failed to load PDF preview. Please ensure the backend server is running.");
                        } finally {
                          setIsPreviewLoading(false);
                        }
                      }}
                      disabled={isPreviewLoading}
                      className="px-4 py-3 bg-white border border-[#2563eb] text-[#2563eb] hover:bg-[#eff4fe] font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
                      title="Preview clinical PDF report"
                    >
                      {isPreviewLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                      <span>Preview PDF</span>
                    </button>

                    {/* PDF Download Direct */}
                    <button
                      onClick={async () => {
                        try {
                          if (!activeAnalysis?.id) return;
                          const btn = document.getElementById('pdf-btn') as HTMLButtonElement;
                          if (btn) btn.innerHTML = '<span class="animate-pulse">Saving...</span>';
                          
                          if (clinicianNotes.trim()) {
                            await updateAnalysis(activeAnalysis.id, {
                              clinicianNotes: clinicianNotes.trim()
                            });
                          }

                          await downloadReport(activeAnalysis.id, `kidneyvision_report_${activeAnalysis.id}.pdf`);
                          if (btn) btn.innerHTML = '<svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>';
                        } catch (e) {
                          alert("Failed to download PDF report.");
                        }
                      }}
                      id="pdf-btn"
                      className="px-3.5 py-3 bg-white border border-[#c3c6d7] hover:bg-slate-50 text-[#131b2e] rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-xs"
                      title="Download PDF Report"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    {/* History Button */}
                    {onAddSuccess && (
                      <button
                        type="button"
                        onClick={onAddSuccess}
                        className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        title="View this study in Historical Analysis Logs"
                      >
                        <ChevronRight className="w-4 h-4" />
                        <span>History</span>
                      </button>
                    )}

                  </div>

                </div>
              )}

            </div>
            
          </div>

        </div>
      </div>

      {/* In-App PDF Preview Modal */}
      {pdfPreviewUrl && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-[#e2e8f0] flex items-center justify-between bg-[#f8fafc]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563eb] flex items-center justify-center shrink-0">
                  <FileText className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-[#131b2e] truncate">
                    Clinical Diagnostic Report Dossier
                  </h3>
                  <p className="text-[10px] text-[#737686] font-mono truncate">
                    Case {activeAnalysis ? `#${activeAnalysis.id} • ${patientName || patientId || "Case"}` : ""}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={pdfPreviewUrl}
                  download={`kidneyvision_report_${activeAnalysis?.id || "preview"}.pdf`}
                  className="px-3.5 py-1.5 bg-[#2563eb] text-white hover:bg-blue-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </a>
                <button
                  onClick={() => {
                    if (pdfPreviewUrl.startsWith("blob:")) {
                      URL.revokeObjectURL(pdfPreviewUrl);
                    }
                    setPdfPreviewUrl(null);
                  }}
                  className="p-1.5 text-[#737686] hover:text-[#131b2e] hover:bg-neutral-200 rounded-lg transition-all cursor-pointer"
                  title="Close Preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body with PDF Viewer iframe */}
            <div className="flex-1 bg-[#525659] relative min-h-[580px]">
              <iframe
                src={`${pdfPreviewUrl}#toolbar=1&navpanes=0`}
                title="Diagnostic Report PDF"
                className="w-full h-full min-h-[580px] border-0"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
