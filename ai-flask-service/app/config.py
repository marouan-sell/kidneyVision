"""
Configuration constants for KidneyVision AI Flask microservice.
"""
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")

# SOTA Model Checkpoint Paths
MASTER_MODEL_PATH = os.environ.get(
    "MASTER_MODEL_PATH",
    os.path.join(MODELS_DIR, "kidneyvision_master_4class_sota.pth")
)
GATE_MODEL_PATH = os.environ.get(
    "GATE_MODEL_PATH",
    os.path.join(MODELS_DIR, "kidney_gate_model_gpu.pth")
)
ULTRASOUND_MODEL_PATH = os.environ.get(
    "ULTRASOUND_MODEL_PATH",
    os.path.join(MODELS_DIR, "kidneyvision_convnext_sota.pth")
)

# File Upload Limits
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp', 'bmp', 'tiff'}
MAX_FILE_SIZE = 15 * 1024 * 1024  # 15 MB

# Neural Network Input Specifications
IMG_HEIGHT = 224
IMG_WIDTH = 224
CLASS_NAMES = ["Cyst", "Normal", "Stone", "Tumor"]
NUM_CLASSES = 4

# Gate Admission Settings
GATE_THRESHOLD = 0.75  # Reject if non-kidney probability >= 0.75

# Uncertainty & Clinical Triage Boundary (4-Class Model, baseline 25%)
MIN_CONFIDENCE_THRESHOLD = 40.0
AI_TASK_DESCRIPTION = "Multi-Pathology Kidney Diagnostic & Gate System"

# Medical Image Validation
MAX_COLOR_SATURATION = 45.0   # Grayscale consistency threshold
MIN_DARK_PIXEL_RATIO = 0.10   # Medical scan dark background ratio
DARK_PIXEL_THRESHOLD = 60     # Background pixel threshold (0-255)
