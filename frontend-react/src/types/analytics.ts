import type { Diagnosis, Laterality, RiskLevel } from './scan';

export interface DashboardMetrics {
  totalScans: number;
  normalScans: number;
  stoneScans: number;
  cystScans: number;
  tumorScans: number;
  pendingScans: number;
  rejectedScans: number;
  pathologyDetections: number;
  averageConfidence: number;
  normalAverageConfidence: number;
  stoneAverageConfidence: number;
  cystAverageConfidence: number;
  tumorAverageConfidence: number;
  stonePositivityRate: number;
  normalRate: number;
  cystRate: number;
  tumorRate: number;
  pathologyRate: number;
  pendingRate: number;
  rejectedRate: number;
  scansDeltaPct: number;
  confidenceDeltaPct: number;
  pendingReviewCount: number;
}

export interface TimelineDataPoint {
  date: string;
  formattedDate: string;
  normal: number;
  stone: number;
  cyst: number;
  tumor: number;
  pending: number;
  rejected?: number;
  total: number;
}

export interface ConfidenceBucket {
  range: string;
  normalCount: number;
  stoneCount: number;
  cystCount: number;
  tumorCount: number;
  totalCount: number;
}

export interface RiskDistributionPoint {
  level: RiskLevel;
  label: string;
  count: number;
  pct: number;
}

export interface LateralityDistributionPoint {
  laterality: Laterality;
  label: string;
  count: number;
  pct: number;
}

export interface DiagnosticDistributionPoint {
  diagnosis: Diagnosis;
  label: string;
  count: number;
  pct: number;
}

export interface AgeCohortPoint {
  range: string;
  normal: number;
  stone: number;
  cyst?: number;
  tumor?: number;
}

