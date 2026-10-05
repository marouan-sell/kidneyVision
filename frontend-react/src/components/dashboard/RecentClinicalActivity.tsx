import React, { useState, useMemo } from 'react';
import type { Diagnosis, RiskLevel, ScanRecord } from '../../types/scan';
import {
  Search,
  Filter,
  Eye,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ChevronLeft,
  ChevronRight,
  FileDown,
  Activity,
  AlertOctagon,
  XCircle,
  CheckCircle2,
} from 'lucide-react';
import { generateScanPdfReport } from '../../utils/generateScanPdfReport';

interface RecentClinicalActivityProps {
  scans: ScanRecord[];
  onSelectScan: (scan: ScanRecord) => void;
  selectedDiagnosis: Diagnosis | 'all';
  onFilterDiagnosis: (diagnosis: Diagnosis | 'all') => void;
}

export const RecentClinicalActivity: React.FC<RecentClinicalActivityProps> = ({
  scans,
  onSelectScan,
  selectedDiagnosis,
  onFilterDiagnosis,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  // Filtered scans
  const filteredScans = useMemo(() => {
    return scans.filter((scan) => {
      // Search match
      const query = searchQuery.trim().toLowerCase();
      const matchSearch =
        !query ||
        scan.id.toLowerCase().includes(query) ||
        scan.patientAlias.toLowerCase().includes(query) ||
        scan.formattedDate.toLowerCase().includes(query);

      // Diagnosis filter
      const matchDiagnosis =
        selectedDiagnosis === 'all' || scan.diagnosis === selectedDiagnosis;

      // Risk filter
      const matchRisk = riskFilter === 'all' || scan.riskLevel === riskFilter;

      return matchSearch && matchDiagnosis && matchRisk;
    });
  }, [scans, searchQuery, selectedDiagnosis, riskFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredScans.length / itemsPerPage) || 1;
  const paginatedScans = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredScans.slice(start, start + itemsPerPage);
  }, [filteredScans, currentPage]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col overflow-hidden">
      {/* Table Header & Controls */}
      <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Recent Clinical Activity</h3>
            <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 text-xs font-semibold">
              {filteredScans.length} Scans
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time ultrasound inference queue & decision-support audit log
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search ID or alias..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
            />
          </div>

          {/* Diagnosis Filter */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedDiagnosis}
              onChange={(e) => {
                onFilterDiagnosis(e.target.value as Diagnosis | 'all');
                setCurrentPage(1);
              }}
              className="bg-transparent text-xs text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">All Diagnoses</option>
              <option value="normal">Normal</option>
              <option value="nephrolithiasis">Nephrolithiasis (Stone)</option>
              <option value="cyst">Renal Cyst</option>
              <option value="tumor">Renal Tumor</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected / Non-Kidney</option>
            </select>
          </div>

          {/* Risk Filter */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1">
            <select
              value={riskFilter}
              onChange={(e) => {
                setRiskFilter(e.target.value as RiskLevel | 'all');
                setCurrentPage(1);
              }}
              className="bg-transparent text-xs text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">All Risk Levels</option>
              <option value="low">Low Risk</option>
              <option value="elevated">Elevated</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Content (Horizontally scrollable on small screens) */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
              <th className="py-3 px-4">Scan ID</th>
              <th className="py-3 px-4">Patient Alias</th>
              <th className="py-3 px-4">Date / Time</th>
              <th className="py-3 px-4">Laterality</th>
              <th className="py-3 px-4">AI Result</th>
              <th className="py-3 px-4">Confidence</th>
              <th className="py-3 px-4">Risk Level</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {paginatedScans.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-400">
                  No scan records matching the selected criteria.
                </td>
              </tr>
            ) : (
              paginatedScans.map((scan) => {
                const isNormal = scan.diagnosis === 'normal';
                const isStone = scan.diagnosis === 'nephrolithiasis';
                const isCyst = scan.diagnosis === 'cyst';
                const isTumor = scan.diagnosis === 'tumor';
                const isPending = scan.diagnosis === 'pending';
                const isRejected = scan.diagnosis === 'rejected';

                return (
                  <tr
                    key={scan.id}
                    onClick={() => onSelectScan(scan)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    {/* Scan ID */}
                    <td className="py-3 px-4 font-mono font-medium text-slate-900 group-hover:text-sky-600 transition-colors">
                      {scan.id}
                    </td>

                    {/* Patient Alias */}
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {scan.patientAlias}
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {scan.formattedDate}
                    </td>

                    {/* Laterality */}
                    <td className="py-3 px-4 capitalize">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                        {scan.laterality}
                      </span>
                    </td>

                    {/* AI Result */}
                    <td className="py-3 px-4">
                      {isRejected && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                          <XCircle className="w-3 h-3 text-red-500" />
                          Rejected / Non-Kidney
                        </span>
                      )}
                      {isNormal && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          <ShieldCheck className="w-3 h-3" />
                          Normal
                        </span>
                      )}
                      {isStone && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
                          <AlertTriangle className="w-3 h-3" />
                          Stone Detected
                        </span>
                      )}
                      {isCyst && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200/60">
                          <Activity className="w-3 h-3" />
                          Renal Cyst
                        </span>
                      )}
                      {isTumor && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/60">
                          <AlertOctagon className="w-3 h-3" />
                          Tumor Alert
                        </span>
                      )}
                      {isPending && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
                          <Clock className="w-3 h-3" />
                          Pending Review
                        </span>
                      )}
                    </td>

                    {/* AI Confidence */}
                    <td className="py-3 px-4">
                      {scan.confidence !== null ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full ${
                                isNormal
                                  ? 'bg-emerald-500'
                                  : isStone
                                  ? 'bg-rose-500'
                                  : isCyst
                                  ? 'bg-teal-500'
                                  : 'bg-purple-500'
                              }`}
                              style={{ width: `${scan.confidence}%` }}
                            />
                          </div>
                          <span className="font-mono text-slate-800 font-medium">
                            {scan.confidence}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">—</span>
                      )}
                    </td>

                    {/* Risk */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                          scan.riskLevel === 'low'
                            ? 'bg-emerald-100 text-emerald-800'
                            : scan.riskLevel === 'elevated'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {scan.riskLevel}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      {scan.status === 'flagged' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertOctagon className="w-3 h-3 text-rose-500" />
                          <span>Flagged</span>
                        </span>
                      ) : scan.status === 'under_review' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-500" />
                          <span>Under Review</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span>Confirmed</span>
                        </span>
                      )}
                    </td>

                    {/* Action: Download PDF Report */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            generateScanPdfReport(scan);
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 hover:text-sky-800 border border-sky-200/80 shadow-2xs transition-all active:scale-95 cursor-pointer"
                          title={`Download PDF Report for ${scan.patientAlias} (${scan.id})`}
                        >
                          <FileDown className="w-3.5 h-3.5 text-sky-600" />
                          <span>Download PDF</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
        <div>
          Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
          {Math.min(currentPage * itemsPerPage, filteredScans.length)} of {filteredScans.length}{' '}
          entries
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 font-medium text-slate-700">
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
