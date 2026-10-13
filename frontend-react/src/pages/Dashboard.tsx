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
import { getStatistics } from '../services/dashboard.service';
import { KidneyAnalysis, DiagnosisResult } from '../types/analysis';
import type { DashboardStats } from '../types';

import type { DateRangeOption } from '../types/dashboard';
import type { Diagnosis, ScanRecord, ScanStatus } from '../types/scan';
import { Menu } from 'lucide-react';

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

  // Live aggregated DB statistics (to support arbitrarily large archives)
  const [liveStats, setLiveStats] = useState<DashboardStats | null>(null);

  // Load real analyses from Laravel API and global DB statistics
  const loadBackendScans = async () => {
    try {
      const [analysesResult, statsResult] = await Promise.allSettled([
        getAnalyses(1, 100),
        getStatistics(),
      ]);

      if (analysesResult.status === 'fulfilled' && analysesResult.value && Array.isArray(analysesResult.value.data)) {
        const mapped = analysesResult.value.data.map(mapAnalysisToScanRecord);
        setBackendScans(mapped);
      } else {
        setBackendScans([]);
      }

      if (statsResult.status === 'fulfilled' && statsResult.value) {
        setLiveStats(statsResult.value);
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
    const computed = computeDashboardMetrics(filteredRangeScans);
    if (dateRange === 'ALL' && liveStats && liveStats.totalScans > computed.totalScans) {
      const total = liveStats.totalScans;
      const normal = liveStats.normalCount;
      const stones = liveStats.stoneCount;
      const cysts = liveStats.cystCount;
      const tumors = liveStats.tumorCount;
      const pathDetections = stones + cysts + tumors;
      const normalRate = total > 0 ? Math.round((normal / total) * 100) : 0;
      const pathRate = total > 0 ? Math.round((pathDetections / total) * 100) : 0;
      return {
        ...computed,
        totalScans: total,
        normalScans: normal,
        normalRate,
        stoneScans: stones,
        cystScans: cysts,
        tumorScans: tumors,
        pathologyDetections: pathDetections,
        pathologyRate: pathRate,
        scansDeltaPct: liveStats.monthGrowthPercentage !== null ? liveStats.monthGrowthPercentage : computed.scansDeltaPct,
      };
    }
    return computed;
  }, [filteredRangeScans, dateRange, liveStats]);

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
          onNewScanClick={() => navigate('/analysis')}
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
    </div>
  );
};

export default Dashboard;
