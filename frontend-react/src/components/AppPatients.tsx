/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  Users, Search, Plus, Calendar, Clock, AlertTriangle, 
  CheckCircle2, FileText, Eye, ArrowLeft, Download, 
  FileDown, RefreshCw, Loader2, X, ChevronRight, 
  ChevronLeft, Split, Activity, ShieldCheck, 
  Phone, Mail, CalendarPlus, UserCheck, AlertOctagon, 
  FileCheck, Stethoscope, Sparkles, Filter, Edit3
} from "lucide-react";
import { 
  fetchPatientsDirectory, 
  fetchFollowUpStats, 
  fetchPatientProfile, 
  createPatientRecord, 
  updatePatientRecord, 
  schedulePatientFollowUp, 
  updatePatientFollowUp, 
  deletePatientFollowUp, 
  fetchScanComparison, 
  downloadPatientHistoryPdf, 
  getPatientHistoryPdfBlobUrl,
  downloadReport,
  getReportPdfBlobUrl,
  PatientDirectoryItem,
  FollowUpStats,
  PatientProfileData,
  ScanComparisonData
} from "../services";
import { CLINICAL_SCAN_FALLBACK_SVG } from "../services/client";

export default function AppPatients() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedPatientIdFromUrl = searchParams.get("id");

  // Directory State
  const [patients, setPatients] = useState<PatientDirectoryItem[]>([]);
  const [stats, setStats] = useState<FollowUpStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterVisit, setFilterVisit] = useState("all");
  const [filterReview, setFilterReview] = useState("all");
  const [filterFollowUp, setFilterFollowUp] = useState("all");

  // Selected Patient Profile State
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(selectedPatientIdFromUrl);
  const [profileData, setProfileData] = useState<PatientProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "imaging" | "follow_up" | "reports">("overview");

  // Modals State
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showEditDemographicsModal, setShowEditDemographicsModal] = useState(false);
  const [schedulePatientTargetId, setSchedulePatientTargetId] = useState<string>("");

  // Scan Comparison State
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareScan1, setCompareScan1] = useState<number | null>(null);
  const [compareScan2, setCompareScan2] = useState<number | null>(null);
  const [comparisonResult, setComparisonResult] = useState<ScanComparisonData | null>(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);

  // PDF Preview State
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewTitle, setPdfPreviewTitle] = useState<string>("");
  const [pdfPreviewLoading, setPdfPreviewLoading] = useState(false);

  // Form inputs
  const [newPatientForm, setNewPatientForm] = useState({
    name: "",
    age: "",
    gender: "Male",
    phone: "",
    email: "",
    notes: "",
  });

  const [scheduleForm, setScheduleForm] = useState({
    follow_up_date: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 16),
    reason: "Routine Ultrasound Re-evaluation",
    status: "scheduled",
    clinical_notes: "",
  });

  const [editPatientForm, setEditPatientForm] = useState({
    name: "",
    age: "",
    gender: "Male",
    phone: "",
    email: "",
    notes: "",
  });

  // Load Directory & Stats
  useEffect(() => {
    loadDirectoryData();
  }, [page, searchQuery, filterVisit, filterReview, filterFollowUp]);

  // Load Patient Profile when selected
  useEffect(() => {
    if (selectedPatientId) {
      loadPatientProfile(selectedPatientId);
    } else {
      setProfileData(null);
    }
  }, [selectedPatientId]);

  async function loadDirectoryData() {
    setLoading(true);
    try {
      const [dirRes, statsRes] = await Promise.all([
        fetchPatientsDirectory({
          page,
          per_page: 10,
          search: searchQuery,
          filter_visit: filterVisit,
          filter_review: filterReview,
          filter_follow_up: filterFollowUp,
        }),
        fetchFollowUpStats()
      ]);
      setPatients(dirRes.data);
      setMeta(dirRes.meta);
      setStats(statsRes);
    } catch (e) {
      console.error("Failed to load patient follow-up center data", e);
    } finally {
      setLoading(false);
    }
  }

  async function loadPatientProfile(patientId: string) {
    setProfileLoading(true);
    try {
      const profile = await fetchPatientProfile(patientId);
      setProfileData(profile);
      if (profile?.patient) {
        setEditPatientForm({
          name: profile.patient.name,
          age: profile.patient.age ? String(profile.patient.age) : "",
          gender: profile.patient.gender || "Male",
          phone: profile.patient.phone || "",
          email: profile.patient.email || "",
          notes: profile.patient.notes || "",
        });
      }
    } catch (e) {
      console.error("Failed to load patient profile", e);
    } finally {
      setProfileLoading(false);
    }
  }

  function handleOpenPatient(patientId: string) {
    setSelectedPatientId(patientId);
    setSearchParams({ id: patientId });
    setActiveTab("overview");
  }

  function handleBackToDirectory() {
    setSelectedPatientId(null);
    setSearchParams({});
    loadDirectoryData();
  }

  function handleStartAnalysisForPatient(patient: any) {
    navigate("/analysis", { state: { patient } });
  }

  async function handleCreatePatientSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newPatientForm.name.trim()) return;
    try {
      const created = await createPatientRecord({
        name: newPatientForm.name.trim(),
        age: newPatientForm.age ? parseInt(newPatientForm.age) : null,
        gender: newPatientForm.gender,
        phone: newPatientForm.phone.trim() || undefined,
        email: newPatientForm.email.trim() || undefined,
        notes: newPatientForm.notes.trim() || undefined,
      });
      setShowAddPatientModal(false);
      setNewPatientForm({ name: "", age: "", gender: "Male", phone: "", email: "", notes: "" });
      loadDirectoryData();
      if (created?.patient_id) {
        handleOpenPatient(created.patient_id);
      }
    } catch (err) {
      alert("Failed to create patient. Please ensure details are valid.");
    }
  }

  async function handleEditPatientSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPatientId || !editPatientForm.name.trim()) return;
    try {
      await updatePatientRecord(selectedPatientId, {
        name: editPatientForm.name.trim(),
        age: editPatientForm.age ? parseInt(editPatientForm.age) : null,
        gender: editPatientForm.gender,
        phone: editPatientForm.phone.trim() || null,
        email: editPatientForm.email.trim() || null,
        notes: editPatientForm.notes.trim() || null,
      });
      setShowEditDemographicsModal(false);
      loadPatientProfile(selectedPatientId);
    } catch (err) {
      alert("Failed to update patient demographics.");
    }
  }

  async function handleScheduleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const pid = schedulePatientTargetId || selectedPatientId;
    if (!pid || !scheduleForm.reason.trim()) return;
    try {
      await schedulePatientFollowUp(pid, {
        follow_up_date: new Date(scheduleForm.follow_up_date).toISOString(),
        reason: scheduleForm.reason.trim(),
        status: scheduleForm.status,
        clinical_notes: scheduleForm.clinical_notes.trim() || undefined,
      });
      setShowScheduleModal(false);
      setScheduleForm({
        follow_up_date: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 16),
        reason: "Routine Ultrasound Re-evaluation",
        status: "scheduled",
        clinical_notes: "",
      });
      if (selectedPatientId) {
        loadPatientProfile(selectedPatientId);
      }
      loadDirectoryData();
    } catch (err) {
      alert("Failed to schedule follow-up appointment.");
    }
  }

  async function handleUpdateFollowUpStatus(followUpId: number, newStatus: string) {
    if (!selectedPatientId) return;
    try {
      await updatePatientFollowUp(selectedPatientId, followUpId, { status: newStatus });
      loadPatientProfile(selectedPatientId);
      loadDirectoryData();
    } catch (e) {
      alert("Failed to update follow-up status.");
    }
  }

  async function handleDeleteFollowUp(followUpId: number) {
    if (!selectedPatientId || !confirm("Are you sure you want to cancel this follow-up?")) return;
    try {
      await deletePatientFollowUp(selectedPatientId, followUpId);
      loadPatientProfile(selectedPatientId);
      loadDirectoryData();
    } catch (e) {
      alert("Failed to cancel follow-up.");
    }
  }

  async function handleRunComparison() {
    if (!selectedPatientId || !compareScan1 || !compareScan2) {
      alert("Please select two distinct scans to compare.");
      return;
    }
    setComparisonLoading(true);
    try {
      const res = await fetchScanComparison(selectedPatientId, compareScan1, compareScan2);
      setComparisonResult(res);
      setShowCompareModal(true);
    } catch (e) {
      alert("Failed to load side-by-side scan comparison.");
    } finally {
      setComparisonLoading(false);
    }
  }

  async function handlePreviewHistoryPdf(patientId: string) {
    setPdfPreviewLoading(true);
    setPdfPreviewTitle(`Longitudinal History — ${patientId}`);
    try {
      const url = await getPatientHistoryPdfBlobUrl(patientId);
      setPdfPreviewUrl(url);
    } catch (e) {
      alert("Failed to load Patient History PDF preview.");
    } finally {
      setPdfPreviewLoading(false);
    }
  }

  async function handlePreviewReportPdf(analysisId: number) {
    setPdfPreviewLoading(true);
    setPdfPreviewTitle(`KidneyVision Report — KV-${String(analysisId).padStart(6, '0')}`);
    try {
      const url = await getReportPdfBlobUrl(String(analysisId));
      setPdfPreviewUrl(url);
    } catch (e) {
      alert("Failed to load Diagnostic Report preview.");
    } finally {
      setPdfPreviewLoading(false);
    }
  }

  function closePdfPreview() {
    if (pdfPreviewUrl) {
      window.URL.revokeObjectURL(pdfPreviewUrl);
    }
    setPdfPreviewUrl(null);
    setPdfPreviewTitle("");
  }

  const getBadgeClass = (finding?: string) => {
    const p = (finding || "").toLowerCase();
    if (p.includes("stone")) return "bg-red-100 text-red-800 border-red-200";
    if (p.includes("cyst")) return "bg-teal-100 text-teal-800 border-teal-200";
    if (p.includes("tumor")) return "bg-purple-100 text-purple-800 border-purple-200";
    if (p.includes("normal")) return "bg-emerald-100 text-emerald-800 border-emerald-200";
    return "bg-slate-100 text-slate-800 border-slate-200";
  };

  // ─────────────────────────────────────────────────────────────
  // RENDER: DEDICATED PATIENT PROFILE VIEW
  // ─────────────────────────────────────────────────────────────
  if (selectedPatientId && profileData) {
    const { patient, overview, timeline, imaging, reports, follow_ups } = profileData;

    return (
      <div className="space-y-6 text-left">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#c3c6d7]">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackToDirectory}
              className="p-2 bg-white border border-[#c3c6d7] rounded-xl hover:bg-[#f2f3ff] text-[#434655] hover:text-[#2563eb] transition-all cursor-pointer shadow-2xs"
              title="Return to Patients Directory"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-sans text-2xl font-bold text-[#131b2e] tracking-tight">
                  {patient.name}
                </h2>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-[#eaedff] text-[#2563eb] border border-[#2563eb]/30">
                  {patient.patient_id}
                </span>
                {patient.flagged_for_review && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    Review Flagged
                  </span>
                )}
              </div>
              <p className="text-xs text-[#737686] mt-0.5 flex items-center gap-2 flex-wrap">
                <span>{patient.age ? `${patient.age} years old` : "Age unspecified"}</span>
                <span>•</span>
                <span>{patient.gender || "Gender unspecified"}</span>
                {patient.phone && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {patient.phone}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Quick Profile Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleStartAnalysisForPatient(patient)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#2563eb] hover:bg-[#004ac6] text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              New Analysis
            </button>
            <button
              onClick={() => {
                setSchedulePatientTargetId(patient.patient_id);
                setShowScheduleModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-[#c3c6d7] hover:bg-[#f2f3ff] text-[#131b2e] rounded-lg text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            >
              <CalendarPlus className="w-3.5 h-3.5 text-[#2563eb]" />
              Schedule Follow-up
            </button>
            <button
              onClick={() => handlePreviewHistoryPdf(patient.patient_id)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-[#c3c6d7] hover:bg-[#f2f3ff] text-[#131b2e] rounded-lg text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5 text-slate-500" />
              Patient History PDF
            </button>
            <button
              onClick={() => setShowEditDemographicsModal(true)}
              className="p-2 bg-white border border-[#c3c6d7] hover:bg-[#f2f3ff] text-[#434655] rounded-lg text-xs transition-all cursor-pointer"
              title="Edit Demographics"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-[#c3c6d7] overflow-x-auto">
          {[
            { id: "overview", label: "Overview", count: null },
            { id: "timeline", label: "Clinical Timeline", count: timeline.length },
            { id: "imaging", label: "Imaging & Scans", count: imaging.length },
            { id: "follow_up", label: "Follow-up Visits", count: follow_ups.length },
            { id: "reports", label: "Diagnostic Reports", count: reports.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2.5 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-[#2563eb] text-[#2563eb]"
                  : "border-transparent text-[#737686] hover:text-[#131b2e]"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeTab === tab.id ? "bg-[#eaedff] text-[#2563eb]" : "bg-slate-100 text-slate-600"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── TAB 1: OVERVIEW ── */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white border border-[#c3c6d7] rounded-xl p-4 shadow-2xs">
                <span className="text-[10px] font-bold text-[#737686] uppercase tracking-wider">Total Scans</span>
                <p className="text-xl font-extrabold text-[#131b2e] mt-1">{patient.analyses_count}</p>
                <span className="text-[10px] text-slate-500">First: {new Date(overview.first_visit).toLocaleDateString()}</span>
              </div>
              <div className="bg-white border border-[#c3c6d7] rounded-xl p-4 shadow-2xs">
                <span className="text-[10px] font-bold text-[#737686] uppercase tracking-wider">Confirmed Diagnoses</span>
                <p className="text-xl font-extrabold text-emerald-600 mt-1">{overview.confirmed_count}</p>
                <span className="text-[10px] text-slate-500">Clinician verified</span>
              </div>
              <div className="bg-white border border-[#c3c6d7] rounded-xl p-4 shadow-2xs">
                <span className="text-[10px] font-bold text-[#737686] uppercase tracking-wider">Pending Reviews</span>
                <p className="text-xl font-extrabold text-amber-600 mt-1">{overview.pending_reviews_count}</p>
                <span className="text-[10px] text-slate-500">Awaiting validation</span>
              </div>
              <div className="bg-white border border-[#c3c6d7] rounded-xl p-4 shadow-2xs">
                <span className="text-[10px] font-bold text-[#737686] uppercase tracking-wider">Scheduled Follow-ups</span>
                <p className="text-xl font-extrabold text-[#2563eb] mt-1">{overview.scheduled_follow_ups_count}</p>
                <span className="text-[10px] text-slate-500">Active care plan</span>
              </div>
            </div>

            {/* Latest Clinical Assessment Card */}
            {overview.latest_analysis ? (
              <div className="bg-white border border-[#c3c6d7] rounded-xl p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#131b2e] flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#2563eb]" />
                    Latest Renal Examination Summary
                  </h3>
                  <span className="text-xs text-[#737686]">
                    Examined {new Date(overview.latest_analysis.created_at).toLocaleString()}
                  </span>
                </div>

                <div className="flex flex-col md:flex-row items-start gap-5">
                  {overview.latest_analysis.image_url && (
                    <img
                      src={overview.latest_analysis.image_url}
                      alt="Latest scan"
                      className="w-32 h-32 rounded-xl object-cover border border-[#c3c6d7] shrink-0 bg-neutral-900"
                      onError={(e) => { (e.target as HTMLImageElement).src = CLINICAL_SCAN_FALLBACK_SVG; }}
                    />
                  )}
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getBadgeClass(overview.latest_analysis.prediction)}`}>
                        {overview.latest_analysis.prediction} Detection
                      </span>
                      <span className="text-xs font-semibold text-[#434655]">
                        Confidence: <strong className="text-[#131b2e]">{overview.latest_analysis.confidence}%</strong>
                      </span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        KV-{String(overview.latest_analysis.id).padStart(6, '0')}
                      </span>
                    </div>

                    <p className="text-xs text-[#434655] leading-relaxed">
                      AI Computer-Aided Diagnostic Triage indicates findings consistent with <strong>{overview.latest_analysis.prediction}</strong>.
                      All preliminary AI evaluations must be confirmed by the attending radiologist or nephrologist before prescribing intervention.
                    </p>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        onClick={() => handlePreviewReportPdf(overview.latest_analysis!.id)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#2563eb] hover:underline cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Diagnostic Report
                      </button>
                      <button
                        onClick={() => setActiveTab("imaging")}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#434655] hover:text-[#131b2e] cursor-pointer"
                      >
                        Browse all {patient.analyses_count} scans &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-[#c3c6d7] rounded-xl p-8 text-center space-y-3">
                <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                <h4 className="text-sm font-bold text-[#131b2e]">No ultrasound examinations on file</h4>
                <p className="text-xs text-[#737686]">Upload a renal ultrasound scan to establish this patient's longitudinal baseline.</p>
                <button
                  onClick={() => handleStartAnalysisForPatient(patient)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2563eb] hover:bg-[#004ac6] text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Upload Initial Scan
                </button>
              </div>
            )}

            {/* Baseline Clinical Notes */}
            <div className="bg-white border border-[#c3c6d7] rounded-xl p-5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-[#e2e8f0]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#131b2e] flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-slate-400" />
                  Clinical Baseline &amp; Patient History
                </h3>
                <button
                  onClick={() => setShowEditDemographicsModal(true)}
                  className="text-xs text-[#2563eb] hover:underline font-semibold cursor-pointer"
                >
                  Edit Notes
                </button>
              </div>
              <p className="text-xs text-[#434655] leading-relaxed whitespace-pre-wrap">
                {patient.notes || "No clinical history or baseline notes recorded yet. Click 'Edit Notes' to document presenting symptoms, serum creatinine, or previous urological history."}
              </p>
            </div>
          </div>
        )}

        {/* ── TAB 2: TIMELINE ── */}
        {activeTab === "timeline" && (
          <div className="bg-white border border-[#c3c6d7] rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#e2e8f0]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#131b2e]">
                Longitudinal Clinical Timeline ({timeline.length} Events)
              </h3>
              <span className="text-[10px] text-[#737686]">Chronological order</span>
            </div>

            {timeline.length === 0 ? (
              <p className="text-xs text-[#737686] py-8 text-center">No timeline events recorded yet.</p>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#e2e8f0]">
                {timeline.map((event) => (
                  <div key={event.id} className="relative group">
                    {/* Event Dot */}
                    <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-white bg-[#2563eb] shadow-xs group-hover:scale-110 transition-transform" />

                    <div className="p-3.5 bg-[#faf8ff] border border-[#c3c6d7]/80 rounded-xl hover:bg-[#f2f3ff] transition-all space-y-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-bold text-xs text-[#131b2e]">{event.title}</span>
                        <span className="text-[10px] text-[#737686]">
                          {new Date(event.timestamp).toLocaleString("en-US", {
                            month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit"
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-[#434655] leading-relaxed">{event.description}</p>
                      {event.notes && (
                        <div className="mt-2 text-[11px] p-2 bg-white rounded border border-[#c3c6d7] text-[#434655] italic">
                          "{event.notes}"
                        </div>
                      )}
                      {event.image_url && (
                        <div className="pt-2">
                          <img
                            src={event.image_url}
                            alt="Scan thumb"
                            className="w-16 h-16 rounded-lg object-cover border border-[#c3c6d7] bg-neutral-900"
                            onError={(e) => { (e.target as HTMLImageElement).src = CLINICAL_SCAN_FALLBACK_SVG; }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: IMAGING & SCANS ── */}
        {activeTab === "imaging" && (
          <div className="space-y-4">
            {/* Compare Bar */}
            <div className="bg-[#eaedff]/60 border border-[#2563eb]/30 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Split className="w-4 h-4 text-[#2563eb]" />
                <span className="font-bold text-[#131b2e]">Side-by-Side Scan Comparison</span>
                <span className="text-slate-500 text-[11px]">(Select two scans from below to analyze progression)</span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={compareScan1 || ""}
                  onChange={(e) => setCompareScan1(e.target.value ? Number(e.target.value) : null)}
                  className="px-2 py-1.5 bg-white border border-[#c3c6d7] rounded-lg text-xs"
                >
                  <option value="">Scan 1 (Baseline)</option>
                  {imaging.map((s) => (
                    <option key={`c1-${s.id}`} value={s.id}>
                      KV-{String(s.id).padStart(6, '0')} ({s.prediction} · {new Date(s.created_at).toLocaleDateString()})
                    </option>
                  ))}
                </select>
                <span className="font-bold text-slate-400">vs</span>
                <select
                  value={compareScan2 || ""}
                  onChange={(e) => setCompareScan2(e.target.value ? Number(e.target.value) : null)}
                  className="px-2 py-1.5 bg-white border border-[#c3c6d7] rounded-lg text-xs"
                >
                  <option value="">Scan 2 (Follow-up)</option>
                  {imaging.map((s) => (
                    <option key={`c2-${s.id}`} value={s.id}>
                      KV-{String(s.id).padStart(6, '0')} ({s.prediction} · {new Date(s.created_at).toLocaleDateString()})
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleRunComparison}
                  disabled={!compareScan1 || !compareScan2 || compareScan1 === compareScan2 || comparisonLoading}
                  className="px-3 py-1.5 bg-[#2563eb] disabled:bg-slate-300 text-white rounded-lg font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1"
                >
                  {comparisonLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Split className="w-3.5 h-3.5" />}
                  Compare
                </button>
              </div>
            </div>

            {/* Scans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {imaging.map((scan) => (
                <div key={scan.id} className="bg-white border border-[#c3c6d7] rounded-xl p-4 shadow-2xs space-y-3 hover:border-[#2563eb]/40 transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={scan.image_url || CLINICAL_SCAN_FALLBACK_SVG}
                        alt="Ultrasound scan"
                        className="w-16 h-16 rounded-lg object-cover border border-[#c3c6d7] bg-neutral-900 shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).src = CLINICAL_SCAN_FALLBACK_SVG; }}
                      />
                      <div className="min-w-0 space-y-0.5">
                        <span className="font-mono text-xs font-bold text-[#2563eb]">
                          KV-{String(scan.id).padStart(6, '0')}
                        </span>
                        <h4 className="font-bold text-xs text-[#131b2e] truncate">{scan.location}</h4>
                        <span className="text-[10px] text-[#737686] block">
                          {new Date(scan.created_at).toLocaleDateString()} at {new Date(scan.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${getBadgeClass(scan.prediction)}`}>
                      {scan.prediction} ({scan.confidence}%)
                    </span>
                  </div>

                  {/* Notes / Assessment */}
                  {scan.clinician_notes && (
                    <p className="text-[11px] text-[#434655] bg-[#faf8ff] p-2 rounded-lg border border-[#c3c6d7]/70 italic">
                      "{scan.clinician_notes}"
                    </p>
                  )}

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#e2e8f0] text-xs">
                    <span className="text-[10px] text-slate-500 font-mono">
                      {scan.model_version || "ConvNeXt Master SOTA"}
                    </span>
                    <div className="flex items-center gap-2">
                      {scan.has_report && (
                        <button
                          onClick={() => handlePreviewReportPdf(scan.id)}
                          className="text-[#2563eb] hover:underline font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                        >
                          <FileText className="w-3 h-3" /> Report PDF
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 4: FOLLOW-UP VISITS ── */}
        {activeTab === "follow_up" && (
          <div className="bg-white border border-[#c3c6d7] rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#e2e8f0]">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#131b2e]">
                  Scheduled &amp; Past Care Follow-up Visits ({follow_ups.length})
                </h3>
                <p className="text-[10px] text-[#737686]">Manage clinical consults, re-evaluations, and surveillance protocols</p>
              </div>
              <button
                onClick={() => {
                  setSchedulePatientTargetId(patient.patient_id);
                  setShowScheduleModal(true);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#2563eb] text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Schedule Visit
              </button>
            </div>

            {follow_ups.length === 0 ? (
              <p className="text-xs text-[#737686] py-8 text-center">No follow-up visits recorded yet for this patient.</p>
            ) : (
              <div className="space-y-3">
                {follow_ups.map((visit) => (
                  <div
                    key={visit.id}
                    className={`p-3.5 border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all ${
                      visit.is_overdue
                        ? "bg-red-50/50 border-red-200"
                        : visit.status === "completed"
                        ? "bg-slate-50 border-slate-200 opacity-80"
                        : "bg-[#faf8ff] border-[#c3c6d7]/80 hover:bg-[#f2f3ff]"
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-[#131b2e] text-xs">{visit.reason}</strong>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          visit.status === "completed"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : visit.is_overdue
                            ? "bg-red-100 text-red-800 border-red-200"
                            : "bg-blue-100 text-blue-800 border-blue-200"
                        }`}>
                          {visit.status.toUpperCase()} {visit.is_overdue && "(OVERDUE)"}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#737686] flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        <span>Date: <strong>{new Date(visit.follow_up_date).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}</strong></span>
                      </p>
                      {visit.clinical_notes && (
                        <p className="text-[11px] text-[#434655] italic pt-1">
                          "{visit.clinical_notes}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {visit.status === "scheduled" && (
                        <button
                          onClick={() => handleUpdateFollowUpStatus(visit.id, "completed")}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold shadow-2xs cursor-pointer flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" /> Mark Completed
                        </button>
                      )}
                      {visit.status === "scheduled" && (
                        <button
                          onClick={() => handleUpdateFollowUpStatus(visit.id, "cancelled")}
                          className="px-2 py-1 bg-white border border-[#c3c6d7] text-slate-600 hover:bg-slate-50 rounded text-[11px] font-medium cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteFollowUp(visit.id)}
                        className="text-red-500 hover:text-red-700 text-[11px] p-1 cursor-pointer"
                        title="Remove visit"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 5: REPORTS ── */}
        {activeTab === "reports" && (
          <div className="bg-white border border-[#c3c6d7] rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#e2e8f0]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#131b2e]">
                Official Signed Diagnostic PDF Reports ({reports.length})
              </h3>
              <span className="text-[10px] text-[#737686]">Instant in-app preview or download</span>
            </div>

            {reports.length === 0 ? (
              <p className="text-xs text-[#737686] py-8 text-center">No PDF diagnostic reports generated yet for this patient.</p>
            ) : (
              <div className="space-y-3">
                {reports.map((doc) => (
                  <div key={doc.id} className="p-3 bg-[#faf8ff] border border-[#c3c6d7]/80 rounded-xl flex items-center justify-between gap-3 text-xs hover:bg-[#f2f3ff] transition-all">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-[#131b2e] truncate">{doc.title}</strong>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white border border-[#c3c6d7] text-[#434655]">
                          {doc.report_code}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getBadgeClass(doc.prediction)}`}>
                          {doc.prediction} ({doc.confidence}%)
                        </span>
                      </div>
                      <span className="text-[10px] text-[#737686] block">
                        Generated on {new Date(doc.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handlePreviewReportPdf(doc.analysis_id)}
                        className="px-2.5 py-1.5 bg-white border border-[#c3c6d7] hover:bg-[#f2f3ff] text-[#131b2e] rounded-lg text-xs font-semibold shadow-2xs cursor-pointer inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3 text-[#2563eb]" /> Preview
                      </button>
                      <button
                        onClick={() => downloadReport(String(doc.analysis_id), doc.filename)}
                        className="px-2.5 py-1.5 bg-[#2563eb] hover:bg-[#004ac6] text-white rounded-lg text-xs font-semibold shadow-2xs cursor-pointer inline-flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" /> Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MODALS FOR PROFILE VIEW ── */}
        {renderModals()}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER: PATIENTS DIRECTORY TABLE & STATS (DEFAULT VIEW)
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 text-left">
      {/* Title & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-sans text-2xl font-bold text-[#131b2e] tracking-tight">Patients Follow-up Center</h2>
          <p className="font-sans text-xs text-[#434655]">
            Centralized longitudinal care management. Monitor renal pathologies, schedule surveillance visits, compare ultrasound progression, and maintain authenticated patient history records.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddPatientModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#2563eb] hover:bg-[#004ac6] text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Patient
          </button>
          <button
            onClick={() => loadDirectoryData()}
            className="p-2 bg-white border border-[#c3c6d7] rounded-xl hover:bg-[#f2f3ff] text-[#434655] transition-all cursor-pointer shadow-2xs"
            title="Refresh Directory"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#2563eb]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-[#c3c6d7] rounded-xl p-4 shadow-2xs">
            <span className="text-[10px] font-bold text-[#737686] uppercase tracking-wider">Registered Patients</span>
            <p className="text-2xl font-black text-[#131b2e] mt-1">{stats.total_patients}</p>
            <span className="text-[10px] text-slate-500 font-medium">Distinct clinical identities</span>
          </div>
          <div className="bg-white border border-[#c3c6d7] rounded-xl p-4 shadow-2xs">
            <span className="text-[10px] font-bold text-[#737686] uppercase tracking-wider">Upcoming Follow-ups</span>
            <p className="text-2xl font-black text-[#2563eb] mt-1">{stats.active_follow_ups}</p>
            <span className="text-[10px] text-slate-500 font-medium">Scheduled surveillance visits</span>
          </div>
          <div className="bg-white border border-[#c3c6d7] rounded-xl p-4 shadow-2xs">
            <span className="text-[10px] font-bold text-[#737686] uppercase tracking-wider">Overdue Consultations</span>
            <p className="text-2xl font-black text-red-600 mt-1">{stats.overdue_follow_ups}</p>
            <span className="text-[10px] text-slate-500 font-medium">Needs clinician outreach</span>
          </div>
          <div className="bg-white border border-[#c3c6d7] rounded-xl p-4 shadow-2xs">
            <span className="text-[10px] font-bold text-[#737686] uppercase tracking-wider">High Risk / Alert Scans</span>
            <p className="text-2xl font-black text-purple-600 mt-1">{stats.high_risk_patients}</p>
            <span className="text-[10px] text-slate-500 font-medium">Renal mass / tumor alert</span>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#c3c6d7] rounded-xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Patient ID (e.g. PT-10006) or Patient Name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-[#f8fafc] border border-[#c3c6d7] rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] outline-none transition-all focus:bg-white"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={filterVisit}
              onChange={(e) => { setFilterVisit(e.target.value); setPage(1); }}
              className="px-2.5 py-2 bg-[#f8fafc] border border-[#c3c6d7] rounded-lg text-xs font-medium focus:border-[#2563eb] outline-none cursor-pointer"
            >
              <option value="all">All Visit Dates</option>
              <option value="recent_30">Last 30 Days</option>
              <option value="recent_90">Last 90 Days</option>
            </select>

            <select
              value={filterReview}
              onChange={(e) => { setFilterReview(e.target.value); setPage(1); }}
              className="px-2.5 py-2 bg-[#f8fafc] border border-[#c3c6d7] rounded-lg text-xs font-medium focus:border-[#2563eb] outline-none cursor-pointer"
            >
              <option value="all">All Review States</option>
              <option value="pending">Pending Review</option>
              <option value="confirmed">Confirmed</option>
              <option value="flagged">Flagged</option>
            </select>

            <select
              value={filterFollowUp}
              onChange={(e) => { setFilterFollowUp(e.target.value); setPage(1); }}
              className="px-2.5 py-2 bg-[#f8fafc] border border-[#c3c6d7] rounded-lg text-xs font-medium focus:border-[#2563eb] outline-none cursor-pointer"
            >
              <option value="all">All Follow-ups</option>
              <option value="upcoming">Upcoming</option>
              <option value="overdue">Overdue</option>
              <option value="completed">Completed</option>
            </select>

            {(searchQuery || filterVisit !== "all" || filterReview !== "all" || filterFollowUp !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setFilterVisit("all");
                  setFilterReview("all");
                  setFilterFollowUp("all");
                  setPage(1);
                }}
                className="text-xs text-[#2563eb] hover:underline font-semibold cursor-pointer px-2"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Patient Table */}
      <div className="bg-white border border-[#c3c6d7] rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8fafc] text-[#434655] font-bold border-b border-[#e2e8f0] uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Patient ID</th>
                <th className="py-3 px-4">Patient Name</th>
                <th className="py-3 px-4">Age / Gender</th>
                <th className="py-3 px-4">Scans Count</th>
                <th className="py-3 px-4">Latest Finding</th>
                <th className="py-3 px-4">Last Visit</th>
                <th className="py-3 px-4">Next Follow-up</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin text-[#2563eb] mx-auto mb-2" />
                    <span>Loading patient records from database...</span>
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 space-y-2">
                    <Users className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="font-bold text-slate-700">No patient records found</p>
                    <p className="text-[11px] text-slate-400">Try adjusting your search criteria or register a new patient.</p>
                  </td>
                </tr>
              ) : (
                patients.map((item) => (
                  <tr key={item.patient_id} className="hover:bg-[#faf8ff] transition-colors group">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#2563eb]">
                      {item.patient_id}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#131b2e]">
                      <div className="flex items-center gap-1.5">
                        <span>{item.name}</span>
                        {item.flagged_for_review && (
                          <span title="Flagged for manual identity review">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[#434655]">
                      {item.age ? `${item.age}y` : "—"} · {item.gender || "—"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                        {item.analyses_count}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {item.latest_result ? (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getBadgeClass(item.latest_result.prediction)}`}>
                          {item.latest_result.prediction} ({item.latest_result.confidence}%)
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">No scans yet</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[#434655] text-[11px]">
                      {item.last_visit ? new Date(item.last_visit).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-3.5 px-4">
                      {item.next_follow_up ? (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          item.next_follow_up.is_overdue
                            ? "bg-red-100 text-red-800 border-red-200"
                            : "bg-blue-100 text-blue-800 border-blue-200"
                        }`}>
                          {new Date(item.next_follow_up.follow_up_date).toLocaleDateString()}
                          {item.next_follow_up.is_overdue && " (OVERDUE)"}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">None scheduled</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenPatient(item.patient_id)}
                          className="px-2.5 py-1 bg-[#eaedff] hover:bg-[#2563eb] text-[#2563eb] hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          View Profile
                        </button>
                        <button
                          onClick={() => handleStartAnalysisForPatient(item)}
                          className="p-1 text-[#434655] hover:text-[#2563eb] transition-colors cursor-pointer"
                          title="Start New Analysis"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSchedulePatientTargetId(item.patient_id);
                            setShowScheduleModal(true);
                          }}
                          className="p-1 text-[#434655] hover:text-[#2563eb] transition-colors cursor-pointer"
                          title="Schedule Follow-up"
                        >
                          <CalendarPlus className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {meta.last_page > 1 && (
          <div className="p-3 bg-[#f8fafc] border-t border-[#e2e8f0] flex items-center justify-between text-xs text-[#434655]">
            <span>
              Showing {patients.length} of {meta.total} patients
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 bg-white border border-[#c3c6d7] rounded hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-3 font-semibold">
                Page {page} of {meta.last_page}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                disabled={page >= meta.last_page}
                className="p-1.5 bg-white border border-[#c3c6d7] rounded hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Shared Modals */}
      {renderModals()}
    </div>
  );

  // ─────────────────────────────────────────────────────────────
  // MODALS RENDER HELPER
  // ─────────────────────────────────────────────────────────────
  function renderModals() {
    return (
      <>
        {/* Modal: Add New Patient */}
        {showAddPatientModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white border border-[#c3c6d7] rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4 text-left">
              <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0]">
                <h3 className="font-sans text-base font-bold text-[#131b2e] flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#2563eb]" />
                  Register New Patient
                </h3>
                <button onClick={() => setShowAddPatientModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreatePatientSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#434655]">Patient Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Johnathan Miller"
                    value={newPatientForm.name}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#f8fafc] border border-[#c3c6d7] rounded-lg text-xs outline-none focus:border-[#2563eb] focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#434655]">Age (Years)</label>
                    <input
                      type="number"
                      min="0"
                      max="130"
                      placeholder="e.g. 52"
                      value={newPatientForm.age}
                      onChange={(e) => setNewPatientForm({ ...newPatientForm, age: e.target.value })}
                      className="w-full px-3 py-2 bg-[#f8fafc] border border-[#c3c6d7] rounded-lg text-xs outline-none focus:border-[#2563eb] focus:bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#434655]">Biological Gender</label>
                    <select
                      value={newPatientForm.gender}
                      onChange={(e) => setNewPatientForm({ ...newPatientForm, gender: e.target.value })}
                      className="w-full px-3 py-2 bg-[#f8fafc] border border-[#c3c6d7] rounded-lg text-xs outline-none focus:border-[#2563eb] cursor-pointer"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#434655]">Phone Number</label>
                    <input
                      type="text"
                      placeholder="e.g. +1 555-0192"
                      value={newPatientForm.phone}
                      onChange={(e) => setNewPatientForm({ ...newPatientForm, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-[#f8fafc] border border-[#c3c6d7] rounded-lg text-xs outline-none focus:border-[#2563eb] focus:bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#434655]">Email Address</label>
                    <input
                      type="email"
                      placeholder="patient@example.com"
                      value={newPatientForm.email}
                      onChange={(e) => setNewPatientForm({ ...newPatientForm, email: e.target.value })}
                      className="w-full px-3 py-2 bg-[#f8fafc] border border-[#c3c6d7] rounded-lg text-xs outline-none focus:border-[#2563eb] focus:bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#434655]">Clinical Notes &amp; History</label>
                  <textarea
                    rows={3}
                    placeholder="Document baseline symptoms, medical history, or prior interventions..."
                    value={newPatientForm.notes}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-[#f8fafc] border border-[#c3c6d7] rounded-lg text-xs outline-none focus:border-[#2563eb] focus:bg-white"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddPatientModal(false)}
                    className="px-4 py-2 bg-white border border-[#c3c6d7] text-[#434655] hover:bg-slate-50 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#2563eb] hover:bg-[#004ac6] text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Register Patient
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Schedule Follow-up Visit */}
        {showScheduleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white border border-[#c3c6d7] rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4 text-left">
              <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0]">
                <h3 className="font-sans text-base font-bold text-[#131b2e] flex items-center gap-2">
                  <CalendarPlus className="w-4 h-4 text-[#2563eb]" />
                  Schedule Clinical Follow-up
                </h3>
                <button onClick={() => setShowScheduleModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleScheduleSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#434655]">Follow-up Date &amp; Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduleForm.follow_up_date}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, follow_up_date: e.target.value })}
                    className="w-full px-3 py-2 bg-[#f8fafc] border border-[#c3c6d7] rounded-lg text-xs outline-none focus:border-[#2563eb] focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#434655]">Clinical Objective / Reason *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Surveillance Ultrasound or Bosniak Cyst Follow-up"
                    value={scheduleForm.reason}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, reason: e.target.value })}
                    className="w-full px-3 py-2 bg-[#f8fafc] border border-[#c3c6d7] rounded-lg text-xs outline-none focus:border-[#2563eb] focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#434655]">Visit Status</label>
                  <select
                    value={scheduleForm.status}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, status: e.target.value })}
                    className="w-full px-3 py-2 bg-[#f8fafc] border border-[#c3c6d7] rounded-lg text-xs outline-none focus:border-[#2563eb] cursor-pointer"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#434655]">Physician Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Specific examination targets or preparatory instructions for the patient..."
                    value={scheduleForm.clinical_notes}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, clinical_notes: e.target.value })}
                    className="w-full px-3 py-2 bg-[#f8fafc] border border-[#c3c6d7] rounded-lg text-xs outline-none focus:border-[#2563eb] focus:bg-white"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(false)}
                    className="px-4 py-2 bg-white border border-[#c3c6d7] text-[#434655] hover:bg-slate-50 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#2563eb] hover:bg-[#004ac6] text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Schedule Appointment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Demographics */}
        {showEditDemographicsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white border border-[#c3c6d7] rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4 text-left">
              <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0]">
                <h3 className="font-sans text-base font-bold text-[#131b2e] flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-[#2563eb]" />
                  Update Patient Record
                </h3>
                <button onClick={() => setShowEditDemographicsModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleEditPatientSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#434655]">Patient Name *</label>
                  <input
                    type="text"
                    required
                    value={editPatientForm.name}
                    onChange={(e) => setEditPatientForm({ ...editPatientForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#f8fafc] border border-[#c3c6d7] rounded-lg text-xs outline-none focus:border-[#2563eb] focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#434655]">Age (Years)</label>
                    <input
                      type="number"
                      min="0"
                      max="130"
                      value={editPatientForm.age}
                      onChange={(e) => setEditPatientForm({ ...editPatientForm, age: e.target.value })}
                      className="w-full px-3 py-2 bg-[#f8fafc] border border-[#c3c6d7] rounded-lg text-xs outline-none focus:border-[#2563eb] focus:bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#434655]">Gender</label>
                    <select
                      value={editPatientForm.gender}
                      onChange={(e) => setEditPatientForm({ ...editPatientForm, gender: e.target.value })}
                      className="w-full px-3 py-2 bg-[#f8fafc] border border-[#c3c6d7] rounded-lg text-xs outline-none focus:border-[#2563eb] cursor-pointer"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#434655]">Phone Number</label>
                    <input
                      type="text"
                      value={editPatientForm.phone}
                      onChange={(e) => setEditPatientForm({ ...editPatientForm, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-[#f8fafc] border border-[#c3c6d7] rounded-lg text-xs outline-none focus:border-[#2563eb] focus:bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#434655]">Email Address</label>
                    <input
                      type="email"
                      value={editPatientForm.email}
                      onChange={(e) => setEditPatientForm({ ...editPatientForm, email: e.target.value })}
                      className="w-full px-3 py-2 bg-[#f8fafc] border border-[#c3c6d7] rounded-lg text-xs outline-none focus:border-[#2563eb] focus:bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#434655]">Clinical Notes &amp; History</label>
                  <textarea
                    rows={4}
                    value={editPatientForm.notes}
                    onChange={(e) => setEditPatientForm({ ...editPatientForm, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-[#f8fafc] border border-[#c3c6d7] rounded-lg text-xs outline-none focus:border-[#2563eb] focus:bg-white"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEditDemographicsModal(false)}
                    className="px-4 py-2 bg-white border border-[#c3c6d7] text-[#434655] hover:bg-slate-50 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#2563eb] hover:bg-[#004ac6] text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Side-by-Side Scan Comparison */}
        {showCompareModal && comparisonResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white border border-[#c3c6d7] rounded-2xl w-full max-w-4xl p-6 shadow-2xl space-y-5 text-left max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0]">
                <div>
                  <h3 className="font-sans text-base font-bold text-[#131b2e] flex items-center gap-2">
                    <Split className="w-5 h-5 text-[#2563eb]" />
                    Comparative Ultrasound Examination Analysis
                  </h3>
                  <p className="text-xs text-[#737686]">
                    Patient: <strong>{comparisonResult.patient.name}</strong> ({comparisonResult.patient.patient_id}) &bull; Elapsed interval: <strong>{comparisonResult.interval_days} days</strong>
                  </p>
                </div>
                <button onClick={() => setShowCompareModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Side-by-Side Panels */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Scan A */}
                <div className="bg-[#faf8ff] border border-[#c3c6d7] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#e2e8f0]">
                    <span className="font-bold text-xs text-[#131b2e]">Scan A (Baseline)</span>
                    <span className="font-mono text-xs font-bold text-[#2563eb]">{comparisonResult.scan_a.report_code}</span>
                  </div>
                  <img
                    src={comparisonResult.scan_a.image_url || CLINICAL_SCAN_FALLBACK_SVG}
                    alt="Scan A"
                    className="w-full h-56 rounded-xl object-contain bg-black border border-[#c3c6d7]"
                    onError={(e) => { (e.target as HTMLImageElement).src = CLINICAL_SCAN_FALLBACK_SVG; }}
                  />
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Date:</span>
                      <strong className="text-[#131b2e]">{new Date(comparisonResult.scan_a.examination_date).toLocaleDateString()}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Target Site:</span>
                      <span className="text-[#131b2e] font-semibold">{comparisonResult.scan_a.location}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Classification:</span>
                      <span className={`px-2 py-0.5 rounded-full font-bold border ${getBadgeClass(comparisonResult.scan_a.prediction)}`}>
                        {comparisonResult.scan_a.prediction} ({comparisonResult.scan_a.confidence}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Scan B */}
                <div className="bg-[#faf8ff] border border-[#c3c6d7] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#e2e8f0]">
                    <span className="font-bold text-xs text-[#131b2e]">Scan B (Follow-up)</span>
                    <span className="font-mono text-xs font-bold text-[#2563eb]">{comparisonResult.scan_b.report_code}</span>
                  </div>
                  <img
                    src={comparisonResult.scan_b.image_url || CLINICAL_SCAN_FALLBACK_SVG}
                    alt="Scan B"
                    className="w-full h-56 rounded-xl object-contain bg-black border border-[#c3c6d7]"
                    onError={(e) => { (e.target as HTMLImageElement).src = CLINICAL_SCAN_FALLBACK_SVG; }}
                  />
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Date:</span>
                      <strong className="text-[#131b2e]">{new Date(comparisonResult.scan_b.examination_date).toLocaleDateString()}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Target Site:</span>
                      <span className="text-[#131b2e] font-semibold">{comparisonResult.scan_b.location}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Classification:</span>
                      <span className={`px-2 py-0.5 rounded-full font-bold border ${getBadgeClass(comparisonResult.scan_b.prediction)}`}>
                        {comparisonResult.scan_b.prediction} ({comparisonResult.scan_b.confidence}%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Neutral Clinical Observations Notice */}
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2 text-xs text-blue-900">
                <div className="flex items-center gap-2 font-bold">
                  <ShieldCheck className="w-4 h-4 text-[#2563eb]" />
                  <span>Comparative Observations</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-[#434655]">
                  <div>Classification Match: <strong>{comparisonResult.neutral_observations.finding_changed ? "Changed" : "Consistent"}</strong></div>
                  <div>Confidence Delta: <strong>{comparisonResult.neutral_observations.confidence_diff > 0 ? `+${comparisonResult.neutral_observations.confidence_diff}%` : `${comparisonResult.neutral_observations.confidence_diff}%`}</strong></div>
                  <div>Interval Elapsed: <strong>{comparisonResult.interval_days} days</strong></div>
                </div>
                <p className="text-[11px] text-slate-600 italic pt-1 border-t border-blue-100">
                  {comparisonResult.neutral_observations.note}
                </p>
              </div>

              <div className="flex items-center justify-end">
                <button
                  onClick={() => setShowCompareModal(false)}
                  className="px-5 py-2 bg-[#2563eb] text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Close Comparison
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: In-App PDF Preview (for Diagnostic Reports & Patient History PDFs) */}
        {pdfPreviewUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white border border-[#c3c6d7] rounded-2xl w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[#e2e8f0] flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-[#2563eb]" />
                  <span className="font-bold text-sm text-[#131b2e]">{pdfPreviewTitle}</span>
                </div>
                <button
                  onClick={closePdfPreview}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 bg-slate-100 relative">
                {pdfPreviewLoading ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-8 h-8 text-[#2563eb] animate-spin" />
                    <span className="text-xs text-slate-600 font-medium">Generating PDF preview...</span>
                  </div>
                ) : (
                  <iframe
                    src={pdfPreviewUrl}
                    title="PDF Document Preview"
                    className="w-full h-full border-none"
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
}
