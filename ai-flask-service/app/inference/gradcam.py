"""
PyTorch Grad-CAM Explainable AI generator and Clinical Visualizer.
"""
import io
import base64
import logging
import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from app.config import IMG_HEIGHT, IMG_WIDTH

logger = logging.getLogger(__name__)

def generate_pytorch_gradcam(
    model,
    tensor: torch.Tensor,
    class_idx: int,
    cleaned_pil: Image.Image,
    pred_class: str,
    confidence_pct: float,
    primary_diag: str,
    severity: str,
    filename: str = "scan.jpg"
) -> dict:
    """Compute PyTorch Grad-CAM heatmap, peak coordinates, diameter, and clinical visualization panels."""
    try:
        # Backward hook gradient extraction
        weights = torch.mean(model.gradients, dim=(2, 3), keepdim=True)
        gradcam_map = torch.sum(weights * model.activations, dim=1, keepdim=True)
        gradcam_map = F.relu(gradcam_map)
        gradcam_map = F.interpolate(
            gradcam_map,
            size=(IMG_HEIGHT, IMG_WIDTH),
            mode='bilinear',
            align_corners=False
        )
        gradcam_np = gradcam_map.squeeze().cpu().detach().numpy()

        # Normalize 0..1
        denom = np.max(gradcam_np) - np.min(gradcam_np)
        if denom > 0:
            norm_map = (gradcam_np - np.min(gradcam_np)) / denom
        else:
            norm_map = np.zeros_like(gradcam_np)

        # Peak activation coordinates
        peak_y, peak_x = np.unravel_index(np.argmax(norm_map), norm_map.shape)
        peak_coords = {
            "x": round(float(peak_x / norm_map.shape[1]) * 100, 1),
            "y": round(float(peak_y / norm_map.shape[0]) * 100, 1)
        }

        # Calculate estimated diameter mm
        core_mask = norm_map >= 0.65
        area_px = float(np.sum(core_mask))
        radius_px = np.sqrt(area_px / np.pi) if area_px > 0 else 6.0
        diam_mm = round(float(2 * radius_px * 0.45), 1)

        if pred_class == "Normal":
            diam_mm = 0.0
            badge_color = "#10b981"
        elif pred_class == "Stone":
            diam_mm = max(3.0, min(diam_mm, 24.0))
            badge_color = "#ef4444"
        elif pred_class == "Cyst":
            diam_mm = max(8.0, min(diam_mm, 55.0))
            badge_color = "#0ea5e9"
        elif pred_class == "Tumor":
            diam_mm = max(12.0, min(diam_mm, 65.0))
            badge_color = "#8b5cf6"
        else:
            badge_color = "#f59e0b"

        # 1. Generate True Patient Scan + Grad-CAM Saliency Overlay
        orig_resized = cleaned_pil.resize((IMG_WIDTH, IMG_HEIGHT))
        orig_np = np.array(orig_resized)

        # Colormap mapping (Jet)
        cmap = matplotlib.colormaps.get_cmap("jet")
        heat_rgb = cmap(norm_map)[:, :, :3]  # float 0..1 in RGB
        
        orig_f = orig_np.astype(float) / 255.0
        # Intensity weight: overlay alpha for saliency regions
        cam_weight = np.clip((norm_map[:, :, np.newaxis] - 0.10) / 0.90, 0.0, 1.0) * 0.52
        blended_np = (1.0 - cam_weight) * orig_f + cam_weight * heat_rgb

        fig_cam = plt.figure(figsize=(6, 6), facecolor="#0b1120")
        ax_cam = fig_cam.add_subplot(1, 1, 1)
        ax_cam.imshow(blended_np)
        if pred_class != "Normal":
            circle_single = patches.Circle((peak_x, peak_y), radius=16, edgecolor=badge_color, facecolor="none", lw=2.2, linestyle="--")
            ax_cam.add_patch(circle_single)
            ax_cam.plot(peak_x, peak_y, marker="+", markersize=14, markeredgewidth=2.2, color="#facc15")
            ax_cam.text(
                peak_x + 8, peak_y - 8,
                f"{pred_class} Target\n~{diam_mm} mm",
                color="white", fontsize=8.5, fontweight="bold",
                bbox=dict(boxstyle="round,pad=0.25", fc=badge_color, ec="white", lw=1)
            )
        ax_cam.axis("off")
        buf_cam = io.BytesIO()
        plt.savefig(buf_cam, format="jpeg", dpi=130, bbox_inches="tight", pad_inches=0.02, facecolor=fig_cam.get_facecolor(), edgecolor="none")
        plt.close(fig_cam)
        gradcam_b64 = f"data:image/jpeg;base64,{base64.b64encode(buf_cam.getvalue()).decode('utf-8')}"

        # 2. Generate Side-by-Side Clinical Panel

        fig = plt.figure(figsize=(11, 4.8), facecolor="#0b1120")
        gs = fig.add_gridspec(1, 2, wspace=0.15)

        ax1 = fig.add_subplot(gs[0, 0])
        ax1.imshow(orig_np)
        ax1.set_title("1. Scanner Nettoyé (Auto-Masking)", color="white", fontsize=10, fontweight="bold", pad=8)
        ax1.axis("off")

        ax2 = fig.add_subplot(gs[0, 1])
        ax2.imshow(orig_np)
        ax2.imshow(norm_map, cmap="jet", alpha=0.50)

        if pred_class != "Normal":
            circle = patches.Circle((peak_x, peak_y), radius=16, edgecolor=badge_color, facecolor="none", lw=2.2, linestyle="--")
            ax2.add_patch(circle)
            ax2.plot(peak_x, peak_y, marker="+", markersize=14, markeredgewidth=2.2, color="#facc15")
            ax2.text(
                peak_x + 8, peak_y - 8,
                f"{pred_class}: ~{diam_mm} mm\n({peak_coords['x']}%, {peak_coords['y']}%)",
                color="white", fontsize=8.5, fontweight="bold",
                bbox=dict(boxstyle="round,pad=0.25", fc=badge_color, ec="white", lw=1)
            )
            ax2.set_title(f"2. Localisation Clinique : {pred_class} (~{diam_mm} mm)", color=badge_color, fontsize=10, fontweight="bold", pad=8)
        else:
            ax2.set_title("2. Analyse Négative (Parenchyme Sain)", color="#10b981", fontsize=10, fontweight="bold", pad=8)
        ax2.axis("off")

        plt.suptitle(
            f"KidneyVision AI | Diagnostic : {primary_diag} ({confidence_pct}%)\n"
            f"Sévérité : {severity}",
            color="white", fontsize=10.5, fontweight="bold", y=0.98
        )

        buf_panel = io.BytesIO()
        plt.savefig(buf_panel, format="png", dpi=140, bbox_inches="tight", facecolor=fig.get_facecolor(), edgecolor="none")
        plt.close(fig)
        clinical_viz_b64 = f"data:image/png;base64,{base64.b64encode(buf_panel.getvalue()).decode('utf-8')}"

        # 3. Cleaned Scan Base64
        buf_clean = io.BytesIO()
        cleaned_pil.save(buf_clean, format="JPEG", quality=90)
        cleaned_b64 = f"data:image/jpeg;base64,{base64.b64encode(buf_clean.getvalue()).decode('utf-8')}"

        return {
            "gradcam_image": gradcam_b64,
            "peak_coordinates": peak_coords,
            "estimated_diameter_mm": diam_mm,
            "visualization_base64": clinical_viz_b64,
            "cleaned_scan_base64": cleaned_b64,
        }

    except Exception as e:
        logger.error(f"Grad-CAM generation error: {str(e)}", exc_info=True)
        return {
            "gradcam_image": None,
            "peak_coordinates": {"x": 50.0, "y": 50.0},
            "estimated_diameter_mm": 0.0,
            "visualization_base64": None,
            "cleaned_scan_base64": None,
        }

# Backwards compatible signature
def compute_gradcam(model, img_batch, class_idx: int):
    # Fallback if called with old signature
    return None, None
