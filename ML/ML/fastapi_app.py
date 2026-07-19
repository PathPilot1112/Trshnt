from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
import pickle
import torch
import torch.nn as nn
from torchvision import models
from PIL import Image
import io

app = FastAPI(title="Treasure Hunt ML API")

# Global variables to store model state
model = None
transforms = None
class_names = None
threshold = None

@app.on_event("startup")
def startup_event():
    global model, transforms, class_names, threshold
    print("Loading ML Model from PKL...")
    
    try:
        # 1. Load the bundled package
        with open("location_model.pkl", "rb") as f:
            package = pickle.load(f)
            
        class_names = package["class_names"]
        threshold = package["threshold"]
        transforms = package["transforms"]
        
        # 2. Rebuild the EfficientNet-B0 architecture
        model = models.efficientnet_b0(weights=None)
        model.classifier[1] = nn.Linear(model.classifier[1].in_features, package["num_classes"])
        
        # 3. Load the saved weights
        model.load_state_dict(package["model_state_dict"])
        model.eval() # Set to evaluation mode
        print("✅ Model loaded successfully!")
        
    except Exception as e:
        print(f"❌ Failed to load model: {e}")

@app.post("/predict")
async def predict(image: UploadFile = File(...)):
    if model is None:
        return JSONResponse(status_code=503, content={"error": "Model is not loaded."})

    try:
        # Read image bytes directly from the request
        image_bytes = await image.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        
        # Preprocess and predict
        x = transforms(image).unsqueeze(0)
        with torch.no_grad():
            logits = model(x)
            probs = torch.softmax(logits, dim=1)[0]
            
        score, idx = torch.max(probs, dim=0)
        
        # Apply confidence threshold
        if score.item() < threshold:
            return {"prediction": "no match", "confidence": round(score.item(), 4)}
            
        return {"prediction": class_names[idx.item()], "confidence": round(score.item(), 4)}
        
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

# To run this server, use the command:
# uvicorn fastapi_app:app --host 0.0.0.0 --port 5000
