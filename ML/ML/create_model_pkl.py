import torch
from predict_location import load_model
import pickle

def create_pkl():
    # Load the model and its configurations
    print("Loading model and metadata...")
    model, tf, class_names, threshold = load_model("artifacts/location_model")
    
    # Bundle everything needed for deployment into a single dictionary
    model_package = {
        "model_state_dict": model.state_dict(),
        "class_names": class_names,
        "threshold": threshold,
        "transforms": tf,
        # For PyTorch, we also need to know the model architecture type to rebuild it.
        # It's EfficientNet_B0 with modified classifier for len(class_names) classes.
        "architecture": "efficientnet_b0",
        "num_classes": len(class_names)
    }
    
    # Save as a single pickle (.pkl) file
    print("Saving to location_model.pkl...")
    with open("location_model.pkl", "wb") as f:
        pickle.dump(model_package, f)
        
    print("✅ Success! Model bundled into location_model.pkl")

if __name__ == "__main__":
    create_pkl()
