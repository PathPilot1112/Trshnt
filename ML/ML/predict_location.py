import argparse
import json
from pathlib import Path

import torch
import torch.nn as nn
from PIL import Image
from torchvision import models, transforms


def load_model(model_dir):
    model_dir = Path(model_dir)
    metadata = json.loads((model_dir / "metadata.json").read_text())
    class_names = metadata["class_names"]
    image_size = metadata.get("image_size", 224)
    threshold = metadata.get("confidence_threshold", 0.55)

    weights = models.EfficientNet_B0_Weights.DEFAULT
    model = models.efficientnet_b0(weights=None)
    model.classifier[1] = nn.Linear(model.classifier[1].in_features, len(class_names))
    model.load_state_dict(torch.load(model_dir / "model.pt", map_location="cpu"))
    model.eval()

    tf = transforms.Compose(
        [
            transforms.Resize((image_size, image_size)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ]
    )
    return model, tf, class_names, threshold


def predict(model, tf, image_path, class_names, threshold):
    image = Image.open(image_path).convert("RGB")
    x = tf(image).unsqueeze(0)
    with torch.no_grad():
        logits = model(x)
        probs = torch.softmax(logits, dim=1)[0]
    score, idx = torch.max(probs, dim=0)
    if score.item() < threshold:
        return "no match", score.item()
    return class_names[idx.item()], score.item()


def main():
    parser = argparse.ArgumentParser(description="Predict the location from an image.")
    parser.add_argument("--model-dir", default="artifacts/location_model")
    parser.add_argument("--image", required=True)
    args = parser.parse_args()

    model, tf, class_names, threshold = load_model(args.model_dir)
    label, score = predict(model, tf, args.image, class_names, threshold)
    print(json.dumps({"prediction": label, "confidence": round(score, 4)}, indent=2))


if __name__ == "__main__":
    main()
