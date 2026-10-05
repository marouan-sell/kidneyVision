import os
import shutil

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CT_DIR = os.path.join(BASE_DIR, "dataset_ct")
TARGET_4CLASS = os.path.join(BASE_DIR, "dataset_4class")

def merge_ct_data():
    print("[MERGE] Starting integration of dataset_ct into dataset_4class...")
    
    splits = ["train", "val"]
    classes = ["Normal", "Stone"]
    
    total_added = 0
    
    for split in splits:
        for cls in classes:
            src_folder = os.path.join(CT_DIR, split, cls)
            dst_folder = os.path.join(TARGET_4CLASS, split, cls)
            
            if not os.path.exists(src_folder):
                print(f"Warning: {src_folder} does not exist.")
                continue
                
            os.makedirs(dst_folder, exist_ok=True)
            files = [f for f in os.listdir(src_folder) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
            
            added_for_cat = 0
            for f in files:
                src_path = os.path.join(src_folder, f)
                # Ensure unique filename prefix
                dst_name = f if f.startswith("ct_") else f"ct_{f}"
                dst_path = os.path.join(dst_folder, dst_name)
                
                if not os.path.exists(dst_path):
                    shutil.copy2(src_path, dst_path)
                    added_for_cat += 1
                    total_added += 1
                    
            print(f"[{split.upper()} - {cls.upper()}] Added {added_for_cat} new scans from dataset_ct")
            
    print(f"\n[MERGE COMPLETE] Total new scans added: {total_added}")
    
    # Summary of final dataset
    print("\n--- FINAL CONSOLIDATED DATASET SUMMARY ---")
    for split in ["train", "val"]:
        print(f"Split: {split.upper()}")
        split_total = 0
        for c in ["Cyst", "Normal", "Stone", "Tumor"]:
            folder = os.path.join(TARGET_4CLASS, split, c)
            cnt = len(os.listdir(folder)) if os.path.exists(folder) else 0
            print(f"  {c:<8}: {cnt:>5} images")
            split_total += cnt
        print(f"  TOTAL {split.upper()}: {split_total} images\n")

if __name__ == "__main__":
    merge_ct_data()
