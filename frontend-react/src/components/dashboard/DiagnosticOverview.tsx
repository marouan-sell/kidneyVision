import React from 'react';
import { ShieldCheck, AlertTriangle, Clock, Activity, ArrowRight, CircleDot, AlertOctagon } from 'lucide-react';
import type { DashboardMetrics, DiagnosticDistributionPoint } from '../../types/analytics';
import type { Diagnosis } from '../../types/scan';

interface DiagnosticOverviewProps {
  metrics: DashboardMetrics;
  distribution: DiagnosticDistributionPoint[];
  selectedDiagnosis: Diagnosis | 'all';
  onSelectDiagnosis: (diagnosis: Diagnosis | 'all') => void;
}

export const DiagnosticOverview: React.FC<DiagnosticOverviewProps> = ({
  metrics,
  distribution: _distribution,
  selectedDiagnosis,
  onSelectDiagnosis,
}) => {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between h-full">
      {/* Card Header */}
      <div>
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-sky-50 text-sky-700">
                <Activity className="w-3.5 h-3.5" />
              </span>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                4-Class Diagnostic Breakdown & Prevalence
              </h2>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              AI decision-support prevalence across {metrics.totalScans} verified ultrasound scans
            </p>
          </div>

          <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono">
            ConvNeXt-Tiny (4-Class) + Gatekeeper
          </span>
        </div>

        {/* Visual Multi-segment Progress Bar */}
        <div className="mt-2.5">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-600 mb-1">
            <span>Diagnostic Distribution</span>
            <span className="text-slate-400 font-mono text-[10px]">
              {metrics.totalScans} Total Cases
            </span>
          </div>

          <div className="w-full h-2.5 rounded-full bg-slate-100 flex overflow-hidden p-0.5 gap-0.5">
            {/* Normal Bar */}
            {metrics.normalScans > 0 && (
              <div
                className="h-full rounded-l-full bg-emerald-500 transition-all duration-500 cursor-pointer hover:opacity-90"
                style={{ width: `${metrics.normalRate}%` }}
                onClick={() => onSelectDiagnosis(selectedDiagnosis === 'normal' ? 'all' : 'normal')}
                title={`Normal: ${metrics.normalScans} (${metrics.normalRate}%)`}
              />
            )}
            {/* Nephrolithiasis Bar */}
            {metrics.stoneScans > 0 && (
              <div
                className="h-full bg-rose-500 transition-all duration-500 cursor-pointer hover:opacity-90"
                style={{ width: `${metrics.stonePositivityRate}%` }}
                onClick={() =>
                  onSelectDiagnosis(selectedDiagnosis === 'nephrolithiasis' ? 'all' : 'nephrolithiasis')
                }
                title={`Nephrolithiasis: ${metrics.stoneScans} (${metrics.stonePositivityRate}%)`}
              />
            )}
            {/* Cyst Bar */}
            {metrics.cystScans > 0 && (
              <div
                className="h-full bg-teal-500 transition-all duration-500 cursor-pointer hover:opacity-90"
                style={{ width: `${metrics.cystRate}%` }}
                onClick={() => onSelectDiagnosis(selectedDiagnosis === 'cyst' ? 'all' : 'cyst')}
                title={`Renal Cyst: ${metrics.cystScans} (${metrics.cystRate}%)`}
              />
            )}
            {/* Tumor Bar */}
            {metrics.tumorScans > 0 && (
              <div
                className="h-full bg-purple-600 transition-all duration-500 cursor-pointer hover:opacity-90"
                style={{ width: `${metrics.tumorRate}%` }}
                onClick={() => onSelectDiagnosis(selectedDiagnosis === 'tumor' ? 'all' : 'tumor')}
                title={`Renal Tumor / Mass: ${metrics.tumorScans} (${metrics.tumorRate}%)`}
              />
            )}
            {/* Pending Bar */}
            {metrics.pendingScans > 0 && (
              <div
                className="h-full rounded-r-full bg-amber-400 transition-all duration-500 cursor-pointer hover:opacity-90"
                style={{ width: `${metrics.pendingRate}%` }}
                onClick={() => onSelectDiagnosis(selectedDiagnosis === 'pending' ? 'all' : 'pending')}
                title={`Pending Review: ${metrics.pendingScans} (${metrics.pendingRate}%)`}
              />
            )}
            {/* Rejected Bar */}
            {metrics.rejectedScans > 0 && (
              <div
                className="h-full rounded-r-full bg-slate-400 transition-all duration-500 cursor-pointer hover:opacity-90"
                style={{ width: `${metrics.rejectedRate}%` }}
                onClick={() => onSelectDiagnosis(selectedDiagnosis === 'rejected' ? 'all' : 'rejected')}
                title={`Rejected (Non-Ultrasound): ${metrics.rejectedScans} (${metrics.rejectedRate}%)`}
              />
            )}
          </div>

          {/* Legend row */}
          <div className="flex flex-wrap items-center justify-between gap-y-1 gap-x-2 mt-1.5 text-[10px] text-slate-500">
            <span className="flex items-center gap-1 cursor-pointer" onClick={() => onSelectDiagnosis(selectedDiagnosis === 'normal' ? 'all' : 'normal')}>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Normal ({metrics.normalRate}%)
            </span>
            <span className="flex items-center gap-1 cursor-pointer" onClick={() => onSelectDiagnosis(selectedDiagnosis === 'nephrolithiasis' ? 'all' : 'nephrolithiasis')}>
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              Stone ({metrics.stonePositivityRate}%)
            </span>
            <span className="flex items-center gap-1 cursor-pointer" onClick={() => onSelectDiagnosis(selectedDiagnosis === 'cyst' ? 'all' : 'cyst')}>
              <span className="w-2 h-2 rounded-full bg-teal-500"></span>
              Cyst ({metrics.cystRate}%)
            </span>
            <span className="flex items-center gap-1 cursor-pointer" onClick={() => onSelectDiagnosis(selectedDiagnosis === 'tumor' ? 'all' : 'tumor')}>
              <span className="w-2 h-2 rounded-full bg-purple-600"></span>
              Tumor ({metrics.tumorRate}%)
            </span>
            <span className="flex items-center gap-1 cursor-pointer" onClick={() => onSelectDiagnosis(selectedDiagnosis === 'pending' ? 'all' : 'pending')}>
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              Pending ({metrics.pendingRate}%)
            </span>
            {metrics.rejectedScans > 0 && (
              <span className="flex items-center gap-1 cursor-pointer" onClick={() => onSelectDiagnosis(selectedDiagnosis === 'rejected' ? 'all' : 'rejected')}>
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                Rejected ({metrics.rejectedRate}%)
              </span>
            )}
          </div>
        </div>

        {/* 5 Cohesive Clinical Cards: 4 Classes + Pending */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mt-3">
          {/* 1. Normal Card */}
          <button
            type="button"
            onClick={() => onSelectDiagnosis(selectedDiagnosis === 'normal' ? 'all' : 'normal')}
            className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
              selectedDiagnosis === 'normal'
                ? 'bg-emerald-50/90 border-emerald-400 ring-2 ring-emerald-200'
                : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/70'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="p-1 rounded-md bg-emerald-100 text-emerald-700">
                <ShieldCheck className="w-3.5 h-3.5" />
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Low Risk
              </span>
            </div>
            <div className="mt-1.5">
              <span className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {metrics.normalScans}
              </span>
              <p className="text-[11px] font-semibold text-slate-700 mt-0.5 truncate">Normal</p>
              <p className="text-[10px] text-emerald-700 font-medium mt-0.5">
                {metrics.normalAverageConfidence}% mean conf
              </p>
            </div>
          </button>

          {/* 2. Nephrolithiasis Card */}
          <button
            type="button"
            onClick={() =>
              onSelectDiagnosis(selectedDiagnosis === 'nephrolithiasis' ? 'all' : 'nephrolithiasis')
            }
            className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
              selectedDiagnosis === 'nephrolithiasis'
                ? 'bg-rose-50/90 border-rose-400 ring-2 ring-rose-200'
                : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/70'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="p-1 rounded-md bg-rose-100 text-rose-700">
                <AlertTriangle className="w-3.5 h-3.5" />
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                Calculus
              </span>
            </div>
            <div className="mt-1.5">
              <span className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {metrics.stoneScans}
              </span>
              <p className="text-[11px] font-semibold text-slate-700 mt-0.5 truncate">Kidney Stone</p>
              <p className="text-[10px] text-rose-700 font-medium mt-0.5">
                {metrics.stoneAverageConfidence}% mean conf
              </p>
            </div>
          </button>

          {/* 3. Renal Cyst Card */}
          <button
            type="button"
            onClick={() => onSelectDiagnosis(selectedDiagnosis === 'cyst' ? 'all' : 'cyst')}
            className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
              selectedDiagnosis === 'cyst'
                ? 'bg-teal-50/90 border-teal-400 ring-2 ring-teal-200'
                : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/70'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="p-1 rounded-md bg-teal-100 text-teal-700">
                <CircleDot className="w-3.5 h-3.5" />
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-teal-100 text-teal-800">
                Benign Cyst
              </span>
            </div>
            <div className="mt-1.5">
              <span className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {metrics.cystScans}
              </span>
              <p className="text-[11px] font-semibold text-slate-700 mt-0.5 truncate">Renal Cyst</p>
              <p className="text-[10px] text-teal-700 font-medium mt-0.5">
                {metrics.cystAverageConfidence}% mean conf
              </p>
            </div>
          </button>

          {/* 4. Renal Tumor Card */}
          <button
            type="button"
            onClick={() => onSelectDiagnosis(selectedDiagnosis === 'tumor' ? 'all' : 'tumor')}
            className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
              selectedDiagnosis === 'tumor'
                ? 'bg-purple-50/90 border-purple-400 ring-2 ring-purple-200'
                : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/70'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="p-1 rounded-md bg-purple-100 text-purple-700">
                <AlertOctagon className="w-3.5 h-3.5" />
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">
                Urgent Mass
              </span>
            </div>
            <div className="mt-1.5">
              <span className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {metrics.tumorScans}
              </span>
              <p className="text-[11px] font-semibold text-slate-700 mt-0.5 truncate">Renal Tumor</p>
              <p className="text-[10px] text-purple-700 font-medium mt-0.5">
                {metrics.tumorAverageConfidence}% mean conf
              </p>
            </div>
          </button>

          {/* 5. Pending Review Card */}
          <button
            type="button"
            onClick={() => onSelectDiagnosis(selectedDiagnosis === 'pending' ? 'all' : 'pending')}
            className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer col-span-2 sm:col-span-1 ${
              selectedDiagnosis === 'pending'
                ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-200'
                : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/70'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="p-1 rounded-md bg-amber-100 text-amber-700">
                <Clock className="w-3.5 h-3.5" />
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                Triage
              </span>
            </div>
            <div className="mt-1.5">
              <span className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {metrics.pendingScans}
              </span>
              <p className="text-[11px] font-semibold text-slate-700 mt-0.5 truncate">Pending Review</p>
              <p className="text-[10px] text-amber-700 font-medium mt-0.5">Under Triage</p>
            </div>
          </button>
        </div>
      </div>

      {/* Card Footer */}
      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="text-[10px] text-slate-400">
          Inferences verified with Gatekeeper & ConvNeXt 4-Class SOTA
        </span>
        {selectedDiagnosis !== 'all' && (
          <button
            type="button"
            onClick={() => onSelectDiagnosis('all')}
            className="text-[11px] text-sky-600 font-medium hover:underline flex items-center gap-1 cursor-pointer"
          >
            Reset filter ({selectedDiagnosis}) <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};

