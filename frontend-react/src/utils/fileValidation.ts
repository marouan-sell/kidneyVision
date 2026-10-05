/**
 * Client-side Medical Ultrasound Image File Validator.
 * Strictly aligned with the Laravel backend and Flask AI model constraints.
 */

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  dimensions?: { width: number; height: number };
}

export const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png'];
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'];
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const MIN_FILE_SIZE_BYTES = 512; // 0.5 KB minimum to filter empty files
export const MIN_DIMENSION = 32;
export const MAX_DIMENSION = 4096;

/**
 * Perform comprehensive file validation including file size, MIME type,
 * extension, and browser image decoding to catch corrupted/empty streams.
 */
export async function validateScanFile(file: File | null): Promise<FileValidationResult> {
  if (!file) {
    return { valid: false, error: "Please select an ultrasound scan image." };
  }

  // 1. Reject empty files
  if (file.size === 0 || file.size < MIN_FILE_SIZE_BYTES) {
    return { valid: false, error: "The selected file is empty (0 bytes). Please upload a valid ultrasound image." };
  }

  // 2. Enforce file size limit (5MB)
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return { valid: false, error: `File size (${sizeMb}MB) exceeds the maximum allowed limit of 5MB.` };
  }

  // 3. Validate file extension
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: `Invalid file type (.${extension || 'unknown'}). Only JPG, JPEG, and PNG ultrasound scans are supported by the AI model.`
    };
  }

  // 4. Validate MIME type
  if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported MIME type (${file.type}). Only image/jpeg and image/png are accepted.`
    };
  }

  // 5. Deep browser decode check: ensures file is not corrupted, truncated, or a disguised non-image
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      URL.revokeObjectURL(objectUrl);

      if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
        resolve({
          valid: false,
          error: `Scan resolution is too small (${width}x${height}). Minimum required is ${MIN_DIMENSION}x${MIN_DIMENSION} pixels.`
        });
        return;
      }

      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        resolve({
          valid: false,
          error: `Scan resolution is too large (${width}x${height}). Maximum permitted is ${MAX_DIMENSION}x${MAX_DIMENSION} pixels.`
        });
        return;
      }

      resolve({
        valid: true,
        dimensions: { width, height }
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        valid: false,
        error: "The image file is corrupted or not a readable image format."
      });
    };

    img.src = objectUrl;
  });
}
