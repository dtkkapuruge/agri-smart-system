from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import torch
import torchvision.transforms as transforms
from torchvision import models
from PIL import Image
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

# 1. MobileNetV2 Model Architecture Initialization
MODEL_PATH = "crop_grading_model.pth"
num_classes = 2  # Fresh, Defective (ඔයාගේ classes ගණන අනුව වෙනස් කළ හැක)
class_names = ['Defective_Tomato', 'Fresh_Tomato'] # Standard folder alphabetic order

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

model = models.mobilenet_v2(pretrained=False)
num_ftrs = model.classifier[1].in_features
model.classifier[1] = torch.nn.Linear(num_ftrs, num_classes)

# Load model weights if exists
if os.path.exists(MODEL_PATH):
    model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
    print("✅ Real Trained Model Loaded Successfully!")
else:
    print("⚠️ Model file not found yet. Running in placeholder mode.")

model = model.to(device)
model.eval()

# 2. Image Transformations
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

@app.get("/")
def read_root():
    return {"status": "AgriSmart AI Engine is Running"}

@app.post("/predict-grade")
async def predict_crop_grade(file: UploadFile = File(...)):
    try:
        # Read uploaded image
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        
        # Preprocess
        input_tensor = transform(image).unsqueeze(0).to(device)
        
        # Inference
        with torch.no_grad():
            outputs = model(input_tensor)
            probabilities = torch.nn.functional.softmax(outputs[0], dim=0)
            confidence, predicted_idx = torch.max(probabilities, 0)
            
        predicted_class = class_names[predicted_idx.item()]
        confidence_score = round(confidence.item() * 100, 2)
        
        # 3. Quality Grading Logic Rules
        if "Fresh" in predicted_class:
            if confidence_score >= 85:
                grade = "A"
                price_multiplier = 1.0
            else:
                grade = "B"
                price_multiplier = 0.8
        else:
            grade = "C"
            price_multiplier = 0.4
            
        return {
            "prediction": predicted_class,
            "confidenceScore": f"{confidence_score}%",
            "qualityGrade": grade,
            "suggestedPriceCategory": f"Grade {grade} Standard",
            "isAccepted": grade != "C"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))