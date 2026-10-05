"""
Prediction route blueprint supporting dual-stage Gatekeeper & 4-Class Diagnostic.
"""
import logging
from flask import Blueprint, request, jsonify
from app.config import ALLOWED_EXTENSIONS, MAX_FILE_SIZE
from app.preprocessing.validator import allowed_file
from app.services.inference_service import process_and_predict

logger = logging.getLogger(__name__)

predict_bp = Blueprint('predict', __name__)

@predict_bp.route('/predict', methods=['POST', 'OPTIONS'])
@predict_bp.route('/api/predict', methods=['POST', 'OPTIONS'])
def predict():
    """Prediction endpoint for renal ultrasound and abdominal CT scans."""
    if request.method == 'OPTIONS':
        return "", 200

    logger.info("Received prediction request.")

    # Find file in common field names
    file_obj = None
    for field in ['image', 'scan', 'file', 'photo']:
        if field in request.files:
            file_obj = request.files[field]
            break

    if file_obj is None or file_obj.filename == '':
        if request.data:
            image_bytes = request.data
            filename = "scan.jpg"
        else:
            logger.warning("No image payload found in request.")
            return jsonify({"error": "No image provided. Please upload an image file under 'image' or 'scan'."}), 400
    else:
        filename = file_obj.filename
        if not allowed_file(filename):
            logger.warning(f"Invalid file extension: {filename}")
            return jsonify({"error": f"Invalid file format: '{filename}'. Allowed: {ALLOWED_EXTENSIONS}"}), 400

        try:
            image_bytes = file_obj.read()
            if len(image_bytes) > MAX_FILE_SIZE:
                logger.warning(f"File size exceeds limit: {len(image_bytes)} bytes")
                return jsonify({"error": f"File exceeds maximum size of {MAX_FILE_SIZE // (1024*1024)}MB"}), 413
        except Exception as e:
            logger.error(f"Error reading file bytes: {str(e)}")
            return jsonify({"error": "Failed reading image stream."}), 400

    # Auto mask option (default to True)
    auto_mask_str = request.form.get("auto_mask", request.args.get("auto_mask", "true")).lower()
    auto_mask = auto_mask_str in ["true", "1", "yes"]

    result, error_msg, status_code = process_and_predict(image_bytes, filename=filename, auto_mask=auto_mask)

    if error_msg:
        is_gate = "Gatekeeper" in error_msg
        return jsonify({
            "error": error_msg,
            "gate_rejected": is_gate,
            "success": False
        }), status_code

    return jsonify(result), status_code
