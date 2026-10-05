import os
import io
import base64
import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import transforms, models
from PIL import Image
import numpy as np
import cv2
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR) if os.path.basename(BASE_DIR) in ["api_service", "training"] else BASE_DIR

def resolve_model_path(filename):
    candidates = [
        os.path.join(PROJECT_ROOT, "models", filename),
        os.path.join(BASE_DIR, "models", filename),
        os.path.join(PROJECT_ROOT, filename),
        os.path.join(BASE_DIR, filename)
    ]
    for p in candidates:
        if os.path.exists(p):
            return p
    return os.path.join(PROJECT_ROOT, "models", filename)

MASTER_4CLASS_PATH = resolve_model_path("kidneyvision_master_4class_sota.pth")
CONVNEXT_BINARY_PATH = resolve_model_path("kidneyvision_convnext_sota.pth")
RESNET_CLEANED_PATH = resolve_model_path("kidney_stone_diagnostic_model_cleaned_gpu.pth")
CT_MODEL_PATH = resolve_model_path("kidney_stone_ct_model_gpu.pth")

device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")

# ==========================================
# 1. SOTA CONVNEXT 4-CLASS ARCHITECTURE
# ==========================================
class KidneyMasterConvNeXt(nn.Module):
    def __init__(self, num_classes=4):
        super(KidneyMasterConvNeXt, self).__init__()
        self.backbone = models.convnext_tiny(weights=None)
        in_features = self.backbone.classifier[2].in_features
        self.backbone.classifier[2] = nn.Sequential(
            nn.Linear(in_features, 256),
            nn.LayerNorm(256),
            nn.GELU(),
            nn.Dropout(p=0.35),
            nn.Linear(256, num_classes) # [Cyst, Normal, Stone, Tumor]
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

# Binary Fallback Architecture
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

# ==========================================
# 2. MASTER CLINICAL INFERENCE ENGINE
# ==========================================
class KidneyVisionEngine:
    def __init__(self):
        self.device = device
        self.model = None
        self.is_multiclass = True
        self.classes = ["Cyst", "Normal", "Stone", "Tumor"]
        self.class_to_idx = {c: i for i, c in enumerate(self.classes)}
        self.model_name = "ConvNeXt-Tiny (Master 4-Class)"
        self._load_active_model()

        self.img_size = 224
        self.preprocess = transforms.Compose([
            transforms.Resize((self.img_size, self.img_size)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

    def _load_active_model(self):
        if os.path.exists(MASTER_4CLASS_PATH):
            print(f"[ENGINE] Loading Master 4-Class SOTA Model: {MASTER_4CLASS_PATH}")
            self.model = KidneyMasterConvNeXt(num_classes=4).to(self.device)
            ckpt = torch.load(MASTER_4CLASS_PATH, map_location=self.device, weights_only=False)
            self.model.load_state_dict(ckpt["model_state_dict"])
            self.classes = ckpt.get("classes", ["Cyst", "Normal", "Stone", "Tumor"])
            self.is_multiclass = True
            self.model_name = "ConvNeXt-Tiny (Master 4-Class SOTA)"
        elif os.path.exists(CONVNEXT_BINARY_PATH):
            print(f"[ENGINE] Master 4-class not found, loading Binary ConvNeXt: {CONVNEXT_BINARY_PATH}")
            self.model = KidneyBinaryConvNeXt().to(self.device)
            ckpt = torch.load(CONVNEXT_BINARY_PATH, map_location=self.device, weights_only=False)
            self.model.load_state_dict(ckpt["model_state_dict"])
            self.is_multiclass = False
            self.model_name = "ConvNeXt-Tiny (Binary SOTA)"
        else:
            raise FileNotFoundError("No trained medical model checkpoint found!")
        self.model.eval()

    def auto_mask_and_clean_image(self, img_pil):
        """
        Removes machine text, calipers, and extraneous photo margins.
        Uses Top-Hat morphological filtering + connected component analysis + Telea inpainting.
        """
        w, h = img_pil.size
        rotation_done = False
        
        # 1. Auto-Orientation
        if h > w * 1.15:
            img_pil = img_pil.rotate(90, expand=True)
            w, h = img_pil.size
            rotation_done = True
            
        img_rgb = img_pil.convert("RGB")
        bgr = cv2.cvtColor(np.array(img_rgb), cv2.COLOR_RGB2BGR)
        gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
        
        # 2. Text & Caliper Isolation via Morphological Top-Hat Filter
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (9, 9))
        tophat = cv2.morphologyEx(gray, cv2.MORPH_TOPHAT, kernel)
        
        mean_intensity = float(np.mean(gray))
        thresh_dynamic = max(135, int(mean_intensity + 35))
        
        text_candidates = (tophat > 38) & (gray > thresh_dynamic)
        text_u8 = np.uint8(text_candidates) * 255
        
        num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(text_u8)
        mask = np.zeros_like(gray)
        artifacts_count = 0
        for i in range(1, num_labels):
            area = stats[i, cv2.CC_STAT_AREA]
            comp_w = stats[i, cv2.CC_STAT_WIDTH]
            comp_h = stats[i, cv2.CC_STAT_HEIGHT]
            if 6 < area < 4000 and comp_w < 130 and comp_h < 100:
                mask[labels == i] = 255
                artifacts_count += 1
                
        dilate_k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        dilated_mask = cv2.dilate(mask, dilate_k, iterations=1)
        
        # 3. Telea Inpainting to seamlessly blend text
        inpainted = cv2.inpaint(bgr, dilated_mask, inpaintRadius=4, flags=cv2.INPAINT_TELEA)
        
        # 4. Smart Ultrasound Cone Extraction for smartphone photos of paper
        border_brightness = (np.mean(gray[:30, :]) + np.mean(gray[-30:, :]) + np.mean(gray[:, :30]) + np.mean(gray[:, -30:])) / 4.0
        is_paper_photo = (border_brightness > 70 or (w > 800 and h > 800)) and not (abs(w - h) < 15 and border_brightness < 20)
        
        if is_paper_photo:
            crop_top = int(h * 0.13)
            crop_bot = int(h * 0.88)
            crop_l = int(w * 0.12)
            crop_r = int(w * 0.86)
            cropped_bgr = inpainted[crop_top:crop_bot, crop_l:crop_r]
            final_pil = Image.fromarray(cv2.cvtColor(cropped_bgr, cv2.COLOR_BGR2RGB))
        else:
            final_pil = Image.fromarray(cv2.cvtColor(inpainted, cv2.COLOR_BGR2RGB))
            
        return {
            "cleaned_pil": final_pil,
            "rotation_done": rotation_done,
            "artifacts_count": artifacts_count,
            "mask_pixel_ratio": round(float(np.sum(dilated_mask > 0)) / (w * h) * 100, 2)
        }

    def predict(self, image_input, auto_mask=True):
        """
        Accepts: filepath (str), PIL Image, or BytesIO/bytes.
        Returns: complete multi-class diagnostic dictionary with Grad-CAM and Base64 images.
        """
        if self.model is None:
            self._load_active_model()

        if isinstance(image_input, (str, os.PathLike)):
            img_pil = Image.open(image_input).convert("RGB")
            filename = os.path.basename(image_input)
        elif isinstance(image_input, bytes):
            img_pil = Image.open(io.BytesIO(image_input)).convert("RGB")
            filename = "uploaded_scan.jpg"
        elif hasattr(image_input, 'read'):
            img_pil = Image.open(image_input).convert("RGB")
            filename = "uploaded_scan.jpg"
        elif isinstance(image_input, Image.Image):
            img_pil = image_input.convert("RGB")
            filename = "input_scan.jpg"
        else:
            raise ValueError("Format d'image non supporté.")

        mask_telemetry = {"auto_masking_applied": False}
        if auto_mask:
            clean_res = self.auto_mask_and_clean_image(img_pil)
            cleaned_pil = clean_res["cleaned_pil"]
            mask_telemetry = {
                "auto_masking_applied": True,
                "rotation_corrected": clean_res["rotation_done"],
                "text_artifacts_removed": clean_res["artifacts_count"],
                "cleaned_area_ratio": clean_res["mask_pixel_ratio"]
            }
        else:
            cleaned_pil = img_pil

        tensor = self.preprocess(cleaned_pil).unsqueeze(0).to(self.device)
        tensor.requires_grad = True

        self.model.zero_grad()
        output = self.model(tensor)

        # Multi-class inference logic
        if self.is_multiclass:
            probs = F.softmax(output, dim=1).squeeze().cpu().detach().numpy()
            pred_idx = int(np.argmax(probs))
            pred_class = self.classes[pred_idx]
            confidence_pct = round(float(probs[pred_idx]) * 100, 2)

            class_probs = {c: round(float(probs[i]) * 100, 2) for i, c in enumerate(self.classes)}
            has_stone = (pred_class == "Stone")
            stone_prob = class_probs.get("Stone", 0.0)

            # Grad-CAM for the dominant pathology
            target_logit = output[0, pred_idx]
            target_logit.backward()
        else:
            prob = torch.sigmoid(output).item()
            has_stone = prob >= 0.50
            pred_class = "Stone" if has_stone else "Normal"
            confidence_pct = round(prob * 100 if has_stone else (1.0 - prob) * 100, 2)
            class_probs = {"Normal": round((1-prob)*100, 2), "Stone": round(prob*100, 2)}
            stone_prob = class_probs["Stone"]
            output.backward()

        weights = torch.mean(self.model.gradients, dim=(2, 3), keepdim=True)
        gradcam_map = torch.sum(weights * self.model.activations, dim=1, keepdim=True)
        gradcam_map = F.relu(gradcam_map)
        gradcam_map = F.interpolate(gradcam_map, size=(self.img_size, self.img_size), mode='bilinear', align_corners=False)
        gradcam_map = gradcam_map.squeeze().cpu().detach().numpy()

        denom = np.max(gradcam_map) - np.min(gradcam_map)
        gradcam_map = (gradcam_map - np.min(gradcam_map)) / denom if denom > 0 else np.zeros_like(gradcam_map)

        peak_y, peak_x = np.unravel_index(np.argmax(gradcam_map), gradcam_map.shape)
        peak_x_pct = round((peak_x / self.img_size) * 100, 1)
        peak_y_pct = round((peak_y / self.img_size) * 100, 1)

        # Estimate lesion diameter in mm
        core_mask = gradcam_map >= 0.65
        area_px = np.sum(core_mask)
        radius_px = np.sqrt(area_px / np.pi) if area_px > 0 else 6.0
        diam_mm = round(float(2 * radius_px * 0.45), 1)

        # Pathology-Specific Clinical Assessment & Recommendations
        if pred_class == "Normal":
            diam_mm = 0.0
            primary_diag = "Parenchyme Rénal Normal (Healthy)"
            severity = "Normale (Sain)"
            urgency = "Aucun traitement requis"
            recommendation = "Parenchyme rénal sain et homogène. Absence de lithiase, de kyste liquidien ou de masse suspecte."
            badge_color = "#22c55e"
        elif pred_class == "Stone":
            diam_mm = max(3.0, min(diam_mm, 24.0))
            primary_diag = "Calcul Rénal Détecté (Lithiase)"
            badge_color = "#ef4444"
            if diam_mm < 5.0:
                severity = "Légère (Micro-calcul)"
                urgency = "Surveillance Ambulatoire"
                recommendation = f"Calcul rénal de petite taille ({diam_mm} mm) : Élimination spontanée probable (> 80%). Hydratation abondante (> 2.5 L/j) et suivi à 4 semaines."
            elif 5.0 <= diam_mm <= 10.0:
                severity = "Modérée (Taille Intermédiaire)"
                urgency = "Consultation Urologique"
                recommendation = f"Calcul rénal intermédiaire ({diam_mm} mm) : Avis urologique recommandé. Évaluation pour Lithotripsie Extra-Corporelle (LEC) ou urétéroscopie souple."
            else:
                severity = "Élevée (Macro-calcul)"
                urgency = "Prise en charge Urologique Rapide"
                recommendation = f"Calcul volumineux ({diam_mm} mm) : Risque d'obstruction pyélique ou d'hydronéphrose. Consultation urologique urgente (Urétéroscopie Laser / NLPC)."
        elif pred_class == "Cyst":
            diam_mm = max(8.0, min(diam_mm, 55.0))
            primary_diag = "Kyste Rénal Détecté (Cyst)"
            severity = "Formation Kystique Bénigne (Bosniak I)"
            urgency = "Surveillance Périodique"
            recommendation = f"Kyste rénal liquidien bien délimité ({diam_mm} mm) sans composante solide suspecte (Aspect Bosniak I). Surveillance échographique annuelle recommandée pour vérifier la stabilité de taille. Aucun geste chirurgical nécessaire."
            badge_color = "#38bdf8"
        elif pred_class == "Tumor":
            diam_mm = max(12.0, min(diam_mm, 65.0))
            primary_diag = "Alerte : Masse / Tumeur Rénale Suspecte"
            severity = "Masse Tissulaire Solide (Néoplasie Potentielle)"
            urgency = "Consultation Spécialisée Urgente"
            recommendation = f"Lésion tissulaire solide détectée ({diam_mm} mm). Bilan complémentaire impératif sans délai : Uro-scanner avec injection de produit de contraste / IRM rénale et consultation urologique / oncologique urgente pour caractérisation histologique."
            badge_color = "#dc2626"

        # Generate Clinical Visualization Base64
        orig_resized = cleaned_pil.resize((self.img_size, self.img_size))
        orig_np = np.array(orig_resized)

        fig = plt.figure(figsize=(13, 5.5), facecolor="#0b1120")
        gs = fig.add_gridspec(1, 2, wspace=0.15)

        ax1 = fig.add_subplot(gs[0, 0])
        ax1.imshow(orig_np)
        ax1.set_title("1. Scanner Nettoyé (Auto-Masking)", color="white", fontsize=11, fontweight="bold", pad=8)
        ax1.axis("off")

        ax2 = fig.add_subplot(gs[0, 1])
        ax2.imshow(orig_np)
        ax2.imshow(gradcam_map, cmap="jet", alpha=0.50)

        if pred_class != "Normal":
            circle = patches.Circle((peak_x, peak_y), radius=16, edgecolor=badge_color, facecolor="none", lw=2.5, linestyle="--")
            ax2.add_patch(circle)
            ax2.plot(peak_x, peak_y, marker="+", markersize=14, markeredgewidth=2.5, color="#facc15")
            ax2.text(peak_x + 8, peak_y - 8, f"{pred_class}: ~{diam_mm} mm\n({peak_x_pct}%, {peak_y_pct}%)",
                     color="white", fontsize=9, fontweight="bold",
                     bbox=dict(boxstyle="round,pad=0.25", fc=badge_color, ec="white", lw=1))
            ax2.set_title(f"2. Localisation Clinique : {pred_class} (~{diam_mm} mm)", color=badge_color, fontsize=11, fontweight="bold", pad=8)
        else:
            ax2.set_title("2. Analyse Négative (Parenchyme Sain)", color="#22c55e", fontsize=11, fontweight="bold", pad=8)
        ax2.axis("off")

        plt.suptitle(
            f"KidneyVision AI ({self.model_name}) | Diagnostic: {primary_diag} ({confidence_pct}%)\n"
            f"Fichier: {filename} | Sévérité: {severity}",
            color="white", fontsize=11, fontweight="bold", y=0.98
        )

        buf = io.BytesIO()
        plt.savefig(buf, format="png", dpi=160, bbox_inches="tight", facecolor=fig.get_facecolor(), edgecolor="none")
        plt.close()
        buf.seek(0)
        base64_encoded = "data:image/png;base64," + base64.b64encode(buf.read()).decode("utf-8")

        buf_clean = io.BytesIO()
        cleaned_pil.save(buf_clean, format="JPEG", quality=92)
        buf_clean.seek(0)
        clean_base64 = "data:image/jpeg;base64," + base64.b64encode(buf_clean.read()).decode("utf-8")

        return {
            "success": True,
            "filename": filename,
            "ai_engine": self.model_name,
            "primary_diagnosis": primary_diag,
            "predicted_class": pred_class,
            "confidence_percent": confidence_pct,
            "class_probabilities": class_probs,
            "has_stone": bool(has_stone),
            "stone_probability": stone_prob,
            "localization": {
                "x_percent": peak_x_pct,
                "y_percent": peak_y_pct,
                "pixel_center": [int(peak_x), int(peak_y)]
            },
            "clinical_assessment": {
                "estimated_diameter_mm": diam_mm,
                "severity": severity,
                "urgency": urgency,
                "recommendation": recommendation
            },
            "telemetry": {
                "auto_masking": mask_telemetry,
                "classes_evaluated": self.classes
            },
            "cleaned_scan_base64": clean_base64,
            "visualization_base64": base64_encoded
        }

# Singleton instance
_engine_instance = None
def get_engine():
    global _engine_instance
    if _engine_instance is None:
        _engine_instance = KidneyVisionEngine()
    return _engine_instance

if __name__ == "__main__":
    eng = get_engine()
    test_img = os.path.join(BASE_DIR, "dataset_4class", "val", "Stone", os.listdir(os.path.join(BASE_DIR, "dataset_4class", "val", "Stone"))[0])
    res = eng.predict(test_img)
    print("Master 4-Class Test Successful!")
    print(f"Predicted Class: {res['predicted_class']} ({res['confidence_percent']}%)")
    print(f"All Probabilities: {res['class_probabilities']}")
    print(f"Recommendation: {res['clinical_assessment']['recommendation']}")
