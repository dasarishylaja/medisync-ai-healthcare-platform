"""
MediSync AI - Notification Service
Dispatches in-app notifications and manages email interface with development fallback.
"""
import logging
from typing import Optional
from app.extensions import db
from app.models import Notification, NotificationType

logger = logging.getLogger(__name__)

class NotificationService:

    @classmethod
    def send_notification(
        cls,
        user_id: int,
        title: str,
        message: str,
        notification_type: NotificationType,
        related_appointment_id: Optional[int] = None
    ) -> Notification:
        """Stores in-app notification in database."""
        notif = Notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type=notification_type,
            related_appointment_id=related_appointment_id
        )
        db.session.add(notif)
        db.session.commit()

        # If email notifications are enabled, forward through email adapter
        cls._send_email_mock(user_id, title, message)
        return notif

    @classmethod
    def _send_email_mock(cls, user_id: int, title: str, message: str):
        """
        Safe email dispatch handler.
        Logs dispatch in development mode without sending unauthorized mail.
        """
        logger.info(f"[EMAIL SERVICE - DEV DISPATCH] To User {user_id}: {title} - {message}")
