import React from 'react';
import { Bar } from 'react-chartjs-2';
import './chartSetup';
import type { AgeCohortPoint } from '../../types/analytics';
import { Users2 } from 'lucide-react';

interface DemographicsChartProps {
  cohorts: AgeCohortPoint[];
}

export const DemographicsChart: React.FC<DemographicsChartProps> = ({ cohorts }) => {
  const chartData = {
    labels: cohorts.map((c) => `${c.range} yrs`),
    datasets: [
      {
        label: 'Normal Parenchyma',
        data: cohorts.map((c) => c.normal),
        backgroundColor: '#10B981',
        borderRadius: 3,
        barPercentage: 0.8,
        categoryPercentage: 0.8,
      },
      {
        label: 'Nephrolithiasis',
        data: cohorts.map((c) => c.stone),
        backgroundColor: '#EF4444',
        borderRadius: 3,
        barPercentage: 0.8,
        categoryPercentage: 0.8,
      },
      {
        label: 'Renal Cyst',
        data: cohorts.map((c) => c.cyst ?? 0),
        backgroundColor: '#0D9488',
        borderRadius: 3,
        barPercentage: 0.8,
        categoryPercentage: 0.8,
      },
      {
        label: 'Renal Tumor / Mass',
        data: cohorts.map((c) => c.tumor ?? 0),
        backgroundColor: '#8B5CF6',
        borderRadius: 3,
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
          font: { size: 10 },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: '#F1F5F9' },
        ticks: { stepSize: 2, font: { size: 10 } },
      },
    },
  };

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
            <Users2 className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Patient Demographic Cohorts</h3>
            <p className="text-xs text-slate-500">Synthetic age cohort distribution across all 4 diagnostic classes</p>
          </div>
        </div>
      </div>

      <div className="w-full h-48 mt-3">
        <Bar data={chartData} options={options} />
      </div>

      <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400">
        Descriptive epidemiological sample breakdown (de-identified demo)
      </div>
    </div>
  );
};
