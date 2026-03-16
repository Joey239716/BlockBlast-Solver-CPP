"""
collect.py — Label Block Blast tray pieces by screenshot.

Flow:
  1. Script shows each screenshot in a window with the tray grid overlaid.
  2. A reference sheet of all piece shapes is printed in the terminal.
  3. You type the piece ID for each of the 3 slots (e.g.  L1  2x2  T3).
     Type "skip" to skip a slot, "s" to skip the whole screenshot.
  4. Script automatically crops and saves filled / empty cell patches.

Usage:
    pip install opencv-python numpy
    python collect.py [screenshots_dir]
"""

import sys, os, glob, cv2, numpy as np

OUT_FILLED = os.path.join(os.path.dirname(__file__), "data", "filled")
OUT_EMPTY  = os.path.join(os.path.dirname(__file__), "data", "empty")
PATCH_SIZE = 32
TRAY_H_FRAC = 0.28

os.makedirs(OUT_FILLED, exist_ok=True)
os.makedirs(OUT_EMPTY,  exist_ok=True)

# ─── Piece library (mirrors pieces.ts exactly) ────────────────────────────────

PIECES = {
    'L1':  [(0,0),(1,0),(2,0),(2,1)],
    'L2':  [(0,0),(1,0),(2,0),(0,1)],
    'L3':  [(0,0),(0,1),(1,1),(2,1)],
    'L4':  [(0,1),(1,1),(2,1),(2,0)],
    'L5':  [(0,0),(0,1),(0,2),(1,2)],
    'L6':  [(1,0),(1,1),(1,2),(0,2)],
    'L7':  [(0,0),(0,1),(0,2),(1,0)],
    'L8':  [(0,0),(1,0),(1,1),(1,2)],
    'L9':  [(0,0),(0,1),(1,1)],
    'L10': [(0,1),(1,0),(1,1)],
    'L11': [(0,0),(1,0),(1,1)],
    'L12': [(0,0),(0,1),(1,0)],
    'L13': [(0,0),(1,0),(2,0),(2,1),(2,2)],
    'L14': [(0,0),(0,1),(0,2),(1,2),(2,2)],
    'L15': [(0,0),(1,0),(2,0),(0,1),(0,2)],
    'L16': [(2,0),(2,1),(2,2),(1,2),(0,2)],
    '1x1': [(0,0)],
    '2x1': [(0,0),(1,0)],
    '1x2': [(0,0),(0,1)],
    '3x1': [(0,0),(1,0),(2,0)],
    '1x3': [(0,0),(0,1),(0,2)],
    '4x1': [(0,0),(1,0),(2,0),(3,0)],
    '1x4': [(0,0),(0,1),(0,2),(0,3)],
    '5x1': [(0,0),(1,0),(2,0),(3,0),(4,0)],
    '1x5': [(0,0),(0,1),(0,2),(0,3),(0,4)],
    '2x2': [(0,0),(1,0),(0,1),(1,1)],
    '3x2': [(0,0),(1,0),(2,0),(0,1),(1,1),(2,1)],
    '2x3': [(0,0),(1,0),(0,1),(1,1),(0,2),(1,2)],
    '3x3': [(x,y) for y in range(3) for x in range(3)],
    'T1':  [(0,0),(0,1),(0,2),(1,1)],
    'T2':  [(0,0),(1,0),(2,0),(1,1)],
    'T3':  [(1,0),(1,1),(1,2),(0,1)],
    'T4':  [(0,1),(1,0),(1,1),(1,2)],
    'Z1':  [(0,0),(1,0),(1,1),(2,1)],
    'Z2':  [(0,1),(1,1),(1,0),(2,0)],
    'Z3':  [(0,0),(0,1),(1,1),(1,2)],
    'Z4':  [(1,0),(1,1),(0,1),(0,2)],
    'S1':  [(0,0),(1,1),(2,2)],
    'S2':  [(0,2),(1,1),(2,0)],
    'S3':  [(0,0),(1,1)],
    'S4':  [(0,1),(1,0)],
}

GROUPS = [
    ('L-shapes',   ['L1','L2','L3','L4','L5','L6','L7','L8','L9','L10','L11','L12','L13','L14','L15','L16']),
    ('Rectangles', ['1x1','2x1','1x2','3x1','1x3','4x1','1x4','5x1','1x5','2x2','3x2','2x3','3x3']),
    ('T-shapes',   ['T1','T2','T3','T4']),
    ('Z-shapes',   ['Z1','Z2','Z3','Z4']),
    ('Diagonals',  ['S1','S2','S3','S4']),
]

