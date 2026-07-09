import argparse
import json
import os
from collections import Counter
from dataclasses import asdict, dataclass
from pathlib import Path

import torch
import torch.nn as nn
from PIL import Image
from sklearn.model_selection import train_test_split
from torch.utils.data import DataLoader, Dataset
from torchvision import models, transforms
from tqdm import tqdm


IMG_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


@dataclass
class TrainConfig:
    data_dir: str
    output_dir: str = "artifacts/location_model"
    image_size: int = 224
    batch_size: int = 16
    epochs: int = 25
    lr: float = 3e-4
    val_size: float = 0.2
    seed: int = 42
    confidence_threshold: float = 0.55
    freeze_backbone_epochs: int = 3


class ImageFolderSubset(Dataset):
    def __init__(self, samples, class_to_idx, transform=None):
        self.samples = samples
        self.class_to_idx = class_to_idx
        self.transform = transform

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        path, label = self.samples[idx]
        image = Image.open(path).convert("RGB")
        if self.transform:
            image = self.transform(image)
        return image, label


def set_seed(seed):
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)
    torch.backends.cudnn.deterministic = False
    torch.backends.cudnn.benchmark = True


def collect_samples(data_dir):
    data_dir = Path(data_dir)
    classes = sorted([p.name for p in data_dir.iterdir() if p.is_dir()])
    class_to_idx = {name: idx for idx, name in enumerate(classes)}
    samples = []
    for cls in classes:
        for path in (data_dir / cls).iterdir():
            if path.is_file() and path.suffix.lower() in IMG_EXTS:
                samples.append((str(path), class_to_idx[cls]))
    return samples, classes, class_to_idx


def build_model(num_classes):
    weights = models.EfficientNet_B0_Weights.DEFAULT
    model = models.efficientnet_b0(weights=weights)
    in_features = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(in_features, num_classes)
    return model, weights.transforms()


def make_transforms(image_size):
    train_tf = transforms.Compose(
        [
            transforms.Resize((image_size, image_size)),
            transforms.RandomHorizontalFlip(),
            transforms.RandomRotation(15),
            transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.05),
            transforms.RandomPerspective(distortion_scale=0.15, p=0.25),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ]
    )
    eval_tf = transforms.Compose(
        [
            transforms.Resize((image_size, image_size)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ]
    )
    return train_tf, eval_tf


def run_epoch(model, loader, criterion, optimizer, device, train=True):
    if train:
        model.train()
    else:
        model.eval()
    total_loss = 0.0
    correct = 0
    total = 0
    for images, labels in tqdm(loader, leave=False):
        images = images.to(device)
        labels = labels.to(device)
        with torch.set_grad_enabled(train):
            outputs = model(images)
            loss = criterion(outputs, labels)
            if train:
                optimizer.zero_grad()
                loss.backward()
                optimizer.step()
        total_loss += loss.item() * images.size(0)
        preds = outputs.argmax(dim=1)
        correct += (preds == labels).sum().item()
        total += labels.size(0)
    return total_loss / total, correct / total


def save_artifacts(output_dir, model, class_names, config, weights_name):
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    torch.save(model.state_dict(), output_dir / "model.pt")
    metadata = {
        "class_names": class_names,
        "confidence_threshold": config.confidence_threshold,
        "image_size": config.image_size,
        "weights": weights_name,
    }
    (output_dir / "metadata.json").write_text(json.dumps(metadata, indent=2))
    (output_dir / "train_config.json").write_text(json.dumps(asdict(config), indent=2))


def main():
    parser = argparse.ArgumentParser(description="Train a location classifier from folder-structured images.")
    parser.add_argument("--data-dir", default="Treasure hunt Photos")
    parser.add_argument("--output-dir", default="artifacts/location_model")
    parser.add_argument("--epochs", type=int, default=25)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--lr", type=float, default=3e-4)
    parser.add_argument("--val-size", type=float, default=0.2)
    parser.add_argument("--image-size", type=int, default=224)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--confidence-threshold", type=float, default=0.55)
    parser.add_argument("--freeze-backbone-epochs", type=int, default=3)
    args = parser.parse_args()

    config = TrainConfig(
        data_dir=args.data_dir,
        output_dir=args.output_dir,
        image_size=args.image_size,
        batch_size=args.batch_size,
        epochs=args.epochs,
        lr=args.lr,
        val_size=args.val_size,
        seed=args.seed,
        confidence_threshold=args.confidence_threshold,
        freeze_backbone_epochs=args.freeze_backbone_epochs,
    )

    set_seed(config.seed)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    samples, class_names, class_to_idx = collect_samples(config.data_dir)
    if len(samples) < 2:
        raise RuntimeError("Not enough images found under the data directory.")

    labels = [label for _, label in samples]
    train_samples, val_samples = train_test_split(
        samples,
        test_size=config.val_size,
        random_state=config.seed,
        stratify=labels,
    )

    train_tf, eval_tf = make_transforms(config.image_size)
    train_ds = ImageFolderSubset(train_samples, class_to_idx, transform=train_tf)
    val_ds = ImageFolderSubset(val_samples, class_to_idx, transform=eval_tf)

    train_loader = DataLoader(train_ds, batch_size=config.batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_ds, batch_size=config.batch_size, shuffle=False, num_workers=0)

    model, weights_tf = build_model(len(class_names))
    model = model.to(device)

    class_counts = Counter(labels)
    class_weights = torch.tensor(
        [1.0 / class_counts[i] for i in range(len(class_names))],
        dtype=torch.float32,
        device=device,
    )
    class_weights = class_weights / class_weights.sum() * len(class_names)
    criterion = nn.CrossEntropyLoss(weight=class_weights)

    for param in model.features.parameters():
        param.requires_grad = False

    optimizer = torch.optim.AdamW(model.parameters(), lr=config.lr, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode="max", patience=3, factor=0.5)

    best_val_acc = 0.0
    best_state = None
    patience = 6
    bad_epochs = 0

    for epoch in range(1, config.epochs + 1):
        if epoch == config.freeze_backbone_epochs + 1:
            for param in model.features.parameters():
                param.requires_grad = True

        train_loss, train_acc = run_epoch(model, train_loader, criterion, optimizer, device, train=True)
        val_loss, val_acc = run_epoch(model, val_loader, criterion, optimizer, device, train=False)
        scheduler.step(val_acc)

        print(
            f"Epoch {epoch:02d}/{config.epochs} | "
            f"train_loss={train_loss:.4f} train_acc={train_acc:.4f} | "
            f"val_loss={val_loss:.4f} val_acc={val_acc:.4f}"
        )

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            best_state = {k: v.detach().cpu().clone() for k, v in model.state_dict().items()}
            bad_epochs = 0
        else:
            bad_epochs += 1
            if bad_epochs >= patience:
                print("Early stopping triggered.")
                break

    if best_state is not None:
        model.load_state_dict(best_state)

    save_artifacts(config.output_dir, model.cpu(), class_names, config, "efficientnet_b0")
    print(f"Saved model to {config.output_dir}")
    print(f"Best validation accuracy: {best_val_acc:.4f}")
    print("Classes:", ", ".join(class_names))


if __name__ == "__main__":
    main()
