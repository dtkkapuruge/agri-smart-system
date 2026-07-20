from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from io import BytesIO
from PIL import Image

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/v1/grade-crop")
async def grade_crop(file: UploadFile = File(...)):
    contents = await file.read()
    image = Image.open(BytesIO(contents))
    
    return {
        "crop": "Tomato",
        "qualityScore": "92%",
        "grade": "A",
        "estimatedPrice": "$2.80/kg",
        "forensicsStatus": "Passed"
    }
