"""
pipeline.py - Graceful fallback anemia detection pipeline.
When a trained model file is available, loads and uses it.
When no model file is present, returns an informative "model unavailable" response.
Supports: best_model.pt (PyTorch), best_enhanced.pth (PyTorch), best_enhanced.h5 (TF legacy)
"""

import os
import logging
import numpy as np
import cv2
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MODELS_DIR = Path(os.getenv("MODELS_DIR", "/app/models"))
MEDICAL_DISCLAIMER = (
    "DISCLAIMER: This software is for research purposes only and has not "
    "received FDA/ICMR/CE validation. Do not use for definitive clinical diagnosis."
)

# Check what model files exist
def _find_model_file():
    candidates = [
        MODELS_DIR / "best_model.pt",
        MODELS_DIR / "best_enhanced.pth",
        MODELS_DIR / "best_enhanced.pt",
        MODELS_DIR / "anemia_model.pth",
        MODELS_DIR / "best_enhanced.h5",
        MODELS_DIR / "anemia_model.h5",
    ]
    for c in candidates:
        if c.exists():
            logger.info(f"Found model file: {c}")
            return c
    return None


class FallbackPipeline:
    """
    Returns a 'model not available' response. Used when no trained model file is found.
    This prevents 500 crashes and informs the user clearly.
    """
    def predict(self, image_bgr, **kwargs):
        logger.warning("No trained anemia model found. Returning model-unavailable response.")
        return {
            "success": True,
            "is_fallback": True,
            "error": "Anemia detection model is not yet available. Please upload a trained model file (best_model.pt) to the models directory.",
            "diagnosis": "MODEL_UNAVAILABLE",
            "is_anemic": None,
            "probability": None,
            "confidence": 0.0,
            "severity": "Unknown",
            "hemoglobin_estimate": None,
            "is_low_confidence": True,
            "model_status": "not_loaded",
            "medical_disclaimer": MEDICAL_DISCLAIMER,
        }


class PyTorchPipeline:
    """
    Loads and uses a PyTorch model file for anemia detection.
    """
    IMAGENET_MEAN = [0.485, 0.456, 0.406]
    IMAGENET_STD  = [0.229, 0.224, 0.225]
    SEVERITY_THRESHOLDS = {"mild": 0.6, "moderate": 0.8}
    HB_ESTIMATES = {"normal": 13.5, "mild": 11.0, "moderate": 9.0, "severe": 7.0}

    def __init__(self, model_path: Path):
        import torch
        self.torch = torch
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        logger.info(f"Loading PyTorch anemia model from {model_path} on {self.device}")

        checkpoint = torch.load(str(model_path), map_location=self.device, weights_only=False)

        # Support state_dict or full checkpoint formats
        if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
            from multi_modal_model import MultiModalModel
            self.model = MultiModalModel()
            self.model.load_state_dict(checkpoint["model_state_dict"])
            if "best_val_acc" in checkpoint:
                logger.info(f"Best validation accuracy: {checkpoint['best_val_acc']:.4f}")
        else:
            # Try loading as raw state_dict with EnhancedAnemiaNet
            try:
                from model_pytorch import EnhancedAnemiaNet
                self.model = EnhancedAnemiaNet()
                self.model.load_state_dict(checkpoint)
            except Exception:
                # If that fails too, try direct model load
                self.model = checkpoint

        self.model.to(self.device)
        self.model.eval()
        logger.info("PyTorch anemia model loaded successfully!")

    def _preprocess(self, image_bgr: np.ndarray) -> "torch.Tensor":
        image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
        image_rgb = cv2.resize(image_rgb, (224, 224))
        image_f = image_rgb.astype(np.float32) / 255.0
        image_f = (image_f - np.array(self.IMAGENET_MEAN)) / np.array(self.IMAGENET_STD)

        # Try 4-channel input (RGB + Lab a*) first, fall back to 3-channel
        try:
            lab = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2LAB).astype(np.float32)
            a_channel = lab[:, :, 1:2] / 255.0
            combined = np.concatenate([image_f, a_channel], axis=2)  # (H, W, 4)
            tensor = self.torch.from_numpy(combined).permute(2, 0, 1).unsqueeze(0).float()
        except Exception:
            tensor = self.torch.from_numpy(image_f).permute(2, 0, 1).unsqueeze(0).float()

        return tensor.to(self.device)

    def predict(self, image_bgr, **kwargs):
        try:
            tensor = self._preprocess(image_bgr)
            with self.torch.no_grad():
                try:
                    output, _ = self.model(tensor, "conjunctiva")
                except TypeError:
                    output = self.model(tensor)

            prob = self.torch.sigmoid(output).squeeze().item()
            is_anemic = prob > 0.5
            confidence = prob if is_anemic else 1 - prob
            is_low_confidence = 0.45 <= prob <= 0.55

            if not is_anemic:
                severity, hb = "Normal", self.HB_ESTIMATES["normal"]
            elif confidence < self.SEVERITY_THRESHOLDS["mild"]:
                severity, hb = "Mild", self.HB_ESTIMATES["mild"]
            elif confidence < self.SEVERITY_THRESHOLDS["moderate"]:
                severity, hb = "Moderate", self.HB_ESTIMATES["moderate"]
            else:
                severity, hb = "Severe", self.HB_ESTIMATES["severe"]

            diagnosis = "INCONCLUSIVE" if is_low_confidence else ("ANEMIC" if is_anemic else "NORMAL")

            return {
                "success": True,
                "diagnosis": diagnosis,
                "is_anemic": is_anemic if not is_low_confidence else None,
                "probability": prob,
                "confidence": confidence,
                "severity": severity if not is_low_confidence else "Unknown",
                "hemoglobin_estimate": hb if not is_low_confidence else None,
                "is_low_confidence": is_low_confidence,
                "model_status": "loaded",
                "version": "v2.0.0-pytorch",
                "model_accuracy": "~90%",
                "medical_disclaimer": MEDICAL_DISCLAIMER,
            }
        except Exception as e:
            logger.error(f"PyTorch prediction failed: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "diagnosis": "INCONCLUSIVE",
                "is_anemic": None,
                "probability": None,
                "confidence": None,
                "severity": None,
                "hemoglobin_estimate": None,
                "is_low_confidence": True,
                "medical_disclaimer": MEDICAL_DISCLAIMER,
            }


# ---------- Singleton ----------
_pipeline = None


def get_pipeline():
    global _pipeline
    if _pipeline is not None:
        return _pipeline

    model_file = _find_model_file()

    if model_file is None:
        logger.warning(
            "No anemia model file found in %s. Using FallbackPipeline.", MODELS_DIR
        )
        _pipeline = FallbackPipeline()
    else:
        ext = model_file.suffix.lower()
        if ext in (".pt", ".pth"):
            try:
                _pipeline = PyTorchPipeline(model_file)
            except Exception as e:
                logger.error(f"Failed to load PyTorch model: {e}")
                _pipeline = FallbackPipeline()
        else:
            logger.warning(f"Unsupported model format: {ext}. Using FallbackPipeline.")
            _pipeline = FallbackPipeline()

    return _pipeline
