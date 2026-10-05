import os
import sys
import time
import random
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score, f1_score

SEED = 42
random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)
if torch.cuda.is_available():
    torch.cuda.manual_seed_all(SEED)

print("="*75)
print(" KidneyVision AI - Master Multi-Pathology ConvNeXt-Tiny Training (GPU)")
print(" Classes (4): Cyst | Normal | Stone | Tumor")
print(" Hardware: NVIDIA GeForce RTX 4060 Laptop GPU")
print("="*75)

device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
if device.type == "cuda":
    print(f"[GPU ACTIVE] {torch.cuda.get_device_name(0)}")
    print(f"[VRAM] Total Available: {torch.cuda.get_device_properties(0).total_memory / (1024**3):.2f} GB")
else:
    print("[ERROR] CUDA GPU required.")
    sys.exit(1)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR) if os.path.basename(BASE_DIR) == "training" else BASE_DIR

if os.path.exists(os.path.join(PROJECT_ROOT, "datasets", "dataset_4class")):
    DATASET_DIR = os.path.join(PROJECT_ROOT, "datasets", "dataset_4class")
elif os.path.exists(os.path.join(PROJECT_ROOT, "dataset_4class")):
    DATASET_DIR = os.path.join(PROJECT_ROOT, "dataset_4class")
else:
    DATASET_DIR = os.path.join(BASE_DIR, "dataset_4class")

TRAIN_DIR = os.path.join(DATASET_DIR, "train")
VAL_DIR = os.path.join(DATASET_DIR, "val")

BATCH_SIZE = 32
IMG_SIZE = 224
NUM_CLASSES = 4
MODEL_SAVE_PATH = os.path.join(PROJECT_ROOT, "models", "kidneyvision_master_4class_sota.pth")

# Data Augmentation for Multi-Pathology Axial CT
train_transforms = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.RandomHorizontalFlip(p=0.5),
    transforms.RandomVerticalFlip(p=0.2),
    transforms.RandomRotation(degrees=15),
    transforms.ColorJitter(brightness=0.20, contrast=0.20),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    transforms.RandomErasing(p=0.25, scale=(0.02, 0.15), value='random')
])

val_transforms = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

print("\n[STEP 1] Loading 4-Class Dataset...")
train_dataset = datasets.ImageFolder(TRAIN_DIR, transform=train_transforms)
val_dataset = datasets.ImageFolder(VAL_DIR, transform=val_transforms)

class_to_idx = train_dataset.class_to_idx
classes = list(class_to_idx.keys())
print(f"Classes Mapping: {class_to_idx}")
print(f"Train Count: {len(train_dataset)} | Val Count: {len(val_dataset)}")

train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=0, pin_memory=True)
val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=0, pin_memory=True)

# Calculate Class Weights to prevent bias toward majority class (Normal)
class_counts = [0] * NUM_CLASSES
for _, label in train_dataset.samples:
    class_counts[label] += 1
print(f"Train Class Counts: {dict(zip(classes, class_counts))}")

total_samples = sum(class_counts)
class_weights = [total_samples / (NUM_CLASSES * count) for count in class_counts]
weights_tensor = torch.tensor(class_weights, dtype=torch.float).to(device)
print(f"Computed Class Weights: {weights_tensor.cpu().numpy().round(3)}")

# Loss with Label Smoothing
criterion = nn.CrossEntropyLoss(weight=weights_tensor, label_smoothing=0.08)

# ==========================================
# 2. CONVNEXT-TINY 4-CLASS ARCHITECTURE
# ==========================================
print("\n[STEP 2] Initializing ConvNeXt-Tiny (Meta AI) for 4 Pathologies...")
class KidneyMasterConvNeXt(nn.Module):
    def __init__(self, num_classes=4):
        super(KidneyMasterConvNeXt, self).__init__()
        self.backbone = models.convnext_tiny(weights=models.ConvNeXt_Tiny_Weights.DEFAULT)
        in_features = self.backbone.classifier[2].in_features # 768
        
        # Clinical 4-class head with LayerNorm and GELU
        self.backbone.classifier[2] = nn.Sequential(
            nn.Linear(in_features, 256),
            nn.LayerNorm(256),
            nn.GELU(),
            nn.Dropout(p=0.35),
            nn.Linear(256, num_classes) # [Cyst, Normal, Stone, Tumor]
        )
        self.gradients = None
        self.activations = None
        
        # Hook features[7] (final stage) for Multi-Class Grad-CAM
        self.backbone.features[7].register_forward_hook(self._save_activations)
        self.backbone.features[7].register_full_backward_hook(self._save_gradients)

    def _save_activations(self, module, input, output):
        self.activations = output

    def _save_gradients(self, module, grad_input, grad_output):
        self.gradients = grad_output[0]

    def forward(self, x):
        return self.backbone(x)

model = KidneyMasterConvNeXt(num_classes=NUM_CLASSES).to(device)
scaler = torch.amp.GradScaler('cuda')

