from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import tensorflow as tf
import numpy as np
from PIL import Image, ExifTags
import cv2
import io
import os

app = FastAPI(title="AgriSmart AI Engine")

# CORS setup for Frontend/NestJS communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. TensorFlow / Keras Model Setup
MODEL_PATH = "quality_model.keras"
CLASS_NAMES = ['Defective_Tomato', 'Fresh_Tomato']

model = None

try:
    model = tf.keras.models.load_model(MODEL_PATH, compile=False)
    print("Real Trained Keras Model (quality_model.keras) Loaded Successfully!")
except Exception as e:
    print(f"Error loading model: {e}")
    model = None


@app.get("/")
def read_root():
    return {"status": "AgriSmart AI Engine is Running"}


@app.post("/predict-grade")
async def predict_crop_grade(file: UploadFile = File(...)):
    try:
        if model is None:
            raise HTTPException(
                status_code=500,
                detail="Model file (quality_model.keras) is not loaded properly."
            )

        # Prevent stream caching issues
        await file.seek(0)
        contents = await file.read()

        # ── STEP 1: OpenCV HSV masking & defect detection ─────────────────────
        nparr = np.frombuffer(contents, np.uint8)
        img_cv = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        total_tomato_pixels = 1   # Prevent division by zero
        defect_pixels = 0
        defect_percentage = 0.0
        total_image_pixels = 160000  # default for 400x400

        if img_cv is not None:
            img_cv = cv2.resize(img_cv, (400, 400))
            total_image_pixels = 400 * 400   # 160,000 pixels
            hsv = cv2.cvtColor(img_cv, cv2.COLOR_BGR2HSV)

            # ── Tomato colour mask (inclusive of whole, cut, halved, green tomatoes) ──
            # Red range 1 (Hue 0-12)
            lower_red1 = np.array([0, 30, 30])
            upper_red1 = np.array([12, 255, 255])
            mask_red1 = cv2.inRange(hsv, lower_red1, upper_red1)

            # Orange-yellow range (unripe / orange variety tomatoes, Hue 12-35)
            lower_orange = np.array([12, 30, 30])
            upper_orange = np.array([35, 255, 255])
            mask_orange = cv2.inRange(hsv, lower_orange, upper_orange)

            # Green range (unripe green tomatoes, stems, leaves, Hue 35-85)
            lower_green = np.array([35, 25, 25])
            upper_green = np.array([85, 255, 255])
            mask_green = cv2.inRange(hsv, lower_green, upper_green)

            # Red range 2 (Hue 160-180: deep red / crimson)
            lower_red2 = np.array([160, 30, 30])
            upper_red2 = np.array([180, 255, 255])
            mask_red2 = cv2.inRange(hsv, lower_red2, upper_red2)

            tomato_color_mask = mask_red1 | mask_orange | mask_green | mask_red2

            # Clean mask (use 3x3 kernel to preserve small details in cut/sliced images)
            kernel = np.ones((3, 3), np.uint8)
            tomato_color_mask = cv2.morphologyEx(tomato_color_mask, cv2.MORPH_CLOSE, kernel)
            tomato_color_mask = cv2.morphologyEx(tomato_color_mask, cv2.MORPH_OPEN, kernel)

            # Defect detection (dark spots, blemishes, brown areas)
            lower_dark = np.array([0, 0, 0])
            upper_dark = np.array([180, 255, 85])
            mask_dark = cv2.inRange(hsv, lower_dark, upper_dark)

            lower_brown1 = np.array([0, 20, 20])
            upper_brown1 = np.array([30, 255, 150])
            mask_brown1 = cv2.inRange(hsv, lower_brown1, upper_brown1)

            lower_brown2 = np.array([160, 20, 20])
            upper_brown2 = np.array([180, 255, 150])
            mask_brown2 = cv2.inRange(hsv, lower_brown2, upper_brown2)

            raw_defect_mask = mask_dark | mask_brown1 | mask_brown2

            # Allow dark/brown defects that are adjacent or on tomato regions
            dilation_kernel = np.ones((15, 15), np.uint8)
            dilated_tomato_mask = cv2.dilate(tomato_color_mask, dilation_kernel, iterations=1)
            defect_mask = cv2.bitwise_and(raw_defect_mask, raw_defect_mask, mask=dilated_tomato_mask)

            # Combine to ensure we count rotten areas connected to tomato parts
            combined_tomato_mask = tomato_color_mask | defect_mask

            total_tomato_pixels = cv2.countNonZero(combined_tomato_mask)
            if total_tomato_pixels == 0:
                total_tomato_pixels = 1

            defect_pixels = cv2.countNonZero(defect_mask)
            defect_percentage = round((defect_pixels / total_tomato_pixels) * 100, 2)

        # ── STEP 2: Model prediction (needed for confidence gate) ─────────────
        pil_image = Image.open(io.BytesIO(contents)).convert("RGB")
        img_resized = pil_image.resize((224, 224))
        img_array = np.array(img_resized, dtype=np.float32)
        img_array = np.expand_dims(img_array, axis=0)   # (1, 224, 224, 3)

        model_predictions = None
        max_confidence = 0.0
        try:
            model_predictions = model.predict(img_array, verbose=0)
            max_confidence = float(np.max(model_predictions[0]))
        except Exception as e:
            print(f"Warning: Model prediction failed: {e}")

        # ── STEP 3: TOMATO VALIDATION GATEKEEPER ─────────────────────────────
        # Thresholds:
        #   - MIN_PIXEL_RATIO: 2.5%
        #   - MIN_CONFIDENCE: 0.22
        MIN_PIXEL_RATIO = 0.025
        MIN_CONFIDENCE = 0.22

        pixel_ratio = float(total_tomato_pixels / total_image_pixels)

        should_reject = False
        reason = "Passed all validation checks"

        # Reject ONLY if pixel_ratio < 2.5% AND confidence < 0.22
        if pixel_ratio < MIN_PIXEL_RATIO and max_confidence < MIN_CONFIDENCE:
            should_reject = True
            reason = f"Rejected: Both pixel ratio ({pixel_ratio:.2%}) < {MIN_PIXEL_RATIO:.2%} and confidence ({max_confidence:.2f}) < {MIN_CONFIDENCE:.2f}"

        decision = "Rejected" if should_reject else "Accepted"

        # Required Debug Logs
        print("===" * 20)
        print("[TOMATO GATEKEEPER DEBUG LOG]")
        print(f"  -> pixel_ratio:    {pixel_ratio:.4f} ({pixel_ratio:.2%})")
        print(f"  -> max_confidence: {max_confidence:.4f} ({max_confidence:.2f})")
        print(f"  -> decision:       {decision}")
        print(f"  -> reason:         {reason}")
        print("===" * 20)

        if should_reject:
            raise HTTPException(
                status_code=400,
                detail="This does not look like a tomato. Please upload a clear tomato photo."
            )
        # ─────────────────────────────────────────────────────────────────────
        # ─────────────────────────────────────────────────────────────────────

        # ── STEP 4: Metadata forensics ────────────────────────────────────────
        forensics = {
            "has_exif": False,
            "timestamp": None,
            "gps": None,
            "likely_live_camera": False
        }

        try:
            raw_pil = Image.open(io.BytesIO(contents))
            exif = raw_pil._getexif()
            if exif:
                forensics["has_exif"] = True
                for tag, value in exif.items():
                    decoded = ExifTags.TAGS.get(tag, tag)
                    if decoded in ["DateTime", "DateTimeOriginal"]:
                        forensics["timestamp"] = str(value)
                        forensics["likely_live_camera"] = True
                    elif decoded == "GPSInfo":
                        forensics["gps"] = {"status": "present"}
        except Exception:
            pass

        # ── STEP 5: Grading based on defect_percentage ────────────────────────
        if defect_percentage <= 4:
            final_score = 95 - defect_percentage
            quality_grade = "A"
        elif defect_percentage <= 15:
            final_score = 80 - defect_percentage
            quality_grade = "B"
        else:
            final_score = 50 - defect_percentage
            quality_grade = "C"

        final_score = max(0.0, min(100.0, final_score))

        return {
            "grade": quality_grade,
            "score": round(final_score, 2),
            "defect_percentage": defect_percentage,
            "total_tomato_pixels": int(total_tomato_pixels),
            "defect_pixels": int(defect_pixels),
            "forensics": forensics
        }

    except HTTPException:
        # Re-raise validation / known HTTP errors as-is
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))