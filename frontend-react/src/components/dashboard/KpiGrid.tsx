import React from 'react';
import { Database, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';
import { KpiCard } from './KpiCard';
import type { DashboardMetrics } from '../../types/analytics';
import type { DateRangeOption } from '../../types/dashboard';

interface KpiGridProps {
  metrics: DashboardMetrics;
  dateRange: DateRangeOption;
}

export const KpiGrid: React.FC<KpiGridProps> = ({ metrics, dateRange }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Scans */}
      <KpiCard
        title="Total Scans"
        value={metrics.totalScans}
        subtitle={`${metrics.totalScans} indexed across ${dateRange === 'ALL' ? 'entire archive' : dateRange}`}
        icon={Database}
        iconColor="text-sky-600"
        iconBg="bg-sky-50"
        highlightColor="blue"
        trend={
          metrics.totalScans > 0
            ? {
                value: `+${metrics.scansDeltaPct}%`,
                isPositive: true,
                label: 'vs previous 30d',
              }
            : undefined
        }
      />

      {/* 2. Normal Scans */}
      <KpiCard
        title="Normal Findings"
        value={metrics.normalScans}
        subtitle={`${metrics.normalRate}% clear renal parenchyma (${metrics.normalScans} of ${metrics.totalScans})`}
        icon={ShieldCheck}
        iconColor="text-emerald-600"
        iconBg="bg-emerald-50"
        highlightColor="emerald"
        trend={
          metrics.normalScans > 0
            ? {
                value: `${metrics.normalAverageConfidence}% avg`,
                isPositive: true,
              }
            : undefined
        }
      />

      {/* 3. Pathology Findings (Stones, Cysts, Tumors) */}
      <KpiCard
        title="Pathology Findings"
        value={metrics.pathologyDetections}
        subtitle={`${metrics.pathologyRate}% detected: ${metrics.stoneScans} stones • ${metrics.cystScans} cysts • ${metrics.tumorScans} tumors`}
        icon={AlertCircle}
        iconColor="text-rose-600"
        iconBg="bg-rose-50"
        highlightColor="rose"
        trend={
          metrics.pathologyDetections > 0
            ? {
                value: `${metrics.stoneScans}s / ${metrics.cystScans}c / ${metrics.tumorScans}t`,
                isNeutral: true,
                label: '4-class triage',
              }
            : undefined
        }
      />


      {/* 4. Mean AI Confidence */}
      <KpiCard
        title="Mean AI Confidence"
        value={`${metrics.averageConfidence}%`}
        subtitle={`${metrics.pendingReviewCount} case(s) queued for clinician review`}
        icon={Sparkles}
        iconColor="text-blue-600"
        iconBg="bg-blue-50"
        highlightColor="blue"
        trend={
          metrics.totalScans > 0
            ? {
                value: `+${metrics.confidenceDeltaPct}%`,
                isPositive: true,
                label: 'Model calibration',
              }
            : undefined
        }
      />
    </div>
  );
};
