"""
Validator for uploaded ultrasound / CT scan medical images.
"""
import logging
import numpy as np
from PIL import Image
from app.config import (
    ALLOWED_EXTENSIONS,
    MAX_COLOR_SATURATION,
    MIN_DARK_PIXEL_RATIO,
    DARK_PIXEL_THRESHOLD
)

logger = logging.getLogger(__name__)

def allowed_file(filename: str) -> bool:
    """Verify file has an allowed image extension."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def validate_medical_image(img: Image.Image) -> tuple[bool, str]:
    """Validate that the uploaded image conforms to medical scan characteristics.
    
    Medical ultrasound and CT images are inherently grayscale and exhibit
    prominent dark boundary regions. Everyday color photographs will be rejected.
    
    Returns (is_valid: bool, reason: str)
    """
    try:
        rgb_img = img.convert('RGB')
        arr = np.array(rgb_img, dtype=np.float32)

        # Check 1: Grayscale color saturation test
        channel_std = np.std(arr, axis=2)
        avg_saturation = float(np.mean(channel_std))

        logger.info(f"Image validation — avg color saturation: {avg_saturation:.2f} (max allowed: {MAX_COLOR_SATURATION})")

        if avg_saturation > MAX_COLOR_SATURATION:
            return False, (
                f"This image appears to be a color photograph, not a medical scan. "
                f"Please upload a renal ultrasound or CT image. "
                f"(Color saturation: {avg_saturation:.1f}, threshold: {MAX_COLOR_SATURATION})"
            )

        # Check 2: Dark background ratio
        gray = np.mean(arr, axis=2)
        dark_ratio = float(np.mean(gray < DARK_PIXEL_THRESHOLD))

        logger.info(f"Image validation — dark pixel ratio: {dark_ratio:.2f} (min required: {MIN_DARK_PIXEL_RATIO})")

        if dark_ratio < MIN_DARK_PIXEL_RATIO:
            return False, (
                f"This image does not match the expected characteristics of a medical scan. "
                f"Medical images typically have dark background regions. "
                f"Please upload a renal ultrasound or CT image."
            )

        return True, "Image passes medical scan validation."

    except Exception as e:
        logger.warning(f"Image validation error (allowing through): {str(e)}")
        return True, "Validation skipped due to processing error."
