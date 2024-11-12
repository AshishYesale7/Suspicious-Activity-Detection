"""Configuration settings"""
import os
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).parent.parent
MODELS_DIR = BASE_DIR / "models"
DATA_DIR = BASE_DIR / "data"

# Email Config
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 465
SENDER_EMAIL = os.getenv("SENDER_EMAIL", "")  # Set via environment variable
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD", "")  # Set via environment variable

# Database
DB_PATH = BASE_DIR / "data/suspicious_detection.db"

# Model Settings
IMG_SIZE = (64, 64)
NUM_CLASSES = 2
MODEL_PATH = MODELS_DIR / "suspicious_detection.h5"

# UI Settings
WINDOW_TITLE = "Suspicious Activity Detection"
THEME_COLOR = "#192841"