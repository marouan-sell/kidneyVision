export type Diagnosis = 'normal' | 'nephrolithiasis' | 'cyst' | 'tumor' | 'pending' | 'rejected';

export type RiskLevel = 'low' | 'elevated' | 'urgent';

export type Laterality = 'left' | 'right' | 'bilateral';

export type ScanStatus = 'reviewed' | 'under_review' | 'flagged' | 'pending';

export interface ScanRecord {
  id: string; // e.g. "KV-DEMO-001"
  patientAlias: string; // e.g. "Patient A", "Patient B" (never real patient names)
  date: string; // ISO date "2026-09-21"
  formattedDate: string; // "Sep 21, 2026"
  laterality: Laterality;
  diagnosis: Diagnosis;
  confidence: number | null; // e.g. 99.2 for AI analyzed, null for pending
  riskLevel: RiskLevel;
  status: ScanStatus;
  patientAge: number;
  patientSex: 'male' | 'female';
  kidneyPole?: 'upper' | 'mid' | 'lower' | 'pelvicalyceal';
  stoneSizeMm?: number;
  hasGradCam: boolean;
  notes?: string;
  confirmedAt?: string;
  confirmedByName?: string;
  flaggedFor?: string;
  flaggedAt?: string;
  pathologyTitle?: string;
  classProbabilities?: Record<string, number>;
  clinicalAssessment?: {
    estimated_diameter_mm?: number;
    severity?: string;
    urgency?: string;
    recommendation?: string;
  };
  gateEvaluation?: {
    gate_passed?: boolean;
    kidney_confidence_percent?: number;
    non_kidney_probability_percent?: number;
  };
  visualizationUrl?: string;
  cleanedScanUrl?: string;
  imageUrl?: string;
  heatmapUrl?: string;
  primaryDiagnosis?: string;
  modelVersion?: string;
  telemetry?: {
    auto_masking?: {
      artifacts_count?: number;
      mask_pixel_ratio?: number;
      rotation_corrected?: boolean;
    };
    classes_evaluated?: string[];
    device?: string;
  };
}
