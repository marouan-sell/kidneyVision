import { apiClient, fetchCsrfCookie, sanitizeImageUrl } from "./client";
import { KidneyAnalysis, DiagnosisResult } from "../types";
import { parseClinicalError } from "../utils/errorParser";

function getPathologyFinding(prediction: string | null | undefined, isFailed: boolean = false): string {
  if (isFailed) return 'Invalid / Non-Kidney Scan';
  const p = (prediction || '').toLowerCase();
  if (p === 'stone') return 'Kidney Stone';
  if (p === 'cyst') return 'Renal Cyst';
  if (p === 'tumor') return 'Renal Tumor';
  if (p === 'normal') return 'Normal Renal Parenchyma';
  return prediction ? prediction : 'Pending Review';
}

function isAnomalyPrediction(prediction: string | null | undefined): boolean {
  const p = (prediction || '').toLowerCase();
  return ['stone', 'cyst', 'tumor'].includes(p);
}

function mapToDiagnosisResult(prediction: string | null | undefined, isFailed: boolean = false, isUncertain: boolean = false): DiagnosisResult {
  if (isFailed) return DiagnosisResult.REJECTED;
  const p = (prediction || '').toLowerCase();
  if (p === 'normal') return DiagnosisResult.NORMAL_FINDINGS;
  if (isUncertain) return DiagnosisResult.REVIEW_REQUIRED;
  if (p === 'stone') return DiagnosisResult.STONE;
  if (p === 'cyst') return DiagnosisResult.CYST;
  if (p === 'tumor') return DiagnosisResult.TUMOR;
  return DiagnosisResult.NORMAL_FINDINGS;
}

/**
 * 1. POST /predict
 * Upload ultrasound scan and trigger AI prediction
 */
