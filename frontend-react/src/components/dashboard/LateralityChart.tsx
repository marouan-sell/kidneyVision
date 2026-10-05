import React from 'react';
import type { LateralityDistributionPoint } from '../../types/analytics';
import { Compass, Split } from 'lucide-react';

interface LateralityChartProps {
  distribution: LateralityDistributionPoint[];
  totalScans: number;
}

export const LateralityChart: React.FC<LateralityChartProps> = ({
  distribution,
  totalScans,
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-sky-50 text-sky-700">
            <Compass className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Anatomical Sweep Laterality</h3>
            <p className="text-xs text-slate-500">Distribution of ultrasound acoustic windows</p>
          </div>
        </div>
      </div>

      {/* Visual Laterality Cards */}
      <div className="grid grid-cols-3 gap-2.5 my-3">
        {distribution.map((item) => {
          const isLeft = item.laterality === 'left';
          const isRight = item.laterality === 'right';

          return (
            <div
              key={item.laterality}
              className="bg-slate-50/80 hover:bg-slate-100/70 border border-slate-200/80 rounded-xl p-3 flex flex-col items-center text-center transition-colors"
            >
              {/* Visual Kidney representation */}
              <div className="w-10 h-10 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs mb-2">
                {isLeft ? 'L' : isRight ? 'R' : 'BIL'}
              </div>

              <span className="text-xs font-semibold text-slate-800">{item.label}</span>
              <span className="text-lg font-bold text-slate-900 mt-0.5">{item.count}</span>
              <span className="text-[11px] text-sky-600 font-medium">{item.pct}%</span>
            </div>
          );
        })}
      </div>

      {/* Multi-segment Laterality comparison progress bar */}
      <div className="w-full">
        <div className="w-full h-2 rounded-full bg-slate-100 flex overflow-hidden">
          {distribution.map((item, idx) => {
            const colors = ['bg-sky-500', 'bg-indigo-500', 'bg-violet-400'];
            return (
              <div
                key={item.laterality}
                className={`${colors[idx % colors.length]} h-full transition-all`}
                style={{ width: `${item.pct}%` }}
                title={`${item.label}: ${item.pct}%`}
              />
            );
          })}
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5">
          <span>Left: {distribution.find((d) => d.laterality === 'left')?.pct}%</span>
          <span>Right: {distribution.find((d) => d.laterality === 'right')?.pct}%</span>
          <span>Bilateral: {distribution.find((d) => d.laterality === 'bilateral')?.pct}%</span>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <Split className="w-3 h-3 text-slate-400" />
          Balanced anatomical acquisition ratio
        </span>
        <span className="font-mono text-[10px]">{totalScans} verified sweeps</span>
      </div>
    </div>
  );
};
