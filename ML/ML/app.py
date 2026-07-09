import os
import threading
import json
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from pathlib import Path
import subprocess
from predict_location import load_model, predict

app = Flask(__name__)

# Global variables to hold the loaded model state
model_state = {
    "model": None,
    "tf": None,
    "class_names": None,
    "threshold": None,
    "is_training": False
}
MODEL_DIR = "artifacts/location_model"
UPLOAD_FOLDER = "Treasure hunt Photos"

def init_model():
    """Load the model into memory."""
    try:
        model, tf, class_names, threshold = load_model(MODEL_DIR)
        model_state["model"] = model
        model_state["tf"] = tf
        model_state["class_names"] = class_names
        model_state["threshold"] = threshold
        print("Model loaded successfully.")
    except Exception as e:
        print(f"Failed to load model on startup (it might not exist yet): {e}")

# Initialize model when the app starts
init_model()

@app.route('/predict', methods=['POST'])
def predict_api():
    if model_state["model"] is None:
        return jsonify({"error": "Model not loaded. It may be missing or failed to initialize."}), 503

    if 'image' not in request.files:
        return jsonify({"error": "No image provided"}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "No image provided"}), 400

    # Save temporarily to run predict
    temp_path = "temp_predict_image.jpg"
    file.save(temp_path)

    try:
        label, score = predict(
            model_state["model"], 
            model_state["tf"], 
            temp_path, 
            model_state["class_names"], 
            model_state["threshold"]
        )
        os.remove(temp_path)
        return jsonify({
            "prediction": label,
            "confidence": round(score, 4)
        })
    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        return jsonify({"error": str(e)}), 500

def run_training_job():
    """Background thread to run the training script and hot-reload."""
    model_state["is_training"] = True
    print("Starting background training...")
    try:
        # Call the existing training script
        subprocess.run(["python", "train_location_model.py", "--data-dir", UPLOAD_FOLDER, "--output-dir", MODEL_DIR], check=True)
        print("Training finished successfully. Hot-reloading model...")
        init_model()  # Reload the new model into memory
    except subprocess.CalledProcessError as e:
        print(f"Training failed with error code: {e.returncode}")
    except Exception as e:
        print(f"Training error: {e}")
    finally:
        model_state["is_training"] = False

@app.route('/train', methods=['POST'])
def train_api():
    if model_state["is_training"]:
        return jsonify({"message": "Training is already in progress."}), 409

    # Trigger background training
    thread = threading.Thread(target=run_training_job)
    thread.start()
    
    return jsonify({"message": "Training job started in the background. The model will be hot-reloaded automatically when complete."}), 202

@app.route('/add_image', methods=['POST'])
def add_image():
    """Uploads an image to the training dataset for future retraining."""
    if 'image' not in request.files or 'label' not in request.form:
        return jsonify({"error": "Missing image or label"}), 400
        
    file = request.files['image']
    label = request.form['label']
    
    if file.filename == '':
        return jsonify({"error": "No image provided"}), 400
        
    # Ensure label directory exists
    label_dir = os.path.join(UPLOAD_FOLDER, secure_filename(label))
    os.makedirs(label_dir, exist_ok=True)
    
    # Save the file
    filename = secure_filename(file.filename)
    save_path = os.path.join(label_dir, filename)
    file.save(save_path)
    
    return jsonify({"message": "Image added successfully", "path": save_path}), 201

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
