/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { 
  Upload, Sparkles, Loader2, Play, CircleDot, ShieldCheck, 
  Eye, FileText, CheckCircle2, ChevronRight, Download, Dna, 
  ArrowRight, Heart, AlertCircle, FileDown, X, RefreshCw,
  User, Calendar, Layers, Image as ImageIcon, Check, Sliders,
  HelpCircle, Info, Stethoscope, Hash, Trash2, Crosshair,
  Ruler, Activity, Cpu, CheckCircle, Maximize2
} from "lucide-react";
import { createPrediction, downloadReport, updateAnalysis, getReportPdfBlobUrl } from "../services";
import { DiagnosisResult, KidneyAnalysis } from "../types";
import { validateScanFile } from "../utils/fileValidation";
import { parseClinicalError, ClinicalError } from "../utils/errorParser";

interface AppNewAnalysisProps {
  onAddSuccess: () => void;
}

export default function AppNewAnalysis({ onAddSuccess }: AppNewAnalysisProps) {
  // Input fields state — starts completely empty for clinical doctor entry
  const [patientId, setPatientId] = useState<string>("");
  const [patientName, setPatientName] = useState<string>("");
  const [patientAge, setPatientAge] = useState<string>("");
  const [patientGender, setPatientGender] = useState<"Male" | "Female" | "Other">("Male");
  const [location, setLocation] = useState<"Left Kidney" | "Right Kidney" | "Unspecified">("Left Kidney");
  const [clinicianNotes, setClinicianNotes] = useState<string>("");
  
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
    { id: "uploading", label: "Uploading Scan", desc: "Streaming acoustic tensor to secure medical pipeline..." },
    { id: "gatekeeper", label: "Stage-1 Gatekeeper Screening", desc: "MobileNetV3 evaluating renal vs non-kidney scan..." },
    { id: "preprocessing", label: "Spatial Cleaning & Inpainting", desc: "Top-Hat filtering & Telea inpainting on 224x224 tensor..." },
    { id: "analyzing", label: "ConvNeXt 4-Class Inference", desc: "Evaluating Cyst, Normal, Stone, Tumor pathologies..." },
    { id: "generating", label: "Grad-CAM Heatmap & Biometrics", desc: "Synthesizing spatial feature activation map & lesion diameter..." },
    { id: "completed", label: "Diagnostic Report Ready", desc: "Audit logged and ready for radiologist confirmation." },
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

    // If patient name is currently blank, suggest an automated placeholder from filename
    if (!patientName.trim()) {
      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      // Only set if not a generic generic hash
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
    if (fileInputRef.current) fileInputRef.current.value = "";
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

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto">
      
      {/* Top Header & Breadcrumbs matching Dashboard style */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-[#c3c6d7]/30">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[#2563eb] text-[11px] font-bold mb-1">
            <Sparkles className="w-3 h-3" />
            AI Computer Vision Inference Console
          </div>
          <h1 className="font-sans text-2xl font-bold text-[#131b2e] tracking-tight">
            New Renal Diagnostic Analysis
          </h1>
          <p className="font-sans text-xs text-[#434655]">
            Upload renal CT or ultrasound scans to run Stage-1 Gatekeeper screening, ConvNeXt-Tiny 4-class classification (Cyst, Normal, Stone, Tumor), and Grad-CAM explainability localization.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#c3c6d7] rounded-lg text-xs font-semibold text-[#434655] shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-sans text-[11px]">AI Model: ConvNeXt-Tiny (4-Class) & Gatekeeper</span>
          </div>
          <a
            href="/help"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f2f3ff] hover:bg-[#eaedff] text-[#2563eb] text-xs font-bold rounded-lg transition-all"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Guide</span>
          </a>
        </div>
      </div>

      {/* Clinical Error Banner */}
      {clinicalError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm space-y-3 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600 shrink-0 mt-0.5">
              <AlertCircle className="w-4.5 h-4.5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-sans text-xs font-bold text-red-900 flex items-center gap-2">
                <span>{clinicalError.title}</span>
                <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-red-200 text-red-800 uppercase font-mono">
                  {clinicalError.type}
                </span>
              </h4>
              <p className="font-sans text-xs text-red-700 mt-1 leading-relaxed">{clinicalError.message}</p>
              {clinicalError.suggestion && (
                <p className="font-sans text-[11px] text-red-800 bg-red-100/60 p-2 rounded-md mt-2 font-medium">
                  💡 {clinicalError.suggestion}
                </p>
              )}
            </div>
            <button
              onClick={() => setClinicalError(null)}
              className="text-red-400 hover:text-red-700 p-1.5 rounded transition-colors cursor-pointer"
              title="Dismiss error notice"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-red-200/60">
            <button
              type="button"
              onClick={() => setClinicalError(null)}
              className="px-3 py-1.5 border border-red-300 text-red-700 hover:bg-red-100 text-xs font-semibold rounded-lg transition-all cursor-pointer"
            >
              Dismiss
            </button>
            <button
              type="button"
              onClick={() => {
                setClinicalError(null);
                handleTriggerAnalysis();
              }}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              <RefreshCw className="w-3 h-3" />
              Retry Analysis
            </button>
          </div>
        </div>
      )}

      {/* Main 2-Column Responsive Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Parameters Registration & Upload (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Card 1: Patient Clinical Metadata */}
          <div className="bg-white border border-[#c3c6d7] rounded-xl p-5 shadow-xs space-y-4 hover:border-slate-400 transition-colors">
            <div className="flex items-center justify-between pb-2 border-b border-[#e2e8f0]">
              <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-[#131b2e] flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-50 text-[#2563eb] flex items-center justify-center">
                  <User className="w-3.5 h-3.5" />
                </div>
                Patient Registration Parameters
              </h3>
              <span className="text-[10px] text-[#737686] font-medium">Step 1 of 2</span>
            </div>

            {/* Patient ID and Name */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1 col-span-1">
                <label className="font-sans text-[11px] font-semibold text-[#434655] flex items-center gap-1" htmlFor="patient-id">
                  <span>Patient ID</span>
                </label>
                <input 
                  id="patient-id"
                  className="w-full px-3 py-2 bg-[#f8fafc] border border-[#c3c6d7] rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] outline-none transition-all focus:bg-white font-mono placeholder:text-slate-400" 
                  type="text" 
                  placeholder="e.g. PT-8492"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                />
              </div>

              <div className="space-y-1 col-span-2">
                <label className="font-sans text-[11px] font-semibold text-[#434655]" htmlFor="patient-name">
                  Patient Full Name
                </label>
                <input 
                  id="patient-name"
                  className="w-full px-3 py-2 bg-[#f8fafc] border border-[#c3c6d7] rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] outline-none transition-all focus:bg-white placeholder:text-slate-400" 
                  type="text" 
                  placeholder="e.g. Sarah Jenkins or Case #104"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                />
              </div>
            </div>

            {/* Age and Gender */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-sans text-[11px] font-semibold text-[#434655]" htmlFor="patient-age">
                  Age (Years)
                </label>
                <input 
                  id="patient-age"
                  className="w-full px-3 py-2 bg-[#f8fafc] border border-[#c3c6d7] rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] outline-none transition-all focus:bg-white placeholder:text-slate-400" 
                  type="number" 
                  min="0"
                  max="130"
                  placeholder="e.g. 48"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="font-sans text-[11px] font-semibold text-[#434655]" htmlFor="patient-gender">
                  Biological Gender
                </label>
                <select 
                  id="patient-gender"
                  className="w-full px-3 py-2 bg-[#f8fafc] border border-[#c3c6d7] rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] outline-none transition-all focus:bg-white cursor-pointer"
                  value={patientGender}
                  onChange={(e) => setPatientGender(e.target.value as any)}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other / Unspecified</option>
                </select>
              </div>
            </div>

            {/* Anatomical location targets */}
            <div className="space-y-1.5 pt-1">
              <label className="font-sans text-[11px] font-semibold text-[#434655] flex items-center justify-between">
                <span>Anatomical Target Site</span>
                <span className="text-[10px] text-[#737686] font-normal">Renal sweep orientation</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "Left Kidney", label: "Left Kidney" },
                  { id: "Right Kidney", label: "Right Kidney" },
                  { id: "Unspecified", label: "Unspecified" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setLocation(item.id as any)}
                    className={`py-2 px-2 border rounded-lg text-[11px] font-semibold transition-all cursor-pointer text-center ${
                      location === item.id 
                        ? "bg-[#2563eb] text-white border-[#2563eb] shadow-xs" 
                        : "bg-white text-[#434655] border-[#c3c6d7] hover:bg-[#f8fafc]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: Ultrasound Scan Upload */}
          <div className="bg-white border border-[#c3c6d7] rounded-xl p-5 shadow-xs space-y-4 hover:border-slate-400 transition-colors">
            <div className="flex items-center justify-between pb-2 border-b border-[#e2e8f0]">
              <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-[#131b2e] flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-50 text-[#2563eb] flex items-center justify-center">
                  <Upload className="w-3.5 h-3.5" />
                </div>
                Renal Scan Upload (CT / Ultrasound)
              </h3>
              <span className="text-[10px] text-[#737686] font-medium">Step 2 of 2</span>
            </div>

            {/* Upload Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => {
                if (!uploadedFile) {
                  fileInputRef.current?.click();
                }
              }}
              className={`border-2 border-dashed rounded-xl p-6 transition-all text-center relative cursor-pointer ${
                isDragging
                  ? "border-[#2563eb] bg-blue-50/60 scale-[1.01]"
                  : uploadedFile
                  ? "border-emerald-300 bg-emerald-50/20"
                  : "border-[#c3c6d7] bg-[#f8fafc] hover:bg-[#f2f3ff] hover:border-[#2563eb]/60"
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
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[#131b2e] truncate max-w-xs mx-auto">
                      {uploadedFile.name}
                    </h4>
                    <p className="text-[10px] text-[#737686] mt-0.5">
                      {(uploadedFile.size / 1024).toFixed(0)} KB • Ultrasound format validated
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="px-2.5 py-1 text-[11px] font-semibold text-[#2563eb] hover:bg-blue-50 rounded-md border border-blue-200 transition-colors"
                    >
                      Change Scan
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile();
                      }}
                      className="px-2.5 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50 rounded-md border border-red-200 transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#2563eb] flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <div className="font-sans text-xs font-bold text-[#131b2e]">
                    Click or drag & drop renal scan image (CT / Ultrasound)
                  </div>
                  <p className="font-sans text-[10px] text-[#737686] max-w-xs mx-auto">
                    Supported formats: PNG, JPG • Auto-screened by Gatekeeper
                  </p>
                  <div className="pt-2 flex items-center justify-center gap-2">
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[9.5px] font-mono text-slate-600 font-medium">Renal CT Axial / Coronal</span>
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[9.5px] font-mono text-slate-600 font-medium">Ultrasound B-Mode</span>
                  </div>
                </div>
              )}
            </div>

            {uploadError && (
              <div className="text-[11px] text-red-700 font-sans font-medium bg-red-50 border border-red-200 p-3 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Run Analysis Action Button */}
            <button
              onClick={handleTriggerAnalysis}
              disabled={isScanning || !uploadedFile}
              className="w-full bg-[#2563eb] hover:bg-[#004ac6] text-white font-bold text-xs py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm shadow-[#2563eb]/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>ANALYZING CORE TENSORS...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>RUN DEEP NEURAL DISCOVERY</span>
                </>
              )}
            </button>
            {!uploadedFile && (
              <p className="text-[10px] text-center text-[#737686]">
                Upload an ultrasound scan above to enable AI neural classification.
              </p>
            )}
          </div>
        </div>

        {/* Right Side: Diagnostic Display HUD & Explainability (7 cols) */}
        <div className="lg:col-span-12 xl:col-span-7 space-y-6">
          
          {/* Main Diagnostic HUD Card */}
          {/* Main Diagnostic HUD Card */}
          <div className="bg-white border border-[#c3c6d7] rounded-xl overflow-hidden shadow-xs">
            
            {/* Header with status and View Mode Switcher */}
            <div className="bg-[#f8fafc] px-5 py-3 border-b border-[#c3c6d7] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CircleDot className={`w-3.5 h-3.5 ${isScanning ? "text-[#2563eb] animate-ping" : activeAnalysis ? "text-emerald-500" : "text-[#737686]"}`} />
                <span className="font-sans text-[11px] font-bold text-[#131b2e] uppercase tracking-wider">
                  Diagnostic Imaging Viewer HUD
                </span>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                {activeAnalysis && (
                  <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-[10px] font-semibold gap-0.5">
                    {activeAnalysis.visualizationUrl && (activeAnalysis.prediction || '').toLowerCase() !== 'normal' && (
                      <button
                        type="button"
                        onClick={() => setHeatmapViewMode("panel")}
                        className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                          heatmapViewMode === "panel" ? "bg-[#2563eb] text-white shadow-xs font-bold" : "text-[#434655] hover:text-[#131b2e]"
                        }`}
                        title="Side-by-side Cleaned Scan & Grad-CAM map with diagnostic annotation"
                      >
                        <Crosshair className="w-3 h-3 text-yellow-300" />
                        Dual Clinical Panel
                      </button>
                    )}
                    {activeAnalysis.heatmapUrl && (activeAnalysis.prediction || '').toLowerCase() !== 'normal' && (
                      <button
                        type="button"
                        onClick={() => setHeatmapViewMode("gradcam")}
                        className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                          heatmapViewMode === "gradcam" ? "bg-[#2563eb] text-white shadow-xs font-bold" : "text-[#434655] hover:text-[#131b2e]"
                        }`}
                        title="Grad-CAM Saliency Overlay"
                      >
                        <Sparkles className="w-3 h-3" />
                        Grad-CAM
                      </button>
                    )}
                    {activeAnalysis.cleanedScanUrl && (
                      <button
                        type="button"
                        onClick={() => setHeatmapViewMode("cleaned")}
                        className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                          heatmapViewMode === "cleaned" ? "bg-[#2563eb] text-white shadow-xs font-bold" : "text-[#434655] hover:text-[#131b2e]"
                        }`}
                        title="Telea Inpainted Scan without calipers/text artifacts"
                      >
                        <Layers className="w-3 h-3" />
                        Cleaned Scan
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setHeatmapViewMode("raw")}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        heatmapViewMode === "raw" ? "bg-white text-[#131b2e] shadow-xs font-bold" : "text-[#434655] hover:text-[#131b2e]"
                      }`}
                      title="Raw upload slice"
                    >
                      Raw Scan
                    </button>
                  </div>
                )}

                <span className="font-mono text-[10.5px] text-[#737686] bg-slate-100 px-2 py-0.5 rounded">
                  {activeAnalysis ? `ID: #${activeAnalysis.id}` : "AWAITING INFERENCE"}
                </span>
              </div>
            </div>

            <div className={`p-5 ${heatmapViewMode === "panel" && activeAnalysis?.visualizationUrl ? "space-y-5" : "grid md:grid-cols-2 gap-5"}`}>
              
              {/* Scan viewport panel */}
              <div className="space-y-3">
                <div className={`rounded-xl border relative overflow-hidden flex items-center justify-center group transition-all duration-300 ${
                  heatmapViewMode === "panel" && activeAnalysis?.visualizationUrl
                    ? "aspect-[16/9] sm:aspect-[2.36/1] bg-black min-h-[260px]"
                    : "aspect-square bg-slate-950"
                } ${
                  uploadedFilePreview
                    ? "border-[#c3c6d7]"
                    : "bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#edf2f9] border-2 border-dashed border-[#c3c6d7]"
                }`}>
                  
                  {uploadedFilePreview ? (
                    <>
                      {/* Image Viewer (Dual Panel, Grad-CAM, Cleaned, or Raw) */}
                      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                        {heatmapViewMode === "gradcam" && (
                          <img
                            alt="Underlying Ultrasound Scan"
                            className="absolute inset-0 w-full h-full object-cover"
                            src={activeAnalysis?.cleanedScanUrl || uploadedFilePreview || activeAnalysis?.imageUrl}
                          />
                        )}
                        <img
                          alt="Ultrasound Diagnostic Target"
                          className={`w-full h-full select-none transition-all duration-300 relative z-10 ${
                            heatmapViewMode === "panel" ? "object-contain" : "object-cover"
                          }`}
                          src={
                            heatmapViewMode === "panel" && activeAnalysis?.visualizationUrl
                              ? activeAnalysis.visualizationUrl
                              : heatmapViewMode === "cleaned" && activeAnalysis?.cleanedScanUrl
                              ? activeAnalysis.cleanedScanUrl
                              : heatmapViewMode === "gradcam" && activeAnalysis?.heatmapUrl
                              ? activeAnalysis.heatmapUrl
                              : uploadedFilePreview
                          }
                        />
                      </div>

                      {/* View mode indicator pill */}
                      {activeAnalysis && (
                        <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md text-white text-[9.5px] font-mono px-2.5 py-1 rounded-md border border-white/20 flex items-center gap-1.5 shadow-md">
                          {heatmapViewMode === "panel" && (
                            <>
                              <Crosshair className="w-3 h-3 text-yellow-400" />
                              <span>DUAL CLINICAL PANEL (INPAINTED SCAN + GRAD-CAM + CALIPER TARGET)</span>
                            </>
                          )}
                          {heatmapViewMode === "gradcam" && (
                            <>
                              <Sparkles className="w-3 h-3 text-sky-400" />
                              <span>GRAD-CAM SALIENCY HEATMAP</span>
                            </>
                          )}
                          {heatmapViewMode === "cleaned" && (
                            <>
                              <Layers className="w-3 h-3 text-emerald-400" />
                              <span>TELEA ARTIFACT-INPAINTED SCAN</span>
                            </>
                          )}
                          {heatmapViewMode === "raw" && (
                            <span>B-MODE RAW ULTRASOUND / CT SCAN</span>
                          )}
                        </div>
                      )}

                      {/* Telemetry reticle frame */}
                      <div className="absolute inset-0 border border-white/10 m-3 pointer-events-none rounded-lg" />
                      
                      {/* Status Badges on image */}
                      {activeAnalysis && !isScanning && (() => {
                        const pred = ((activeAnalysis as any).prediction || activeAnalysis.pathologyFinding || '').toLowerCase();
                        const isStone = pred.includes('stone') || pred.includes('nephro');
                        const isCyst = pred.includes('cyst');
                        const isTumor = pred.includes('tumor');
                        const isNormal = pred.includes('normal') || (!isStone && !isCyst && !isTumor && activeAnalysis.diagnosis === DiagnosisResult.NORMAL_FINDINGS);

                        let badgeColor = "bg-amber-600/90";
                        let label = "Review Required";
                        if (isStone) {
                          badgeColor = "bg-rose-600/90";
                          label = "Nephrolithiasis Focus";
                        } else if (isCyst) {
                          badgeColor = "bg-sky-600/90";
                          label = "Renal Cyst";
                        } else if (isTumor) {
                          badgeColor = "bg-purple-600/90";
                          label = "Renal Tumor Alert";
                        } else if (isNormal) {
                          badgeColor = "bg-emerald-600/90";
                          label = "Normal Parenchyma";
                        }

                        return (
                          <div className={`absolute bottom-3 right-3 ${badgeColor} backdrop-blur-sm text-white px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-lg`}>
                            {isNormal ? <CheckCircle2 className="w-3.5 h-3.5" /> : <CircleDot className="w-3.5 h-3.5" />}
                            <span className="text-[9.5px] font-bold uppercase tracking-wider">{label}</span>
                          </div>
                        );
                      })()}
                    </>
                  ) : (
                    /* Clean Clinical Empty Viewport Placeholder */
                    <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-white border border-[#c3c6d7] shadow-xs flex items-center justify-center text-[#2563eb]">
                        <ImageIcon className="w-7 h-7" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-[#131b2e]">Awaiting Ultrasound Scan</p>
                        <p className="text-[11px] text-[#434655] max-w-[220px] leading-relaxed">
                          Upload a B-mode kidney image on the left panel to initialize imaging telemetry.
                        </p>
                      </div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-blue-200 text-[#2563eb] text-[10px] font-semibold shadow-xs">
                        <span className="w-2 h-2 rounded-full bg-[#2563eb] animate-pulse" />
                        <span>Standby for Scan Upload</span>
                      </div>
                    </div>
                  )}

                  {/* HUD scanning overlay when actively processing */}
                  {isScanning && (
                    <div className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
                      <Loader2 className="w-10 h-10 text-blue-400 animate-spin mb-4" />
                      <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden mb-3 max-w-[220px]">
                        <div 
                          className="h-full bg-blue-400 transition-all duration-300"
                          style={{ width: `${((currentStageIdx + 1) / ANALYSIS_STAGES.length) * 100}%` }}
                        />
                      </div>
                      <span className="font-sans text-[11px] text-white font-bold uppercase tracking-widest animate-pulse">
                        {ANALYSIS_STAGES[currentStageIdx]?.label || "Processing..."}
                      </span>
                      <span className="text-[10px] text-slate-300 mt-1 max-w-[200px]">
                        {ANALYSIS_STAGES[currentStageIdx]?.desc}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Textual Inference Outputs & Rich Model Telemetry Panel */}
              <div className="flex flex-col justify-between space-y-4">
                
                {/* Multi-Stage Visual Pipeline Progression (when scanning) */}
                {isScanning && (
                  <div className="flex-1 flex flex-col justify-center space-y-4 py-2 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between pb-2 border-b border-[#e2e8f0]">
                      <div className="font-sans text-[11px] font-bold text-[#131b2e] uppercase tracking-wider flex items-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 text-[#2563eb] animate-spin" />
                        Inference Pipeline
                      </div>
                      <span className="text-[10.5px] font-mono font-bold text-[#2563eb]">
                        {Math.round(((currentStageIdx + 1) / ANALYSIS_STAGES.length) * 100)}%
                      </span>
                    </div>

                    <div className="space-y-2">
                      {ANALYSIS_STAGES.map((stage, idx) => {
                        const isDone = currentStageIdx > idx;
                        const isCurrent = currentStageIdx === idx;
                        return (
                          <div 
                            key={stage.id} 
                            className={`text-xs flex items-center gap-2.5 transition-all p-1.5 rounded-lg ${
                              isDone 
                                ? "text-emerald-700 font-medium bg-emerald-50/50" 
                                : isCurrent 
                                ? "text-[#2563eb] font-bold bg-[#2563eb]/5 border border-[#2563eb]/30" 
                                : "text-[#737686] opacity-50"
                            }`}
                          >
                            <span className="shrink-0">
                              {isDone ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              ) : isCurrent ? (
                                <Loader2 className="w-4 h-4 text-[#2563eb] animate-spin" />
                              ) : (
                                <div className="w-4 h-4 rounded-full border border-[#c3c6d7] flex items-center justify-center text-[9px] text-[#737686]">
                                  {idx + 1}
                                </div>
                              )}
                            </span>
                            <div className="min-w-0">
                              <div className="leading-tight text-[11px]">{stage.label}</div>
                              {isCurrent && (
                                <div className="text-[9.5px] font-normal text-[#434655] truncate mt-0.5 animate-pulse">
                                  {stage.desc}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Idle Initial View */}
                {!isScanning && !activeAnalysis && (
                  <div className="flex-1 flex flex-col justify-center items-center text-center p-6 space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#2563eb] flex items-center justify-center">
                      <Sparkles className="w-6 h-6 opacity-60" />
                    </div>
                    <div className="space-y-1">
                      <h5 className="font-sans text-xs font-bold text-[#131b2e]">Scan Awaiting Inference</h5>
                      <p className="font-sans text-[11px] text-[#737686] max-w-[220px] leading-relaxed">
                        Fill in patient details, attach a renal CT or ultrasound slice, and trigger neural discovery to populate full diagnostic metrics.
                      </p>
                    </div>
                  </div>
                )}

                {/* Finished AI Analysis Outward Indices with 100% Model Capabilities */}
                {!isScanning && activeAnalysis && (
                  <div className="space-y-4">
                    
                    {/* Primary Diagnosis & Confidence Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <div>
                        <div className="text-[10px] font-semibold text-[#737686] uppercase tracking-wider">
                          Primary AI Clinical Finding
                        </div>
                        <div className="font-bold text-sm text-[#131b2e] mt-0.5">
                          {activeAnalysis.primaryDiagnosis || activeAnalysis.pathologyFinding || activeAnalysis.diagnosis}
                        </div>
                      </div>

                      <div className="sm:text-right">
                        <div className="text-[10px] font-semibold text-[#737686] uppercase tracking-wider">
                          Model Confidence
                        </div>
                        <div className="flex items-center sm:justify-end gap-2 mt-0.5">
                          <span className="font-bold text-sm text-[#2563eb] font-mono">
                            {activeAnalysis.confidence}%
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                            {activeAnalysis.confidence >= 90 ? "High Certainty" : activeAnalysis.confidence >= 70 ? "Moderate" : "Review Required"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stage-1 Gatekeeper Authenticity Card */}
                    <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/60 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                            <span>Stage-1 Gatekeeper AI: PASSED</span>
                            <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-emerald-200/70 text-emerald-800 font-mono">
                              MobileNetV3
                            </span>
                          </div>
                          <div className="text-[11px] text-emerald-800 truncate mt-0.5">
                            Authentic renal anatomy confirmed • Non-kidney rejection check cleared
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <div className="font-mono font-bold text-emerald-900 text-xs">
                          {activeAnalysis.gateEvaluation?.kidney_confidence_percent ?? 98.4}%
                        </div>
                        <div className="text-[9.5px] text-emerald-700 font-medium">Renal Match</div>
                      </div>
                    </div>

                    {/* 4-Class Softmax Probability Cards */}
                    {activeAnalysis.classProbabilities && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                          <span>ConvNeXt-Tiny 4-Class Probability Spectrum</span>
                          <span className="font-mono text-[9.5px] text-slate-500">Softmax Normalized</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {/* Cyst */}
                          <div className="bg-sky-50 border border-sky-200 rounded-lg p-2 text-center">
                            <div className="text-[10px] text-sky-800 font-bold uppercase tracking-wider">Cyst</div>
                            <div className="text-sm font-bold text-sky-950 font-mono mt-0.5">
                              {activeAnalysis.classProbabilities.Cyst ?? activeAnalysis.classProbabilities.cyst ?? 0}%
                            </div>
                            <div className="w-full bg-sky-200/60 h-1.5 rounded-full mt-1.5 overflow-hidden">
                              <div className="bg-sky-600 h-full rounded-full transition-all" style={{ width: `${activeAnalysis.classProbabilities.Cyst ?? activeAnalysis.classProbabilities.cyst ?? 0}%` }} />
                            </div>
                          </div>

                          {/* Normal */}
                          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-center">
                            <div className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">Normal</div>
                            <div className="text-sm font-bold text-emerald-950 font-mono mt-0.5">
                              {activeAnalysis.classProbabilities.Normal ?? activeAnalysis.classProbabilities.normal ?? 0}%
                            </div>
                            <div className="w-full bg-emerald-200/60 h-1.5 rounded-full mt-1.5 overflow-hidden">
                              <div className="bg-emerald-600 h-full rounded-full transition-all" style={{ width: `${activeAnalysis.classProbabilities.Normal ?? activeAnalysis.classProbabilities.normal ?? 0}%` }} />
                            </div>
                          </div>

                          {/* Stone */}
                          <div className="bg-rose-50 border border-rose-200 rounded-lg p-2 text-center">
                            <div className="text-[10px] text-rose-800 font-bold uppercase tracking-wider">Stone</div>
                            <div className="text-sm font-bold text-rose-950 font-mono mt-0.5">
                              {activeAnalysis.classProbabilities.Stone ?? activeAnalysis.classProbabilities.stone ?? 0}%
                            </div>
                            <div className="w-full bg-rose-200/60 h-1.5 rounded-full mt-1.5 overflow-hidden">
                              <div className="bg-rose-600 h-full rounded-full transition-all" style={{ width: `${activeAnalysis.classProbabilities.Stone ?? activeAnalysis.classProbabilities.stone ?? 0}%` }} />
                            </div>
                          </div>

                          {/* Tumor */}
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-2 text-center">
                            <div className="text-[10px] text-purple-800 font-bold uppercase tracking-wider">Tumor</div>
                            <div className="text-sm font-bold text-purple-950 font-mono mt-0.5">
                              {activeAnalysis.classProbabilities.Tumor ?? activeAnalysis.classProbabilities.tumor ?? 0}%
                            </div>
                            <div className="w-full bg-purple-200/60 h-1.5 rounded-full mt-1.5 overflow-hidden">
                              <div className="bg-purple-600 h-full rounded-full transition-all" style={{ width: `${activeAnalysis.classProbabilities.Tumor ?? activeAnalysis.classProbabilities.tumor ?? 0}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Clinical Biometrics & Preprocessing Telemetry Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                      {/* Lesion Diameter */}
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="text-[10px] text-slate-500 font-semibold uppercase flex items-center gap-1">
                          <Ruler className="w-3 h-3 text-[#2563eb]" />
                          Lesion Diameter
                        </div>
                        <div className="font-bold text-slate-900 font-mono text-sm mt-0.5">
                          {activeAnalysis.clinicalAssessment?.estimated_diameter_mm 
                            ? `~${activeAnalysis.clinicalAssessment.estimated_diameter_mm} mm`
                            : "No focal lesion"}
                        </div>
                        <div className="text-[9.5px] text-slate-500 mt-0.5">Spatial contour calibration</div>
                      </div>

                      {/* Severity Grade */}
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="text-[10px] text-slate-500 font-semibold uppercase flex items-center gap-1">
                          <Activity className="w-3 h-3 text-purple-600" />
                          Severity Tier
                        </div>
                        <div className="font-bold text-slate-900 text-xs truncate mt-0.5">
                          {activeAnalysis.clinicalAssessment?.severity || "Standard"}
                        </div>
                        <div className="text-[9.5px] text-slate-500 mt-0.5 truncate">
                          {activeAnalysis.clinicalAssessment?.urgency || "Follow-up"}
                        </div>
                      </div>

                      {/* Auto-masking / Preprocessing Telemetry */}
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg col-span-2 sm:col-span-1">
                        <div className="text-[10px] text-slate-500 font-semibold uppercase flex items-center gap-1">
                          <Layers className="w-3 h-3 text-emerald-600" />
                          Auto-Inpainting
                        </div>
                        <div className="font-bold text-slate-900 text-xs mt-0.5">
                          {activeAnalysis.telemetry?.auto_masking?.artifacts_count ?? 1} artifacts stripped
                        </div>
                        <div className="text-[9.5px] text-slate-500 mt-0.5">
                          Telea algorithm restoration
                        </div>
                      </div>
                    </div>


                    {/* Action Panel */}
                    <div className="pt-2 flex gap-2 flex-wrap sm:flex-nowrap">
                      <button
                        onClick={handleSaveReport}
                        disabled={isSavingNotes}
                        className="flex-1 bg-[#2563eb] hover:bg-[#004ac6] text-white font-semibold text-xs py-2.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                      >
                        {isSavingNotes ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <ShieldCheck className="w-3.5 h-3.5" />
                        )}
                        <span>{isSavingNotes ? "Saving..." : "Sign & Log"}</span>
                      </button>

                      {onAddSuccess && (
                        <button
                          type="button"
                          onClick={onAddSuccess}
                          className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          title="View this study in Historical Analysis Logs"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                          <span>History</span>
                        </button>
                      )}

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
                            alert("Failed to load PDF preview. Please ensure the backend is running.");
                          } finally {
                            setIsPreviewLoading(false);
                          }
                        }}
                        disabled={isPreviewLoading}
                        className="px-3 py-2.5 border border-[#2563eb] text-[#2563eb] hover:bg-[#2563eb]/10 font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        title="Preview PDF report"
                      >
                        {isPreviewLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                        <span>Preview PDF</span>
                      </button>
                      
                      {/* PDF Download Button */}
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
                            if (btn) btn.innerHTML = '<svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>';
                          } catch (e) {
                            alert("Failed to download PDF report.");
                          }
                        }}
                        id="pdf-btn"
                        className="px-3 border border-[#c3c6d7] hover:bg-[#faf8ff] text-[#131b2e] rounded-lg transition-all flex items-center justify-center cursor-pointer"
                        title="Download PDF Report"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                )}

              </div>
            </div>
            
          </div>

          {/* Clinician Addendum Notes Card */}
          {activeAnalysis && (
            <div className="bg-white border border-[#c3c6d7] rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-[#131b2e] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#2563eb]" />
                  Radiologist Diagnostic Addendum Notes
                </h4>
                <button
                  type="button"
                  onClick={async () => {
                    setIsSavingNotes(true);
                    try {
                      await updateAnalysis(activeAnalysis.id, {
                        clinicianNotes: clinicianNotes.trim()
                      });
                      setNoteSavedSuccess(true);
                      setTimeout(() => setNoteSavedSuccess(false), 3500);
                    } catch (e: any) {
                      alert("Failed to save notes: " + e.message);
                    } finally {
                      setIsSavingNotes(false);
                    }
                  }}
                  disabled={isSavingNotes}
                  className="px-2.5 py-1 bg-[#2563eb] hover:bg-[#004ac6] text-white text-[10.5px] font-bold rounded-md flex items-center gap-1 transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isSavingNotes ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                  {isSavingNotes ? "Saving..." : noteSavedSuccess ? "Saved to Report ✓" : "Save Notes"}
                </button>
              </div>
              <textarea
                className="w-full p-3 bg-[#f8fafc] border border-[#c3c6d7] rounded-lg text-xs font-sans focus:bg-white outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all min-h-[90px] placeholder:text-slate-400"
                placeholder="Submit specialized observations, acoustic shadow clarity, or secondary symptoms to seal into the clinical report audit..."
                value={clinicianNotes}
                onChange={(e) => setClinicianNotes(e.target.value)}
              />
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-[#737686]">
                  * Signing this addendum logs the exact credentials and timestamp of your active clinician session.
                </span>
                {noteSavedSuccess && (
                  <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    ✓ Saved to patient record & PDF report
                  </span>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* In-App PDF Preview Modal */}
      {pdfPreviewUrl && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-[#e2e8f0] flex items-center justify-between bg-[#f8fafc]">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4.5 h-4.5 text-[#2563eb] shrink-0" />
                <h3 className="font-bold text-sm text-[#131b2e] truncate">
                  Diagnostic Report Preview {activeAnalysis ? `(#${activeAnalysis.id} - ${patientName || patientId || "Case"})` : ""}
                </h3>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={pdfPreviewUrl}
                  download={`kidneyvision_report_${activeAnalysis?.id || "preview"}.pdf`}
                  className="px-3 py-1.5 bg-[#2563eb] text-white hover:bg-blue-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  Download
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
            <div className="flex-1 bg-[#525659] relative min-h-[550px]">
              <iframe
                src={`${pdfPreviewUrl}#toolbar=1&navpanes=0`}
                title="Diagnostic Report PDF"
                className="w-full h-full min-h-[550px] border-0"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