export async function analyzeImage(
  imageFile: File | null,
  patientData: {
    patientId?: string;
    patientName?: string;
    patientAge?: number | string;
    patientGender?: "Male" | "Female" | "Other" | string;
    location?: "Left Kidney" | "Right Kidney" | "Unspecified";
    imageUrl?: string;
    clinicianNotes?: string;
  }
): Promise<KidneyAnalysis> {
  const formData = new FormData();
  if (imageFile) {
    formData.append("image", imageFile);
  }
  if (patientData.patientId && patientData.patientId.trim()) {
    formData.append("patientId", patientData.patientId.trim());
  }
  if (patientData.patientName && patientData.patientName.trim()) {
    formData.append("patientName", patientData.patientName.trim());
  }
  if (
    patientData.patientAge !== undefined &&
    patientData.patientAge !== null &&
    patientData.patientAge !== "" &&
    !isNaN(Number(patientData.patientAge))
  ) {
    formData.append("patientAge", String(Math.floor(Number(patientData.patientAge))));
  }
  if (patientData.patientGender) {
    formData.append("patientGender", patientData.patientGender);
  }
  formData.append("location", patientData.location || "Unspecified");
  if (patientData.clinicianNotes) {
    formData.append("clinicianNotes", patientData.clinicianNotes);
  }
  if (patientData.imageUrl) {
    formData.append("sampleImageUrl", patientData.imageUrl);
  }

  try {
    const response = await apiClient.post('/predict', formData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("kv_token") || ""}`,
        "Content-Type": "multipart/form-data"
      }
    });

    if (response.status === 201 || response.status === 200) {
      const result = response.data.data;
      if (result.status === 'failed') {
        const errMsg = result.ai_response_payload?.error || "The uploaded image does not appear to be an authentic kidney CT or ultrasound scan.";
        const clinicalErr = parseClinicalError({
          response: {
            status: 422,
            data: { message: errMsg, error: errMsg, error_code: 'NON_CLINICAL_SCAN' }
          }
        });
        const err = new Error(errMsg);
        (err as any).clinicalError = clinicalErr;
        throw err;
      }

      const isNormal = (result.prediction || '').toLowerCase() === 'normal';
      const isUncertain = !isNormal && (result.status === 'review' || (result.confidence && result.confidence < 40) || Boolean(result.ai_response_payload?.is_uncertain));
      const diagnosis = mapToDiagnosisResult(result.prediction, false, isUncertain);
      const finding = getPathologyFinding(result.prediction);

      return {
        id: result.id.toString(),
        patientId: result.patient_id || patientData.patientId || `PT-${result.id}`,
        patientName: result.patient_name || patientData.patientName,
        patientAge: result.patient_age || patientData.patientAge,
        patientGender: result.patient_gender || patientData.patientGender,
        createdAt: result.created_at,
        diagnosis,
        confidence: result.confidence,
        imageUrl: sanitizeImageUrl(result.image_url),
        heatmapUrl: result.heatmap_url || result.ai_response_payload?.gradcam_image || undefined,
        peakCoordinates: result.peak_coordinates || result.ai_response_payload?.peak_coordinates || undefined,
        location: result.anatomical_location || patientData.location || "Left Kidney",
        recommendation: result.report?.summary || result.ai_response_payload?.clinical_assessment?.recommendation || "Pending review",
        clinicianNotes: result.clinician_notes || result.report?.clinician_notes || patientData.clinicianNotes,
        pathologyFinding: finding,
        prediction: result.prediction || result.ai_response_payload?.predicted_class || finding,
        cystType: finding,
        isUncertain,
        status: result.status,
        statusLabel: result.status_label,
        statusColor: result.status_color,
        confirmedAt: result.confirmed_at,
        confirmedBy: result.confirmed_by,
        confirmedByName: result.confirmed_by_name,
        flaggedFor: result.flagged_for,
        flaggedAt: result.flagged_at,

        classProbabilities: result.class_probabilities || result.ai_response_payload?.class_probabilities || undefined,
        clinicalAssessment: result.clinical_assessment || result.ai_response_payload?.clinical_assessment || undefined,
        gateEvaluation: result.gate_evaluation || result.ai_response_payload?.gate_evaluation || undefined,
        visualizationUrl: result.visualization_url || result.ai_response_payload?.visualization_base64 || undefined,
        cleanedScanUrl: result.cleaned_scan_url || result.ai_response_payload?.cleaned_scan_base64 || undefined,
        primaryDiagnosis: result.primary_diagnosis || result.ai_response_payload?.primary_diagnosis || undefined,
        modelVersion: result.model_version || result.ai_response_payload?.model_version || undefined,
        telemetry: result.telemetry || result.ai_response_payload?.telemetry || undefined,
      };
    }
  } catch (e: any) {
    const clinicalErr = parseClinicalError(e);
    const err = new Error(clinicalErr.message);
    (err as any).clinicalError = clinicalErr;
    throw err;
  }

  const fallbackErr = parseClinicalError(null);
  const err = new Error(fallbackErr.message);
  (err as any).clinicalError = fallbackErr;
  throw err;
}

/**
 * Alias for analyzeImage
 */
export const submitPrediction = analyzeImage;
export const createPrediction = analyzeImage;

/**
 * 2. GET /analyses
 * Fetch user scan analyses with pagination
 */
export async function getAnalyses(page: number = 1, perPage: number = 10): Promise<{ data: KidneyAnalysis[]; meta: any }> {
  try {
    const response = await apiClient.get(`/analyses?page=${page}&per_page=${perPage}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("kv_token") || ""}`
      }
    });

    if (response.status === 200) {
      const json = response.data;
      return {
        data: (json.data || []).map((item: any) => {
          const isFailed = item.status === 'failed';
          const isNormal = (item.prediction || '').toLowerCase() === 'normal';
          const isUncertain = !isNormal && (item.status === 'review' || (item.confidence && item.confidence < 40) || Boolean(item.ai_response_payload?.is_uncertain));
          const diagnosis = mapToDiagnosisResult(item.prediction, isFailed, isUncertain);

          const finding = getPathologyFinding(item.prediction, isFailed);

          return {
            id: String(item.id),
            patientId: item.patient_id || `PT-${item.id || "0000"}`,
            patientName: item.patient_name || item.original_filename || "Unknown Patient",
            patientAge: item.patient_age !== null && item.patient_age !== undefined ? Number(item.patient_age) : undefined,
            patientGender: item.patient_gender || "Unspecified",
            createdAt: item.created_at || new Date().toISOString(),
            diagnosis,
            confidence: item.confidence !== null && item.confidence !== undefined ? Number(item.confidence) : 0,
            imageUrl: sanitizeImageUrl(item.image_url),
            heatmapUrl: item.heatmap_url || item.ai_response_payload?.gradcam_image || undefined,
            peakCoordinates: item.peak_coordinates || item.ai_response_payload?.peak_coordinates || undefined,
            location: item.anatomical_location || "Left Kidney",
            recommendation: item.report?.summary || item.ai_response_payload?.clinical_assessment?.recommendation || "Pending clinical review.",
            clinicianNotes: item.clinician_notes || item.report?.clinician_notes,
            pathologyFinding: finding,
            prediction: item.prediction || item.ai_response_payload?.predicted_class || finding,
            cystType: finding,
            isUncertain,
            status: item.status,
            statusLabel: item.status_label,
            statusColor: item.status_color,
            confirmedAt: item.confirmed_at,
            confirmedBy: item.confirmed_by,
            confirmedByName: item.confirmed_by_name,
            flaggedFor: item.flagged_for,
            flaggedAt: item.flagged_at,

            classProbabilities: item.class_probabilities || item.ai_response_payload?.class_probabilities || undefined,
            clinicalAssessment: item.clinical_assessment || item.ai_response_payload?.clinical_assessment || undefined,
            gateEvaluation: item.gate_evaluation || item.ai_response_payload?.gate_evaluation || undefined,
            visualizationUrl: item.visualization_url || item.ai_response_payload?.visualization_base64 || undefined,
            cleanedScanUrl: item.cleaned_scan_url || item.ai_response_payload?.cleaned_scan_base64 || undefined,
            primaryDiagnosis: item.primary_diagnosis || item.ai_response_payload?.primary_diagnosis || undefined,
            modelVersion: item.model_version || item.ai_response_payload?.model_version || undefined,
            telemetry: item.telemetry || item.ai_response_payload?.telemetry || undefined,
          };
        }),
        meta: json.meta || { current_page: 1, last_page: 1, total: json.data?.length || 0 }
      };
    }
  } catch (e) {
    console.warn("[API Error] Fetch analyses failed", e);
  }
  return { data: [], meta: { current_page: 1, last_page: 1, total: 0 } };
}

/**
 * Alias for getAnalyses
 */
export const fetchUserAnalyses = getAnalyses;

/**
 * 3. PATCH /analyses/:id
 * Update patient metadata or clinician notes
 */
export async function updateAnalysis(
  id: string,
  data: {
    patientId?: string;
    patientName?: string;
    patientAge?: number;
    patientGender?: string;
    location?: string;
    clinicianNotes?: string;
  }
): Promise<KidneyAnalysis> {
  const cleanId = id.toString().replace(/^PT-/, "");
  const response = await apiClient.patch(`/analyses/${cleanId}`, data, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("kv_token") || ""}`
    }
  });

  if (response.status === 200 && response.data.success) {
    const result = response.data.data;
    const isFailed = result.status === 'failed';
    const isUncertain = result.status === 'review' || (result.confidence && result.confidence < 70) || result.ai_response_payload?.is_uncertain;
    const diagnosis = mapToDiagnosisResult(result.prediction, isFailed, isUncertain);

    const finding = getPathologyFinding(result.prediction, isFailed);

    return {
      id: result.id.toString(),
      patientId: result.patient_id || `PT-${result.id}`,
      patientName: result.patient_name || "Unknown Patient",
      patientAge: result.patient_age !== null && result.patient_age !== undefined ? Number(result.patient_age) : undefined,
      patientGender: result.patient_gender || "Unspecified",
      createdAt: result.created_at,
      diagnosis,
      confidence: result.confidence,
      imageUrl: sanitizeImageUrl(result.image_url),
      heatmapUrl: result.heatmap_url || result.ai_response_payload?.gradcam_image || undefined,
      peakCoordinates: result.peak_coordinates || result.ai_response_payload?.peak_coordinates || undefined,
      location: result.anatomical_location || "Left Kidney",
      recommendation: result.report?.summary || result.ai_response_payload?.clinical_assessment?.recommendation || "Pending review",
      clinicianNotes: result.clinician_notes || result.report?.clinician_notes,
      pathologyFinding: finding,
      prediction: result.prediction || result.ai_response_payload?.predicted_class || finding,
      cystType: finding,
      isUncertain,
      status: result.status,
      statusLabel: result.status_label,
      statusColor: result.status_color,
      confirmedAt: result.confirmed_at,
      confirmedBy: result.confirmed_by,
      confirmedByName: result.confirmed_by_name,
      flaggedFor: result.flagged_for,
      flaggedAt: result.flagged_at,

      classProbabilities: result.class_probabilities || result.ai_response_payload?.class_probabilities || undefined,
      clinicalAssessment: result.clinical_assessment || result.ai_response_payload?.clinical_assessment || undefined,
      gateEvaluation: result.gate_evaluation || result.ai_response_payload?.gate_evaluation || undefined,
      visualizationUrl: result.visualization_url || result.ai_response_payload?.visualization_base64 || undefined,
      cleanedScanUrl: result.cleaned_scan_url || result.ai_response_payload?.cleaned_scan_base64 || undefined,
      primaryDiagnosis: result.primary_diagnosis || result.ai_response_payload?.primary_diagnosis || undefined,
      modelVersion: result.model_version || result.ai_response_payload?.model_version || undefined,
      telemetry: result.telemetry || result.ai_response_payload?.telemetry || undefined,
    };
  }
  throw new Error(response.data?.message || "Failed to update clinical analysis.");
}

