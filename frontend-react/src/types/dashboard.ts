import type { Diagnosis, RiskLevel } from './scan';

export type DateRangeOption = '7D' | '30D' | '90D' | '1Y' | 'ALL';

export type NavTab = 
  | 'dashboard'
  | 'analysis'
  | 'history'
  | 'reports'
  | 'settings'
  | 'help';

export interface DashboardFilterState {
  dateRange: DateRangeOption;
  searchQuery: string;
  diagnosisFilter: Diagnosis | 'all';
  riskFilter: RiskLevel | 'all';
}

/**
 * Dashboard & Clinical Analytics Statistics Types
 */
export interface DashboardStats {
  totalScans: number;
  normalCount: number;
  stoneCount: number;
  cystCount?: number;
  tumorCount?: number;
  anomalyRate: number; // in %
  pendingReviews: number;
  accuracyRate: number; // in %
  currentMonthCount: number;
  lastMonthCount: number;
  monthGrowthPercentage: number | null;
  scansByMonth: {
    month: string;
    total: number;
    anomalies: number;
    normals: number;
  }[];
  conditionDistribution: {
    name: string;
    value: number;
    color: string;
  }[];
  cystDistribution: {
    name: string;
    value: number;
    color: string;
  }[];
}
