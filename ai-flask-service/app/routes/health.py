"""
Health check blueprint for KidneyVision AI microservice.
"""
from flask import Blueprint, jsonify
from app.inference.model_loader import get_master_model, get_gate_model, get_device
from app.config import CLASS_NAMES

health_bp = Blueprint('health', __name__)

@health_bp.route('/health', methods=['GET'])
@health_bp.route('/api/health', methods=['GET'])
def health_check():
    """Health endpoint reporting model availability, gatekeeper status, and hardware acceleration."""
    master = get_master_model()
    gate = get_gate_model()
    device = get_device()

    if master is None:
        return jsonify({
            "status": "unhealthy",
            "message": "Master ConvNeXt-Tiny model not loaded",
            "gpu_available": str(device).startswith("cuda")
        }), 503

    return jsonify({
        "status": "healthy",
        "service": "KidneyVision AI Multi-Pathology Diagnostic Service",
        "models": {
            "master_model": "ConvNeXt-Tiny (Master 4-Class SOTA)",
            "gatekeeper_model": "MobileNetV3-Small (Kidney Gate)",
            "gate_active": gate is not None
        },
        "supported_classes": CLASS_NAMES,
        "device": str(device),
        "gpu_available": str(device).startswith("cuda")
    }), 200
