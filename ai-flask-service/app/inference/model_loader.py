"""
PyTorch SOTA Model loader for KidneyVision AI:
1. Stage-1 Gatekeeper: MobileNetV3-Small (Kidney Scan vs Non-Kidney / OOD X-rays)
2. Stage-2 Master Diagnostician: ConvNeXt-Tiny (4 Pathologies: Cyst, Normal, Stone, Tumor)
3. Stage-2 Ultrasound Fallback: ConvNeXt-Tiny (Binary: Normal, Stone)
"""
import os
import logging
import torch
import torch.nn as nn
from torchvision import models, transforms
from app.config import (
    MASTER_MODEL_PATH,
    GATE_MODEL_PATH,
    ULTRASOUND_MODEL_PATH,
    IMG_HEIGHT,
    IMG_WIDTH,
    CLASS_NAMES
)

logger = logging.getLogger(__name__)
device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")

# ==========================================
# 1. GATEKEEPER MOBILENETV3-SMALL
# ==========================================
class KidneyGateMobileNetV3(nn.Module):
    def __init__(self):
        super(KidneyGateMobileNetV3, self).__init__()
        self.backbone = models.mobilenet_v3_small(weights=None)
        in_features = self.backbone.classifier[0].in_features  # 576
        self.backbone.classifier = nn.Sequential(
            nn.Linear(in_features, 128),
            nn.BatchNorm1d(128),
            nn.Hardswish(),
            nn.Dropout(p=0.2),
            nn.Linear(128, 1)
        )

    def forward(self, x):
        return self.backbone(x)

# ==========================================
# 2. MASTER 4-CLASS CONVNEXT-TINY
# ==========================================
class KidneyMasterConvNeXt(nn.Module):
    def __init__(self, num_classes=4):
        super(KidneyMasterConvNeXt, self).__init__()
        self.backbone = models.convnext_tiny(weights=None)
        in_features = self.backbone.classifier[2].in_features  # 768
        self.backbone.classifier[2] = nn.Sequential(
            nn.Linear(in_features, 256),
            nn.LayerNorm(256),
            nn.GELU(),
            nn.Dropout(p=0.35),
            nn.Linear(256, num_classes)  # [Cyst, Normal, Stone, Tumor]
        )
        self.gradients = None
        self.activations = None
        # Register hooks for Grad-CAM
        self.backbone.features[7].register_forward_hook(self._save_activations)
        self.backbone.features[7].register_full_backward_hook(self._save_gradients)

    def _save_activations(self, module, input, output):
        self.activations = output

    def _save_gradients(self, module, grad_input, grad_output):
        self.gradients = grad_output[0]

    def forward(self, x):
        return self.backbone(x)

# ==========================================
# 3. BINARY CONVNEXT-TINY FALLBACK
# ==========================================
class KidneyBinaryConvNeXt(nn.Module):
    def __init__(self):
        super(KidneyBinaryConvNeXt, self).__init__()
        self.backbone = models.convnext_tiny(weights=None)
        in_features = self.backbone.classifier[2].in_features
        self.backbone.classifier[2] = nn.Sequential(
            nn.Linear(in_features, 128),
            nn.GELU(),
            nn.Dropout(p=0.3),
            nn.Linear(128, 1)
        )
        self.gradients = None
        self.activations = None
        self.backbone.features[7].register_forward_hook(self._save_activations)
        self.backbone.features[7].register_full_backward_hook(self._save_gradients)

    def _save_activations(self, module, input, output):
        self.activations = output

    def _save_gradients(self, module, grad_input, grad_output):
        self.gradients = grad_output[0]

    def forward(self, x):
        return self.backbone(x)

# Singleton model instances
_gate_model_instance = None
_master_model_instance = None
_ultrasound_model_instance = None

def get_device():
    return device

