/**
 * Clinical Kidney Analysis Types
 */

export enum DiagnosisResult {
  NORMAL_FINDINGS = "Normal findings",
  STONE = "Kidney Stone",
  CYST = "Renal Cyst",
  TUMOR = "Renal Tumor",
  ANOMALY_DETECTED = "Anomaly Detected",
  REVIEW_REQUIRED = "Review Required",
  ANALYZING = "Analyzing...",
  REJECTED = "Scan Rejected"
}

export interface KidneyAnalysis {
  id: string; // e.g., PT-2024-8841
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: "Male" | "Female" | "Other";
  createdAt: string; // ISO String
  diagnosis: DiagnosisResult;
  confidence: number; // e.g., 94
  imageUrl: string;
  heatmapUrl?: string; // Grad-CAM overlay
  peakCoordinates?: { x: number; y: number };
  dimensions?: {
    length: number; // in mm
    width: number; // in mm
    volume: number; // in cm3
  };
  location?: "Left Kidney" | "Right Kidney" | "Unspecified";
  pathologyFinding?: "Kidney Stone" | "Normal Renal Parenchyma" | "Renal Cyst" | "Renal Tumor" | string;
  prediction?: "Normal" | "Stone" | "Cyst" | "Tumor" | string;
  cystType?: string; // Backwards-compatible alias for pathologyFinding

  isUncertain?: boolean;
  recommendation: string;
  clinicianNotes?: string;
  isDraft?: boolean;
  status?: string;
  statusLabel?: string;
  statusColor?: string;
  confirmedAt?: string;
  confirmedBy?: number;
  confirmedByName?: string;
  flaggedFor?: string;
  flaggedAt?: string;
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
