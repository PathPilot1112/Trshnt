import os
import shutil
from pathlib import Path

BASE_DIR = Path(__file__).parent.resolve()
ORIGINAL_DATA_DIR = BASE_DIR / "Treasure hunt Photos" / "Photos" / "Photos_for_ML_training"
NEW_PHOTO_DIR = BASE_DIR / "New Photo"
EXTRA_MBA_GATE_DIR = BASE_DIR / "Treasure hunt Photos" / "MBA Gate"

TARGET_DATASET_DIR = BASE_DIR / "Combined_Dataset"

IMG_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

# Mapping for the new photo folders to official target class folders
NEW_PHOTO_MAP = {
    # Zone 1
    ("Zone 1", "Mahatma Gandhi Statue"): ("Zone 1", "Mahatma Gandhi Statue"),
    ("Zone 1", "Raja Raja Chola"): ("Zone 1", "Chola Statue"),
    # Zone 2
    ("Zone 2", "Law Block"): ("Zone 2", "Law School"),
    # Zone 3
    ("Zone 3", "#SRM TP"): ("Zone 3", "SRM logo"),
    ("Zone 3", "Aarush Logo"): ("Zone 3", "Aarush Logo"),
    # Zone 4
    ("Zone 4", "Dental College"): ("Zone 4", "Dental College"),
    ("Zone 4", "PickleBall Court"): ("Zone 4", "Pickleball Court"),
    ("Zone 4", "TP Audi Gate"): ("Zone 4", "TP Auditorium Gate"),
    # Zone 5
    ("Zone 5", "Architecture Stonehedge"): ("Zone 5", "Stone edge"),
    ("Zone 5", "MBA Gate"): ("Zone 5", "MBA Gate"),
}

def copy_images(src_dir, dest_dir, prefix=""):
    dest_dir.mkdir(parents=True, exist_ok=True)
    count = 0
    for root, _, files in os.walk(src_dir):
        for f in files:
            p = Path(root) / f
            if p.suffix.lower() in IMG_EXTS:
                dest_filename = f"{prefix}_{f}" if prefix else f
                dest_path = dest_dir / dest_filename
                # Avoid collision if duplicate name
                idx = 1
                while dest_path.exists():
                    dest_path = dest_dir / f"{dest_path.stem}_{idx}{dest_path.suffix}"
                    idx += 1
                shutil.copy2(p, dest_path)
                count += 1
    return count

def regroup():
    print(f"Target Directory: {TARGET_DATASET_DIR}")
    if TARGET_DATASET_DIR.exists():
        print("Removing existing Combined_Dataset folder to start clean...")
        shutil.rmtree(TARGET_DATASET_DIR)
    TARGET_DATASET_DIR.mkdir(parents=True, exist_ok=True)

    counts = {}

    # 1. Copy all existing photos from Photos_for_ML_training
    print("\n--- 1. Copying existing training photos ---")
    for zone_path in sorted(ORIGINAL_DATA_DIR.iterdir()):
        if not zone_path.is_dir():
            continue
        zone_name = zone_path.name
        for loc_path in sorted(zone_path.iterdir()):
            if not loc_path.is_dir():
                continue
            loc_name = loc_path.name
            dest_loc_dir = TARGET_DATASET_DIR / zone_name / loc_name
            c = copy_images(loc_path, dest_loc_dir, prefix="orig")
            key = f"{zone_name} - {loc_name}"
            counts[key] = counts.get(key, 0) + c
            print(f"Copied {c:3d} existing images -> {key}")

    # 2. Copy extra MBA Gate images if available
    if EXTRA_MBA_GATE_DIR.exists():
        dest_mba = TARGET_DATASET_DIR / "Zone 5" / "MBA Gate"
        c = copy_images(EXTRA_MBA_GATE_DIR, dest_mba, prefix="mba_orig")
        key = "Zone 5 - MBA Gate"
        counts[key] = counts.get(key, 0) + c
        print(f"Copied {c:3d} extra MBA Gate images -> {key}")

    # 3. Copy newly clicked images from New Photo with mapped names
    print("\n--- 2. Copying newly clicked photos from 'New Photo' ---")
    for (src_zone, src_loc), (dst_zone, dst_loc) in NEW_PHOTO_MAP.items():
        src_path = NEW_PHOTO_DIR / src_zone / src_loc
        if not src_path.exists():
            print(f"Warning: {src_path} does not exist!")
            continue
        dest_loc_dir = TARGET_DATASET_DIR / dst_zone / dst_loc
        c = copy_images(src_path, dest_loc_dir, prefix="new")
        key = f"{dst_zone} - {dst_loc}"
        counts[key] = counts.get(key, 0) + c
        print(f"Copied {c:3d} new images from '{src_zone}/{src_loc}' -> {key}")

    print("\n==========================================")
    print("FINAL SUMMARY OF COMBINED DATASET:")
    print("==========================================")
    total_imgs = 0
    for key in sorted(counts.keys()):
        print(f"  {key:35s}: {counts[key]:4d} images")
        total_imgs += counts[key]
    print("------------------------------------------")
    print(f"Total Classes: {len(counts)} / 25")
    print(f"Total Images : {total_imgs}")
    print("==========================================")

if __name__ == "__main__":
    regroup()