def render_piece(pts, cell=3):
    """Return a tiny ASCII + visual string for the terminal."""
    if not pts:
        return ''
    max_x = max(p[0] for p in pts)
    max_y = max(p[1] for p in pts)
    filled = set(pts)
    lines = []
    for y in range(max_y + 1):
        row = ''
        for x in range(max_x + 1):
            row += '██' if (x, y) in filled else '  '
        lines.append(row)
    return '\n'.join(lines)

def print_piece_sheet():
    print('\n' + '='*60)
    print('  PIECE REFERENCE')
    print('='*60)
    for group_name, ids in GROUPS:
        print(f'\n── {group_name} ──')
        for pid in ids:
            pts = PIECES[pid]
            shape_lines = render_piece(pts).split('\n')
            header = f'  {pid:<6}'
            for i, line in enumerate(shape_lines):
                prefix = header if i == 0 else ' ' * len(header)
                print(prefix + line)
    print()

# ─── Board detection ──────────────────────────────────────────────────────────

def detect_board(img):
    h, w = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (3, 3), 0)
    edge = cv2.Canny(blur, 30, 100)
    k    = max(15, min(40, round(w * 0.04)))
    dil  = cv2.dilate(edge, cv2.getStructuringElement(cv2.MORPH_RECT, (k, k)))
    cnts, _ = cv2.findContours(dil, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    best, best_score = None, 0
    for c in cnts:
        x, y, bw, bh = cv2.boundingRect(c)
        area = bw * bh
        asp  = bw / bh if bh else 0
        if area < w * h * 0.10:          continue
        if asp < 0.7 or asp > 1.4:       continue
        if y + bh / 2 > h * 0.65:        continue
        score = area * (1 - abs(1 - asp))
        if score > best_score:
            best_score = score
            best = (x, y, bw, bh)
    if best is None:
        return None
    x, y, bw, bh = best
    ix, iy = round(bw * 0.025), round(bh * 0.025)
    return (x + ix, y + iy, bw - ix*2, bh - iy*2)

# ─── Patch extraction ─────────────────────────────────────────────────────────

def extract_patches(img, board, slot_idx, piece_id):
    """
    Given a detected board rect and a piece ID for one slot,
    return list of (patch_bgr, label) where label 1=filled 0=empty.
    Assumes the piece is centered in the slot.
    """
    h, w = img.shape[:2]
    bx, by, bw, bh = board
    tray_y = by + bh
    tray_h = min(h - tray_y, round(h * TRAY_H_FRAC))
    if tray_h < 10:
        return []

    slot_x = round(slot_idx * w / 3)
    slot_w = round((slot_idx + 1) * w / 3) - slot_x

    pts = PIECES[piece_id]
    filled = set(pts)
    pw = max(p[0] for p in pts) + 1   # piece width in cells
    ph = max(p[1] for p in pts) + 1   # piece height in cells

    # Cell size: fit piece into slot with 1-cell padding on each side
    cell = min(slot_w / (pw + 2), tray_h / (ph + 2))

    # Center the piece in the slot
    origin_x = slot_x + (slot_w - pw * cell) / 2
    origin_y = tray_y + (tray_h - ph * cell) / 2

    results = []
    # Scan piece bounding box + 1-cell border for empty examples
    for gy in range(-1, ph + 1):
        for gx in range(-1, pw + 1):
            cx = origin_x + (gx + 0.5) * cell
            cy = origin_y + (gy + 0.5) * cell
            x1 = max(0, int(cx - cell * 0.5))
            y1 = max(0, int(cy - cell * 0.5))
            x2 = min(w, int(cx + cell * 0.5))
            y2 = min(h, int(cy + cell * 0.5))
            if x2 - x1 < 4 or y2 - y1 < 4:
                continue
            patch = cv2.resize(img[y1:y2, x1:x2], (PATCH_SIZE, PATCH_SIZE))
            label = 1 if (gx, gy) in filled else 0
            results.append((patch, label, x1, y1, x2, y2))
    return results

# ─── Main loop ────────────────────────────────────────────────────────────────

def main():
    sdir = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), 'screenshots')
    files = sorted(set(
        f for pat in ['*.png','*.jpg','*.jpeg','*.PNG','*.JPG']
        for f in glob.glob(os.path.join(sdir, pat))
    ))
    if not files:
        print(f'No images found in {sdir}'); return

    print_piece_sheet()
    print(f'Found {len(files)} screenshots. Type piece IDs per slot.')
    print('Commands: piece ID (e.g. L1)  |  skip = no piece  |  s = skip screenshot  |  q = quit\n')

    counter = {'filled': 0, 'empty': 0}
    file_idx = [0]
    existing = len(os.listdir(OUT_FILLED)) + len(os.listdir(OUT_EMPTY))
    patch_idx = [existing]

    cv2.namedWindow('screenshot', cv2.WINDOW_NORMAL)

    while file_idx[0] < len(files):
        fpath = files[file_idx[0]]
        img = cv2.imread(fpath)
        if img is None:
            file_idx[0] += 1
            continue

        board = detect_board(img)
        print(f'\n[{file_idx[0]+1}/{len(files)}] {os.path.basename(fpath)}')

        # Draw overlay on a preview copy
        preview = img.copy()
        if board:
            bx, by, bw, bh = board
            tray_y = by + bh
            h, w = img.shape[:2]
            tray_h = min(h - tray_y, round(h * TRAY_H_FRAC))
            cw, ch = bw / 8, bh / 8
            cv2.rectangle(preview, (bx, by), (bx+bw, by+bh), (0,220,255), 2)
            cv2.rectangle(preview, (0, tray_y), (w, tray_y+tray_h), (60,160,255), 2)
            for slot in range(1, 3):
                sx = round(slot * w / 3)
                cv2.line(preview, (sx, tray_y), (sx, tray_y+tray_h), (60,160,255), 1)
            print(f'  Board detected at ({bx},{by}) {bw}×{bh}  — tray starts at y={tray_y}')
        else:
            print('  ⚠  Board not found')

        # Show screenshot
        ph, pw_img = preview.shape[:2]
        scale = min(1.0, 900 / max(ph, pw_img))
        disp = cv2.resize(preview, (int(pw_img*scale), int(ph*scale)))
        cv2.imshow('screenshot', disp)
        cv2.waitKey(1)

        if not board:
            input('  [enter to skip] ')
            file_idx[0] += 1
            continue

        # Ask for piece IDs
        slot_pieces = []
        skip_screenshot = False
        for slot in range(3):
            while True:
                raw = input(f'  Slot {slot+1} piece ID (or "skip"/"s"/"q"): ').strip()
                if raw.lower() == 'q':
                    cv2.destroyAllWindows(); return
                if raw.lower() == 's':
                    skip_screenshot = True; break
                if raw.lower() in ('skip', ''):
                    slot_pieces.append(None); break
                if raw in PIECES:
                    slot_pieces.append(raw); break
                print(f'    Unknown piece "{raw}". Check the reference sheet above.')
            if skip_screenshot:
                break

        if skip_screenshot:
            file_idx[0] += 1
            continue

        # Draw piece overlays and extract patches
        save_preview = preview.copy()
        all_patches = []
        for slot, piece_id in enumerate(slot_pieces):
            if piece_id is None:
                continue
            patches = extract_patches(img, board, slot, piece_id)
            for patch, label, x1, y1, x2, y2 in patches:
                color = (0, 255, 128) if label == 1 else (0, 60, 200)
                cv2.rectangle(save_preview, (x1, y1), (x2, y2), color, 1)
                all_patches.append((patch, label))

        # Show preview with labeled cells
        disp2 = cv2.resize(save_preview, (int(pw_img*scale), int(ph*scale)))
        cv2.imshow('screenshot', disp2)
        cv2.waitKey(1)

        confirm = input(f'  Save {len(all_patches)} patches? (y/n) [y]: ').strip().lower()
        if confirm in ('', 'y'):
            for patch, label in all_patches:
                fname = f'{patch_idx[0]:06d}.png'
                patch_idx[0] += 1
                if label == 1:
                    cv2.imwrite(os.path.join(OUT_FILLED, fname), patch)
                    counter['filled'] += 1
                else:
                    cv2.imwrite(os.path.join(OUT_EMPTY, fname), patch)
                    counter['empty'] += 1
            print(f'  Saved. Total so far — filled: {counter["filled"]}  empty: {counter["empty"]}')

        file_idx[0] += 1

    cv2.destroyAllWindows()
    print(f'\nDone — filled: {counter["filled"]}  empty: {counter["empty"]}')

if __name__ == '__main__':
    main()
