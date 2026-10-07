import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardSidebar } from '../components/dashboard/DashboardSidebar';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { KpiGrid } from '../components/dashboard/KpiGrid';
import { Kidney3DViewer } from '../components/dashboard/Kidney3DViewer';
import { DiagnosticOverview } from '../components/dashboard/DiagnosticOverview';
import { ScanVolumeChart } from '../components/dashboard/ScanVolumeChart';
import { ConfidenceChart } from '../components/dashboard/ConfidenceChart';
import { RiskDistribution } from '../components/dashboard/RiskDistribution';
import { LateralityChart } from '../components/dashboard/LateralityChart';
import { DemographicsChart } from '../components/dashboard/DemographicsChart';
import { RecentClinicalActivity } from '../components/dashboard/RecentClinicalActivity';
import { ScanDetailModal } from '../components/dashboard/ScanDetailModal';

import {
  computeDashboardMetrics,
  computeDiagnosticDistribution,
  computeRiskDistribution,
  computeLateralityDistribution,
  computeConfidenceBuckets,
  computeTimelineData,
  computeAgeCohorts,
  filterScansByDateRange,
} from '../data/mockAnalytics';

import { getAnalyses } from '../services/analysis.service';
import { KidneyAnalysis, DiagnosisResult } from '../types/analysis';

import type { DateRangeOption } from '../types/dashboard';
import type { Diagnosis, ScanRecord, ScanStatus } from '../types/scan';
import { Menu, Upload, CheckCircle2, ArrowRight } from 'lucide-react';

export interface DashboardProps {
  hideSidebar?: boolean;
}

