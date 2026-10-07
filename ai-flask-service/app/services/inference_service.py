"""
Complete Clinical Inference Pipeline Orchestrator:
Stage 1: Gatekeeper MobileNetV3 (Authentic Kidney CT/Ultrasound vs Non-Kidney X-Rays / Photos)
Stage 2: Auto-Masking & Cleaning (Telea Inpainting + Caliper & Border Artifact Removal)
Stage 3: Master ConvNeXt-Tiny 4-Class Deep Inference (Cyst, Normal, Stone, Tumor)
Stage 4: Explainable AI Grad-CAM Saliency, mm Size Estimation, & Pathology-Specific Recommendations
"""
import io
import logging
from PIL import Image
import torch
import torch.nn.functional as F
import numpy as np

from app.config import (
    CLASS_NAMES,
    GATE_THRESHOLD,
    MIN_CONFIDENCE_THRESHOLD,
    AI_TASK_DESCRIPTION,
    MASTER_MODEL_PATH,
)
from app.preprocessing.validator import validate_medical_image
from app.preprocessing.preprocessor import auto_mask_and_clean_image, preprocess_for_torch
from app.inference.model_loader import get_master_model, get_gate_model, get_device
from app.inference.gradcam import generate_pytorch_gradcam

logger = logging.getLogger(__name__)

