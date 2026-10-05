/**
 * Clinical Error Parsing Utility
 * Translates technical API, network, and validation errors into clear,
 * user-friendly medical portal messages while preventing raw stack traces.
 */

export interface ClinicalError {
  title: string;
  message: string;
  type: 'validation' | 'network' | 'ai' | 'auth' | 'server' | 'pdf';
  suggestion?: string;
}

export function parseClinicalError(error: unknown): ClinicalError {
  if (!error) {
    return {
      title: "Unexpected Error",
      message: "An unexpected clinical portal error occurred. Please try again.",
      type: "server",
    };
  }

  // Handle Axios / Network / HTTP Response errors
  const err = error as any;
  const status = err.response?.status;
  const data = err.response?.data;
  const errorCode = data?.error_code || data?.code;
  const serverMsg = typeof data?.message === 'string' ? data.message : null;
  const validationErrors = data?.errors;

  // 1. Network / Server Offline Errors
  if (
    err.code === 'ERR_NETWORK' ||
    err.code === 'ECONNREFUSED' ||
    err.message?.includes('Network Error') ||
    err.message?.includes('Failed to fetch') ||
    status === 0
  ) {
    return {
      title: "Clinical Server Offline",
      message: "Unable to establish a secure connection with the KidneyVision medical server.",
      type: "network",
      suggestion: "Please check your network connection or verify that the local server is running.",
    };
  }

  // 2. Authentication & Authorization Errors
  if (status === 401) {
    return {
      title: "Session Expired",
      message: "Your authenticated clinical session has expired or is invalid.",
      type: "auth",
      suggestion: "Please sign in again to continue accessing medical records.",
    };
  }

  if (status === 403) {
    return {
      title: "Access Restricted",
      message: "You do not have authorization to view or modify this medical analysis.",
      type: "auth",
      suggestion: "Please verify you are logged in with the appropriate physician credentials.",
    };
  }

  // 3. File Upload & Format Validation Errors
  if (status === 413 || errorCode === 'FILE_TOO_LARGE' || serverMsg?.toLowerCase().includes('large') || serverMsg?.toLowerCase().includes('exceed')) {
    return {
      title: "File Size Exceeded",
      message: "The selected ultrasound scan exceeds the maximum allowable upload limit of 10MB.",
      type: "validation",
      suggestion: "Please select a compressed scan image or DICOM slice under 10MB.",
    };
  }

  if (errorCode === 'UNSUPPORTED_FORMAT' || serverMsg?.toLowerCase().includes('format') || serverMsg?.toLowerCase().includes('extension') || serverMsg?.toLowerCase().includes('mime')) {
    return {
      title: "Unsupported Scan Format",
      message: "The uploaded file format is not supported by the imaging pipeline.",
      type: "validation",
      suggestion: "Please upload an authentic JPG, PNG, or standard DICOM kidney ultrasound slice.",
    };
  }

  if (errorCode === 'CORRUPTED_IMAGE' || serverMsg?.toLowerCase().includes('corrupted') || serverMsg?.toLowerCase().includes('invalid image')) {
    return {
      title: "Corrupted Scan File",
      message: "The uploaded ultrasound file is corrupted or unreadable by image decoders.",
      type: "validation",
      suggestion: "Please re-export the image from your ultrasound device and try again.",
    };
  }

  if (status === 422) {
    // Collect field validation error messages if present
    let detail = serverMsg || "The scan or clinical parameters provided could not be validated.";
    if (validationErrors && typeof validationErrors === 'object') {
      const firstKey = Object.keys(validationErrors)[0];
      if (Array.isArray(validationErrors[firstKey]) && validationErrors[firstKey].length > 0) {
        detail = validationErrors[firstKey][0];
      }
    }
    
    // Check if message mentions non-medical image or Gatekeeper rejection
    const lower = detail.toLowerCase();
    if (
      lower.includes('renal') ||
      lower.includes('ultrasound') ||
      lower.includes('medical') ||
      lower.includes('gatekeeper') ||
      lower.includes('kidney') ||
      lower.includes('dark background') ||
      lower.includes('photograph') ||
      lower.includes('non-kidney')
    ) {
      return {
        title: "Non-Kidney / Invalid Scan Detected",
        message: detail,
        type: "validation",
        suggestion: "The AI Gatekeeper only accepts authentic kidney CT or ultrasound scans. Please upload a genuine renal medical image, not a desktop screenshot or non-kidney photo.",
      };
    }

    return {
      title: "Clinical Input Validation Failed",
      message: detail,
      type: "validation",
      suggestion: "Please verify all required patient fields and scan parameters.",
    };
  }

  // 4. AI Inference Service Errors (Flask Unavailable / Model Broken)
  if (status === 503 || errorCode === 'FLASK_SERVICE_UNAVAILABLE' || serverMsg?.toLowerCase().includes('ai service') || serverMsg?.toLowerCase().includes('flask')) {
    return {
      title: "AI Inference Engine Unavailable",
      message: "The neural network analysis service is temporarily offline or undergoing maintenance.",
      type: "ai",
      suggestion: "Please retry in a moment. If the issue persists, ensure the AI service is active.",
    };
  }

  if (status === 502 || serverMsg?.toLowerCase().includes('inference failed') || serverMsg?.toLowerCase().includes('tensorflow')) {
    return {
      title: "AI Inference Failure",
      message: "The neural network encountered an unexpected mathematical failure during classification.",
      type: "ai",
      suggestion: "Please try with a clearer acoustic frame or alternative scan orientation.",
    };
  }

  // 5. Not Found / ID Manipulation
  if (status === 404) {
    return {
      title: "Record Not Found",
      message: "The requested medical analysis or diagnostic report could not be found in your patient registry.",
      type: "server",
      suggestion: "Please verify the patient analysis ID or return to the clinical history.",
    };
  }

  // 6. PDF Generation Errors
  if (err.message?.toLowerCase().includes('pdf') || serverMsg?.toLowerCase().includes('pdf')) {
    return {
      title: "PDF Dossier Generation Error",
      message: "Failed to compile the printable medical PDF diagnostic report.",
      type: "pdf",
      suggestion: "Please refresh the page and try opening the preview or download again.",
    };
  }

  // 7. Generic Fallback without exposing raw stack traces
  const cleanMessage = serverMsg && !serverMsg.includes('Exception') && !serverMsg.includes('Stack trace') && !serverMsg.includes('SQLSTATE')
    ? serverMsg
    : "An internal processing error occurred while handling this clinical request.";

  return {
    title: "Clinical Processing Notice",
    message: cleanMessage,
    type: "server",
    suggestion: "Please try again or contact your clinical portal system administrator if the problem persists.",
  };
}
