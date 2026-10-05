import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  trend?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
    label?: string;
  };
  highlightColor?: 'blue' | 'emerald' | 'rose' | 'amber';
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  iconBg,
  trend,
  highlightColor = 'blue',
}) => {
  const borderHighlight = {
    blue: 'hover:border-sky-300',
    emerald: 'hover:border-emerald-300',
    rose: 'hover:border-rose-300',
    amber: 'hover:border-amber-300',
  }[highlightColor];

  return (
    <div
      className={`relative bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group ${borderHighlight}`}
    >
      {/* Top row: Title and Icon */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        <div className={`p-2 rounded-xl ${iconBg} transition-transform group-hover:scale-105`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>

      {/* Metric Value */}
      <div className="mt-2 flex items-baseline gap-2.5">
        <span className="text-3xl font-bold tracking-tight text-slate-900 font-sans">
          {value}
        </span>

        {trend && (
          <span
            className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${
              trend.isNeutral
                ? 'bg-slate-100 text-slate-600'
                : trend.isPositive
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                : 'bg-rose-50 text-rose-700 border border-rose-200/60'
            }`}
          >
            {trend.isNeutral ? (
              <Minus className="w-3 h-3 mr-0.5" />
            ) : trend.isPositive ? (
              <ArrowUpRight className="w-3 h-3 mr-0.5" />
            ) : (
              <ArrowDownRight className="w-3 h-3 mr-0.5" />
            )}
            {trend.value}
          </span>
        )}
      </div>

      {/* Subtitle / Context */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>{subtitle}</span>
        {trend?.label && (
          <span className="text-[11px] text-slate-400 font-normal">{trend.label}</span>
        )}
      </div>
    </div>
  );
};