/**
 * Alias for updateAnalysis
 */
export const updateAnalysisDetails = updateAnalysis;

/**
 * 4. POST /guest-predict
 */
export async function guestPredict(imageFile: File | null): Promise<{
  prediction: string;
  confidence: number;
  imageUrl: string;
  heatmapUrl?: string;
  visualizationUrl?: string;
  cleanedScanUrl?: string;
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
  peakCoordinates?: { x: number; y: number };
  usageCount?: number;
  usageLimit?: number;
}> {
  if (!imageFile) throw new Error("Image file is required.");

  const formData = new FormData();
  formData.append("image", imageFile);

  try {
    const response = await apiClient.post('/guest-predict', formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });

    const result = response.data;
    if (response.status === 200 && result.success) {
      return {
        prediction: result.data.prediction,
        confidence: result.data.confidence,
        imageUrl: sanitizeImageUrl(result.data.image_url),
        heatmapUrl: result.data.heatmap_url || undefined,
        visualizationUrl: result.data.visualization_url || undefined,
        cleanedScanUrl: result.data.cleaned_scan_url || undefined,
        classProbabilities: result.data.class_probabilities || undefined,
        clinicalAssessment: result.data.clinical_assessment || undefined,
        gateEvaluation: result.data.gate_evaluation || undefined,
        peakCoordinates: result.data.peak_coordinates || undefined,
        usageCount: result.data.usage_count,
        usageLimit: result.data.usage_limit
      };
    } else {
      throw new Error(result.message || "Failed to process image.");
    }

  } catch (e: any) {
    throw new Error(e.response?.data?.message || e.message || "Failed to process image.");
  }
}

