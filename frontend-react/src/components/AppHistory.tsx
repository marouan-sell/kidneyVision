/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Search, Calendar, Filter, Eye, Trash2, Sliders, X, 
  ChevronRight, ChevronLeft, Loader2, Award, ClipboardCheck, ArrowUpRight, CheckCircle2, AlertCircle, RefreshCw,
  FileText, Download, FileDown, Sparkles, ZoomIn, ExternalLink, Crosshair, Ruler, Activity, Cpu, Layers, ShieldCheck
} from "lucide-react";
import { getAnalyses, deleteAnalysis, downloadReport, updateAnalysis, getReportPdfBlobUrl } from "../services";
import { KidneyAnalysis, DiagnosisResult } from "../types";
import { parseClinicalError, ClinicalError } from "../utils/errorParser";
import LoadingSkeleton from "./common/LoadingSkeleton";

export default function AppHistory() {
  const [analyses, setAnalyses] = useState<KidneyAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchId, setSearchId] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All Results");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [dateFilter, setDateFilter] = useState<"All Time" | "Last 7 Days" | "Last 30 Days" | "Last 90 Days">("All Time");
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  
  const [selectedAnalysis, setSelectedAnalysis] = useState<KidneyAnalysis | null>(null);
  const [dossierViewMode, setDossierViewMode] = useState<"panel" | "gradcam" | "cleaned" | "raw">("panel");
  const [submittingNote, setSubmittingNote] = useState(false);
  const [editingNoteText, setEditingNoteText] = useState("");
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteSavedFeedback, setNoteSavedFeedback] = useState(false);

  // Notification Banner state
  const [notification, setNotification] = useState<{ type: 'error' | 'success' | 'info'; title: string; message: string; suggestion?: string } | null>(null);

  // PDF Preview and Download states
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewPdfTitle, setPreviewPdfTitle] = useState<string>("");
  const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null);
  const [downloadLoadingId, setDownloadLoadingId] = useState<string | null>(null);

  // Enlarged Image Modal state
  const [enlargedImageUrl, setEnlargedImageUrl] = useState<string | null>(null);
  const [enlargedImageTitle, setEnlargedImageTitle] = useState<string>("");

  const handlePreviewPdf = async (item: KidneyAnalysis, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPreviewLoadingId(item.id);
    try {
      const url = await getReportPdfBlobUrl(item.id);
      setPreviewPdfTitle(`Diagnostic Report — ${item.patientName || item.patientId} (#${item.id})`);
      setPreviewPdfUrl(url);
    } catch (err: any) {
      const parsed = parseClinicalError(err);
      setNotification({
        type: 'error',
        title: parsed.title,
        message: parsed.message,
        suggestion: parsed.suggestion
      });
    } finally {
      setPreviewLoadingId(null);
    }
  };

  const handleDownloadPdf = async (item: KidneyAnalysis, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDownloadLoadingId(item.id);
    try {
      await downloadReport(item.id, `kidneyvision_report_${item.id}.pdf`);
      setNotification({
        type: 'success',
        title: 'Report Downloaded',
        message: `Diagnostic PDF report for study #${item.id} downloaded successfully.`
      });
    } catch (err: any) {
      const parsed = parseClinicalError(err);
      setNotification({
        type: 'error',
        title: parsed.title,
        message: parsed.message,
        suggestion: parsed.suggestion
      });
    } finally {
      setDownloadLoadingId(null);
    }
  };

  const openDetails = (item: KidneyAnalysis) => {
    setSelectedAnalysis(item);
    setDossierViewMode(item.visualizationUrl ? "panel" : item.heatmapUrl ? "gradcam" : "raw");
    setEditingNoteText(item.clinicianNotes || "");
    setIsEditingNote(false);
    setNoteSavedFeedback(false);
  };

  async function loadAnalyses(page: number) {
    setLoading(true);
    try {
      const response = await getAnalyses(page, 10);
      setAnalyses(response.data);
      setMeta(response.meta);
      setCurrentPage(response.meta.current_page);
    } catch (e: any) {
      const parsed = parseClinicalError(e);
      setNotification({
        type: 'error',
        title: parsed.title,
        message: parsed.message,
        suggestion: parsed.suggestion
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalyses(currentPage);
  }, [currentPage]);

  // Handle Deletion (DELETE /analyses/:id)
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering details modal drawer
    if (confirm(`Are you sure you want to delete patient record ${id}?`)) {
      try {
        await deleteAnalysis(id);
        setAnalyses(prev => prev.filter(x => x.id !== id));
        setMeta(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
        if (selectedAnalysis?.id === id) {
          setSelectedAnalysis(null);
        }
        setNotification({
          type: 'success',
          title: 'Record Deleted',
          message: `Patient analysis record #${id} was deleted successfully.`
        });
      } catch (err: any) {
        const parsed = parseClinicalError(err);
        setNotification({
          type: 'error',
          title: parsed.title,
          message: parsed.message,
          suggestion: parsed.suggestion
        });
      }
    }
  };

  // Perform search & state filtering
  const filteredAnalyses = analyses.filter((item) => {
    const query = searchId.trim().toLowerCase();
    const matchesSearch = !query || 
                          (item.patientId && item.patientId.toLowerCase().includes(query)) || 
                          (item.patientName && item.patientName.toLowerCase().includes(query)) ||
                          (item.id && String(item.id).toLowerCase().includes(query)) ||
                          (item.location && item.location.toLowerCase().includes(query));
    
    // Status filter - supporting all 4 pathologies and triage states
    let matchesStatus = true;
    const itemDiag = item.diagnosis;
    const itemFinding = (item.pathologyFinding || item.prediction || '').toLowerCase();

    if (statusFilter === "Normal Findings") {
      matchesStatus = itemDiag === DiagnosisResult.NORMAL_FINDINGS || itemFinding.includes('normal');
    } else if (statusFilter === "Kidney Stone") {
      matchesStatus = itemDiag === DiagnosisResult.STONE || itemFinding.includes('stone') || itemFinding.includes('nephro');
    } else if (statusFilter === "Renal Cyst") {
      matchesStatus = itemDiag === DiagnosisResult.CYST || itemFinding.includes('cyst');
    } else if (statusFilter === "Renal Tumor") {
      matchesStatus = itemDiag === DiagnosisResult.TUMOR || itemFinding.includes('tumor');
    } else if (statusFilter === "Review Required") {
      matchesStatus = itemDiag === DiagnosisResult.REVIEW_REQUIRED;
    } else if (statusFilter === "Scan Rejected") {
      matchesStatus = itemDiag === DiagnosisResult.REJECTED || itemFinding.includes('reject') || itemFinding.includes('invalid');
    }

    // Date filter
    let matchesDate = true;
    if (dateFilter !== "All Time") {
      const itemTime = new Date(item.createdAt).getTime();
      const now = Date.now();
      if (!isNaN(itemTime)) {
        if (dateFilter === "Last 7 Days") matchesDate = itemTime >= now - 7 * 86400000;
        else if (dateFilter === "Last 30 Days") matchesDate = itemTime >= now - 30 * 86400000;
        else if (dateFilter === "Last 90 Days") matchesDate = itemTime >= now - 90 * 86400000;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Relative date formatting
  const formatDateTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) {
        return { date: "Unknown Date", time: "--:--" };
      }
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const formattedDate = `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
      
      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      
      return {
        date: formattedDate,
        time: `${hours}:${minutes} ${ampm}`
      };
    } catch {
      return { date: "Unknown Date", time: "--:--" };
    }
  };

  return (
    <div className="space-y-6 text-left relative min-h-[500px]">
      
      {/* Upper header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-sans text-2xl font-bold text-[#131b2e] tracking-tight">Analysis History</h2>
          <p className="font-sans text-xs text-[#434655]">
            Review past ultrasound analyses, diagnostic confidence scores, and historical patient imaging records.
          </p>
        </div>

        {/* Top bar controls: Search & Filters (identical to Screen 3 Header controls) */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Search Patient ID */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737686]">
              <Search className="w-4 h-4" />
            </span>
            <input 
              className="pl-9 pr-4 py-2 bg-white border border-[#c3c6d7] rounded-lg text-xs font-sans focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] w-60 placeholder:text-[#737686]" 
              placeholder="Search Patient ID or Name..." 
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
            />
          </div>

          {/* Date range trigger dropdown */}
          <div className="relative">
            <button 
              onClick={() => { setShowDateDropdown(!showDateDropdown); setShowFilterDropdown(false); }}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#c3c6d7] rounded-lg text-xs font-sans text-[#131b2e] hover:bg-[#faf8ff] transition-colors cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-[#737686]" />
              {dateFilter}
              <span className="text-[10px] text-[#737686]">▼</span>
            </button>

            {showDateDropdown && (
              <div className="absolute right-0 mt-1 bg-white border border-[#c3c6d7] rounded-lg shadow-lg z-20 py-1 w-44 font-sans text-xs">
                {(["All Time", "Last 7 Days", "Last 30 Days", "Last 90 Days"] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setDateFilter(opt);
                      setShowDateDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-[#f2f3ff] text-[#131b2e] cursor-pointer flex items-center justify-between ${
                      dateFilter === opt ? "font-bold text-[#2563eb] bg-[#f2f3ff]" : ""
                    }`}
                  >
                    <span>{opt}</span>
                    {dateFilter === opt && <CheckCircle2 className="w-3.5 h-3.5 text-[#2563eb]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Diagnosis code filter dropdown */}
          <div className="relative">
            <button 
              onClick={() => { setShowFilterDropdown(!showFilterDropdown); setShowDateDropdown(false); }}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#c3c6d7] rounded-lg text-xs font-sans text-[#131b2e] hover:bg-[#faf8ff] transition-colors cursor-pointer"
            >
              <Filter className="w-4 h-4 text-[#737686]" />
              {statusFilter}
              <span className="text-[10px] text-[#737686]">▼</span>
            </button>
            
            {showFilterDropdown && (
              <div className="absolute right-0 mt-1 bg-white border border-[#c3c6d7] rounded-lg shadow-lg z-20 py-1 w-52 font-sans text-xs">
                {["All Results", "Normal Findings", "Kidney Stone", "Renal Cyst", "Renal Tumor", "Review Required", "Scan Rejected"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setStatusFilter(opt);
                      setShowFilterDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-[#f2f3ff] text-[#131b2e] cursor-pointer flex items-center justify-between ${
                      statusFilter === opt ? "font-bold text-[#2563eb] bg-[#f2f3ff]" : ""
                    }`}
                  >
                    <span>{opt}</span>
                    {statusFilter === opt && <CheckCircle2 className="w-3.5 h-3.5 text-[#2563eb]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Clinical Notification Banner */}
      {notification && (
        <div className={`p-4 rounded-xl border flex items-start justify-between gap-3 text-xs animate-in fade-in duration-200 shadow-sm ${
          notification.type === 'error' ? 'bg-red-50/90 border-red-200 text-red-800' :
          notification.type === 'success' ? 'bg-emerald-50/90 border-emerald-200 text-emerald-800' :
          'bg-blue-50/90 border-blue-200 text-blue-800'
        }`}>
          <div className="flex items-start gap-2.5">
            {notification.type === 'error' ? <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" /> :
             notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> :
             <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />}
            <div>
              <h4 className="font-bold text-xs">{notification.title}</h4>
              <p className="mt-0.5 opacity-90">{notification.message}</p>
              {notification.suggestion && (
                <p className="mt-1 text-[11px] font-medium opacity-80 italic">💡 {notification.suggestion}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-[#737686] hover:text-[#131b2e] p-1 rounded transition-colors cursor-pointer"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Table view container (Identical to Screen 3 Table layout) */}
      <div className="bg-white border border-[#c3c6d7] rounded-xl overflow-hidden shadow-sm flex flex-col justify-between">
        
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton />
          </div>
        ) : analyses.length === 0 ? (
          <div className="py-20 text-center space-y-3 px-4">
            <div className="w-12 h-12 rounded-full bg-[#f2f3ff] mx-auto flex items-center justify-center text-[#2563eb]">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-[#131b2e] text-sm">No analyses yet</h4>
              <p className="text-xs text-[#737686] max-w-sm mx-auto mt-1">
                Upload your first kidney ultrasound to begin analysis and build your clinical record history.
              </p>
            </div>
            <Link
              to="/analysis"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2563eb] hover:bg-[#004ac6] text-white text-xs font-bold rounded-lg shadow-sm transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Start New Analysis
            </Link>
          </div>
        ) : filteredAnalyses.length === 0 ? (
          <div className="py-24 text-center text-[#737686] space-y-2">
            <AlertCircle className="w-8 h-8 text-[#737686] opacity-40 mx-auto" />
            <p className="font-sans text-xs font-bold">No clinical logs matched your search terms.</p>
            <button onClick={() => { setSearchId(""); setStatusFilter("All Results"); }} className="text-[#2563eb] text-[11px] font-semibold hover:underline cursor-pointer">
              Reset all search filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans text-xs">
              
              <thead>
                <tr className="bg-[#f2f3ff] border-b border-[#c3c6d7] text-left">
                  <th className="font-semibold text-[#434655] uppercase tracking-wider py-4 px-6">Patient ID</th>
                  <th className="font-semibold text-[#434655] uppercase tracking-wider py-4 px-6">Date &amp; Time</th>
                  <th className="font-semibold text-[#434655] uppercase tracking-wider py-4 px-6">Diagnosis Result</th>
                  <th className="font-semibold text-[#434655] uppercase tracking-wider py-4 px-6">Confidence Score</th>
                  <th className="font-semibold text-[#434655] uppercase tracking-wider py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#c3c6d7]/30">
                {filteredAnalyses.map((item) => {
                  const { date, time } = formatDateTime(item.createdAt);
                  const isAnomaly = item.diagnosis === DiagnosisResult.ANOMALY_DETECTED;
                  const isNormal = item.diagnosis === DiagnosisResult.NORMAL_FINDINGS;
                  const isReview = item.diagnosis === DiagnosisResult.REVIEW_REQUIRED;
                  const isRejected = item.diagnosis === DiagnosisResult.REJECTED;

                  return (
                    <tr 
                      key={item.id} 
                      onClick={() => { openDetails(item); }}
                      className="hover:bg-[#f2f3ff] transition-colors cursor-pointer group"
                    >
                      {/* Patient ID & Thumbnail with Image Preview */}
                      <td className="py-4 px-6 font-semibold text-[#131b2e]">
                        <div className="flex items-center gap-3">
                          <div 
                            className="relative group/thumb cursor-pointer shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEnlargedImageUrl(item.imageUrl);
                              setEnlargedImageTitle(`${item.patientName || item.patientId} — Ultrasound Scan (#${item.id})`);
                            }}
                            title="Click to inspect ultrasound scan"
                          >
                            <img
                              src={item.imageUrl}
                              alt="Ultrasound scan"
                              className="w-10 h-10 rounded-lg object-cover border border-[#c3c6d7] bg-neutral-900 group-hover/thumb:ring-2 group-hover/thumb:ring-[#2563eb] transition-all"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=400&q=80";
                              }}
                            />
                            <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <ZoomIn className="w-3.5 h-3.5" />
                            </div>
                          </div>
                          <div className="min-w-0">
                            <div className="truncate">{item.patientId}</div>
                            <span className="block text-[10px] text-[#737686] font-normal truncate">{item.patientName}</span>
                          </div>
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td className="py-4 px-6 text-[#434655] leading-normal">
                        {date}
                        <br />
                        <span className="text-[10.5px] text-[#737686] opacity-80">{time}</span>
                      </td>

                      {/* Diagnostic status pill badge (4-Class specific badges) */}
                      <td className="py-4 px-6">
                        {(() => {
                          const p = (item.pathologyFinding || item.prediction || '').toLowerCase();
                          const isCyst = item.diagnosis === DiagnosisResult.CYST || p.includes('cyst');
                          const isTumor = item.diagnosis === DiagnosisResult.TUMOR || p.includes('tumor');
                          const isStone = item.diagnosis === DiagnosisResult.STONE || p.includes('stone') || p.includes('nephro');
                          const isNormal = item.diagnosis === DiagnosisResult.NORMAL_FINDINGS || (!isCyst && !isTumor && !isStone && p.includes('normal'));
                          const isRejected = item.diagnosis === DiagnosisResult.REJECTED || p.includes('reject') || p.includes('invalid');
                          const isReview = item.diagnosis === DiagnosisResult.REVIEW_REQUIRED;
                          const isAnalyzing = item.diagnosis === DiagnosisResult.ANALYZING;

                          if (isAnalyzing) {
                            return (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#dbe1ff]/70 text-[#004ac6] font-sans text-[11px] font-bold tracking-wide uppercase rounded-full">
                                <RefreshCw className="w-3 h-3 animate-spin text-[#004ac6]" />
                                Analyzing...
                              </span>
                            );
                          }
                          if (isRejected) {
                            return (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-300 text-slate-700 font-sans text-[11px] font-bold tracking-wide uppercase rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                                Rejected / Invalid
                              </span>
                            );
                          }
                          if (isReview) {
                            return (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-300 text-amber-800 font-sans text-[11px] font-bold tracking-wide uppercase rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                                Review Required
                              </span>
                            );
                          }
                          if (isCyst) {
                            return (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal-50 border border-teal-300 text-teal-700 font-sans text-[11px] font-bold tracking-wide uppercase rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                                Renal Cyst
                              </span>
                            );
                          }
                          if (isTumor) {
                            return (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 border border-purple-300 text-purple-700 font-sans text-[11px] font-bold tracking-wide uppercase rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                                Tumor Alert
                              </span>
                            );
                          }
                          if (isStone) {
                            return (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 border border-rose-300 text-rose-700 font-sans text-[11px] font-bold tracking-wide uppercase rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                                Kidney Stone
                              </span>
                            );
                          }
                          if (isNormal) {
                            return (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-300 text-emerald-700 font-sans text-[11px] font-bold tracking-wide uppercase rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                Normal Findings
                              </span>
                            );
                          }
                          return (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 font-sans text-[11px] font-medium rounded-full">
                              {item.diagnosis}
                            </span>
                          );
                        })()}
                      </td>

                      {/* AI Confidence Meter Bar */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#131b2e] w-8">
                            {item.diagnosis === DiagnosisResult.ANALYZING ? "--%" : `${item.confidence}%`}
                          </span>
                          <div className="w-24 h-1.5 bg-[#eaedff] rounded-full overflow-hidden relative">
                            {item.diagnosis === DiagnosisResult.ANALYZING ? (
                              <div className="absolute inset-0 bg-blue-500/20 animate-pulse w-full" />
                            ) : (
                              <div 
                                className={`h-full ${isAnomaly ? "bg-red-500" : isNormal ? "bg-teal-500" : "bg-sky-500"}`} 
                                style={{ width: `${item.confidence}%` }}
                              />
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Action items */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5 md:opacity-0 group-hover:opacity-100 transition-opacity">

                          {/* PDF Download Button */}
                          <button
                            onClick={(e) => handleDownloadPdf(item, e)}
                            disabled={downloadLoadingId === item.id}
                            className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded transition-all cursor-pointer disabled:opacity-50"
                            title="Download PDF Report"
                          >
                            {downloadLoadingId === item.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                          </button>

                          {/* Delete Trigger */}
                          <button 
                            onClick={(e) => handleDelete(item.id, e)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-all cursor-pointer"
                            title="Purge Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

            </table>
          </div>
        )}

        {/* Paginated Footer stamp matching the exact bottom values of Screen 3 */}
        <div className="px-6 py-4 border-t border-[#c3c6d7]/50 bg-white flex items-center justify-between font-sans text-xs">
          <p className="text-[#434655]">
            Showing <span className="font-semibold text-[#131b2e]">{(meta.current_page - 1) * 10 + 1}</span> to <span className="font-semibold text-[#131b2e]">{Math.min(meta.current_page * 10, meta.total)}</span> of <span className="font-semibold text-[#131b2e]">{meta.total}</span> analyses
          </p>
          
          <div className="flex items-center gap-1">
            <button 
              disabled={meta.current_page === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="p-1.5 border border-[#c3c6d7] rounded text-[#131b2e] hover:bg-[#f2f3ff] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded bg-[#2563eb] text-white font-bold">
              {meta.current_page}
            </button>
            <span className="px-1 text-[#434655]">of {meta.last_page}</span>
            <button 
              disabled={meta.current_page === meta.last_page || meta.last_page === 0}
              onClick={() => setCurrentPage(prev => Math.min(meta.last_page, prev + 1))}
              className="p-1.5 border border-[#c3c6d7] rounded text-[#131b2e] hover:bg-[#f2f3ff] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* --- Patient Details Slider Drawer (Micro-interaction) --- */}
      {selectedAnalysis && (
        <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm flex justify-end transition-opacity duration-300">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl overflow-y-auto p-6 flex flex-col justify-between text-left animate-[slideIn_300ms_ease-out]">
            
            {/* Drawer Header */}
            <div className="flex justify-between items-center pb-4 border-b border-[#e2e8f0]">
              <div>
                <span className="text-[10px] font-bold text-[#2563eb] tracking-wider uppercase bg-blue-50 px-2 py-0.5 rounded">
                  Clinical Scan Dossier
                </span>
                <h3 className="font-sans text-lg font-bold text-[#131b2e] mt-1">
                  Patient ID: {selectedAnalysis.patientId}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedAnalysis(null)}
                className="p-1.5 text-[#434655] hover:text-[#131b2e] hover:bg-[#f2f3ff] rounded-full transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Dossier Content */}
            <div className="flex-grow py-5 space-y-6">
              
              {/* Patient Core Profile */}
              <div className="grid grid-cols-2 gap-4 bg-[#faf8ff] p-4 rounded-xl border border-[#c3c6d7]/50 text-xs">
                <div>
                  <span className="text-[#737686] block">Full Name:</span>
                  <span className="font-bold text-[#131b2e] text-sm">{selectedAnalysis.patientName}</span>
                </div>
                <div>
                  <span className="text-[#737686] block">Anatomical Target:</span>
                  <span className="font-bold text-sm text-[#131b2e] flex items-center gap-1">
                    {selectedAnalysis.location || "Left Kidney"}
                  </span>
                </div>
                <div>
                  <span className="text-[#737686] block">Patient Age / Gender:</span>
                  <span className="font-bold text-sm text-[#131b2e]">{selectedAnalysis.patientAge} yrs / {selectedAnalysis.patientGender}</span>
                </div>
                <div>
                  <span className="text-[#737686] block">Inference Date:</span>
                  <span className="font-bold text-sm text-[#131b2e]">
                    {formatDateTime(selectedAnalysis.createdAt).date}
                  </span>
                </div>
              </div>

              {/* Diagnostic Visualizations Switcher */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[#131b2e]">Visual Diagnostic Evidence</span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                      {selectedAnalysis.modelVersion || "ConvNeXt-Tiny Master"}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#737686]">Click image to enlarge</span>
                </div>

                {/* View Mode Toggle Buttons */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
                  {selectedAnalysis.visualizationUrl && (
                    <button
                      type="button"
                      onClick={() => setDossierViewMode("panel")}
                      className={`flex-1 py-1 px-2 rounded text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
                        dossierViewMode === "panel"
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      Dual Panel
                    </button>
                  )}
                  {selectedAnalysis.heatmapUrl && (
                    <button
                      type="button"
                      onClick={() => setDossierViewMode("gradcam")}
                      className={`flex-1 py-1 px-2 rounded text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
                        dossierViewMode === "gradcam"
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                      }`}
                    >
                      <Crosshair className="w-3 h-3" />
                      Grad-CAM
                    </button>
                  )}
                  {selectedAnalysis.cleanedScanUrl && (
                    <button
                      type="button"
                      onClick={() => setDossierViewMode("cleaned")}
                      className={`flex-1 py-1 px-2 rounded text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
                        dossierViewMode === "cleaned"
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                      }`}
                    >
                      <Layers className="w-3 h-3" />
                      Cleaned Scan
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setDossierViewMode("raw")}
                    className={`flex-1 py-1 px-2 rounded text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
                      dossierViewMode === "raw"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    Raw Scan
                  </button>
                </div>
                
                {/* Active Image Canvas */}
                {(() => {
                  const activeImg = 
                    dossierViewMode === "panel" && selectedAnalysis.visualizationUrl ? selectedAnalysis.visualizationUrl :
                    dossierViewMode === "gradcam" && selectedAnalysis.heatmapUrl ? selectedAnalysis.heatmapUrl :
                    dossierViewMode === "cleaned" && selectedAnalysis.cleanedScanUrl ? selectedAnalysis.cleanedScanUrl :
                    selectedAnalysis.imageUrl;

                  const viewLabel = 
                    dossierViewMode === "panel" ? "Dual Comparative Diagnostic Panel" :
                    dossierViewMode === "gradcam" ? "Grad-CAM Saliency Activation Heatmap" :
                    dossierViewMode === "cleaned" ? "Telea Inpainted Ultrasound Scan (Artifacts Removed)" :
                    "Original Raw Ultrasound / CT Scan";

                  return (
                    <div 
                      onClick={() => {
                        setEnlargedImageUrl(activeImg);
                        setEnlargedImageTitle(`${selectedAnalysis.patientName || selectedAnalysis.patientId} — ${viewLabel} (#${selectedAnalysis.id})`);
                      }}
                      className={`${dossierViewMode === "panel" ? "aspect-[2.36/1] sm:aspect-[16/9]" : "aspect-video"} bg-black rounded-lg relative overflow-hidden flex items-center justify-center border border-[#c3c6d7] cursor-pointer group shadow-sm transition-all`}
                      title="Click to inspect full resolution"
                    >
                      {dossierViewMode === "gradcam" && (
                        <img
                          alt="Underlying Scan"
                          className="absolute inset-0 w-full h-full object-cover select-none"
                          src={selectedAnalysis.cleanedScanUrl || selectedAnalysis.imageUrl}
                        />
                      )}
                      <img 
                        alt={viewLabel} 
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 relative z-10" 
                        src={activeImg} 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = selectedAnalysis.imageUrl;
                        }}
                      />
                      <div className="absolute top-2 left-2 bg-black/75 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded font-mono border border-white/10">
                        {viewLabel}
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[11px] px-2.5 py-1 rounded flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ZoomIn className="w-3.5 h-3.5" />
                        Inspect Slice
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Stage-1 Gatekeeper Authenticity Card */}
              {selectedAnalysis.gateEvaluation && (
                <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                  selectedAnalysis.gateEvaluation.gate_passed
                    ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                    : "bg-amber-50/80 border-amber-200 text-amber-900"
                }`}>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className={`w-4 h-4 ${selectedAnalysis.gateEvaluation.gate_passed ? "text-emerald-600" : "text-amber-600"}`} />
                    <div>
                      <span className="font-bold block leading-tight">
                        Stage-1 Gatekeeper: {selectedAnalysis.gateEvaluation.gate_passed ? "Renal Ultrasound Verified" : "Non-Standard Scan"}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        MobileNetV3 Anatomical Validation
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold">
                      {selectedAnalysis.gateEvaluation.kidney_confidence_percent ?? 99.8}% Match
                    </div>
                    {selectedAnalysis.gateEvaluation.non_kidney_probability_percent !== undefined && (
                      <div className="text-[10px] text-slate-500 font-mono">
                        {selectedAnalysis.gateEvaluation.non_kidney_probability_percent}% non-renal
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 4-Class Softmax Probability Breakdown */}
              {selectedAnalysis.classProbabilities && (
                <div className="space-y-2 bg-[#faf8ff] p-3 rounded-xl border border-[#c3c6d7]/50">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#131b2e] flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-blue-600" />
                      4-Class Probability Spectrum
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">ConvNeXt-Tiny</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { label: "Cyst", value: selectedAnalysis.classProbabilities.Cyst, color: "bg-sky-500", text: "text-sky-700", bg: "bg-sky-50" },
                      { label: "Normal", value: selectedAnalysis.classProbabilities.Normal, color: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" },
                      { label: "Stone", value: selectedAnalysis.classProbabilities.Stone, color: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50" },
                      { label: "Tumor", value: selectedAnalysis.classProbabilities.Tumor, color: "bg-purple-500", text: "text-purple-700", bg: "bg-purple-50" },
                    ].map((cls) => {
                      const pct = cls.value !== undefined ? Number(cls.value).toFixed(1) : "0.0";
                      const isDominant = selectedAnalysis.diagnosis.toLowerCase().includes(cls.label.toLowerCase()) || 
                                         selectedAnalysis.primaryDiagnosis?.toLowerCase().includes(cls.label.toLowerCase());
                      return (
                        <div key={cls.label} className={`p-2 rounded-lg border ${cls.bg} ${isDominant ? "border-blue-400 ring-1 ring-blue-300" : "border-slate-200/80"}`}>
                          <div className="flex justify-between items-center mb-1">
                            <span className={`font-bold ${cls.text} flex items-center gap-1 text-[11px]`}>
                              {cls.label}
                              {isDominant && <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>}
                            </span>
                            <span className="font-mono font-bold text-[11px] text-slate-800">{pct}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-200/80 rounded-full overflow-hidden">
                            <div className={`h-full ${cls.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Diagnostic Sizing Metrics & Diagnosis */}
              <div className="space-y-3">
                <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-[#131b2e] flex items-center justify-between">
                  <span>AI Quantitative Classification & Biometrics</span>
                  {selectedAnalysis.clinicalAssessment?.severity && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 normal-case">
                      {selectedAnalysis.clinicalAssessment.severity} Tier
                    </span>
                  )}
                </h4>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="border border-[#c3c6d7] rounded-lg p-2.5 bg-[#faf8ff] text-center">
                    <span className="text-[10px] text-[#737686] block">Diagnosis:</span>
                    <span className="font-bold text-[11px] text-[#131b2e] capitalize leading-tight">
                      {selectedAnalysis.primaryDiagnosis || selectedAnalysis.diagnosis}
                    </span>
                  </div>
                  <div className="border border-[#c3c6d7] rounded-lg p-2.5 bg-[#faf8ff] text-center">
                    <span className="text-[10px] text-[#737686] block">Estimated Size:</span>
                    <span className="font-bold text-[11px] text-[#131b2e]">
                      {selectedAnalysis.clinicalAssessment?.estimated_diameter_mm !== undefined
                        ? `${selectedAnalysis.clinicalAssessment.estimated_diameter_mm.toFixed(1)} mm`
                        : selectedAnalysis.dimensions?.length
                        ? `${selectedAnalysis.dimensions.length} mm`
                        : "None (Clear)"}
                    </span>
                  </div>
                  <div className="border border-[#c3c6d7] rounded-lg p-2.5 bg-[#faf8ff] text-center">
                    <span className="text-[10px] text-[#737686] block">Confidence:</span>
                    <span className="font-bold text-[11px] text-[#2563eb]">
                      {selectedAnalysis.confidence}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Telemetry & Quality Assurance (if available) */}
              {selectedAnalysis.telemetry && (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-3.5 h-3.5 text-slate-500" />
                    <span>Inpainted artifacts: <strong className="text-slate-800">{selectedAnalysis.telemetry.auto_masking?.artifacts_count ?? 0}</strong></span>
                  </div>
                  <div className="text-slate-500 font-mono text-[10px]">
                    Device: {selectedAnalysis.telemetry.device || "CPU"} • Clean ratio: {((selectedAnalysis.telemetry.auto_masking?.mask_pixel_ratio ?? 0) * 100).toFixed(1)}%
                  </div>
                </div>
              )}


              {/* Clinician's Notes Addendum Display & Editor */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="font-sans text-xs font-bold text-[#131b2e] flex items-center gap-1.5">
                    <ClipboardCheck className="w-4 h-4 text-[#2563eb]" />
                    Radiological Signature Addendum
                  </div>
                  {!isEditingNote ? (
                    <button
                      type="button"
                      onClick={() => setIsEditingNote(true)}
                      className="text-[11px] font-bold text-[#2563eb] hover:underline cursor-pointer"
                    >
                      {selectedAnalysis.clinicianNotes ? "Edit Addendum" : "+ Add Note"}
                    </button>
                  ) : (
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingNoteText(selectedAnalysis.clinicianNotes || "");
                          setIsEditingNote(false);
                        }}
                        className="px-2 py-0.5 text-[10px] text-[#434655] hover:bg-gray-100 rounded cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={submittingNote}
                        onClick={async () => {
                          setSubmittingNote(true);
                          try {
                            const updated = await updateAnalysis(selectedAnalysis.id, {
                              clinicianNotes: editingNoteText.trim()
                            });
                            setSelectedAnalysis(updated);
                            setAnalyses(prev => prev.map(a => a.id === updated.id ? updated : a));
                            setIsEditingNote(false);
                            setNoteSavedFeedback(true);
                            setTimeout(() => setNoteSavedFeedback(false), 3000);
                          } catch (e: any) {
                            const parsed = parseClinicalError(e);
                            setNotification({
                              type: 'error',
                              title: parsed.title,
                              message: parsed.message,
                              suggestion: parsed.suggestion
                            });
                          } finally {
                            setSubmittingNote(false);
                          }
                        }}
                        className="px-2.5 py-0.5 bg-[#2563eb] hover:bg-[#004ac6] text-white text-[10px] font-bold rounded flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        {submittingNote ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                        Save Note
                      </button>
                    </div>
                  )}
                </div>

                {isEditingNote ? (
                  <textarea
                    className="w-full p-2.5 bg-white border border-[#2563eb] rounded-lg text-xs text-[#131b2e] leading-relaxed outline-none min-h-[80px]"
                    value={editingNoteText}
                    onChange={(e) => setEditingNoteText(e.target.value)}
                    placeholder="Enter clinical biopsy indicators, Doppler notes, or comments..."
                  />
                ) : (
                  <div className="p-3 bg-[#faf8ff] rounded-lg border border-[#c3c6d7] text-xs text-[#434655] leading-relaxed min-h-[50px] whitespace-pre-wrap">
                    {selectedAnalysis.clinicianNotes || "No clinical notes appended. Click '+ Add Note' above to record radiological impressions."}
                  </div>
                )}
                {noteSavedFeedback && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                    ✓ Addendum notes saved to database and PDF report
                  </span>
                )}
              </div>

            </div>

            {/* Folder Print Action Footer */}
            <div className="pt-4 border-t border-[#e2e8f0] flex gap-2">
              {/* Preview Button */}
              <button 
                onClick={async (e) => {
                  try {
                    // Persist note if dirty
                    if (isEditingNote && editingNoteText.trim() !== (selectedAnalysis.clinicianNotes || "")) {
                      const updated = await updateAnalysis(selectedAnalysis.id, {
                        clinicianNotes: editingNoteText.trim()
                      });
                      setSelectedAnalysis(updated);
                      setAnalyses(prev => prev.map(a => a.id === updated.id ? updated : a));
                      setIsEditingNote(false);
                    }
                    handlePreviewPdf(selectedAnalysis, e);
                  } catch (err: any) {
                    const parsed = parseClinicalError(err);
                    setNotification({
                      type: 'error',
                      title: parsed.title,
                      message: parsed.message,
                      suggestion: parsed.suggestion
                    });
                  }
                }}
                disabled={previewLoadingId === selectedAnalysis.id}
                className="flex-1 border border-[#2563eb] text-[#2563eb] hover:bg-[#2563eb]/10 font-sans font-semibold text-xs py-2.5 rounded-lg text-center flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
              >
                {previewLoadingId === selectedAnalysis.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
                Preview PDF
              </button>

              {/* Download Button */}
              <button 
                onClick={async (e) => {
                  try {
                    const btn = e.currentTarget;
                    btn.innerHTML = '<span class="animate-pulse">Downloading...</span>';
                    
                    // If notes were edited in text area, persist before download
                    if (isEditingNote && editingNoteText.trim() !== (selectedAnalysis.clinicianNotes || "")) {
                      const updated = await updateAnalysis(selectedAnalysis.id, {
                        clinicianNotes: editingNoteText.trim()
                      });
                      setSelectedAnalysis(updated);
                      setAnalyses(prev => prev.map(a => a.id === updated.id ? updated : a));
                      setIsEditingNote(false);
                    }

                    await downloadReport(selectedAnalysis.id.toString(), `kidneyvision_report_${selectedAnalysis.id}.pdf`);
                    btn.innerHTML = '<svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg> Download PDF';
                    setNotification({
                      type: 'success',
                      title: 'Report Downloaded',
                      message: `Diagnostic report for study #${selectedAnalysis.id} downloaded successfully.`
                    });
                  } catch (err: any) {
                    const parsed = parseClinicalError(err);
                    setNotification({
                      type: 'error',
                      title: parsed.title,
                      message: parsed.message,
                      suggestion: parsed.suggestion
                    });
                  }
                }}
                className="flex-1 bg-[#2563eb] hover:bg-[#004ac6] text-white font-sans font-semibold text-xs py-2.5 rounded-lg text-center flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-sm"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>

              <button
                onClick={() => setSelectedAnalysis(null)}
                className="px-3.5 py-2 border border-[#c3c6d7] hover:bg-[#faf8ff] text-xs font-sans text-[#131b2e] rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* In-App PDF Preview Modal */}
      {previewPdfUrl && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-[#e2e8f0] flex items-center justify-between bg-[#f9fafb]">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4.5 h-4.5 text-[#2563eb] shrink-0" />
                <h3 className="font-bold text-sm text-[#131b2e] truncate">{previewPdfTitle || "Diagnostic Report Preview"}</h3>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={previewPdfUrl}
                  download="kidneyvision_diagnostic_report.pdf"
                  className="px-3 py-1.5 bg-[#2563eb] text-white hover:bg-blue-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  Download
                </a>
                <button
                  onClick={() => {
                    if (previewPdfUrl.startsWith("blob:")) {
                      URL.revokeObjectURL(previewPdfUrl);
                    }
                    setPreviewPdfUrl(null);
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
                src={`${previewPdfUrl}#toolbar=1&navpanes=0`}
                title="Diagnostic Report PDF"
                className="w-full h-full min-h-[550px] border-0"
              />
            </div>
          </div>
        </div>
      )}

      {/* Enlarged Image Lightbox Modal */}
      {enlargedImageUrl && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setEnlargedImageUrl(null)}
        >
          <div 
            className="bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3 border-b border-neutral-800 flex items-center justify-between text-neutral-200">
              <h3 className="font-bold text-sm text-white truncate">{enlargedImageTitle || "Ultrasound Scan Inspection"}</h3>
              <button
                onClick={() => setEnlargedImageUrl(null)}
                className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-all cursor-pointer"
                title="Close Viewer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-black min-h-[400px]">
              <img
                src={enlargedImageUrl}
                alt="High-resolution ultrasound scan"
                className="max-h-[70vh] w-auto max-w-full object-contain rounded"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80";
                }}
              />
            </div>
            <div className="px-5 py-2.5 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
              <span>High-resolution ultrasound acquisition slice</span>
              <a
                href={enlargedImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#38bdf8] hover:underline flex items-center gap-1"
              >
                Open original file <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
