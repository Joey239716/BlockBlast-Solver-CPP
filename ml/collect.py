"""
collect.py — Label tray cell patches from Block Blast screenshots.

Usage:
    python collect.py screenshots/

Drop your screenshots into the screenshots/ folder (any image format),
then run this script. It will:
  1. Detect the board region in each screenshot.
  2. Crop a 5×5 grid of candidate cell patches from each of the 3 tray slots.
  3. Show each patch full-screen and ask: f = filled  |  e = empty  |  s = skip

Labeled patches are saved to:
    data/filled/  ← piece block cells
    data/empty/   ← background cells
"""

import sys
import os
import glob
import cv2
import numpy as np

PATCH_SIZE   = 32   # pixels — resize every patch to 32×32 for the model
GRID_ROWS    = 5    # rows to scan per slot
GRID_COLS    = 5    # cols to scan per slot
TRAY_H_FRAC  = 0.28 # fraction of image height to scan below the board


# ─── Board detection (mirrors JS logic) ────────────────────────────────────────

def detect_board(img):
    """Returns (x, y, w, h) of the board rect or None."""
    h, w = img.shape[:2]
    gray    = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (3, 3), 0)
    edges   = cv2.Canny(blurred, 30, 100)

    k_size  = max(15, min(40, round(w * 0.04)))
    kernel  = cv2.getStructuringElement(cv2.MORPH_RECT, (k_size, k_size))
    dilated = cv2.dilate(edges, kernel)

    cnts, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    min_area  = w * h * 0.10
    best_rect = None
    best_score = 0

    for c in cnts:
        x, y, bw, bh = cv2.boundingRect(c)
        area   = bw * bh
        aspect = bw / bh if bh else 0
        center_y = y + bh / 2
        if area < min_area:              continue
        if aspect < 0.7 or aspect > 1.4: continue
        if center_y > h * 0.65:          continue
        score = area * (1 - abs(1 - aspect))
        if score > best_score:
            best_score = score
            best_rect  = (x, y, bw, bh)

    if best_rect is None:
        return None

    x, y, bw, bh = best_rect
    inset_x = round(bw * 0.025)
    inset_y = round(bh * 0.025)
    return (x + inset_x, y + inset_y, bw - inset_x * 2, bh - inset_y * 2)


# ─── Extract candidate patches from one screenshot ─────────────────────────────

def extract_patches(img):
    """Yields (patch_bgr, debug_full_img, rect_on_full) tuples."""
    h, w = img.shape[:2]
    board = detect_board(img)
    if board is None:
        print("  ⚠  Board not found, skipping.")
        return

    bx, by, bw, bh = board
    tray_y = by + bh
    tray_h = min(h - tray_y, round(h * TRAY_H_FRAC))
    if tray_h < 20:
        print("  ⚠  Tray too small, skipping.")
        return

    cell_w = (bw / 8) * 1.1   # approx tray cell size ~ board cell size
    cell_h = (bh / 8) * 1.1

    for slot in range(3):
        slot_x = round(slot       * w / 3)
        slot_w = round((slot + 1) * w / 3) - slot_x

        # Center the 5×5 scan grid in each slot
        grid_w = GRID_COLS * cell_w
        grid_h = GRID_ROWS * cell_h
        origin_x = slot_x + (slot_w - grid_w) / 2
        origin_y = tray_y + (tray_h - grid_h) / 2

        for gy in range(GRID_ROWS):
            for gx in range(GRID_COLS):
                cx = origin_x + (gx + 0.5) * cell_w
                cy = origin_y + (gy + 0.5) * cell_h
                x1 = max(0, int(cx - cell_w / 2))
                y1 = max(0, int(cy - cell_h / 2))
                x2 = min(w, int(cx + cell_w / 2))
                y2 = min(h, int(cy + cell_h / 2))
                if x2 <= x1 or y2 <= y1:
                    continue
                patch = img[y1:y2, x1:x2]
                yield patch, (x1, y1, x2, y2)


# ─── Labeling UI ───────────────────────────────────────────────────────────────

def label_patches(screenshot_dir):
    filled_dir = os.path.join(os.path.dirname(__file__), "data", "filled")
    empty_dir  = os.path.join(os.path.dirname(__file__), "data", "empty")
    os.makedirs(filled_dir, exist_ok=True)
    os.makedirs(empty_dir,  exist_ok=True)

    patterns = ["*.png", "*.jpg", "*.jpeg", "*.PNG", "*.JPG"]
    files    = []
    for p in patterns:
        files += glob.glob(os.path.join(screenshot_dir, p))
    files = sorted(set(files))

    if not files:
        print(f"No images found in {screenshot_dir}")
        sys.exit(1)

    counter = {"filled": 0, "empty": 0, "skipped": 0}
    idx     = 0  # global patch counter for unique filenames

    cv2.namedWindow("patch", cv2.WINDOW_NORMAL)
    cv2.resizeWindow("patch", 480, 480)

    print(f"\nFound {len(files)} screenshot(s).")
    print("Keys:  f = filled  |  e = empty  |  s = skip  |  q = quit\n")

    for fpath in files:
        img = cv2.imread(fpath)
        if img is None:
            print(f"  Could not read {fpath}, skipping.")
            continue
        print(f"Processing: {os.path.basename(fpath)}")

        for patch, (x1, y1, x2, y2) in extract_patches(img):
            # Draw context on a copy of the full image
            preview = img.copy()
            cv2.rectangle(preview, (x1, y1), (x2, y2), (0, 255, 128), 2)

            # Show the patch enlarged
            patch_resized = cv2.resize(patch, (480, 480), interpolation=cv2.INTER_NEAREST)
            cv2.imshow("patch", patch_resized)

            # Also show context window
            ph, pw = img.shape[:2]
            max_dim = 600
            scale   = min(1.0, max_dim / max(ph, pw))
            ctx     = cv2.resize(preview, (int(pw * scale), int(ph * scale)))
            cv2.imshow("context", ctx)

            key = cv2.waitKey(0) & 0xFF

            if key == ord('q'):
                print(f"\nSaved — filled: {counter['filled']}  empty: {counter['empty']}  skipped: {counter['skipped']}")
                cv2.destroyAllWindows()
                return

            patch_out = cv2.resize(patch, (PATCH_SIZE, PATCH_SIZE))
            filename  = f"{idx:06d}.png"
            idx      += 1

            if key == ord('f'):
                cv2.imwrite(os.path.join(filled_dir, filename), patch_out)
                counter["filled"] += 1
            elif key == ord('e'):
                cv2.imwrite(os.path.join(empty_dir, filename), patch_out)
                counter["empty"] += 1
            else:
                counter["skipped"] += 1

    cv2.destroyAllWindows()
    print(f"\nDone — filled: {counter['filled']}  empty: {counter['empty']}  skipped: {counter['skipped']}")


if __name__ == "__main__":
    sdir = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), "screenshots")
    label_patches(sdir)
