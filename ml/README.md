# Block Blast — Piece Tray ML Pipeline

## Setup

```bash
pip install tensorflow tensorflowjs opencv-python numpy
```

## Step 1 — Collect screenshots

Drop Block Blast screenshots into `ml/screenshots/` (any format).

## Step 2 — Label patches

```bash
python collect.py
```

Keys during labeling:
- `f` — filled (piece block)
- `e` — empty (background)
- `s` — skip (ambiguous)
- `q` — quit and save progress

Aim for **~50 screenshots** covering different piece colors and backgrounds.

## Step 3 — Train

```bash
python train.py
```

Outputs `model/` folder (~200KB) with TensorFlow.js weights.

## Step 4 — Deploy

Copy `ml/model/` → `web/public/model/`

The browser will load it with `tf.loadLayersModel('/model/model.json')`.