function mapAnalysisToScanRecord(analysis: KidneyAnalysis): ScanRecord {
  const confidence = typeof analysis.confidence === 'number' ? Number(analysis.confidence.toFixed(1)) : null;
  const findingLower = (analysis.pathologyFinding || '').toLowerCase();
  const predLower = (analysis.prediction || '').toLowerCase();
  const isRejected = analysis.diagnosis === DiagnosisResult.REJECTED || findingLower.includes('rejected') || findingLower.includes('invalid') || findingLower.includes('non-kidney');
  const isNormal = predLower === 'normal' || findingLower.includes('normal') || analysis.diagnosis === DiagnosisResult.NORMAL_FINDINGS;
  const isPending = !isNormal && (analysis.diagnosis === DiagnosisResult.ANALYZING || analysis.diagnosis === DiagnosisResult.REVIEW_REQUIRED);
  
  let diagnosis: Diagnosis = 'normal';
  let riskLevel: 'low' | 'elevated' | 'urgent' = 'low';

  if (isRejected) {
    diagnosis = 'rejected';
    riskLevel = 'elevated';
  } else if (isNormal) {
    diagnosis = 'normal';
    riskLevel = 'low';
  } else if (findingLower.includes('tumor') || predLower === 'tumor') {
    diagnosis = 'tumor';
    riskLevel = 'urgent';
  } else if (findingLower.includes('stone') || predLower === 'stone' || analysis.diagnosis === DiagnosisResult.ANOMALY_DETECTED) {
    diagnosis = 'nephrolithiasis';
    riskLevel = confidence && confidence > 90 ? 'urgent' : 'elevated';
  } else if (findingLower.includes('cyst') || predLower === 'cyst') {
    diagnosis = 'cyst';
    riskLevel = 'low';
  } else if (isPending) {
    diagnosis = 'pending';
    riskLevel = 'elevated';
  }

  const rawId = String(analysis.id || '');
  const id = rawId.startsWith('KV-') || rawId.startsWith('PT-') ? rawId : `KV-${rawId.padStart(3, '0')}`;

  let formattedDate = 'Recent';
  let date = new Date().toISOString().slice(0, 10);
  if (analysis.createdAt) {
    try {
      const d = new Date(analysis.createdAt);
      if (!isNaN(d.getTime())) {
        date = d.toISOString().slice(0, 10);
        formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
    } catch {
      // keep defaults
    }
  }

  const loc = String(analysis.location || '').toLowerCase();
  const laterality = loc.includes('right') ? 'right' : loc.includes('bilateral') ? 'bilateral' : 'left';
  const diamMm = analysis.clinicalAssessment?.estimated_diameter_mm || analysis.dimensions?.length;

    const rawStatus = (analysis.status || '').toLowerCase();
    let scanStatus: ScanStatus = 'reviewed';
    if (
      rawStatus === 'review' ||
      rawStatus === 'pending' ||
      analysis.diagnosis === DiagnosisResult.REVIEW_REQUIRED ||
      analysis.isDraft
    ) {
      scanStatus = 'under_review';
    } else if (rawStatus === 'flagged') {
      scanStatus = 'flagged';
    } else if (rawStatus === 'confirmed' || rawStatus === 'completed') {
      scanStatus = 'reviewed';
    } else {
      scanStatus = analysis.confirmedAt ? 'reviewed' : 'under_review';
    }

    return {
      id,
      patientAlias: analysis.patientName || analysis.patientId || `Patient ${rawId}`,
      date,
      formattedDate,
      laterality,
      diagnosis,
      confidence,
      riskLevel,
      status: scanStatus,
      patientAge: analysis.patientAge || 45,
      patientSex: String(analysis.patientGender || '').toLowerCase() === 'female' ? 'female' : 'male',
      kidneyPole: 'lower',
      stoneSizeMm: diamMm,
      hasGradCam: !isNormal && Boolean(analysis.heatmapUrl || analysis.visualizationUrl),
      notes: analysis.clinicianNotes || analysis.recommendation || 'Clinical record from database.',
      confirmedAt: analysis.confirmedAt,
      confirmedByName: analysis.confirmedByName,
      flaggedFor: analysis.flaggedFor,
      flaggedAt: analysis.flaggedAt,
      pathologyTitle: analysis.pathologyFinding,
    classProbabilities: analysis.classProbabilities,
    clinicalAssessment: analysis.clinicalAssessment,
    gateEvaluation: analysis.gateEvaluation,
    visualizationUrl: isNormal ? undefined : analysis.visualizationUrl,
    cleanedScanUrl: analysis.cleanedScanUrl,
    imageUrl: analysis.imageUrl,
    heatmapUrl: isNormal ? undefined : analysis.heatmapUrl,
    primaryDiagnosis: analysis.primaryDiagnosis,
    modelVersion: analysis.modelVersion,
    telemetry: analysis.telemetry,
  };
}

export const Dashboard: React.FC<DashboardProps> = ({ hideSidebar = false }) => {
  const navigate = useNavigate();
  const [isOpenMobile, setIsOpenMobile] = useState<boolean>(false);

  // Backend analyses state
  const [backendScans, setBackendScans] = useState<ScanRecord[]>([]);

  // Filter state
  const [dateRange, setDateRange] = useState<DateRangeOption>('30D');
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<Diagnosis | 'all'>('all');

  // Modal inspection state
  const [selectedScan, setSelectedScan] = useState<ScanRecord | null>(null);

  // New Analysis Demo State
  const [showNewScanModal, setShowNewScanModal] = useState<boolean>(false);
  const [newScanStep, setNewScanStep] = useState<number>(1);

  // Load real analyses from Laravel API
  const loadBackendScans = async () => {
    try {
      const res = await getAnalyses(1, 100);
      if (res && Array.isArray(res.data)) {
        const mapped = res.data.map(mapAnalysisToScanRecord);
        setBackendScans(mapped);
      } else {
        setBackendScans([]);
      }
    } catch {
      // Backend offline or user not logged in; retain real empty state
      setBackendScans([]);
    }
  };

  useEffect(() => {
    loadBackendScans();
  }, []);

  // Real scans from backend database (authenticated user)
  const allScans = useMemo(() => {
    return backendScans;
  }, [backendScans]);

  // Filter scans by active date range
  const filteredRangeScans = useMemo(() => {
    return filterScansByDateRange(allScans, dateRange);
  }, [allScans, dateRange]);

  // Derived metrics & chart datasets
  const metrics = useMemo(() => {
    return computeDashboardMetrics(filteredRangeScans);
  }, [filteredRangeScans]);

  const diagnosticDistribution = useMemo(() => {
    return computeDiagnosticDistribution(filteredRangeScans);
  }, [filteredRangeScans]);

  const riskDistribution = useMemo(() => {
    return computeRiskDistribution(filteredRangeScans);
  }, [filteredRangeScans]);

  const lateralityDistribution = useMemo(() => {
    return computeLateralityDistribution(filteredRangeScans);
  }, [filteredRangeScans]);

  const confidenceBuckets = useMemo(() => {
    return computeConfidenceBuckets(filteredRangeScans);
  }, [filteredRangeScans]);

  const timelineData = useMemo(() => {
    return computeTimelineData(filteredRangeScans);
  }, [filteredRangeScans]);

  const ageCohorts = useMemo(() => {
    return computeAgeCohorts(filteredRangeScans);
  }, [filteredRangeScans]);

  const handleScanUpdated = (updatedScan: ScanRecord) => {
    setBackendScans((prev) =>
      prev.map((s) => (s.id === updatedScan.id ? updatedScan : s))
    );
    setSelectedScan(updatedScan);
  };

  return (
    <div className={`min-h-full bg-slate-50 flex flex-col text-slate-800 antialiased selection:bg-sky-100 selection:text-sky-900 ${!hideSidebar ? 'min-h-screen' : ''}`}>
      {/* 1. Sidebar Navigation (shown only when not embedded in PortalLayout) */}
      {!hideSidebar && (
        <DashboardSidebar
          isOpenMobile={isOpenMobile}
          onToggleMobile={() => setIsOpenMobile(!isOpenMobile)}
          onNewScanClick={() => setShowNewScanModal(true)}
        />
      )}

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 ${!hideSidebar ? 'lg:pl-64' : ''}`}>
        {/* Mobile Top Header Bar (only when standalone) */}
        {!hideSidebar && (
          <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200">
            <button
              type="button"
              onClick={() => setIsOpenMobile(true)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg border border-slate-200"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-bold text-slate-900 text-sm">KidneyVision AI</span>
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
              MS
            </div>
          </div>
        )}

        {/* 2. Top Header with Controls */}
        <DashboardHeader
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          onRefresh={() => {
            loadBackendScans();
            setDateRange((prev) => prev);
          }}
          pendingCount={metrics.pendingReviewCount}
          onNewScanClick={() => setShowNewScanModal(true)}
        />

        {/* Dashboard Body Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* 3. Top KPI Cards */}
          <section aria-label="Key Performance Indicators">
            <KpiGrid metrics={metrics} dateRange={dateRange} />
          </section>

          {/* 4. Main Visual Section: 3D Kidney & Diagnostic Overview */}
          <section
            aria-label="3D Kidney Anatomy and Diagnostic Overview"
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
          >
            {/* Left 3D Kidney Viewer (compact 4 cols on lg) */}
            <div className="lg:col-span-4 flex flex-col h-full">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  3D Anatomical Reference
                </span>
                <span className="text-[11px] text-slate-500">
                  Renal Anatomy
                </span>
              </div>
              <div className="flex-1 min-h-0">
                <Kidney3DViewer />
              </div>
            </div>

            {/* Right Diagnostic Overview (8 cols on lg) */}
            <div className="lg:col-span-8 flex flex-col h-full">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Classification Breakdown
                </span>
                <span className="text-[11px] text-slate-500">
                  Cohort: {metrics.totalScans} cases
                </span>
              </div>
              <div className="flex-1 min-h-0">
                <DiagnosticOverview
                  metrics={metrics}
                  distribution={diagnosticDistribution}
                  selectedDiagnosis={selectedDiagnosis}
                  onSelectDiagnosis={setSelectedDiagnosis}
                />
              </div>
            </div>
          </section>

          {/* 5. Analytics Section */}
          <section aria-label="Clinical Analytics Visualizations" className="space-y-6">
            {/* Row 1: Scan Volume Trends + Confidence Calibration */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ScanVolumeChart data={timelineData} />
              <ConfidenceChart
                buckets={confidenceBuckets}
                normalAvg={metrics.normalAverageConfidence}
                stoneAvg={metrics.stoneAverageConfidence}
                cystAvg={metrics.cystAverageConfidence}
                tumorAvg={metrics.tumorAverageConfidence}
              />
            </div>

            {/* Row 2: Risk Stratification, Sweep Laterality & Demographics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <RiskDistribution
                distribution={riskDistribution}
                totalScans={metrics.totalScans}
              />
              <LateralityChart
                distribution={lateralityDistribution}
                totalScans={metrics.totalScans}
              />
              <DemographicsChart cohorts={ageCohorts} />
            </div>
          </section>

          {/* 6. Recent Clinical Activity Table */}
          <section aria-label="Recent Clinical Activity and Inference Audit">
            <RecentClinicalActivity
              scans={filteredRangeScans}
              onSelectScan={(scan) => setSelectedScan(scan)}
              selectedDiagnosis={selectedDiagnosis}
              onFilterDiagnosis={setSelectedDiagnosis}
            />
          </section>
        </main>
      </div>

      {/* Interactive Scan Review Modal */}
      <ScanDetailModal
        scan={selectedScan}
        onClose={() => setSelectedScan(null)}
        onScanUpdated={handleScanUpdated}
      />

      {/* Interactive "New Ultrasound Scan" Demo Modal */}
      {showNewScanModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setShowNewScanModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-100 text-sky-700">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Upload Ultrasound Scan
                  </h3>
                  <p className="text-xs text-slate-500">
                    Connect DICOM or standard B-mode image stream
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewScanModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="my-6">
              {newScanStep === 1 ? (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50 hover:bg-slate-100/60 cursor-pointer transition-colors">
                    <Upload className="w-8 h-8 text-sky-600 mx-auto mb-2 animate-bounce" />
                    <p className="text-sm font-semibold text-slate-800">
                      Drag and drop DICOM / PNG / JPEG
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      B-mode renal acoustic window (up to 50MB)
                    </p>
                    <button
                      type="button"
                      onClick={() => setNewScanStep(2)}
                      className="mt-4 px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 shadow-xs"
                    >
                      Simulate Upload Demo Scan
                    </button>
                  </div>

                  <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-sky-900">Live AI Inference Engine</p>
                      <p className="text-[11px] text-sky-700">Run ConvNeXt-Tiny 4-Class & Gatekeeper inference via Flask & Laravel</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewScanModal(false);
                        navigate('/analysis');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <span>Live Scan</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Inference Pipeline Complete</span>
                  </div>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    Scan verified by <strong>Stage-1 Gatekeeper AI</strong> and diagnosed with <strong>ConvNeXt-Tiny SOTA</strong> (4 Pathologies: Cyst, Normal, Stone, Tumor). Grad-CAM saliency generated. Case indexed as <strong>KV-DEMO-001</strong>.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewScanModal(false);
                      setNewScanStep(1);
                      setSelectedScan(allScans[0] || null);
                    }}
                    className="w-full py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shadow-xs"
                  >
                    Inspect Newly Analyzed Case
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowNewScanModal(false);
                  setNewScanStep(1);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
