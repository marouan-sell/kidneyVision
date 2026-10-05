/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  FileDown, Printer, Eye, Search, Award, CheckCircle2, 
  AlertTriangle, RefreshCw, X, Loader2, FileText, Calendar,
  ShieldCheck, ArrowUpDown, Sparkles, CircleDot, AlertOctagon
} from "lucide-react";
import { getAnalyses, downloadReport, getReportPdfBlobUrl } from "../services";
import { KidneyAnalysis, DiagnosisResult } from "../types";

export default function AppReports() {
  const [analyses, setAnalyses] = useState<KidneyAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDiagnosis, setFilterDiagnosis] = useState<string>("ALL");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  
  // PDF In-App Preview Modal State
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>("");
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    setLoading(true);
    try {
      const res = await getAnalyses(1, 100);
      setAnalyses(res.data);
    } catch (e) {
      console.error("Failed to load reports from database", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(id: string, filename: string) {
    setDownloadingId(id);
    try {
      await downloadReport(id, filename);
    } catch (e) {
      alert("Failed to download PDF report. Please ensure the analysis is completed.");
    } finally {
      setDownloadingId(null);
    }
  }

  async function handlePreview(id: string, filename: string) {
    setPreviewLoading(true);
    setPreviewTitle(`KidneyVision Report — KV-${id} (${filename})`);
    try {
      const url = await getReportPdfBlobUrl(id);
      setPreviewUrl(url);
    } catch (e) {
      alert("Failed to generate PDF preview.");
    } finally {
      setPreviewLoading(false);
    }
  }

  function closePreview() {
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setPreviewTitle("");
  }

  // Clinical 4-class classifier helper
  function getReportClass(item: KidneyAnalysis): 'STONE' | 'CYST' | 'TUMOR' | 'NORMAL' | 'OTHER' {
    const p = (item.prediction || item.pathologyFinding || item.primaryDiagnosis || '').toLowerCase();
    if (p.includes('stone') || p.includes('calculus') || p.includes('nephrolithiasis')) return 'STONE';
    if (p.includes('cyst')) return 'CYST';
    if (p.includes('tumor') || p.includes('mass') || p.includes('neoplasm')) return 'TUMOR';
    if (p.includes('normal') || item.diagnosis === DiagnosisResult.NORMAL_FINDINGS) return 'NORMAL';
    if (item.diagnosis === DiagnosisResult.ANOMALY_DETECTED) return 'STONE';
    return 'OTHER';
  }

  // Filter and search reports
  const filteredAnalyses = analyses.filter((item) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = 
      !query ||
      (item.patientName && item.patientName.toLowerCase().includes(query)) ||
      (item.id && String(item.id).toLowerCase().includes(query)) ||
      (item.patientId && item.patientId.toLowerCase().includes(query));

    if (!matchesSearch) return false;

    if (filterDiagnosis === "ALL") return true;
    return getReportClass(item) === filterDiagnosis;
  });

  const totalReports = analyses.length;
  const stoneCount = analyses.filter(a => getReportClass(a) === 'STONE').length;
  const cystCount = analyses.filter(a => getReportClass(a) === 'CYST').length;
  const tumorCount = analyses.filter(a => getReportClass(a) === 'TUMOR').length;
  const normalCount = analyses.filter(a => getReportClass(a) === 'NORMAL').length;

  return (
    <div className="space-y-6 text-left">
      {/* Title & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-sans text-2xl font-bold text-[#131b2e] tracking-tight">Clinical Reports</h2>
          <p className="font-sans text-xs text-[#434655]">
            Certified diagnostic PDF reports signed by KidneyVision AI. Download, print, or preview patient analyses across all 4 clinical classifications.
          </p>
        </div>
        <button
          onClick={loadReports}
          disabled={loading}
          className="self-start sm:self-auto px-3 py-1.5 bg-white border border-[#c3c6d7] text-[#131b2e] hover:bg-neutral-50 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#2563eb] ${loading ? "animate-spin" : ""}`} />
          Refresh Records
        </button>
      </div>

      {/* Numerical Stats Bar - 5 Responsive Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white border border-[#c3c6d7] rounded-xl p-3 flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <span className="text-[10px] font-semibold text-[#737686] uppercase tracking-wider block">Total Reports</span>
            <span className="font-sans text-lg font-bold text-[#131b2e]">{totalReports}</span>
          </div>
          <div className="w-7 h-7 rounded-lg bg-[#2563eb]/10 flex items-center justify-center text-[#2563eb]">
            <FileText className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-white border border-[#c3c6d7] rounded-xl p-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-[#737686] uppercase tracking-wider block">Stone Reports</span>
            <span className="font-sans text-lg font-bold text-red-600">{stoneCount}</span>
          </div>
          <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center text-red-600">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-white border border-[#c3c6d7] rounded-xl p-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-[#737686] uppercase tracking-wider block">Cyst Reports</span>
            <span className="font-sans text-lg font-bold text-teal-600">{cystCount}</span>
          </div>
          <div className="w-7 h-7 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-600">
            <CircleDot className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-white border border-[#c3c6d7] rounded-xl p-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-[#737686] uppercase tracking-wider block">Tumor Alerts</span>
            <span className="font-sans text-lg font-bold text-purple-600">{tumorCount}</span>
          </div>
          <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600">
            <AlertOctagon className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-white border border-[#c3c6d7] rounded-xl p-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-[#737686] uppercase tracking-wider block">Normal Scans</span>
            <span className="font-sans text-lg font-bold text-emerald-600">{normalCount}</span>
          </div>
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white border border-[#c3c6d7] rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#737686] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input 
            type="text"
            placeholder="Search report by study filename, patient name, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#faf8ff] border border-[#c3c6d7] rounded-lg text-xs text-[#131b2e] focus:outline-none focus:border-[#2563eb] transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0 flex-wrap">
          <button
            onClick={() => setFilterDiagnosis("ALL")}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              filterDiagnosis === "ALL" 
                ? "bg-[#2563eb] text-white border-[#2563eb]" 
                : "bg-white text-[#737686] border-[#c3c6d7] hover:bg-neutral-50"
            }`}
          >
            All ({totalReports})
          </button>
          <button
            onClick={() => setFilterDiagnosis("STONE")}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              filterDiagnosis === "STONE" 
                ? "bg-red-600 text-white border-red-600" 
                : "bg-white text-[#737686] border-[#c3c6d7] hover:bg-neutral-50"
            }`}
          >
            Stones ({stoneCount})
          </button>
          <button
            onClick={() => setFilterDiagnosis("CYST")}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              filterDiagnosis === "CYST" 
                ? "bg-teal-600 text-white border-teal-600" 
                : "bg-white text-[#737686] border-[#c3c6d7] hover:bg-neutral-50"
            }`}
          >
            Cysts ({cystCount})
          </button>
          <button
            onClick={() => setFilterDiagnosis("TUMOR")}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              filterDiagnosis === "TUMOR" 
                ? "bg-purple-600 text-white border-purple-600" 
                : "bg-white text-[#737686] border-[#c3c6d7] hover:bg-neutral-50"
            }`}
          >
            Tumors ({tumorCount})
          </button>
          <button
            onClick={() => setFilterDiagnosis("NORMAL")}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              filterDiagnosis === "NORMAL" 
                ? "bg-emerald-600 text-white border-emerald-600" 
                : "bg-white text-[#737686] border-[#c3c6d7] hover:bg-neutral-50"
            }`}
          >
            Normal ({normalCount})
          </button>
        </div>
      </div>


      {/* Reports List Container */}
      <div className="bg-white border border-[#c3c6d7] rounded-xl p-5 space-y-4">
        <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-[#131b2e] pb-2 border-b border-[#e2e8f0] flex items-center justify-between">
          <span>Available Medical PDF Reports ({filteredAnalyses.length})</span>
          <span className="text-[10px] text-[#737686] font-normal lowercase">Click preview or download to open</span>
        </h3>

        {/* Loading State */}
        {loading && (
          <div className="py-12 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-7 h-7 text-[#2563eb] animate-spin" />
            <span className="text-xs text-[#737686] font-medium">Loading clinical reports from server...</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredAnalyses.length === 0 && (
          <div className="py-16 text-center space-y-3 px-4">
            <div className="w-12 h-12 rounded-full bg-[#f2f3ff] mx-auto flex items-center justify-center text-[#2563eb]">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-[#131b2e] text-sm">
                {analyses.length === 0 ? "No diagnostic reports yet" : "No diagnostic reports found"}
              </h4>
              <p className="text-xs text-[#737686] max-w-sm mx-auto mt-1">
                {searchQuery || filterDiagnosis !== "ALL"
                  ? "No reports match your current search query or filter. Try resetting filters." 
                  : "Upload a renal ultrasound scan in 'New Analysis' to automatically generate an official PDF report."}
              </p>
            </div>
            {analyses.length === 0 ? (
              <Link
                to="/analysis"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2563eb] hover:bg-[#004ac6] text-white text-xs font-bold rounded-lg shadow-sm transition-all mt-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Upload First Scan
              </Link>
            ) : (
              <button
                onClick={() => { setSearchQuery(""); setFilterDiagnosis("ALL"); }}
                className="text-[#2563eb] text-[11px] font-semibold hover:underline cursor-pointer"
              >
                Reset all search filters
              </button>
            )}
          </div>
        )}

        {/* Reports Grid / Cards */}
        {!loading && filteredAnalyses.length > 0 && (
          <div className="space-y-3">
            {filteredAnalyses.map((doc) => {
              const reportClass = getReportClass(doc);
              const formattedDate = doc.createdAt 
                ? new Date(doc.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })
                : "Just now";

              const reportFileName = `kidneyvision_report_${doc.id}.pdf`;

              return (
                <div 
                  key={doc.id} 
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-[#faf8ff] border border-[#c3c6d7]/80 rounded-xl hover:bg-[#f2f3ff] hover:border-[#2563eb]/40 transition-all text-xs gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Ultrasound Thumbnail */}
                    {doc.imageUrl ? (
                      <img 
                        src={doc.imageUrl} 
                        alt="Scan thumb" 
                        className="w-12 h-12 rounded-lg object-cover border border-[#c3c6d7] shrink-0 bg-neutral-900"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=400&q=80";
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-[#2563eb]/10 flex items-center justify-center text-[#2563eb] shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                    )}

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-[#131b2e] truncate">{reportFileName}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-[#c3c6d7] text-[#434655]">
                          KV-{String(doc.id).padStart(6, '0')}
                        </span>
                        {reportClass === 'STONE' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                            Kidney Stone Detected ({doc.confidence}%)
                          </span>
                        )}
                        {reportClass === 'CYST' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                            Renal Cyst Detected ({doc.confidence}%)
                          </span>
                        )}
                        {reportClass === 'TUMOR' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                            Suspicious Renal Mass ({doc.confidence}%)
                          </span>
                        )}
                        {reportClass === 'NORMAL' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            Normal Findings ({doc.confidence}%)
                          </span>
                        )}
                        {reportClass === 'OTHER' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                            Clinical Triage ({doc.confidence || 0}%)
                          </span>
                        )}
                      </div>


                      <div className="text-[11px] text-[#737686] flex items-center gap-2 flex-wrap">
                        <span>Patient Study: <strong className="text-[#131b2e]">{doc.patientName || `Patient #${doc.id}`}</strong> <span className="font-mono text-[10px] text-[#2563eb]">({doc.patientId || `PT-${doc.id}`})</span></span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formattedDate}
                        </span>
                        {doc.clinicianNotes && (
                          <>
                            <span>•</span>
                            <span className="text-[10px] font-semibold text-[#004ac6] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                              Addendum Signed
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    {/* Preview Button */}
                    <button 
                      onClick={() => handlePreview(doc.id, doc.patientName)}
                      className="px-3 py-1.5 bg-white border border-[#c3c6d7] text-[#131b2e] hover:bg-[#2563eb]/5 hover:text-[#2563eb] hover:border-[#2563eb] rounded-lg font-semibold text-[11px] flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
                      title="Preview PDF inside browser"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#2563eb]" />
                      Preview
                    </button>

                    {/* Download Button */}
                    <button 
                      onClick={() => handleDownload(doc.id, reportFileName)}
                      disabled={downloadingId === doc.id}
                      className="px-3 py-1.5 bg-[#2563eb] text-white hover:bg-blue-700 rounded-lg font-semibold text-[11px] flex items-center gap-1.5 cursor-pointer transition-all shrink-0 shadow-sm disabled:opacity-50"
                      title="Download PDF report to computer"
                    >
                      {downloadingId === doc.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <FileDown className="w-3.5 h-3.5" />
                          Download PDF
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Compliance / Attestation Footer Card */}
      <div className="bg-[#eaedff]/40 border border-[#2563eb]/20 p-5 rounded-xl space-y-2">
        <h4 className="font-sans text-xs font-bold text-[#0053db] flex items-center gap-1.5">
          <ShieldCheck className="w-4.5 h-4.5 text-[#2563eb]" />
          Diagnostic Medical Record Integrity
        </h4>
        <p className="font-sans text-[11px] text-[#434655] leading-relaxed">
          Every PDF report contains physician verification credentials, unique study identifiers (KV-ID), confidence metrics, and timestamped forensic logs compliant with clinical auditing protocols.
        </p>
      </div>

      {/* In-App PDF Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-[#e2e8f0] flex items-center justify-between bg-[#f9fafb]">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4.5 h-4.5 text-[#2563eb] shrink-0" />
                <h3 className="font-bold text-sm text-[#131b2e] truncate">{previewTitle}</h3>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={previewUrl}
                  download="kidneyvision_diagnostic_report.pdf"
                  className="px-3 py-1.5 bg-[#2563eb] text-white hover:bg-blue-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  Download
                </a>
                <button
                  onClick={closePreview}
                  className="p-1.5 text-[#737686] hover:text-[#131b2e] hover:bg-neutral-200 rounded-lg transition-all cursor-pointer"
                  title="Close Preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body with PDF Viewer iframe */}
            <div className="flex-1 bg-[#525659] relative min-h-[500px]">
              <iframe
                src={`${previewUrl}#toolbar=1&navpanes=0`}
                title="Diagnostic Report PDF"
                className="w-full h-full min-h-[600px] border-0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
