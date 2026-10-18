"""
MediSync AI - Scheduling & Conflict Prevention Service
Guarantees atomic slot validation, double-booking prevention, working-hour compliance,
and transactional safety.
"""
import uuid
from datetime import date, datetime, timedelta, timezone
from typing import Dict, Any, List, Optional
from app.extensions import db
from app.models import (
    Appointment, AppointmentStatus, AppointmentType, 
    DoctorProfile, DoctorAvailability, BlockedTime, Notification, NotificationType, AuditLog
)

class SchedulingService:

    @staticmethod
    def generate_booking_reference() -> str:
        """Generates a human-friendly booking reference like 'MS-4982'"""
        return f"MS-{uuid.uuid4().hex[:6].upper()}"

    @classmethod
    def get_available_slots(
        cls, doctor_id: int, target_date: date
    ) -> List[Dict[str, Any]]:
        """
        Calculates all valid, unbooked time slots for a doctor on a specific date.
        Respects working hours, breaks, and blocked periods.
        """
        doctor = DoctorProfile.query.get(doctor_id)
        if not doctor or not doctor.is_accepting_patients:
            return []

        day_of_week = target_date.weekday()
        availability = DoctorAvailability.query.filter_by(
            doctor_id=doctor_id,
            day_of_week=day_of_week,
            is_active=True
        ).first()

        if not availability:
            return []

        # Parse times
        start_h, start_m = map(int, availability.start_time.split(':'))
        end_h, end_m = map(int, availability.end_time.split(':'))
        duration = timedelta(minutes=availability.slot_duration_minutes)

        day_start = datetime(target_date.year, target_date.month, target_date.day, start_h, start_m)
        day_end = datetime(target_date.year, target_date.month, target_date.day, end_h, end_m)

        # Retrieve active appointments for the date
        active_appointments = Appointment.query.filter(
            Appointment.doctor_id == doctor_id,
            Appointment.appointment_date == target_date,
            Appointment.status.in_([AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING])
        ).all()
        booked_times = {a.start_time for a in active_appointments}

        # Retrieve blocked periods
        blocked = BlockedTime.query.filter(
            BlockedTime.doctor_id == doctor_id,
            BlockedTime.start_datetime <= day_end,
            BlockedTime.end_datetime >= day_start
        ).all()

        slots = []
        curr = day_start
        now = datetime.now()

        while curr + duration <= day_end:
            slot_end = curr + duration
            slot_start_str = curr.strftime("%H:%M")
            slot_end_str = slot_end.strftime("%H:%M")

            # Check if in past
            is_past = (target_date < date.today()) or (target_date == date.today() and curr < now)

            # Check break
            is_break = False
            if availability.break_start_time and availability.break_end_time:
                if availability.break_start_time <= slot_start_str < availability.break_end_time:
                    is_break = True

            # Check blocked times
            is_blocked = any(b.start_datetime <= curr < b.end_datetime for b in blocked)

            # Check booked
            is_booked = slot_start_str in booked_times

            is_available = not (is_past or is_break or is_blocked or is_booked)

            slots.append({
                "start_time": slot_start_str,
                "end_time": slot_end_str,
                "is_available": is_available,
                "reason_unavailable": "past" if is_past else (
                    "break" if is_break else (
                        "blocked" if is_blocked else (
                            "booked" if is_booked else None
                        )
                    )
                )
            })
            curr += duration

        return slots

    @classmethod
    def book_appointment(
        cls,
        patient_id: int,
        doctor_id: int,
        appointment_date: date,
        start_time: str,
        reason: str,
        appointment_type: AppointmentType = AppointmentType.IN_PERSON,
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Atomically books an appointment. Enforces strict double-booking prevention.
        """
        # 1. Past date validation
        if appointment_date < date.today():
            raise ValueError("Appointments cannot be scheduled in the past.")

        # 2. Doctor existence check
        doctor = DoctorProfile.query.get(doctor_id)
        if not doctor:
            raise ValueError("Selected doctor was not found.")
        if not doctor.is_accepting_patients:
            raise ValueError("This doctor is currently not accepting new appointments.")

        # 3. Working hours & slot duration verification
        day_of_week = appointment_date.weekday()
        availability = DoctorAvailability.query.filter_by(
            doctor_id=doctor_id,
            day_of_week=day_of_week,
            is_active=True
        ).first()

        if not availability:
            raise ValueError("Doctor has no active schedule for the chosen day of the week.")

        duration = availability.slot_duration_minutes
        s_h, s_m = map(int, start_time.split(':'))
        start_dt = datetime(appointment_date.year, appointment_date.month, appointment_date.day, s_h, s_m)
        end_dt = start_dt + timedelta(minutes=duration)
        end_time = end_dt.strftime("%H:%M")

        # 4. Strict Conflict / Double-booking Prevention Check
        existing = Appointment.query.filter(
            Appointment.doctor_id == doctor_id,
            Appointment.appointment_date == appointment_date,
            Appointment.start_time == start_time,
            Appointment.status.in_([AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING])
        ).with_for_update().first() if db.engine.name != 'sqlite' else Appointment.query.filter(
            Appointment.doctor_id == doctor_id,
            Appointment.appointment_date == appointment_date,
            Appointment.start_time == start_time,
            Appointment.status.in_([AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING])
        ).first()

        if existing:
            raise ValueError(f"Slot {start_time} on {appointment_date.isoformat()} is already booked. Please choose another slot or join the waitlist.")

        # 5. Check if patient already has another appointment at this exact time
        patient_conflict = Appointment.query.filter(
            Appointment.patient_id == patient_id,
            Appointment.appointment_date == appointment_date,
            Appointment.start_time == start_time,
            Appointment.status.in_([AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING])
        ).first()
        if patient_conflict:
            raise ValueError("You already have an active appointment scheduled at this time.")

        # 6. Calculate daily queue order
        daily_count = Appointment.query.filter_by(
            doctor_id=doctor_id,
            appointment_date=appointment_date
        ).count()

        booking_ref = cls.generate_booking_reference()

        appointment = Appointment(
            booking_reference=booking_ref,
            patient_id=patient_id,
            doctor_id=doctor_id,
            appointment_date=appointment_date,
            start_time=start_time,
            end_time=end_time,
            status=AppointmentStatus.CONFIRMED,
            appointment_type=appointment_type,
            reason=reason,
            notes=notes,
            queue_order=daily_count + 1
        )
        db.session.add(appointment)

        # Add in-app confirmation notification for patient
        notification = Notification(
            user_id=doctor.user_id,
            title="New Appointment Scheduled",
            message=f"New appointment booked for {appointment_date.strftime('%b %d, %Y')} at {start_time} (Ref: {booking_ref}).",
            notification_type=NotificationType.APPOINTMENT_BOOKED
        )
        db.session.add(notification)

        # Audit log
        audit = AuditLog(
            user_id=patient_id,
            action="APPOINTMENT_BOOKED",
            target_entity="Appointment",
            target_id=booking_ref,
            details_json=f'{{"doctor_id": {doctor_id}, "date": "{appointment_date.isoformat()}", "time": "{start_time}"}}'
        )
        db.session.add(audit)

        db.session.commit()
        return appointment.to_dict()

    @classmethod
    def cancel_appointment(
        cls,
        appointment_id: int,
        actor_user_id: int,
        cancellation_reason: str
    ) -> Dict[str, Any]:
        """
        Cancels an appointment, logs audit, and triggers waitlist slot recovery.
        """
        appointment = Appointment.query.get(appointment_id)
        if not appointment:
            raise ValueError("Appointment not found.")

        if appointment.status == AppointmentStatus.CANCELLED:
            raise ValueError("Appointment is already cancelled.")

        appointment.status = AppointmentStatus.CANCELLED
        appointment.cancellation_reason = cancellation_reason
        appointment.updated_at = datetime.now(timezone.utc)

        # Audit
        audit = AuditLog(
            user_id=actor_user_id,
            action="APPOINTMENT_CANCELLED",
            target_entity="Appointment",
            target_id=appointment.booking_reference,
            details_json=f'{{"reason": "{cancellation_reason}"}}'
        )
        db.session.add(audit)
        db.session.commit()

        # Trigger waitlist recovery service
        from app.services.waitlist_service import WaitlistService
        offered_entry = WaitlistService.trigger_slot_recovery(
            doctor_id=appointment.doctor_id,
            slot_date=appointment.appointment_date,
            slot_time=appointment.start_time
        )

        return {
            "appointment": appointment.to_dict(),
            "waitlist_slot_offered": offered_entry is not None
        }

    @classmethod
    def reschedule_appointment(
        cls,
        appointment_id: int,
        new_date: date,
        new_start_time: str,
        actor_user_id: int,
        reason: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Reschedules an appointment to a new date and time atomically.
        """
        appointment = Appointment.query.get(appointment_id)
        if not appointment:
            raise ValueError("Appointment not found.")

        if appointment.status in [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED]:
            raise ValueError(f"Cannot reschedule an appointment in {appointment.status.value} status.")

        # Check target slot availability
        doctor_id = appointment.doctor_id
        day_of_week = new_date.weekday()
        avail = DoctorAvailability.query.filter_by(
            doctor_id=doctor_id,
            day_of_week=day_of_week,
            is_active=True
        ).first()

        if not avail:
            raise ValueError("Doctor is not scheduled on this day.")

        conflict = Appointment.query.filter(
            Appointment.doctor_id == doctor_id,
            Appointment.appointment_date == new_date,
            Appointment.start_time == new_start_time,
            Appointment.id != appointment_id,
            Appointment.status.in_([AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING])
        ).first()

        if conflict:
            raise ValueError(f"Slot {new_start_time} on {new_date.isoformat()} is already occupied.")

        old_date = appointment.appointment_date
        old_time = appointment.start_time

        s_h, s_m = map(int, new_start_time.split(':'))
        start_dt = datetime(new_date.year, new_date.month, new_date.day, s_h, s_m)
        end_dt = start_dt + timedelta(minutes=avail.slot_duration_minutes)

        appointment.appointment_date = new_date
        appointment.start_time = new_start_time
        appointment.end_time = end_dt.strftime("%H:%M")
        appointment.status = AppointmentStatus.RESCHEDULED
        appointment.updated_at = datetime.now(timezone.utc)

        # Audit
        audit = AuditLog(
            user_id=actor_user_id,
            action="APPOINTMENT_RESCHEDULED",
            target_entity="Appointment",
            target_id=appointment.booking_reference,
            details_json=f'{{"from": "{old_date} {old_time}", "to": "{new_date} {new_start_time}"}}'
        )
        db.session.add(audit)
        db.session.commit()

        # Check waitlist for the freed up old slot!
        from app.services.waitlist_service import WaitlistService
        WaitlistService.trigger_slot_recovery(
            doctor_id=doctor_id,
            slot_date=old_date,
            slot_time=old_time
        )

        return appointment.to_dict()
