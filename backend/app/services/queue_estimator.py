"""
MediSync AI - Waiting-Time & Queue Estimation Service
Calculates transparent queue position and estimated wait times.
Includes required clinical variance disclaimers without fabricating real-time telemetry.
"""
from typing import Dict, Any
from datetime import date, datetime
from app.models import Appointment, AppointmentStatus, DoctorProfile

class QueueEstimator:
    """
    Computes transparent queue position and waiting time estimation.
    Default consultation pacing assumption is 15 minutes per patient.
    """

    AVERAGE_SERVICE_MINUTES = 15

    @classmethod
    def estimate_wait_time(
        cls, appointment_id: int
    ) -> Dict[str, Any]:
        """
        Computes the queue metrics for an appointment.
        """
        appointment = Appointment.query.get(appointment_id)
        if not appointment:
            raise ValueError("Appointment not found.")

        # If already completed or cancelled
        if appointment.status in [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED]:
            return {
                "appointment_id": appointment_id,
                "status": appointment.status.value,
                "queue_position": 0,
                "patients_ahead": 0,
                "estimated_wait_minutes": 0,
                "status_message": f"Appointment is {appointment.status.value}.",
                "disclaimer": "No active queue estimation needed."
            }

        # Find appointments for this doctor on this day that are scheduled before this one
        prior_appointments = Appointment.query.filter(
            Appointment.doctor_id == appointment.doctor_id,
            Appointment.appointment_date == appointment.appointment_date,
            Appointment.start_time < appointment.start_time,
            Appointment.status.in_([AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING])
        ).count()

        patients_ahead = prior_appointments
        queue_position = patients_ahead + 1
        estimated_wait_minutes = patients_ahead * cls.AVERAGE_SERVICE_MINUTES

        doctor = DoctorProfile.query.get(appointment.doctor_id)
        doc_name = f"Dr. {doctor.user.last_name}" if doctor and doctor.user else "your doctor"

        return {
            "appointment_id": appointment.id,
            "booking_reference": appointment.booking_reference,
            "appointment_time": appointment.start_time,
            "queue_position": queue_position,
            "patients_ahead": patients_ahead,
            "estimated_wait_minutes": estimated_wait_minutes,
            "assumed_service_duration_minutes": cls.AVERAGE_SERVICE_MINUTES,
            "last_updated": datetime.now().strftime("%H:%M:%S"),
            "status_message": (
                f"You are next in line for {doc_name}." if patients_ahead == 0 else
                f"There are {patients_ahead} patient{'s' if patients_ahead > 1 else ''} scheduled ahead of you."
            ),
            "disclaimer": (
                "Illustrative operational estimate based on standard 15-minute consultation pacing. "
                "Actual clinical times may vary due to patient needs or urgent cases."
            )
        }
