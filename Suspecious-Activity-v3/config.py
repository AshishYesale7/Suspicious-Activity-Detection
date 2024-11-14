import os
from dotenv import load_dotenv

load_dotenv()

# Email Configuration
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 465
SENDER_EMAIL = os.getenv("SENDER_EMAIL")
APP_PASSWORD = os.getenv("APP_PASSWORD")
RECIPIENT_EMAIL = os.getenv("RECIPIENT_EMAIL")

# Database Configuration
DB_PATH = "data/suspicious_activity.db"

# Model Configuration
MODEL_PATH = "models/suspicious_activity_model.h5"
IMG_SIZE = (64, 64)
NUM_CLASSES = 2

# Logging Configuration
LOG_PATH = "logs/app.log"