def get_gate_model():
    """Retrieve the Stage-1 Gatekeeper model instance."""
    global _gate_model_instance
    if _gate_model_instance is None:
        load_gate_model()
    return _gate_model_instance

def get_master_model():
    """Retrieve the Stage-2 Master 4-Class ConvNeXt model instance."""
    global _master_model_instance
    if _master_model_instance is None:
        load_master_model()
    return _master_model_instance

def get_ultrasound_model():
    """Retrieve the Stage-2 Ultrasound binary ConvNeXt model instance."""
    global _ultrasound_model_instance
    if _ultrasound_model_instance is None:
        load_ultrasound_model()
    return _ultrasound_model_instance

def load_gate_model():
    """Load and initialize Stage-1 Gatekeeper."""
    global _gate_model_instance
    try:
        if not os.path.exists(GATE_MODEL_PATH):
            logger.warning(f"Gate model checkpoint not found at: {GATE_MODEL_PATH}")
            return None
        logger.info(f"Loading Stage-1 Gatekeeper model from {GATE_MODEL_PATH} ({device})...")
        model = KidneyGateMobileNetV3().to(device)
        ckpt = torch.load(GATE_MODEL_PATH, map_location=device, weights_only=False)
        model.load_state_dict(ckpt['model_state_dict'])
        model.eval()
        _gate_model_instance = model
        logger.info("Stage-1 Gatekeeper model loaded successfully.")
        return _gate_model_instance
    except Exception as e:
        logger.error(f"Failed to load Gate model: {str(e)}")
        return None

def load_master_model():
    """Load and initialize Stage-2 Master 4-Class ConvNeXt."""
    global _master_model_instance
    try:
        if not os.path.exists(MASTER_MODEL_PATH):
            logger.error(f"Master 4-Class checkpoint not found at: {MASTER_MODEL_PATH}")
            return None
        logger.info(f"Loading Stage-2 Master 4-Class ConvNeXt from {MASTER_MODEL_PATH} ({device})...")
        model = KidneyMasterConvNeXt(num_classes=4).to(device)
        ckpt = torch.load(MASTER_MODEL_PATH, map_location=device, weights_only=False)
        model.load_state_dict(ckpt['model_state_dict'])
        model.eval()
        _master_model_instance = model
        logger.info("Stage-2 Master 4-Class ConvNeXt loaded successfully.")
        return _master_model_instance
    except Exception as e:
        logger.error(f"Failed to load Master model: {str(e)}")
        return None

def load_ultrasound_model():
    """Load and initialize Stage-2 Ultrasound binary model."""
    global _ultrasound_model_instance
    try:
        if not os.path.exists(ULTRASOUND_MODEL_PATH):
            return None
        logger.info(f"Loading Ultrasound ConvNeXt from {ULTRASOUND_MODEL_PATH} ({device})...")
        model = KidneyBinaryConvNeXt().to(device)
        ckpt = torch.load(ULTRASOUND_MODEL_PATH, map_location=device, weights_only=False)
        model.load_state_dict(ckpt['model_state_dict'])
        model.eval()
        _ultrasound_model_instance = model
        return _ultrasound_model_instance
    except Exception as e:
        logger.warning(f"Failed to load Ultrasound model: {str(e)}")
        return None

def load_model():
    """Load all models and perform warm-up."""
    logger.info("Initializing KidneyVision AI Dual-Stage Models...")
    load_gate_model()
    master = load_master_model()
    load_ultrasound_model()

    if master is not None:
        try:
            logger.info("Warming up inference pipeline...")
            dummy = torch.zeros(1, 3, IMG_HEIGHT, IMG_WIDTH).to(device)
            with torch.no_grad():
                if _gate_model_instance:
                    _gate_model_instance(dummy)
                master(dummy)
            logger.info("Inference warm-up completed successfully.")
        except Exception as e:
            logger.warning(f"Warm-up exception: {str(e)}")

    return master

# Backwards compatible alias
get_model = get_master_model
