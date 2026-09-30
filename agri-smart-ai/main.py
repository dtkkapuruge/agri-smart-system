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
        
        # 1. Image Masking and Defect Detection with OpenCV
        nparr = np.frombuffer(contents, np.uint8)
        img_cv = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        total_tomato_pixels = 1 # Prevent division by zero
        defect_pixels = 0
        defect_percentage = 0.0
        
        if img_cv is not None:
            # Resize to a consistent size for pixel counting
            img_cv = cv2.resize(img_cv, (400, 400))
            hsv = cv2.cvtColor(img_cv, cv2.COLOR_BGR2HSV)
            
            # Masking tomato colors (red/orange/yellow/greenish)
            lower_red1 = np.array([0, 40, 40])
            upper_red1 = np.array([100, 255, 255])
            mask1 = cv2.inRange(hsv, lower_red1, upper_red1)
            
            lower_red2 = np.array([170, 40, 40])
            upper_red2 = np.array([180, 255, 255])
            mask2 = cv2.inRange(hsv, lower_red2, upper_red2)
            
            tomato_mask = mask1 | mask2
            
            # Clean mask
            kernel = np.ones((5,5), np.uint8)
            tomato_mask = cv2.morphologyEx(tomato_mask, cv2.MORPH_CLOSE, kernel)
            tomato_mask = cv2.morphologyEx(tomato_mask, cv2.MORPH_OPEN, kernel)
            
            total_tomato_pixels = cv2.countNonZero(tomato_mask)
            if total_tomato_pixels == 0:
                total_tomato_pixels = 1
                
            # Defect Detection (dark spots, blemishes, brown areas)
            # 1. Dark spots (Value < 80, making it less sensitive for mild shadows)
            lower_dark = np.array([0, 0, 0])
            upper_dark = np.array([180, 255, 80])
            mask_dark = cv2.inRange(hsv, lower_dark, upper_dark)
            
            # 2. Brown/dark red areas (scars/blemishes)
            # Hue around 0-30 or 160-180, with moderate-to-low Value (e.g. 50-140) and higher saturation
            lower_brown1 = np.array([0, 40, 50])
            upper_brown1 = np.array([30, 255, 140])
            mask_brown1 = cv2.inRange(hsv, lower_brown1, upper_brown1)
            
            lower_brown2 = np.array([160, 40, 50])
            upper_brown2 = np.array([180, 255, 140])
            mask_brown2 = cv2.inRange(hsv, lower_brown2, upper_brown2)
            
            defect_mask = mask_dark | mask_brown1 | mask_brown2
            
            # Only count defects within the tomato area
            defect_mask = cv2.bitwise_and(defect_mask, defect_mask, mask=tomato_mask)
            
            defect_pixels = cv2.countNonZero(defect_mask)
            defect_percentage = round((defect_pixels / total_tomato_pixels) * 100, 2)
        
        # 2. Extract Metadata Forensics
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        
        forensics = {
            "has_exif": False,
            "timestamp": None,
            "gps": None,
            "likely_live_camera": False
        }
        
        try:
            exif = image._getexif()
            if exif:
                forensics["has_exif"] = True
                for tag, value in exif.items():
                    decoded = ExifTags.TAGS.get(tag, tag)
                    if decoded in ["DateTime", "DateTimeOriginal"]:
                        forensics["timestamp"] = str(value)
                        forensics["likely_live_camera"] = True
                    elif decoded == "GPSInfo":
                        forensics["gps"] = {"status": "present"} # Simplified GPS representation
        except Exception:
            pass
            
        # 3. Model Prediction (Optional but kept for completeness if needed later)
        img_resized = image.resize((224, 224))
        img_array = np.array(img_resized, dtype=np.float32)
        img_array = np.expand_dims(img_array, axis=0)  # Shape: (1, 224, 224, 3)

        try:
            _ = model.predict(img_array, verbose=0)
        except Exception as e:
            print(f"Warning: Model prediction failed: {e}")
        
        # Grading Logic based on OpenCV defect_percentage
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
        
        # Final cleaned production response
        return {
            "grade": quality_grade,
            "score": round(final_score, 2),
            "defect_percentage": defect_percentage,
            "total_tomato_pixels": int(total_tomato_pixels),
            "defect_pixels": int(defect_pixels),
            "forensics": forensics
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))