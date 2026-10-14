import { apiClient } from "./client";

export interface PatientDirectoryItem {
  id: number;
  patient_id: string;
  name: string;
  age?: number | null;
  gender?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  flagged_for_review: boolean;
  review_reason?: string | null;
  analyses_count: number;
  first_visit?: string | null;
  last_visit?: string | null;
  latest_result?: {
    id: number;
    prediction: string;
    confidence: number | string;
    status: string;
    status_label: string;
    status_color: string;
    created_at: string;
  } | null;
  has_pending_reviews: boolean;
  next_follow_up?: {
    id: number;
    follow_up_date: string;
    reason: string;
    status: string;
    is_overdue: boolean;
  } | null;
  created_at: string;
}

export interface FollowUpStats {
  total_patients: number;
  active_follow_ups: number;
  overdue_follow_ups: number;
  pending_reviews: number;
  total_analyses: number;
  high_risk_patients: number;
}

export interface PatientProfileData {
  patient: {
    id: number;
    patient_id: string;
    name: string;
    age?: number | null;
    gender?: string | null;
    phone?: string | null;
    email?: string | null;
    notes?: string | null;
    flagged_for_review: boolean;
    review_reason?: string | null;
    created_at: string;
    analyses_count: number;
  };
  overview: {
    latest_analysis?: {
      id: number;
      prediction: string;
      confidence: number;
      status: string;
      status_label: string;
      created_at: string;
      image_url?: string;
    } | null;
    first_visit: string;
    last_visit: string;
    pending_reviews_count: number;
    confirmed_count: number;
    scheduled_follow_ups_count: number;
  };
  timeline: Array<{
    id: string;
    type: string;
    timestamp: string;
    title: string;
    description: string;
    status?: string;
    status_label?: string;
    status_color?: string;
    record_id?: number;
    image_url?: string;
    notes?: string;
    is_overdue?: boolean;
  }>;
  imaging: Array<{
    id: number;
    image_url?: string;
    original_filename: string;
    prediction: string;
    confidence: number;
    status: string;
    status_label: string;
    status_color: string;
    location: string;
    clinician_notes?: string;
    model_version?: string;
    heatmap_url?: string;
    has_report: boolean;
    confirmed_at?: string;
    confirmed_by_name?: string;
    created_at: string;
  }>;
  reports: Array<{
    id: number;
    analysis_id: number;
    report_code: string;
    title: string;
    summary: string;
    prediction: string;
    confidence: number;
    created_at: string;
    filename: string;
  }>;
  follow_ups: Array<{
    id: number;
    patient_id: string;
    follow_up_date: string;
    reason: string;
    status: string;
    clinical_notes?: string;
    is_overdue: boolean;
    created_at: string;
  }>;
}

export interface ScanComparisonData {
  patient: {
    patient_id: string;
    name: string;
    age?: number | null;
    gender?: string | null;
  };
  scan_a: {
    id: number;
    report_code: string;
    examination_date: string;
    image_url?: string;
    heatmap_url?: string;
    prediction: string;
    confidence: number;
    status: string;
    status_label: string;
    location: string;
    clinician_notes?: string;
    model_version?: string;
    clinical_assessment?: any;
    has_report: boolean;
  };
  scan_b: {
    id: number;
    report_code: string;
    examination_date: string;
    image_url?: string;
    heatmap_url?: string;
    prediction: string;
    confidence: number;
    status: string;
    status_label: string;
    location: string;
    clinician_notes?: string;
    model_version?: string;
    clinical_assessment?: any;
    has_report: boolean;
  };
  interval_days: number;
  is_compatible: boolean;
  neutral_observations: {
    finding_changed: boolean;
    finding_a: string;
    finding_b: string;
    confidence_diff: number;
    note: string;
  };
}

/**
 * 1. Fetch Paginated Patients Directory
 */
