import { apiClient, BASE_URL } from "./client";
import { parseClinicalError } from "../utils/errorParser";

/**
 * 1. GET /analyses/:id/report/pdf
 * Downloads clinical diagnostic PDF report and automatically triggers browser file download.
 */
export async function downloadReportPDF(id: string | number, customFilename?: string): Promise<Blob> {
  try {
    const response = await apiClient.get(`/analyses/${id}/report/pdf`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });

    // Automatically trigger file download in user's browser
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = customFilename || `kidneyvision_report_${id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => {
      window.URL.revokeObjectURL(downloadUrl);
    }, 1000);

    return blob;
  } catch (err: any) {
    const clinicalErr = parseClinicalError(err);
    (err as any).clinicalError = clinicalErr;
    throw err;
  }
}

/**
 * 2. GET /analyses/:id/report/preview
 * Streams PDF report inline for browser modal/iframe preview.
 */
export async function getPDFPreviewUrl(id: string | number): Promise<string> {
  try {
    const response = await apiClient.get(`/analyses/${id}/report/preview`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    return URL.createObjectURL(blob);
  } catch (err: any) {
    const clinicalErr = parseClinicalError(err);
    (err as any).clinicalError = clinicalErr;
    throw err;
  }
}

export const downloadReport = downloadReportPDF;
export const getReportPdfBlobUrl = getPDFPreviewUrl;

