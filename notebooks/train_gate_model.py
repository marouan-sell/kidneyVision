"""
KidneyVision AI — Stage 1 Gate Model Training Script
Binary AI Filter: Kidney Scan vs. Non-Kidney (Chest X-ray, Bone X-ray, Dental X-ray, etc.)

Usage:
    python train_gate_model.py --dataset-dir /path/to/dataset_gate --output-model kidney_gate_model.keras
"""
import os
import sys
import glob
import hashlib
import random
import argparse
import numpy as np
from PIL import Image

import tensorflow as tf
from tensorflow.keras import layers, models, callbacks, optimizers, metrics

# Reproducibility
SEED = 42
os.environ["PYTHONHASHSEED"] = str(SEED)
random.seed(SEED)
np.random.seed(SEED)
tf.random.set_seed(SEED)


def clean_and_audit_dataset(directory_path: str):
    """Scans directory to remove unreadable, zero-byte, and duplicate images."""
    if not os.path.exists(directory_path):
        print(f"[WARNING] Directory not found: {directory_path}. Skipping audit.")
        return

    valid_extensions = (".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff", ".jfif")
    seen_hashes = set()
    removed_corrupted = 0
    removed_duplicates = 0
    total_valid = 0

    print(f"\n[DATA AUDIT] Auditing images in: {directory_path}...")
    
    for root, _, files in os.walk(directory_path):
        for fname in files:
            fpath = os.path.join(root, fname)
            
            if not fname.lower().endswith(valid_extensions):
                continue

            # Check file size > 0
            if os.path.getsize(fpath) == 0:
                try:
                    os.remove(fpath)
                    removed_corrupted += 1
                except OSError:
                    pass
                continue

            # Verify image format integrity
            try:
                with Image.open(fpath) as img:
                    img.verify()
                
                # MD5 Hash check for duplicate removal
                with open(fpath, "rb") as f:
                    file_hash = hashlib.md5(f.read()).hexdigest()
                    
                if file_hash in seen_hashes:
                    try:
                        os.remove(fpath)
                        removed_duplicates += 1
                    except OSError:
                        pass
                else:
                    seen_hashes.add(file_hash)
                    total_valid += 1

            except Exception:
                try:
                    os.remove(fpath)
                    removed_corrupted += 1
                except OSError:
                    pass

    print(f"Audit Complete for {directory_path}:")
    print(f"  - Valid unique images: {total_valid}")
    print(f"  - Corrupted files removed: {removed_corrupted}")
    print(f"  - Duplicate files removed: {removed_duplicates}")


def build_gate_model(input_shape=(224, 224, 3)):
    """Builds MobileNetV3-Small binary classification model."""
    base_model = tf.keras.applications.MobileNetV3Small(
        input_shape=input_shape,
        include_top=False,
        weights="imagenet"
    )
    base_model.trainable = False  # Frozen for Phase 1

    inputs = tf.keras.Input(shape=input_shape, name="scan_input")
    x = tf.keras.applications.mobilenet_v3.preprocess_input(inputs)
    x = base_model(x, training=False)
    
    # Clinical Triage Head
    x = layers.GlobalAveragePooling2D(name="gap")(x)
    x = layers.BatchNormalization(name="gate_bn1")(x)
    x = layers.Dropout(0.35, name="gate_dropout1")(x)
    x = layers.Dense(128, activation="relu", name="gate_dense1")(x)
    x = layers.BatchNormalization(name="gate_bn2")(x)
    x = layers.Dropout(0.2, name="gate_dropout2")(x)
    outputs = layers.Dense(1, activation="sigmoid", name="kidney_probability")(x)
    
    model = tf.keras.Model(inputs=inputs, outputs=outputs, name="KidneyVision_Gate_MobileNetV3")
    return model, base_model