/**
 * 5. DELETE /analyses/:id
 */
export async function deleteAnalysis(id: string): Promise<boolean> {
  const cleanId = id.toString().replace(/^PT-/, "");
  try {
    const response = await apiClient.delete(`/analyses/${cleanId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("kv_token") || ""}`
      }
    });
    if (response.status === 200 || response.status === 204) {
      return true;
    }
    return false;
  } catch (e) {
    const clinicalErr = parseClinicalError(e);
    (e as any).clinicalError = clinicalErr;
    throw e;
  }
}

/**
 * Alias for deleteAnalysis
 */
export const deleteAnalysisRecord = deleteAnalysis;

/**
 * 6. POST /analyses/:id/confirm
 * Sign and confirm an analysis finding by clinician.
 */
export async function confirmAnalysis(
  id: string | number,
  notes?: string
): Promise<KidneyAnalysis> {
  const cleanId = id.toString().replace(/^KV-/, "").replace(/^PT-/, "");
  const response = await apiClient.post(
    `/analyses/${cleanId}/confirm`,
    { notes },
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("kv_token") || ""}`,
      },
    }
  );

  if (response.status === 200 && response.data.success) {
    const result = response.data.data;
    const isFailed = result.status === 'failed';
    const isUncertain =
      result.status === 'review' ||
      (result.confidence && result.confidence < 40) ||
      result.ai_response_payload?.is_uncertain;
    const diagnosis = mapToDiagnosisResult(result.prediction, isFailed, isUncertain);
    const finding = getPathologyFinding(result.prediction, isFailed);

    return {
      id: result.id.toString(),
      patientId: result.patient_id || `PT-${result.id}`,
      patientName: result.patient_name || "Unknown Patient",
      patientAge:
        result.patient_age !== null && result.patient_age !== undefined
          ? Number(result.patient_age)
          : undefined,
      patientGender: result.patient_gender || "Unspecified",
      createdAt: result.created_at,
      diagnosis,
      confidence: result.confidence,
      imageUrl: sanitizeImageUrl(result.image_url),
      heatmapUrl: result.heatmap_url || result.ai_response_payload?.gradcam_image || undefined,
      peakCoordinates:
        result.peak_coordinates || result.ai_response_payload?.peak_coordinates || undefined,
      location: result.anatomical_location || "Left Kidney",
      recommendation:
        result.report?.summary ||
        result.ai_response_payload?.clinical_assessment?.recommendation ||
        "Clinician confirmed finding.",
      clinicianNotes: result.clinician_notes || result.report?.clinician_notes,
      pathologyFinding: finding,
      prediction: result.prediction || result.ai_response_payload?.predicted_class || finding,
      cystType: finding,
      isUncertain,
      status: result.status,
      statusLabel: result.status_label,
      statusColor: result.status_color,
      confirmedAt: result.confirmed_at,
      confirmedBy: result.confirmed_by,
      confirmedByName: result.confirmed_by_name,
      flaggedFor: result.flagged_for,
      flaggedAt: result.flagged_at,
      classProbabilities:
        result.class_probabilities || result.ai_response_payload?.class_probabilities || undefined,
      clinicalAssessment:
        result.clinical_assessment || result.ai_response_payload?.clinical_assessment || undefined,
      gateEvaluation:
        result.gate_evaluation || result.ai_response_payload?.gate_evaluation || undefined,
      visualizationUrl:
        result.visualization_url || result.ai_response_payload?.visualization_base64 || undefined,
      cleanedScanUrl:
        result.cleaned_scan_url || result.ai_response_payload?.cleaned_scan_base64 || undefined,
      primaryDiagnosis:
        result.primary_diagnosis || result.ai_response_payload?.primary_diagnosis || undefined,
      modelVersion: result.model_version || result.ai_response_payload?.model_version || undefined,
      telemetry: result.telemetry || result.ai_response_payload?.telemetry || undefined,
    };
  }
  throw new Error(response.data?.message || "Failed to confirm clinical analysis.");
}

/**
 * 7. POST /analyses/:id/flag
 * Flag an analysis for specialist triage consultation (e.g., Urology, Oncology).
 */
export async function flagAnalysis(
  id: string | number,
  department: string = "urology",
  reason?: string
): Promise<KidneyAnalysis> {
  const cleanId = id.toString().replace(/^KV-/, "").replace(/^PT-/, "");
  const response = await apiClient.post(
    `/analyses/${cleanId}/flag`,
    { department, reason },
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("kv_token") || ""}`,
      },
    }
  );

  if (response.status === 200 && response.data.success) {
    const result = response.data.data;
    const isFailed = result.status === 'failed';
    const isUncertain =
      result.status === 'review' ||
      (result.confidence && result.confidence < 40) ||
      result.ai_response_payload?.is_uncertain;
    const diagnosis = mapToDiagnosisResult(result.prediction, isFailed, isUncertain);
    const finding = getPathologyFinding(result.prediction, isFailed);

    return {
      id: result.id.toString(),
      patientId: result.patient_id || `PT-${result.id}`,
      patientName: result.patient_name || "Unknown Patient",
      patientAge:
        result.patient_age !== null && result.patient_age !== undefined
          ? Number(result.patient_age)
          : undefined,
      patientGender: result.patient_gender || "Unspecified",
      createdAt: result.created_at,
      diagnosis,
      confidence: result.confidence,
      imageUrl: sanitizeImageUrl(result.image_url),
      heatmapUrl: result.heatmap_url || result.ai_response_payload?.gradcam_image || undefined,
      peakCoordinates:
        result.peak_coordinates || result.ai_response_payload?.peak_coordinates || undefined,
      location: result.anatomical_location || "Left Kidney",
      recommendation:
        result.report?.summary ||
        result.ai_response_payload?.clinical_assessment?.recommendation ||
        `Flagged for ${department} consultation.`,
      clinicianNotes: result.clinician_notes || result.report?.clinician_notes,
      pathologyFinding: finding,
      prediction: result.prediction || result.ai_response_payload?.predicted_class || finding,
      cystType: finding,
      isUncertain,
      status: result.status,
      statusLabel: result.status_label,
      statusColor: result.status_color,
      confirmedAt: result.confirmed_at,
      confirmedBy: result.confirmed_by,
      confirmedByName: result.confirmed_by_name,
      flaggedFor: result.flagged_for,
      flaggedAt: result.flagged_at,
      classProbabilities:
        result.class_probabilities || result.ai_response_payload?.class_probabilities || undefined,
      clinicalAssessment:
        result.clinical_assessment || result.ai_response_payload?.clinical_assessment || undefined,
      gateEvaluation:
        result.gate_evaluation || result.ai_response_payload?.gate_evaluation || undefined,
      visualizationUrl:
        result.visualization_url || result.ai_response_payload?.visualization_base64 || undefined,
      cleanedScanUrl:
        result.cleaned_scan_url || result.ai_response_payload?.cleaned_scan_base64 || undefined,
      primaryDiagnosis:
        result.primary_diagnosis || result.ai_response_payload?.primary_diagnosis || undefined,
      modelVersion: result.model_version || result.ai_response_payload?.model_version || undefined,
      telemetry: result.telemetry || result.ai_response_payload?.telemetry || undefined,
    };
  }
  throw new Error(response.data?.message || "Failed to flag clinical analysis.");
}
