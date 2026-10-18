"""
MediSync AI - Automated Scheduling & Double-Booking Tests
Validates transactional booking safety, slot recovery, and conflict prevention.
"""
import unittest
from datetime import date, timedelta
from app import create_app, db
from app.models import (
    User, UserRole, PatientProfile, DoctorProfile, Specialty,
    DoctorAvailability, Appointment, AppointmentStatus, AppointmentType
)
from app.services.scheduling_service import SchedulingService

class SchedulingTestCase(unittest.TestCase):

    def setUp(self):
        self.app = create_app('testing')
        self.ctx = self.app.app_context()
        self.ctx.push()
        db.create_all()

        # Seed minimal fixtures
        spec = Specialty(name="Cardiology", code="CARDIO", description="Heart Care")
        db.session.add(spec)

        doc_user = User(email="dr.smith@test.com", role=UserRole.DOCTOR, first_name="John", last_name="Smith")
        doc_user.set_password("SecurePass123!")
        db.session.add(doc_user)
        db.session.flush()

        doc_profile = DoctorProfile(user_id=doc_user.id, specialty_id=spec.id, license_number="LIC-1234")
        db.session.add(doc_profile)
        db.session.flush()

        # Doctor works Monday to Friday 09:00 - 17:00, 30 min slots
        avail = DoctorAvailability(
            doctor_id=doc_profile.id,
            day_of_week=0, # Monday
            start_time="09:00",
            end_time="17:00",
            slot_duration_minutes=30,
            break_start_time="12:00",
            break_end_time="13:00",
            is_active=True
        )
        db.session.add(avail)

        pat_user = User(email="pat.alice@test.com", role=UserRole.PATIENT, first_name="Alice", last_name="Johnson")
        pat_user.set_password("SecurePass123!")
        db.session.add(pat_user)
        db.session.flush()

        pat_profile = PatientProfile(user_id=pat_user.id)
        db.session.add(pat_profile)

        pat2_user = User(email="pat.bob@test.com", role=UserRole.PATIENT, first_name="Bob", last_name="Brown")
        pat2_user.set_password("SecurePass123!")
        db.session.add(pat2_user)
        db.session.flush()

        pat2_profile = PatientProfile(user_id=pat2_user.id)
        db.session.add(pat2_profile)

        db.session.commit()

        self.doctor_id = doc_profile.id
        self.patient1_id = pat_profile.id
        self.patient2_id = pat2_profile.id

        # Target next Monday
        today = date.today()
        days_ahead = 0 - today.weekday()
        if days_ahead <= 0:
            days_ahead += 7
        self.target_date = today + timedelta(days=days_ahead)

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    def test_successful_booking(self):
        """Test scheduling an open slot succeeds with reference and confirmed status."""
        result = SchedulingService.book_appointment(
            patient_id=self.patient1_id,
            doctor_id=self.doctor_id,
            appointment_date=self.target_date,
            start_time="09:00",
            reason="Routine Checkup"
        )
        self.assertIsNotNone(result)
        self.assertEqual(result["status"], "confirmed")
        self.assertEqual(result["start_time"], "09:00")
        self.assertTrue(result["booking_reference"].startswith("MS-"))

    def test_double_booking_prevention(self):
        """Test booking an already occupied slot raises an explicit conflict error."""
        # Book slot first
        SchedulingService.book_appointment(
            patient_id=self.patient1_id,
            doctor_id=self.doctor_id,
            appointment_date=self.target_date,
            start_time="09:30",
            reason="First Consultation"
        )

        # Attempt to book exact same slot with another patient
        with self.assertRaises(ValueError) as ctx:
            SchedulingService.book_appointment(
                patient_id=self.patient2_id,
                doctor_id=self.doctor_id,
                appointment_date=self.target_date,
                start_time="09:30",
                reason="Simultaneous conflicting booking attempt"
            )
        self.assertIn("already booked", str(ctx.exception))

    def test_past_date_prevention(self):
        """Test scheduling in the past is strictly rejected."""
        past_date = date.today() - timedelta(days=5)
        with self.assertRaises(ValueError) as ctx:
            SchedulingService.book_appointment(
                patient_id=self.patient1_id,
                doctor_id=self.doctor_id,
                appointment_date=past_date,
                start_time="10:00",
                reason="Past test"
            )
        self.assertIn("past", str(ctx.exception))

    def test_appointment_cancellation(self):
        """Test appointment cancellation transitions status correctly."""
        app = SchedulingService.book_appointment(
            patient_id=self.patient1_id,
            doctor_id=self.doctor_id,
            appointment_date=self.target_date,
            start_time="11:00",
            reason="Checkup"
        )
        cancelled = SchedulingService.cancel_appointment(
            appointment_id=app["id"],
            actor_user_id=1,
            cancellation_reason="Personal schedule change"
        )
        self.assertEqual(cancelled["appointment"]["status"], "cancelled")

if __name__ == '__main__':
    unittest.main()
