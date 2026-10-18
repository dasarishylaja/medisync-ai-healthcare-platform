"""
MediSync AI - Waitlist & Slot Recovery Engine
Detects eligible waitlist entries upon cancellation, issues timed offers,
and manages atomic claiming of freed slots.
"""
from datetime import date, datetime, timedelta, timezone
from typing import Optional, Dict, Any, List
from app.extensions import db
from app.models import (
    WaitlistEntry, WaitlistStatus, Appointment, AppointmentStatus,
    Notification, NotificationType, AuditLog, DoctorProfile
)

class WaitlistService:

    @classmethod
    def join_waitlist(
        cls,
        patient_id: int,
        doctor_id: int,
        preferred_date: date,
        preferred_time_range: str = "any"
    ) -> Dict[str, Any]:
        """Adds a patient to the doctor's queue for a target date."""
        # Check if already in waitlist for this doctor and date
        existing = WaitlistEntry.query.filter_by(
            patient_id=patient_id,
            doctor_id=doctor_id,
            preferred_date=preferred_date,
            status=WaitlistStatus.WAITING
        ).first()

        if existing:
            raise ValueError("You are already on the waitlist for this doctor on the selected date.")

        entry = WaitlistEntry(
            patient_id=patient_id,
            doctor_id=doctor_id,
            preferred_date=preferred_date,
            preferred_time_range=preferred_time_range,
            status=WaitlistStatus.WAITING
        )
        db.session.add(entry)
        db.session.commit()
        return entry.to_dict()

    @classmethod
    def trigger_slot_recovery(
        cls, doctor_id: int, slot_date: date, slot_time: str
    ) -> Optional[Dict[str, Any]]:
        """
        Invoked when an appointment is cancelled or rescheduled away.
        Finds the earliest eligible patient on the waitlist and offers the slot.
        """
        # Determine time range (morning if hour < 12, else afternoon)
        s_h = int(slot_time.split(':')[0])
        slot_period = "morning" if s_h < 12 else "afternoon"

        # Find waiting candidates
        candidates = WaitlistEntry.query.filter(
            WaitlistEntry.doctor_id == doctor_id,
            WaitlistEntry.preferred_date == slot_date,
            WaitlistEntry.status == WaitlistStatus.WAITING
        ).order_by(WaitlistEntry.created_at.asc()).all()

        eligible = None
        for cand in candidates:
            if cand.preferred_time_range in ["any", slot_period]:
                eligible = cand
                break

        if not eligible:
            return None

        # Offer the slot with a 2-hour window
        offer_expires = datetime.now(timezone.utc) + timedelta(hours=2)
        eligible.status = WaitlistStatus.OFFERED
        eligible.offered_slot_start = slot_time
        eligible.offered_slot_date = slot_date
        eligible.offer_expires_at = offer_expires

        # Send notification to the patient
        doctor = DoctorProfile.query.get(doctor_id)
        doc_name = f"Dr. {doctor.user.last_name}" if doctor and doctor.user else "Doctor"

        notif = Notification(
            user_id=eligible.patient.user_id,
            title="Waitlist Slot Available!",
            message=f"A cancellation has opened an appointment slot with {doc_name} on {slot_date.strftime('%b %d')} at {slot_time}. Claim your slot before it expires in 2 hours.",
            notification_type=NotificationType.WAITLIST_OFFERED
        )
        db.session.add(notif)
        db.session.commit()

        return eligible.to_dict()

    @classmethod
    def claim_offered_slot(
        cls, waitlist_id: int, patient_id: int, reason: str
    ) -> Dict[str, Any]:
        """
        Allows an offered patient to confirm and finalize booking the recovered slot.
        """
        entry = WaitlistEntry.query.get(waitlist_id)
        if not entry:
            raise ValueError("Waitlist entry not found.")

        if entry.patient_id != patient_id:
            raise ValueError("Unauthorized to claim this waitlist offer.")

        if entry.status != WaitlistStatus.OFFERED:
            raise ValueError(f"Waitlist offer is no longer valid (status: {entry.status.value}).")

        # Verify not expired
        if entry.offer_expires_at and entry.offer_expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
            entry.status = WaitlistStatus.EXPIRED
            db.session.commit()
            raise ValueError("This waitlist slot offer has expired.")

        # Book the slot via SchedulingService
        from app.services.scheduling_service import SchedulingService
        appointment_dict = SchedulingService.book_appointment(
            patient_id=entry.patient_id,
            doctor_id=entry.doctor_id,
            appointment_date=entry.offered_slot_date,
            start_time=entry.offered_slot_start,
            reason=reason or "Claimed via MediSync Waitlist Recovery"
        )

        entry.status = WaitlistStatus.CLAIMED
        db.session.commit()

        return {
            "waitlist_entry": entry.to_dict(),
            "appointment": appointment_dict
        }

    @classmethod
    def leave_waitlist(cls, waitlist_id: int, patient_id: int) -> bool:
        """Removes a patient from the waiting list."""
        entry = WaitlistEntry.query.get(waitlist_id)
        if not entry or entry.patient_id != patient_id:
            raise ValueError("Waitlist entry not found.")

        entry.status = WaitlistStatus.CANCELLED
        db.session.commit()
        return True
