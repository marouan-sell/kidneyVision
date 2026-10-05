import React from 'react';
import { Bar } from 'react-chartjs-2';
import './chartSetup';
import type { ConfidenceBucket } from '../../types/analytics';
import { Sparkles, CheckCircle2 } from 'lucide-react';

interface ConfidenceChartProps {
  buckets: ConfidenceBucket[];
  normalAvg: number;
  stoneAvg: number;
  cystAvg?: number;
  tumorAvg?: number;
}

export const ConfidenceChart: React.FC<ConfidenceChartProps> = ({
  buckets,
  normalAvg,
  stoneAvg,
  cystAvg = 0,
  tumorAvg = 0,
}) => {
  const chartData = {
    labels: buckets.map((b) => b.range),
    datasets: [
      {
        label: 'Normal Parenchyma',
        data: buckets.map((b) => b.normalCount),
        backgroundColor: '#10B981',
        borderRadius: 4,
        barPercentage: 0.8,
        categoryPercentage: 0.8,
      },
      {
        label: 'Nephrolithiasis (Stone)',
        data: buckets.map((b) => b.stoneCount),
        backgroundColor: '#EF4444',
        borderRadius: 4,
        barPercentage: 0.8,
        categoryPercentage: 0.8,
      },
      {
        label: 'Renal Cyst',
        data: buckets.map((b) => b.cystCount),
        backgroundColor: '#0D9488',
        borderRadius: 4,
        barPercentage: 0.8,
        categoryPercentage: 0.8,
      },
      {
        label: 'Renal Tumor / Mass',
        data: buckets.map((b) => b.tumorCount),
        backgroundColor: '#8B5CF6',
        borderRadius: 4,
        barPercentage: 0.8,
        categoryPercentage: 0.8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          boxWidth: 8,
          boxHeight: 8,
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 10,
          font: { size: 10, weight: 500 },
        },
      },
      tooltip: {
        callbacks: {
          footer: (items: any[]) => {
            const sum = items.reduce((acc, curr) => acc + (curr.parsed.y || 0), 0);
            return `Total Scans in bracket: ${sum}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11, weight: 500 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: '#F1F5F9' },
        ticks: { stepSize: 5, font: { size: 10 } },
      },
    },
  };

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
              <Sparkles className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-slate-900">
              AI Confidence Distribution & Calibration
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Model confidence spread across 4 diagnostic cohorts (85% decision baseline)
          </p>
        </div>

        {/* Statistical Averages Badge */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
          <div className="px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200/60 text-emerald-800 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Normal: {normalAvg}%</span>
          </div>
          <div className="px-2 py-0.5 rounded-lg bg-rose-50 border border-rose-200/60 text-rose-800 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            <span>Stone: {stoneAvg}%</span>
          </div>
          {cystAvg > 0 && (
            <div className="px-2 py-0.5 rounded-lg bg-teal-50 border border-teal-200/60 text-teal-800 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
              <span>Cyst: {cystAvg}%</span>
            </div>
          )}
          {tumorAvg > 0 && (
            <div className="px-2 py-0.5 rounded-lg bg-purple-50 border border-purple-200/60 text-purple-800 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
              <span>Tumor: {tumorAvg}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-64 mt-4">
        <Bar data={chartData} options={options} />
      </div>

      {/* Footer Notes */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1 text-[11px] text-slate-400">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          High density (&gt;95%) confirms robust feature extraction on renal poles
        </span>
        <span className="text-[11px] font-mono text-slate-400">softmax ceiling</span>
      </div>
    </div>
  );
};
