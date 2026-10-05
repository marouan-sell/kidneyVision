import React, { useState } from 'react';
import type { DateRangeOption } from '../../types/dashboard';
import {
  RefreshCw,
  Plus,
} from 'lucide-react';

interface DashboardHeaderProps {
  dateRange: DateRangeOption;
  onDateRangeChange: (range: DateRangeOption) => void;
  onRefresh: () => void;
  pendingCount?: number;
  onNewScanClick: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  dateRange,
  onDateRangeChange,
  onRefresh,
  onNewScanClick,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshClick = () => {
    setIsRefreshing(true);
    onRefresh();
    setTimeout(() => setIsRefreshing(false), 700);
  };

  const dateOptions: DateRangeOption[] = ['7D', '30D', '90D', '1Y', 'ALL'];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-6 lg:px-8 py-3.5 shadow-2xs backdrop-blur-md bg-white/95">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Title & Clinical Subtitle */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-sans">
            Clinical Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Renal ultrasound analytics and AI-assisted clinical insights
          </p>
        </div>

        {/* Controls: Date range, refresh, CTA */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Date Range Selector Pills */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-medium text-slate-600">
            {dateOptions.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => onDateRangeChange(opt)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  dateRange === opt
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={handleRefreshClick}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            title="Refresh clinical metrics"
            aria-label="Refresh dashboard data"
          >
            <RefreshCw
              className={`w-4 h-4 text-slate-500 ${isRefreshing ? 'animate-spin text-sky-600' : ''}`}
            />
          </button>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={onNewScanClick}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Ultrasound Scan</span>
            <span className="sm:hidden">New Scan</span>
          </button>
        </div>
      </div>
    </header>
  );
};