def evaluate():
    model.eval()
    running_loss = 0.0
    all_targets = []
    all_preds = []
    all_probs = []
    
    with torch.no_grad():
        for images, labels in val_loader:
            images = images.to(device, non_blocking=True)
            labels = labels.to(device, non_blocking=True)
            
            with torch.amp.autocast('cuda'):
                outputs = model(images)
                loss = criterion(outputs, labels)
                
            running_loss += loss.item() * images.size(0)
            probs = F.softmax(outputs, dim=1)
            preds = torch.argmax(probs, dim=1)
            
            all_targets.extend(labels.cpu().numpy())
            all_preds.extend(preds.cpu().numpy())
            all_probs.extend(probs.cpu().numpy())
            
    val_loss = running_loss / len(val_dataset)
    all_targets = np.array(all_targets)
    all_preds = np.array(all_preds)
    all_probs = np.array(all_probs)
    
    acc = (all_preds == all_targets).mean()
    macro_f1 = f1_score(all_targets, all_preds, average="macro")
    try:
        val_auc = roc_auc_score(all_targets, all_probs, multi_class="ovr")
    except Exception:
        val_auc = 0.0
    return val_loss, acc, macro_f1, val_auc, all_targets, all_preds

def train_epoch(epoch, total_epochs, optimizer):
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0
    start_time = time.time()
    
    for images, labels in train_loader:
        images = images.to(device, non_blocking=True)
        labels = labels.to(device, non_blocking=True)
        
        optimizer.zero_grad()
        with torch.amp.autocast('cuda'):
            outputs = model(images)
            loss = criterion(outputs, labels)
            
        scaler.scale(loss).backward()
        scaler.step(optimizer)
        scaler.update()
        
        running_loss += loss.item() * images.size(0)
        preds = torch.argmax(outputs, dim=1)
        correct += (preds == labels).sum().item()
        total += labels.size(0)
        
    epoch_time = time.time() - start_time
    epoch_loss = running_loss / total
    epoch_acc = correct / total
    val_loss, val_acc, val_f1, val_auc, _, _ = evaluate()
    print(f"Epoch [{epoch}/{total_epochs}] ({epoch_time:.1f}s) - Train Loss: {epoch_loss:.4f} - Train Acc: {epoch_acc*100:.2f}% | Val Acc: {val_acc*100:.2f}% - Val F1: {val_f1*100:.2f}% - AUC: {val_auc:.4f}")
    return val_f1

# ==========================================
# 3. PHASE 1: TRAIN CLASSIFIER HEAD (Backbone Frozen)
# ==========================================
print("\n" + "="*50)
print(" PHASE 1: CONVNEXT 4-CLASS HEAD TRAINING (3 Epochs)")
print("="*50)
for name, param in model.backbone.named_parameters():
    param.requires_grad = "classifier" in name

optimizer = torch.optim.AdamW(model.backbone.classifier.parameters(), lr=1e-3, weight_decay=1e-2)
for epoch in range(1, 4):
    train_epoch(epoch, 3, optimizer)

# ==========================================
# 4. PHASE 2: SOTA CONVNEXT DEEP FINE-TUNING
# ==========================================
print("\n" + "="*50)
print(" PHASE 2: SOTA DEEP FINE-TUNING (Stages 6, 7 + Classifier - 4 Epochs)")
print("="*50)
for name, param in model.backbone.named_parameters():
    param.requires_grad = any(k in name for k in ["features.6", "features.7", "classifier"])

optimizer = torch.optim.AdamW(filter(lambda p: p.requires_grad, model.parameters()), lr=2.5e-5, weight_decay=1e-2)
best_f1 = 0.0

for epoch in range(1, 5):
    val_f1 = train_epoch(epoch, 4, optimizer)
    if val_f1 > best_f1:
        best_f1 = val_f1
        torch.save({
            "model_state_dict": model.state_dict(),
            "architecture": "ConvNeXt-Tiny-4Class-Master",
            "class_to_idx": class_to_idx,
            "classes": classes,
            "val_f1": val_f1,
            "num_classes": NUM_CLASSES
        }, MODEL_SAVE_PATH)

print(f"\n[GPU SAVE] Master 4-Class Model saved to: {MODEL_SAVE_PATH}")

# ==========================================
# 5. FINAL CLINICAL EVALUATION & REPORTS
# ==========================================
checkpoint = torch.load(MODEL_SAVE_PATH, map_location=device)
model.load_state_dict(checkpoint["model_state_dict"])
_, final_acc, final_f1, final_auc, y_true, y_pred = evaluate()

cm = confusion_matrix(y_true, y_pred)
print(f"\nMASTER 4-CLASS CONFUSION MATRIX:")
print(f"{'':>10} " + " ".join([f"{c:>8}" for c in classes]))
for i, c in enumerate(classes):
    print(f"{c:>10} " + " ".join([f"{cm[i, j]:>8}" for j in range(NUM_CLASSES)]))

print("\nDETAILED 4-PATHOLOGY CLINICAL REPORT:")
print(classification_report(y_true, y_pred, target_names=classes, digits=4))
print(f"Overall Accuracy: {final_acc*100:.2f}%")
print(f"Macro F1-Score: {final_f1*100:.2f}%")
print(f"Multi-Class ROC-AUC (OVR): {final_auc:.4f}")
print("MASTER 4-CLASS TRAINING COMPLETE!")
