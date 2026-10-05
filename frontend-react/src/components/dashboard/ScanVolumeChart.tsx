import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import './chartSetup';
import type { TimelineDataPoint } from '../../types/analytics';
import { Calendar, TrendingUp } from 'lucide-react';

interface ScanVolumeChartProps {
  data: TimelineDataPoint[];
}

export const ScanVolumeChart: React.FC<ScanVolumeChartProps> = ({ data }) => {
  const [viewFilter, setViewFilter] = useState<'all' | 'normal' | 'stone' | 'cyst' | 'tumor'>('all');

  const labels = data.map((d) => d.formattedDate);

  const datasets = [];

  if (viewFilter === 'all' || viewFilter === 'normal') {
    datasets.push({
      label: 'Normal Parenchyma',
      data: data.map((d) => d.normal),
      borderColor: '#10B981',
      backgroundColor: 'rgba(16, 185, 129, 0.08)',
      tension: 0.35,
      fill: true,
      pointRadius: 3,
      pointHoverRadius: 6,
      pointBackgroundColor: '#10B981',
      pointBorderColor: '#FFFFFF',
      pointBorderWidth: 2,
    });
  }

  if (viewFilter === 'all' || viewFilter === 'stone') {
    datasets.push({
      label: 'Nephrolithiasis (Stone)',
      data: data.map((d) => d.stone),
      borderColor: '#EF4444',
      backgroundColor: 'rgba(239, 68, 68, 0.08)',
      tension: 0.35,
      fill: true,
      pointRadius: 3,
      pointHoverRadius: 6,
      pointBackgroundColor: '#EF4444',
      pointBorderColor: '#FFFFFF',
      pointBorderWidth: 2,
    });
  }

  if (viewFilter === 'all' || viewFilter === 'cyst') {
    datasets.push({
      label: 'Renal Cyst',
      data: data.map((d) => d.cyst),
      borderColor: '#0D9488',
      backgroundColor: 'rgba(13, 148, 136, 0.08)',
      tension: 0.35,
      fill: true,
      pointRadius: 3,
      pointHoverRadius: 6,
      pointBackgroundColor: '#0D9488',
      pointBorderColor: '#FFFFFF',
      pointBorderWidth: 2,
    });
  }

  if (viewFilter === 'all' || viewFilter === 'tumor') {
    datasets.push({
      label: 'Suspicious Neoplasm / Tumor',
      data: data.map((d) => d.tumor),
      borderColor: '#8B5CF6',
      backgroundColor: 'rgba(139, 92, 246, 0.08)',
      tension: 0.35,
      fill: true,
      pointRadius: 3,
      pointHoverRadius: 6,
      pointBackgroundColor: '#8B5CF6',
      pointBorderColor: '#FFFFFF',
      pointBorderWidth: 2,
    });
  }

  const chartData = {
    labels,
    datasets,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          boxWidth: 8,
          boxHeight: 8,
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 12,
          font: {
            size: 10,
            weight: 500,
          },
        },
      },
      tooltip: {
        callbacks: {
          footer: (items: any[]) => {
            const sum = items.reduce((acc, curr) => acc + (curr.parsed.y || 0), 0);
            return `Total Scans: ${sum}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: { size: 10 },
          maxRotation: 0,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: '#F1F5F9',
        },
        ticks: {
          stepSize: 2,
          font: { size: 10 },
        },
      },
    },
  };

  const totalScansCount = data.reduce((acc, d) => acc + (d.total || 0), 0);

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
      {/* Card Header with View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-sky-50 text-sky-700">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-slate-900">
              Diagnostic Scan Workload & Triage Trends
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Temporal cadence across 4-class multi-pathology ultrasound sweeps
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              viewFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Classes
          </button>
          <button
            type="button"
            onClick={() => setViewFilter('normal')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              viewFilter === 'normal'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Normal
          </button>
          <button
            type="button"
            onClick={() => setViewFilter('stone')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              viewFilter === 'stone'
                ? 'bg-white text-rose-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Stone
          </button>
          <button
            type="button"
            onClick={() => setViewFilter('cyst')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              viewFilter === 'cyst'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cyst
          </button>
          <button
            type="button"
            onClick={() => setViewFilter('tumor')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              viewFilter === 'tumor'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tumor
          </button>
        </div>
      </div>

      {/* Canvas container */}
      <div className="w-full h-64 mt-4">
        <Line data={chartData} options={options} />
      </div>

      {/* Footer Insight */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          Synchronized ultrasound acquisition cadence
        </span>
        <span className="text-[11px] text-slate-400 font-mono">
          Archive: {totalScansCount} scans
        </span>
      </div>
    </div>
  );
};