def process_and_predict(image_bytes: bytes, filename: str = "scan.jpg", auto_mask: bool = True) -> tuple[dict | None, str | None, int]:
    """Execute complete clinical gatekeeper and 4-class diagnosis pipeline.

    Returns (result_dict, error_message, http_status_code)
    """
    device = get_device()
    master_model = get_master_model()
    gate_model = get_gate_model()

    if master_model is None:
        logger.error("Prediction attempted but Master 4-Class model is not loaded.")
        return None, "Service unavailable. Master AI model not loaded.", 503

    # 1. Parse Image
    try:
        img_pil = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as e:
        logger.error(f"Error parsing image bytes: {str(e)}")
        return None, "Invalid image file format. Supported: PNG, JPG, JPEG, WEBP.", 400

    # 2. Basic Medical Characteristic Check
    is_valid, reason = validate_medical_image(img_pil)
    if not is_valid:
        logger.warning(f"Medical scan heuristic validation rejected: {reason}")
        return None, reason, 422

    # 3. Stage-1 Neural Gatekeeper Check
    gate_passed = True
    non_kidney_prob = 0.0
    kidney_prob = 1.0

    if gate_model is not None:
        try:
            gate_tensor = preprocess_for_torch(img_pil, device)
            with torch.no_grad():
                gate_logit = gate_model(gate_tensor)
                kidney_prob = float(torch.sigmoid(gate_logit).item())

            # If borderline or rejected initially, verify with machine-text cleaned scan
            if (1.0 - kidney_prob) >= GATE_THRESHOLD and auto_mask:
                try:
                    clean_for_gate = auto_mask_and_clean_image(img_pil)["cleaned_pil"]
                    gate_tensor_clean = preprocess_for_torch(clean_for_gate, device)
                    with torch.no_grad():
                        clean_logit = gate_model(gate_tensor_clean)
                        clean_kidney_prob = float(torch.sigmoid(clean_logit).item())
                        kidney_prob = max(kidney_prob, clean_kidney_prob)
                except Exception as clean_err:
                    logger.debug(f"Gatekeeper clean fallback skipped: {clean_err}")

            non_kidney_prob = float(1.0 - kidney_prob)

            logger.info(
                f"[GATEKEEPER] Kidney Prob: {kidney_prob * 100:.2f}%, "
                f"Non-Kidney Prob: {non_kidney_prob * 100:.2f}% (Threshold: {GATE_THRESHOLD * 100:.0f}%)"
            )

            if non_kidney_prob >= GATE_THRESHOLD:
                rejection_msg = (
                    f"Image rejected by Gatekeeper AI: The uploaded image does not appear to be an authentic "
                    f"kidney CT or renal ultrasound scan (Non-kidney probability: {non_kidney_prob * 100:.1f}%). "
                    f"Please upload a valid abdominal CT or renal ultrasound."
                )
                logger.warning(f"Gatekeeper rejection triggered: {rejection_msg}")
                return None, rejection_msg, 422

        except Exception as e:
            logger.warning(f"Gatekeeper evaluation error (allowing scan through): {str(e)}")

    # 4. Stage-2 Auto-Masking & Telea Inpainting
    mask_telemetry = {"auto_masking_applied": False}
    if auto_mask:
        clean_res = auto_mask_and_clean_image(img_pil)
        cleaned_pil = clean_res["cleaned_pil"]
        mask_telemetry = {
            "auto_masking_applied": True,
            "rotation_corrected": clean_res["rotation_done"],
            "text_artifacts_removed": clean_res["artifacts_count"],
            "cleaned_area_ratio": clean_res["mask_pixel_ratio"]
        }
    else:
        cleaned_pil = img_pil

    # 5. Stage-3 Master 4-Class Deep Inference
    try:
        tensor = preprocess_for_torch(cleaned_pil, device)
        tensor.requires_grad = True

        master_model.zero_grad()
        output = master_model(tensor)

        probs = F.softmax(output, dim=1).squeeze().cpu().detach().numpy()
        pred_idx = int(np.argmax(probs))
        pred_class = CLASS_NAMES[pred_idx]
        confidence_pct = round(float(probs[pred_idx]) * 100, 2)

        class_probs = {c: round(float(probs[i]) * 100, 2) for i, c in enumerate(CLASS_NAMES)}

        has_stone = (pred_class == "Stone")
        has_tumor = (pred_class == "Tumor")
        has_cyst = (pred_class == "Cyst")
        is_normal = (pred_class == "Normal")

        # Uncertainty check: Flagged for review only if confidence < 40% or margin < 5%
        sorted_probs = sorted(probs, reverse=True)
        margin = (sorted_probs[0] - sorted_probs[1]) if len(sorted_probs) > 1 else 1.0
        is_uncertain = bool((confidence_pct < MIN_CONFIDENCE_THRESHOLD) or (margin < 0.05))
        triage_status = "review" if is_uncertain else "completed"

        review_reason = (
            f"Multi-pathology prediction margin is narrow ({margin * 100:.1f}% margin, {confidence_pct:.1f}% confidence). Clinician review recommended."
            if is_uncertain else None
        )

        # 6. Pathology-Specific Clinical Assessment & Recommendations
        if pred_class == "Normal":
            diam_mm = 0.0
            primary_diag = "Normal Renal Parenchyma (Healthy)"
            severity = "Normale (Sain)"
            urgency = "Routine / None"
            recommendation = "Homogeneous renal parenchyma. No nephrolithiasis, cortical cyst, or suspicious tissue mass detected. Normal routine follow-up."
        elif pred_class == "Stone":
            primary_diag = "Kidney Stone Detected (Nephrolithiasis)"
            severity = "Moderate"
            urgency = "Urological Consultation"
            recommendation = "Renal calculus identified. Urological evaluation recommended for dimension staging (ESWL vs Ureteroscopy), hydration therapy, and metabolic workup."
        elif pred_class == "Cyst":
            primary_diag = "Renal Cyst Detected (Bosniak I/II)"
            severity = "Benign Cystic Formation"
            urgency = "Periodic Ultrasound Follow-up"
            recommendation = "Well-defined fluid-filled cortical cyst consistent with Bosniak Category I/II. Annual ultrasound monitoring advised to confirm size stability. No surgical intervention indicated."
        elif pred_class == "Tumor":
            primary_diag = "Suspicious Renal Mass / Neoplasm Alert"
            severity = "Solid Tissue Mass (Potential Neoplasm)"
            urgency = "Urgent Specialist Evaluation"
            recommendation = "Solid heterogeneous renal lesion detected. Immediate diagnostic workup required: Contrast-enhanced multiphasic CT / MRI and urgent urology/oncology consult for staging and characterization."
        else:
            primary_diag = f"{pred_class} Detected"
            severity = "Investigate"
            urgency = "Clinical Review"
            recommendation = "Clinical evaluation indicated."

        # 7. Grad-CAM only for focal anomalies (Stone, Cyst, Tumor) — suppressed for Normal
        if pred_class != "Normal":
            target_logit = output[0, pred_idx]
            target_logit.backward()

            cam_result = generate_pytorch_gradcam(
                model=master_model,
                tensor=tensor,
                class_idx=pred_idx,
                cleaned_pil=cleaned_pil,
                pred_class=pred_class,
                confidence_pct=confidence_pct,
                primary_diag=primary_diag,
                severity=severity,
                filename=filename
            )
            diam_mm = cam_result.get("estimated_diameter_mm", 0.0)
        else:
            cam_result = {
                "gradcam_image": None,
                "peak_coordinates": None,
                "estimated_diameter_mm": 0.0,
                "visualization_base64": None,
            }
            diam_mm = 0.0

        logger.info(
            f"[INFERENCE] Prediction: {pred_class} ({confidence_pct}%), "
            f"Gate: Passed ({kidney_prob * 100:.1f}%), Status: {triage_status}"
        )

        return {
            "task": AI_TASK_DESCRIPTION,
            "prediction": pred_class,
            "predicted_class": pred_class,
            "confidence": confidence_pct,
            "confidence_percent": confidence_pct,
            "probability": round(float(probs[pred_idx]), 4),
            "class_probabilities": class_probs,
            "has_stone": has_stone,
            "has_tumor": has_tumor,
            "has_cyst": has_cyst,
            "is_normal": is_normal,
            "stone_probability": class_probs.get("Stone", 0.0),
            "cyst_probability": class_probs.get("Cyst", 0.0),
            "tumor_probability": class_probs.get("Tumor", 0.0),
            "normal_probability": class_probs.get("Normal", 0.0),
            "primary_diagnosis": primary_diag,
            "is_uncertain": is_uncertain,
            "status": triage_status,
            "review_reason": review_reason,
            "model_version": "ConvNeXt-Tiny Master 4-Class SOTA + MobileNetV3 Gate",
            "gradcam_image": cam_result.get("gradcam_image"),
            "heatmap_url": cam_result.get("gradcam_image"),
            "peak_coordinates": cam_result.get("peak_coordinates"),
            "clinical_assessment": {
                "estimated_diameter_mm": diam_mm,
                "severity": severity,
                "urgency": urgency,
                "recommendation": recommendation,
            },
            "gate_evaluation": {
                "gate_passed": True,
                "kidney_confidence_percent": round(kidney_prob * 100, 2),
                "non_kidney_probability_percent": round(non_kidney_prob * 100, 2),
            },
            "telemetry": {
                "auto_masking": mask_telemetry,
                "classes_evaluated": CLASS_NAMES,
                "device": str(device)
            },
            "cleaned_scan_base64": cam_result.get("cleaned_scan_base64"),
            "visualization_base64": cam_result.get("visualization_base64")
        }, None, 200

    except Exception as e:
        logger.error(f"Inference execution error: {str(e)}", exc_info=True)
        return None, f"Error during neural network inference: {str(e)}", 500
