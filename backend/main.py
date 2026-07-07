from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

from ultralytics import YOLO
from transformers import TrOCRProcessor
from transformers import VisionEncoderDecoderModel

from PIL import Image

import cv2
import torch
import shutil
import os
import time
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "best.pt"
UPLOAD_DIR = BASE_DIR / "uploads"
TROCR_MODEL_NAME = os.getenv(
    "TROCR_MODEL_NAME",
    "microsoft/trocr-small-handwritten"
)
MAX_OCR_BOXES = int(os.getenv("MAX_OCR_BOXES", "3"))
OCR_BATCH_SIZE = int(os.getenv("OCR_BATCH_SIZE", "1"))
OCR_MAX_NEW_TOKENS = int(os.getenv("OCR_MAX_NEW_TOKENS", "16"))
TORCH_THREADS = max(1, min(4, os.cpu_count() or 1))

torch.set_num_threads(TORCH_THREADS)

# ==========================================
# FASTAPI
# ==========================================

app = FastAPI()

# ==========================================
# CORS
# ==========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# LOAD YOLO MODEL
# ==========================================

yolo_model = YOLO(str(MODEL_PATH))

# ==========================================
# LOAD TrOCR MODEL
# ==========================================

processor = TrOCRProcessor.from_pretrained(
    TROCR_MODEL_NAME
)

trocr_model = VisionEncoderDecoderModel.from_pretrained(
    TROCR_MODEL_NAME
)

# ==========================================
# USE GPU IF AVAILABLE
# ==========================================

device = "cuda" if torch.cuda.is_available() else "cpu"

trocr_model.to(device)

# ==========================================
# CREATE UPLOAD FOLDER
# ==========================================

os.makedirs(UPLOAD_DIR, exist_ok=True)

# ==========================================
# API ROUTE
# ==========================================

@app.get("/health")
async def health():

    return {
        "status": "ok"
    }

@app.post("/upload")

def upload_image(file: UploadFile = File(...)):

    started_at = time.perf_counter()

    # Save uploaded image
    safe_filename = Path(file.filename or "upload.png").name

    filepath = UPLOAD_DIR / safe_filename

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Load image
    img = cv2.imread(str(filepath))

    if img is None:

        raise HTTPException(
            status_code=400,
            detail="Uploaded file is not a readable image."
        )

    print(f"[ocr] received={safe_filename} shape={img.shape}", flush=True)

    # ==========================================
    # RESIZE IMAGE
    # ==========================================

    max_width = 1280

    h, w = img.shape[:2]

    if w > max_width:

        scale = max_width / w

        new_w = int(w * scale)
        new_h = int(h * scale)

        img = cv2.resize(
            img,
            (new_w, new_h)
        )

    # ==========================================
    # YOLO DETECTION
    # ==========================================

    results = yolo_model.predict(
        source=img,
        imgsz=512,
        conf=0.25,
        verbose=False
    )

    print(f"[ocr] yolo done in {time.perf_counter() - started_at:.2f}s", flush=True)

    # ==========================================
    # GET BOXES
    # ==========================================

    all_boxes = []

    for r in results:

        boxes = r.boxes.xyxy.tolist()

        all_boxes.extend(boxes)

    # ==========================================
    # SORT BOXES
    # ==========================================

    all_boxes = sorted(all_boxes, key=lambda b: (b[1], b[0]))

    if len(all_boxes) > MAX_OCR_BOXES:

        all_boxes = all_boxes[:MAX_OCR_BOXES]

    print(f"[ocr] boxes={len(all_boxes)}", flush=True)

    # ==========================================
    # PREPARE CROPS
    # ==========================================

    all_pil_images = []

    padding = 10

    for box in all_boxes:

        x1, y1, x2, y2 = map(int, box)

        x1 = max(0, x1 - padding)
        y1 = max(0, y1 - padding)
        x2 = min(img.shape[1], x2 + padding)
        y2 = min(img.shape[0], y2 + padding)

        crop = img[y1:y2, x1:x2]

        # Resize
        crop = cv2.resize(
            crop,
            None,
            fx=2,
            fy=2,
            interpolation=cv2.INTER_CUBIC
        )

        # Grayscale
        gray = cv2.cvtColor(
            crop,
            cv2.COLOR_BGR2GRAY
        )

        # Threshold
        thresh = cv2.threshold(
            gray,
            0,
            255,
            cv2.THRESH_BINARY + cv2.THRESH_OTSU
        )[1]

        # Convert back to RGB
        rgb = cv2.cvtColor(
            thresh,
            cv2.COLOR_GRAY2RGB
        )

        pil_image = Image.fromarray(rgb)

        all_pil_images.append(pil_image)

    if len(all_pil_images) == 0:

        return {
            "text": "",
            "lines": []
        }

    # ==========================================
    # TrOCR BATCH PROCESSING
    # ==========================================

    generated_texts = []

    for index in range(0, len(all_pil_images), OCR_BATCH_SIZE):

        batch_images = all_pil_images[index:index + OCR_BATCH_SIZE]

        pixel_values = processor(
            images=batch_images,
            return_tensors="pt",
            padding=True
        ).pixel_values

        pixel_values = pixel_values.to(device)

        with torch.inference_mode():

            generated_ids = trocr_model.generate(
                pixel_values,
                max_new_tokens=OCR_MAX_NEW_TOKENS,
                num_beams=1
            )

        generated_texts.extend(
            processor.batch_decode(
                generated_ids,
                skip_special_tokens=True
            )
        )

        print(
            f"[ocr] trocr batch {index // OCR_BATCH_SIZE + 1} done in {time.perf_counter() - started_at:.2f}s",
            flush=True
        )

    # ==========================================
    # FINAL TEXT
    # ==========================================

    full_text = "\n".join(generated_texts)

    print(f"[ocr] complete in {time.perf_counter() - started_at:.2f}s", flush=True)

    return {
        "text": full_text,
        "lines": generated_texts
    }
