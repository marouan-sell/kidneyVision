import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import './chartSetup';
import type { RiskDistributionPoint } from '../../types/analytics';
import { AlertOctagon, ShieldAlert } from 'lucide-react';

interface RiskDistributionProps {
  distribution: RiskDistributionPoint[];
  totalScans: number;
}

export const RiskDistribution: React.FC<RiskDistributionProps> = ({
  distribution,
  totalScans,
}) => {
  const chartData = {
    labels: distribution.map((d) => d.label),
    datasets: [
      {
        data: distribution.map((d) => d.count),
        backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
        borderWidth: 2,
        borderColor: '#FFFFFF',
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const count = context.parsed;
            const pct = ((count / (totalScans || 1)) * 100).toFixed(1);
            return ` ${context.label}: ${count} cases (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-rose-50 text-rose-700">
            <ShieldAlert className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Clinical Triage Risk Stratification</h3>
            <p className="text-xs text-slate-500">Based on calculus size, position & obstruction</p>
          </div>
        </div>
      </div>

      {/* Doughnut Chart + Legend */}
      <div className="flex flex-col sm:flex-row items-center gap-4 my-3">
        {/* Doughnut with center stat */}
        <div className="relative w-36 h-36 flex-shrink-0 flex items-center justify-center">
          <Doughnut data={chartData} options={options} />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-bold text-slate-900">{totalScans}</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Assessed
            </span>
          </div>
        </div>

        {/* Legend List */}
        <div className="flex-1 w-full space-y-2.5">
          {distribution.map((item) => {
            const colorClass =
              item.level === 'low'
                ? 'bg-emerald-500'
                : item.level === 'elevated'
                ? 'bg-amber-500'
                : 'bg-rose-500';

            const bgClass =
              item.level === 'low'
                ? 'bg-emerald-50 border-emerald-100'
                : item.level === 'elevated'
                ? 'bg-amber-50 border-amber-100'
                : 'bg-rose-50 border-rose-100';

            return (
              <div
                key={item.level}
                className={`flex items-center justify-between p-2 rounded-xl border ${bgClass}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${colorClass}`}></span>
                  <span className="text-xs font-semibold text-slate-800">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">{item.count}</span>
                  <span className="text-[11px] text-slate-500 font-mono">({item.pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Note */}
      <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-400">
        <AlertOctagon className="w-3.5 h-3.5 text-amber-500" />
        <span>Urgent cases trigger immediate clinician review notifications</span>
      </div>
    </div>
  );
};