def main():
    parser = argparse.ArgumentParser(description="Train KidneyVision AI Gate Model with Hard-Negative X-Rays")
    parser.add_argument("--dataset-dir", type=str, default="dataset_gate", help="Path to gate dataset directory")
    parser.add_argument("--train-dir", type=str, default=None, help="Explicit path to train directory")
    parser.add_argument("--val-dir", type=str, default=None, help="Explicit path to val directory")
    parser.add_argument("--img-size", type=int, default=224, help="Target image dimension (default: 224)")
    parser.add_argument("--batch-size", type=int, default=32, help="Batch size (default: 32)")
    parser.add_argument("--epochs-p1", type=int, default=8, help="Phase 1 epochs (frozen backbone)")
    parser.add_argument("--epochs-p2", type=int, default=12, help="Phase 2 epochs (fine-tuning)")
    parser.add_argument("--threshold", type=float, default=0.75, help="Strict admission threshold (default: 0.75)")
    parser.add_argument("--output-model", type=str, default="kidney_gate_model.keras", help="Output .keras file path")
    args = parser.parse_args()

    train_path = args.train_dir or os.path.join(args.dataset_dir, "train")
    val_path = args.val_dir or os.path.join(args.dataset_dir, "val")

    print(f"TensorFlow Version: {tf.__version__}")
    print(f"Train directory: {train_path}")
    print(f"Validation directory: {val_path}")
    print(f"Strict Gate Threshold: {args.threshold * 100:.0f}%")

    # 1. Clean & Audit Dataset
    clean_and_audit_dataset(train_path)
    clean_and_audit_dataset(val_path)

    # 2. tf.data Pipelines with aspect ratio preservation
    img_size = (args.img_size, args.img_size)
    train_raw = tf.keras.utils.image_dataset_from_directory(
        train_path,
        image_size=img_size,
        crop_to_aspect_ratio=True,
        batch_size=args.batch_size,
        label_mode="binary",
        shuffle=True,
        seed=SEED
    )
    val_raw = tf.keras.utils.image_dataset_from_directory(
        val_path,
        image_size=img_size,
        crop_to_aspect_ratio=True,
        batch_size=args.batch_size,
        label_mode="binary",
        shuffle=False
    )

    class_names = train_raw.class_names
    print(f"Classes detected: {class_names}")

    data_augmentation = tf.keras.Sequential([
        layers.RandomFlip("horizontal"),
        layers.RandomRotation(0.08),
        layers.RandomZoom(0.08),
        layers.RandomContrast(0.12),
        layers.RandomBrightness(0.08)
    ], name="gate_data_augmentation")

    AUTOTUNE = tf.data.AUTOTUNE
    train_ds = (
        train_raw.map(lambda x, y: (data_augmentation(x, training=True), y), num_parallel_calls=AUTOTUNE)
                 .shuffle(buffer_size=1000, seed=SEED)
                 .prefetch(buffer_size=AUTOTUNE)
    )
    val_ds = val_raw.prefetch(buffer_size=AUTOTUNE)

    # 3. Build Model
    gate_model, base_backbone = build_gate_model(input_shape=(args.img_size, args.img_size, 3))
    gate_model.summary()

    # 4. Phase 1: Feature Extraction (Head Only)
    print("\n--- Phase 1: Feature Extraction ---")
    gate_model.compile(
        optimizer=optimizers.Adam(learning_rate=1e-3),
        loss="binary_crossentropy",
        metrics=[
            "accuracy",
            metrics.Precision(name="precision"),
            metrics.Recall(name="recall"),
            metrics.AUC(name="auc")
        ]
    )

    cb_p1 = [
        callbacks.EarlyStopping(monitor="val_auc", mode="max", patience=3, restore_best_weights=True, verbose=1),
        callbacks.ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=2, min_lr=1e-6, verbose=1)
    ]
    gate_model.fit(train_ds, validation_data=val_ds, epochs=args.epochs_p1, callbacks=cb_p1)

    # 5. Phase 2: Fine-Tuning Top 35 Layers
    print("\n--- Phase 2: Fine-Tuning ---")
    base_backbone.trainable = True
    for layer in base_backbone.layers[:-35]:
        layer.trainable = False

    gate_model.compile(
        optimizer=optimizers.Adam(learning_rate=1e-5),
        loss="binary_crossentropy",
        metrics=[
            "accuracy",
            metrics.Precision(name="precision"),
            metrics.Recall(name="recall"),
            metrics.AUC(name="auc")
        ]
    )

    cb_p2 = [
        callbacks.EarlyStopping(monitor="val_auc", mode="max", patience=4, restore_best_weights=True, verbose=1),
        callbacks.ModelCheckpoint(filepath=args.output_model, monitor="val_auc", mode="max", save_best_only=True, verbose=1),
        callbacks.ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=2, min_lr=1e-7, verbose=1)
    ]
    gate_model.fit(train_ds, validation_data=val_ds, epochs=args.epochs_p2, callbacks=cb_p2)

    # 6. Save final model
    gate_model.save(args.output_model)
    print(f"\n[SUCCESS] Model successfully trained and saved to: {os.path.abspath(args.output_model)}")

    # 7. Verification reload
    print("Verifying model reload...")
    loaded = tf.keras.models.load_model(args.output_model)
    dummy = np.zeros((1, args.img_size, args.img_size, 3), dtype=np.float32)
    pred = loaded.predict(dummy, verbose=0)
    print(f"Reload verification successful. Dummy output shape: {pred.shape}")


if __name__ == "__main__":
    main()
