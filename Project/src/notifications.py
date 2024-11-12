"""Notification system"""
import smtplib
from email.message import EmailMessage
from datetime import datetime
from .config import SMTP_SERVER, SMTP_PORT, SENDER_EMAIL, EMAIL_PASSWORD

class EmailNotifier:
    def __init__(self):
        self.last_notification = None
        self.cooldown = 300  # 5 minutes between notifications
        
    def send_alert(self, recipient_email: str = None):
        """Send suspicious activity alert"""
        now = datetime.now()
        
        # Check cooldown
        if (self.last_notification and 
            (now - self.last_notification).total_seconds() < self.cooldown):
            return
            
        if not SENDER_EMAIL or not EMAIL_PASSWORD:
            raise ValueError("Email credentials not configured")
            
        msg = EmailMessage()
        msg.set_content('Suspicious Activity Detected!')
        msg['Subject'] = 'Security Alert - Suspicious Activity'
        msg['From'] = SENDER_EMAIL
        msg['To'] = recipient_email or SENDER_EMAIL
        
        with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT) as smtp:
            smtp.login(SENDER_EMAIL, EMAIL_PASSWORD)
            smtp.send_message(msg)
            
        self.last_notification = now