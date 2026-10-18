"""
MediSync AI - Automated Doctor Discovery & Recommendation Tests
"""
import unittest
from datetime import date, timedelta
from app import create_app, db
from app.models import (
    User, UserRole, DoctorProfile, Specialty, DoctorAvailability
)
from app.services.recommendation_engine import DoctorRecommendationEngine

class DiscoveryTestCase(unittest.TestCase):

    def setUp(self):
        self.app = create_app('testing')
        self.ctx = self.app.app_context()
        self.ctx.push()
        db.create_all()

        s1 = Specialty(name="Cardiology", code="CARDIO", description="Heart")
        s2 = Specialty(name="Neurology", code="NEURO", description="Brain")
        db.session.add_all([s1, s2])
        db.session.commit()

        u1 = User(email="cardio.doc@test.com", first_name="Sarah", last_name="Chen", role=UserRole.DOCTOR)
        u1.set_password("pass123")
        u2 = User(email="neuro.doc@test.com", first_name="Marcus", last_name="Vance", role=UserRole.DOCTOR)
        u2.set_password("pass123")
        db.session.add_all([u1, u2])
        db.session.commit()

        d1 = DoctorProfile(user_id=u1.id, specialty_id=s1.id, license_number="L1", average_rating=4.95)
        d2 = DoctorProfile(user_id=u2.id, specialty_id=s2.id, license_number="L2", average_rating=4.7)
        db.session.add_all([d1, d2])
        db.session.commit()

        # Add availability for tomorrow
        target_date = date.today() + timedelta(days=1)
        dow = target_date.weekday()

        avail1 = DoctorAvailability(doctor_id=d1.id, day_of_week=dow, start_time="09:00", end_time="17:00", is_active=True)
        avail2 = DoctorAvailability(doctor_id=d2.id, day_of_week=dow, start_time="09:00", end_time="17:00", is_active=True)
        db.session.add_all([avail1, avail2])
        db.session.commit()

        self.s1_id = s1.id
        self.target_date = target_date

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    def test_specialty_filter_ranking(self):
        """Test engine ranks matching specialty higher with explainable reasons."""
        engine = DoctorRecommendationEngine()
        results = engine.recommend_doctors(specialty_id=self.s1_id, preferred_date=self.target_date)

        self.assertGreater(len(results), 0)
        top_match = results[0]
        self.assertEqual(top_match["doctor"]["specialty_id"], self.s1_id)
        self.assertIn("Cardiology", top_match["explanation"])
        self.assertIn("score_breakdown", top_match)
        self.assertEqual(top_match["score_breakdown"]["specialty_fit"], 100)

if __name__ == '__main__':
    unittest.main()