export async function fetchPatientsDirectory(params: {
  page?: number;
  per_page?: number;
  search?: string;
  filter_visit?: string;
  filter_review?: string;
  filter_follow_up?: string;
} = {}): Promise<{ data: PatientDirectoryItem[]; meta: any }> {
  try {
    const res = await apiClient.get('/patients', { params });
    return {
      data: res.data.data || [],
      meta: res.data.meta || { current_page: 1, last_page: 1, total: 0 }
    };
  } catch (e) {
    console.error("Failed to load patients directory", e);
    return { data: [], meta: { current_page: 1, last_page: 1, total: 0 } };
  }
}

/**
 * 2. Fetch Aggregate Follow-up Stats
 */
export async function fetchFollowUpStats(): Promise<FollowUpStats> {
  try {
    const res = await apiClient.get('/patients/stats');
    return res.data.data;
  } catch (e) {
    console.error("Failed to load follow-up stats", e);
    return {
      total_patients: 0,
      active_follow_ups: 0,
      overdue_follow_ups: 0,
      pending_reviews: 0,
      total_analyses: 0,
      high_risk_patients: 0,
    };
  }
}

/**
 * 3. Fetch Full Patient Profile with all tabs
 */
export async function fetchPatientProfile(patientId: string): Promise<PatientProfileData | null> {
  try {
    const res = await apiClient.get(`/patients/${encodeURIComponent(patientId)}`);
    return res.data.data || null;
  } catch (e) {
    console.error(`Failed to load profile for patient ${patientId}`, e);
    return null;
  }
}

/**
 * 4. Create New Patient
 */
export async function createPatientRecord(data: {
  name: string;
  patient_id?: string;
  age?: number | string | null;
  gender?: string;
  phone?: string;
  email?: string;
  notes?: string;
}): Promise<any> {
  const res = await apiClient.post('/patients', data);
  return res.data.data;
}

/**
 * 5. Update Patient Demographics / Notes
 */
export async function updatePatientRecord(patientId: string, data: {
  name?: string;
  age?: number | string | null;
  gender?: string;
  phone?: string;
  email?: string;
  notes?: string;
}): Promise<any> {
  const res = await apiClient.put(`/patients/${encodeURIComponent(patientId)}`, data);
  return res.data.data;
}

/**
 * 6. Schedule Follow-up Appointment
 */
export async function schedulePatientFollowUp(patientId: string, data: {
  follow_up_date: string;
  reason: string;
  status?: string;
  clinical_notes?: string;
}): Promise<any> {
  const res = await apiClient.post(`/patients/${encodeURIComponent(patientId)}/follow-ups`, data);
  return res.data.data;
}

/**
 * 7. Update Follow-up Appointment
 */
export async function updatePatientFollowUp(patientId: string, followUpId: number, data: {
  follow_up_date?: string;
  reason?: string;
  status?: string;
  clinical_notes?: string;
}): Promise<any> {
  const res = await apiClient.put(`/patients/${encodeURIComponent(patientId)}/follow-ups/${followUpId}`, data);
  return res.data.data;
}

/**
 * 8. Delete Follow-up Appointment
 */
export async function deletePatientFollowUp(patientId: string, followUpId: number): Promise<boolean> {
  await apiClient.delete(`/patients/${encodeURIComponent(patientId)}/follow-ups/${followUpId}`);
  return true;
}

/**
 * 9. Fetch Side-by-Side Scan Comparison
 */
export async function fetchScanComparison(patientId: string, scan1: number, scan2: number): Promise<ScanComparisonData> {
  const res = await apiClient.get(`/patients/${encodeURIComponent(patientId)}/compare`, {
    params: { scan1, scan2 }
  });
  return res.data.data;
}

/**
 * 10. Generate & Download Patient History PDF
 */
export async function downloadPatientHistoryPdf(patientId: string, filename?: string): Promise<void> {
  const res = await apiClient.get(`/patients/${encodeURIComponent(patientId)}/history/pdf`, {
    responseType: 'blob'
  });
  const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `patient_history_${patientId}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

/**
 * 11. Get Blob URL for Patient History PDF Preview
 */
export async function getPatientHistoryPdfBlobUrl(patientId: string): Promise<string> {
  const res = await apiClient.get(`/patients/${encodeURIComponent(patientId)}/history/pdf`, {
    params: { preview: true },
    responseType: 'blob'
  });
  return window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
}
