"""Suspicious activity detection logic"""
import cv2
import numpy as np
from tensorflow.keras.models import load_model
from typing import Tuple, Optional
from .config import IMG_SIZE, MODEL_PATH
from .notifications import EmailNotifier

class ActivityDetector:
    def __init__(self, model_path: str = str(MODEL_PATH)):
        self.model = load_model(model_path)
        self.notifier = EmailNotifier()
        
    def preprocess_frame(self, frame: np.ndarray) -> np.ndarray:
        """Preprocess video frame for model input"""
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        resized = cv2.resize(gray, IMG_SIZE)
        normalized = resized.astype('float32') / 255.0
        return normalized.reshape(1, *IMG_SIZE, 1)

    def detect_activity(self, frame: np.ndarray) -> Tuple[bool, float]:
        """Detect suspicious activity in a frame"""
        processed = self.preprocess_frame(frame)
        prediction = self.model.predict(processed)[0]
        is_suspicious = prediction[1] > 0.5
        confidence = prediction[1] if is_suspicious else prediction[0]
        
        if is_suspicious:
            self.notifier.send_alert()
            
        return is_suspicious, confidence

    def process_video_feed(self, video_source: Optional[str] = None):
        """Process video feed for suspicious activity"""
        cap = cv2.VideoCapture(video_source if video_source else 0)
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
                
            is_suspicious, confidence = self.detect_activity(frame)
            
            # Annotate frame
            color = (0, 0, 255) if is_suspicious else (0, 255, 0)
            text = f"{'Suspicious' if is_suspicious else 'Normal'} ({confidence:.2f})"
            cv2.putText(frame, text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, color, 2)
            
            yield frame
            
        cap.release()