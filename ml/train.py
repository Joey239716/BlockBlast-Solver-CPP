"""
train.py — Train a tiny CNN to classify tray cells as filled or empty,
           then export it to TensorFlow.js format for in-browser inference.

Requirements:
    pip install tensorflow tensorflowjs opencv-python numpy

Usage:
    python train.py

Output:
    model/        ← TensorFlow.js model (copy this folder to web/public/model/)
    model.keras   ← Keras checkpoint (for retraining later)
"""

import os
import numpy as np
import cv2

# ─── Load dataset ──────────────────────────────────────────────────────────────

BASE   = os.path.dirname(__file__)
FILLED = os.path.join(BASE, "data", "filled")
EMPTY  = os.path.join(BASE, "data", "empty")
SIZE   = 32  # must match PATCH_SIZE in collect.py

def load_images(folder, label):
    imgs = []
    for f in os.listdir(folder):
        if not f.lower().endswith(".png"):
            continue
        img = cv2.imread(os.path.join(folder, f))
        if img is None:
            continue
        img = cv2.resize(img, (SIZE, SIZE))
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        imgs.append((img, label))
    return imgs

data = load_images(FILLED, 1) + load_images(EMPTY, 0)
print(f"Loaded {sum(l for _, l in data)} filled  +  {sum(1-l for _, l in data)} empty patches")

if len(data) < 20:
    raise SystemExit("Not enough data — label at least 20 patches first (run collect.py).")

import random
random.shuffle(data)

X = np.array([d[0] for d in data], dtype=np.float32) / 255.0
y = np.array([d[1] for d in data], dtype=np.float32)

split = int(len(X) * 0.85)
X_train, X_val = X[:split], X[split:]
y_train, y_val = y[:split], y[split:]

# ─── Model ─────────────────────────────────────────────────────────────────────

import tensorflow as tf
from tensorflow import keras

model = keras.Sequential([
    keras.layers.Input(shape=(SIZE, SIZE, 3)),

    # Block 1
    keras.layers.Conv2D(16, 3, padding="same", activation="relu"),
    keras.layers.MaxPooling2D(2),   # → 16×16

    # Block 2
    keras.layers.Conv2D(32, 3, padding="same", activation="relu"),
    keras.layers.MaxPooling2D(2),   # → 8×8

    # Block 3
    keras.layers.Conv2D(32, 3, padding="same", activation="relu"),
    keras.layers.GlobalAveragePooling2D(),

    # Head
    keras.layers.Dense(32, activation="relu"),
    keras.layers.Dropout(0.3),
    keras.layers.Dense(1, activation="sigmoid"),
], name="cell_classifier")

model.summary()

model.compile(
    optimizer=keras.optimizers.Adam(1e-3),
    loss="binary_crossentropy",
    metrics=["accuracy"],
)

# ─── Data augmentation ────────────────────────────────────────────────────────

augment = keras.Sequential([
    keras.layers.RandomFlip("horizontal_and_vertical"),
    keras.layers.RandomBrightness(0.2),
    keras.layers.RandomContrast(0.2),
])

def make_dataset(X, y, augment_data=False, batch=32):
    ds = tf.data.Dataset.from_tensor_slices((X, y))
    if augment_data:
        ds = ds.map(lambda x, label: (augment(x, training=True), label),
                    num_parallel_calls=tf.data.AUTOTUNE)
    return ds.shuffle(1000).batch(batch).prefetch(tf.data.AUTOTUNE)

train_ds = make_dataset(X_train, y_train, augment_data=True)
val_ds   = make_dataset(X_val,   y_val,   augment_data=False)

# ─── Train ─────────────────────────────────────────────────────────────────────

callbacks = [
    keras.callbacks.EarlyStopping(patience=8, restore_best_weights=True),
    keras.callbacks.ReduceLROnPlateau(patience=4, factor=0.5, min_lr=1e-5),
]

history = model.fit(
    train_ds,
    validation_data=val_ds,
    epochs=60,
    callbacks=callbacks,
    verbose=1,
)

val_loss, val_acc = model.evaluate(val_ds, verbose=0)
print(f"\nVal accuracy: {val_acc:.1%}   Val loss: {val_loss:.4f}")

# ─── Save ──────────────────────────────────────────────────────────────────────

model.save(os.path.join(BASE, "model.keras"))
print("Saved model.keras")

# Export to TensorFlow.js
try:
    import tensorflowjs as tfjs
    out_dir = os.path.join(BASE, "model")
    tfjs.converters.save_keras_model(model, out_dir)
    print(f"\nTensorFlow.js model saved to: {out_dir}/")
    print("→ Copy the 'model/' folder to web/public/model/")
    print("→ Load in browser with: tf.loadLayersModel('/model/model.json')")
except ImportError:
    print("\ntensorflowjs not installed — run: pip install tensorflowjs")
    print("Then convert manually: tensorflowjs_converter --input_format keras model.keras model/")
