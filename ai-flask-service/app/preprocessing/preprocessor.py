"""
Image preprocessor and clinical auto-masking/cleaning engine.
"""
import numpy as np
import cv2
import torch
from torchvision import transforms
from PIL import Image
from app.config import IMG_HEIGHT, IMG_WIDTH

torch_transform = transforms.Compose([
    transforms.Resize((IMG_HEIGHT, IMG_WIDTH)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

def auto_mask_and_clean_image(img_pil: Image.Image) -> dict:
    """
    Removes machine text, calipers, and extraneous photo margins.
    Uses Top-Hat morphological filtering + connected component analysis + Telea inpainting.
    """
    try:
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
        border_brightness = (
            np.mean(gray[:30, :]) + np.mean(gray[-30:, :]) + np.mean(gray[:, :30]) + np.mean(gray[:, -30:])
        ) / 4.0
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
    except Exception:
        # Fallback to original image if opencv processing encounters rare issue
        return {
            "cleaned_pil": img_pil.convert("RGB"),
            "rotation_done": False,
            "artifacts_count": 0,
            "mask_pixel_ratio": 0.0
        }

def preprocess_for_torch(img_pil: Image.Image, device) -> torch.Tensor:
    """Preprocess PIL image into a normalized PyTorch tensor batch (1, 3, 224, 224)."""
    if img_pil.mode != 'RGB':
        img_pil = img_pil.convert('RGB')
    tensor = torch_transform(img_pil).unsqueeze(0).to(device)
    return tensor

def preprocess_image(img: Image.Image) -> np.ndarray:
    """Backwards compatibility for tests expecting NumPy array."""
    if img.mode != 'RGB':
        img = img.convert('RGB')
    img_resized = img.resize((IMG_WIDTH, IMG_HEIGHT), Image.Resampling.BILINEAR)
    return np.expand_dims(np.array(img_resized, dtype=np.float32), axis=0)
