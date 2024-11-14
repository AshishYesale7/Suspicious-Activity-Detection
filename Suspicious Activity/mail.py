import smtplib
import logging
from email.message import EmailMessage
from config import SMTP_SERVER, SMTP_PORT, SENDER_EMAIL, APP_PASSWORD, RECIPIENT_EMAIL

logger = logging.getLogger(__name__)

def send_alert(subject="Suspicious Activity Detection", message="Suspicious Activity Detected"):
    """Send email alert when suspicious activity is detected"""
    try:
        msg = EmailMessage()
        msg['Subject'] = subject
        msg['From'] = SENDER_EMAIL
        msg['To'] = RECIPIENT_EMAIL
        msg.set_content(message)

        with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT) as smtp:
            smtp.login(SENDER_EMAIL, APP_PASSWORD)
            smtp.send_message(msg)
            logger.info("Alert email sent successfully")
            
    except Exception as e:
        logger.error(f"Failed to send alert email: {str(e)}")
        raise