"""
MediSync AI - Synthetic Database Seeder
Populates realistic demo healthcare data including doctors, specialties, schedules,
appointments, waitlist items, and audit entries.
"""
from datetime import date, datetime, timedelta, timezone
from app import create_app, db
from app.models import (
    User, UserRole, PatientProfile, DoctorProfile, Specialty,
    DoctorAvailability, BlockedTime, Appointment, AppointmentStatus,
    AppointmentType, WaitlistEntry, WaitlistStatus, Notification, NotificationType, AuditLog
)

def seed_database():
    app = create_app('development')
    with app.app_context():
        print("Cleaning and recreating database schema...")
        db.drop_all()
        db.create_all()

        # 1. Create Specialties
        specialties = [
            Specialty(name="Internal Medicine & Cardiology", code="CARDIO", description="Cardiovascular system health, preventive cardiology, heart condition management.", icon_name="HeartPulse"),
            Specialty(name="Neurology & Neurosciences", code="NEURO", description="Brain, nerve, and spine consultations, migraine, and cognitive care.", icon_name="Brain"),
            Specialty(name="Pediatrics & Child Care", code="PEDI", description="Comprehensive infants, children, and adolescent clinical care.", icon_name="Baby"),
            Specialty(name="Dermatology & Skin Health", code="DERM", description="Clinical dermatology, skin evaluations, and allergy assessments.", icon_name="Sparkles"),
            Specialty(name="Orthopedics & Joint Care", code="ORTHO", description="Musculoskeletal system, joint health, sports injuries, and rehabilitation.", icon_name="Activity"),
            Specialty(name="Family & Preventative Medicine", code="FAMILY", description="Primary primary care, annual health checkups, and chronic disease coordination.", icon_name="ShieldCheck")
        ]
        db.session.add_all(specialties)
        db.session.commit()

        # 2. Create Users
        # Admin
        admin_user = User(
            email="admin@medisync.io",
            role=UserRole.ADMIN,
            first_name="Eleanor",
            last_name="Vance",
            phone="+1 (555) 100-2000"
        )
        admin_user.set_password("AdminPass123!")
        db.session.add(admin_user)

        # Doctors
        doc1_user = User(
            email="sarah.chen@medisync.io",
            role=UserRole.DOCTOR,
            first_name="Sarah",
            last_name="Chen",
            phone="+1 (555) 234-5678"
        )
        doc1_user.set_password("DoctorPass123!")

        doc2_user = User(
            email="marcus.vance@medisync.io",
            role=UserRole.DOCTOR,
            first_name="Marcus",
            last_name="Vance",
            phone="+1 (555) 345-6789"
        )
        doc2_user.set_password("DoctorPass123!")

        doc3_user = User(
            email="elena.rodriguez@medisync.io",
            role=UserRole.DOCTOR,
            first_name="Elena",
            last_name="Rodriguez",
            phone="+1 (555) 456-7890"
        )
        doc3_user.set_password("DoctorPass123!")

        # Patients
        pat1_user = User(
            email="patient.emma@example.com",
            role=UserRole.PATIENT,
            first_name="Emma",
            last_name="Watson",
            phone="+1 (555) 876-5432"
        )
        pat1_user.set_password("PatientPass123!")

        pat2_user = User(
            email="patient.david@example.com",
            role=UserRole.PATIENT,
            first_name="David",
            last_name="Kim",
            phone="+1 (555) 987-6543"
        )
        pat2_user.set_password("PatientPass123!")

        db.session.add_all([doc1_user, doc2_user, doc3_user, pat1_user, pat2_user])
        db.session.commit()

        # 3. Create Doctor Profiles
        doc1_profile = DoctorProfile(
            user_id=doc1_user.id,
            specialty_id=specialties[0].id,
            license_number="MD-NY-84920",
            consultation_fee=120.00,
            bio="Board-certified cardiologist specializing in preventive heart health, cardiovascular wellness, and hypertension management with 12+ years of clinical experience.",
            experience_years=12,
            average_rating=4.9,
            total_reviews_count=142,
            office_room="Suite 401A",
            avatar_url="/src/assets/images/doc_sarah_chen_1792303936307.jpg"
        )

        doc2_profile = DoctorProfile(
            user_id=doc2_user.id,
            specialty_id=specialties[1].id,
            license_number="MD-NY-77412",
            consultation_fee=140.00,
            bio="Chief of Clinical Neurology. Expert in chronic migraine management, cognitive wellness, and vestibular disorders with leading academic affiliations.",
            experience_years=16,
            average_rating=4.95,
            total_reviews_count=98,
            office_room="Suite 502B",
            avatar_url="/src/assets/images/doc_marcus_vance_1792303952095.jpg"
        )

        doc3_profile = DoctorProfile(
            user_id=doc3_user.id,
            specialty_id=specialties[2].id,
            license_number="MD-NY-65109",
            consultation_fee=95.00,
            bio="Compassionate pediatric specialist focusing on developmental milestones, childhood preventative medicine, and comprehensive adolescent care.",
            experience_years=9,
            average_rating=4.88,
            total_reviews_count=175,
            office_room="Suite 204C",
            avatar_url="/src/assets/images/doc_elena_rodriguez_1792303965310.jpg"
        )

        db.session.add_all([doc1_profile, doc2_profile, doc3_profile])
        db.session.commit()

        # 4. Patient Profiles
        pat1_profile = PatientProfile(
            user_id=pat1_user.id,
            date_of_birth=date(1994, 5, 12),
            blood_group="A+",
            emergency_contact="John Watson (+1 555-888-9999)",
            medical_notes_summary="Mild seasonal allergies, family history of hypertension.",
            preferred_contact_method="email"
        )
        pat2_profile = PatientProfile(
            user_id=pat2_user.id,
            date_of_birth=date(1988, 11, 23),
            blood_group="O+",
            emergency_contact="Grace Kim (+1 555-777-6666)",
            medical_notes_summary="No known allergies, routine physical scheduled.",
            preferred_contact_method="sms"
        )
        db.session.add_all([pat1_profile, pat2_profile])
        db.session.commit()

        # 5. Doctor Availabilities (Monday - Friday, 09:00 - 17:00)
        for doc_p in [doc1_profile, doc2_profile, doc3_profile]:
            for day in range(5): # Mon to Fri
                avail = DoctorAvailability(
                    doctor_id=doc_p.id,
                    day_of_week=day,
                    start_time="09:00",
                    end_time="17:00",
                    slot_duration_minutes=30,
                    break_start_time="12:00",
                    break_end_time="13:00",
                    is_active=True
                )
                db.session.add(avail)
        db.session.commit()

        # 6. Sample Appointments
        today = date.today()
        tomorrow = today + timedelta(days=1)
        yesterday = today - timedelta(days=1)

        app1 = Appointment(
            booking_reference="MS-784210",
            patient_id=pat1_profile.id,
            doctor_id=doc1_profile.id,
            appointment_date=today,
            start_time="10:00",
            end_time="10:30",
            status=AppointmentStatus.CONFIRMED,
            appointment_type=AppointmentType.IN_PERSON,
            reason="Quarterly blood pressure review and cardiovascular checkup",
            notes="Patient reports consistent morning readings.",
            queue_order=1
        )

        app2 = Appointment(
            booking_reference="MS-891244",
            patient_id=pat2_profile.id,
            doctor_id=doc1_profile.id,
            appointment_date=today,
            start_time="10:30",
            end_time="11:00",
            status=AppointmentStatus.CONFIRMED,
            appointment_type=AppointmentType.IN_PERSON,
            reason="Follow-up on lipid panel lab results",
            notes="",
            queue_order=2
        )

        app3 = Appointment(
            booking_reference="MS-345091",
            patient_id=pat1_profile.id,
            doctor_id=doc2_profile.id,
            appointment_date=tomorrow,
            start_time="14:00",
            end_time="14:30",
            status=AppointmentStatus.CONFIRMED,
            appointment_type=AppointmentType.TELEHEALTH,
            reason="Migraine frequency assessment and headache diary review",
            notes="Virtual telehealth video link issued.",
            queue_order=1
        )

        app4 = Appointment(
            booking_reference="MS-112344",
            patient_id=pat1_profile.id,
            doctor_id=doc3_profile.id,
            appointment_date=yesterday,
            start_time="11:00",
            end_time="11:30",
            status=AppointmentStatus.COMPLETED,
            appointment_type=AppointmentType.IN_PERSON,
            reason="Routine preventive wellness checkup",
            notes="Vitals within normal range. No acute issues.",
            queue_order=1
        )

        db.session.add_all([app1, app2, app3, app4])
        db.session.commit()

        # 7. Sample Waitlist Entry
        waitlist1 = WaitlistEntry(
            patient_id=pat2_profile.id,
            doctor_id=doc2_profile.id,
            preferred_date=today,
            preferred_time_range="morning",
            status=WaitlistStatus.WAITING
        )
        db.session.add(waitlist1)

        # 8. Notifications
        n1 = Notification(
            user_id=pat1_user.id,
            title="Appointment Confirmed: Dr. Sarah Chen",
            message=f"Your cardiovascular follow-up is confirmed for {today.strftime('%b %d')} at 10:00 AM (Ref: MS-784210).",
            notification_type=NotificationType.APPOINTMENT_CONFIRMED,
            related_appointment_id=app1.id,
            is_read=False
        )
        n2 = Notification(
            user_id=doc1_user.id,
            title="Today's Schedule: 2 Consultations",
            message="You have 2 scheduled patient visits for today starting at 10:00 AM.",
            notification_type=NotificationType.REMINDER,
            is_read=True
        )
        db.session.add_all([n1, n2])

        # 9. Audit Logs
        a1 = AuditLog(
            user_id=pat1_user.id,
            action="APPOINTMENT_BOOKED",
            target_entity="Appointment",
            target_id="MS-784210",
            details_json='{"doctor_id": 1, "service": "Cardiology"}',
            ip_address="192.168.1.10"
        )
        db.session.add(a1)

        db.session.commit()
        print("MediSync AI synthetic database successfully seeded!")

if __name__ == '__main__':
    seed_database()
