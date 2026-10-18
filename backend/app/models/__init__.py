"""
MediSync AI - Database Models Package
Exports all domain models for relational mapping and migrations.
"""
from datetime import datetime, timezone
import enum
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
from app.extensions import db, login_manager

class UserRole(enum.Enum):
    PATIENT = "patient"
    DOCTOR = "doctor"
    ADMIN = "admin"

class AppointmentStatus(enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    RESCHEDULED = "rescheduled"
    NO_SHOW = "no_show"

class AppointmentType(enum.Enum):
    IN_PERSON = "in_person"
    TELEHEALTH = "telehealth"

class WaitlistStatus(enum.Enum):
    WAITING = "waiting"
    OFFERED = "offered"
    CLAIMED = "claimed"
    EXPIRED = "expired"
    CANCELLED = "cancelled"

class NotificationType(enum.Enum):
    APPOINTMENT_BOOKED = "appointment_booked"
    APPOINTMENT_CONFIRMED = "appointment_confirmed"
    APPOINTMENT_CANCELLED = "appointment_cancelled"
    APPOINTMENT_RESCHEDULED = "appointment_rescheduled"
    WAITLIST_OFFERED = "waitlist_offered"
    REMINDER = "reminder"
    SCHEDULE_CHANGE = "schedule_change"

class User(UserMixin, db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.Enum(UserRole), nullable=False, default=UserRole.PATIENT)
    first_name = db.Column(db.String(64), nullable=False)
    last_name = db.Column(db.String(64), nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    patient_profile = db.relationship('PatientProfile', backref='user', uselist=False, cascade='all, delete-orphan')
    doctor_profile = db.relationship('DoctorProfile', backref='user', uselist=False, cascade='all, delete-orphan')
    notifications = db.relationship('Notification', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    audit_logs = db.relationship('AuditLog', backref='actor', lazy='dynamic')

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "role": self.role.value if isinstance(self.role, UserRole) else self.role,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "full_name": self.full_name,
            "phone": self.phone,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

class Specialty(db.Model):
    __tablename__ = 'specialties'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False, index=True)
    code = db.Column(db.String(30), unique=True, nullable=False)
    description = db.Column(db.Text, nullable=True)
    icon_name = db.Column(db.String(50), default='Stethoscope')

    doctors = db.relationship('DoctorProfile', backref='specialty', lazy='dynamic')

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "code": self.code,
            "description": self.description,
            "icon_name": self.icon_name
        }

class PatientProfile(db.Model):
    __tablename__ = 'patient_profiles'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False)
    date_of_birth = db.Column(db.Date, nullable=True)
    blood_group = db.Column(db.String(5), nullable=True)
    emergency_contact = db.Column(db.String(100), nullable=True)
    medical_notes_summary = db.Column(db.Text, nullable=True)
    preferred_contact_method = db.Column(db.String(20), default='email')

    appointments = db.relationship('Appointment', backref='patient', lazy='dynamic')
    waitlist_entries = db.relationship('WaitlistEntry', backref='patient', lazy='dynamic')

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "date_of_birth": self.date_of_birth.isoformat() if self.date_of_birth else None,
            "blood_group": self.blood_group,
            "emergency_contact": self.emergency_contact,
            "medical_notes_summary": self.medical_notes_summary,
            "preferred_contact_method": self.preferred_contact_method
        }

class DoctorProfile(db.Model):
    __tablename__ = 'doctor_profiles'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False)
    specialty_id = db.Column(db.Integer, db.ForeignKey('specialties.id'), nullable=False)
    license_number = db.Column(db.String(50), unique=True, nullable=False)
    consultation_fee = db.Column(db.Numeric(10, 2), default=75.00)
    bio = db.Column(db.Text, nullable=True)
    experience_years = db.Column(db.Integer, default=5)
    average_rating = db.Column(db.Float, default=4.9)
    total_reviews_count = db.Column(db.Integer, default=0)
    is_accepting_patients = db.Column(db.Boolean, default=True)
    office_room = db.Column(db.String(30), default="Suite 401")
    avatar_url = db.Column(db.String(255), nullable=True)

    availabilities = db.relationship('DoctorAvailability', backref='doctor', lazy='dynamic', cascade='all, delete-orphan')
    blocked_times = db.relationship('BlockedTime', backref='doctor', lazy='dynamic', cascade='all, delete-orphan')
    appointments = db.relationship('Appointment', backref='doctor', lazy='dynamic')
    waitlist_entries = db.relationship('WaitlistEntry', backref='doctor', lazy='dynamic')
    reviews = db.relationship('Review', backref='doctor', lazy='dynamic')

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "doctor_name": f"Dr. {self.user.first_name} {self.user.last_name}" if self.user else "Doctor",
            "specialty": self.specialty.name if self.specialty else "General Medicine",
            "specialty_id": self.specialty_id,
            "license_number": self.license_number,
            "consultation_fee": float(self.consultation_fee) if self.consultation_fee else 0.0,
            "bio": self.bio,
            "experience_years": self.experience_years,
            "average_rating": self.average_rating,
            "total_reviews_count": self.total_reviews_count,
            "is_accepting_patients": self.is_accepting_patients,
            "office_room": self.office_room,
            "avatar_url": self.avatar_url
        }

class DoctorAvailability(db.Model):
    __tablename__ = 'doctor_availabilities'

    id = db.Column(db.Integer, primary_key=True)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctor_profiles.id', ondelete='CASCADE'), nullable=False, index=True)
    day_of_week = db.Column(db.Integer, nullable=False) # 0=Monday, 6=Sunday
    start_time = db.Column(db.String(5), nullable=False) # "09:00"
    end_time = db.Column(db.String(5), nullable=False)   # "17:00"
    slot_duration_minutes = db.Column(db.Integer, default=30)
    break_start_time = db.Column(db.String(5), default="12:00")
    break_end_time = db.Column(db.String(5), default="13:00")
    is_active = db.Column(db.Boolean, default=True)

    __table_args__ = (
        db.UniqueConstraint('doctor_id', 'day_of_week', name='uq_doctor_day_availability'),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "doctor_id": self.doctor_id,
            "day_of_week": self.day_of_week,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "slot_duration_minutes": self.slot_duration_minutes,
            "break_start_time": self.break_start_time,
            "break_end_time": self.break_end_time,
            "is_active": self.is_active
        }

class BlockedTime(db.Model):
    __tablename__ = 'blocked_times'

    id = db.Column(db.Integer, primary_key=True)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctor_profiles.id', ondelete='CASCADE'), nullable=False, index=True)
    start_datetime = db.Column(db.DateTime, nullable=False)
    end_datetime = db.Column(db.DateTime, nullable=False)
    reason = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "doctor_id": self.doctor_id,
            "start_datetime": self.start_datetime.isoformat(),
            "end_datetime": self.end_datetime.isoformat(),
            "reason": self.reason
        }

class Appointment(db.Model):
    __tablename__ = 'appointments'

    id = db.Column(db.Integer, primary_key=True)
    booking_reference = db.Column(db.String(16), unique=True, nullable=False, index=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patient_profiles.id'), nullable=False, index=True)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctor_profiles.id'), nullable=False, index=True)
    appointment_date = db.Column(db.Date, nullable=False, index=True)
    start_time = db.Column(db.String(5), nullable=False) # "09:30"
    end_time = db.Column(db.String(5), nullable=False)   # "10:00"
    status = db.Column(db.Enum(AppointmentStatus), default=AppointmentStatus.CONFIRMED, nullable=False, index=True)
    appointment_type = db.Column(db.Enum(AppointmentType), default=AppointmentType.IN_PERSON, nullable=False)
    reason = db.Column(db.String(255), nullable=False)
    notes = db.Column(db.Text, nullable=True)
    cancellation_reason = db.Column(db.String(255), nullable=True)
    queue_order = db.Column(db.Integer, default=1)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        db.Index('idx_doctor_slot', 'doctor_id', 'appointment_date', 'start_time'),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "booking_reference": self.booking_reference,
            "patient_id": self.patient_id,
            "patient_name": self.patient.user.full_name if self.patient and self.patient.user else "Patient",
            "patient_email": self.patient.user.email if self.patient and self.patient.user else "",
            "doctor_id": self.doctor_id,
            "doctor_name": f"Dr. {self.doctor.user.first_name} {self.doctor.user.last_name}" if self.doctor and self.doctor.user else "Doctor",
            "specialty": self.doctor.specialty.name if self.doctor and self.doctor.specialty else "General Medicine",
            "appointment_date": self.appointment_date.isoformat(),
            "start_time": self.start_time,
            "end_time": self.end_time,
            "status": self.status.value if isinstance(self.status, AppointmentStatus) else self.status,
            "appointment_type": self.appointment_type.value if isinstance(self.appointment_type, AppointmentType) else self.appointment_type,
            "reason": self.reason,
            "notes": self.notes,
            "cancellation_reason": self.cancellation_reason,
            "queue_order": self.queue_order,
            "created_at": self.created_at.isoformat()
        }

class WaitlistEntry(db.Model):
    __tablename__ = 'waitlist_entries'

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patient_profiles.id'), nullable=False, index=True)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctor_profiles.id'), nullable=False, index=True)
    preferred_date = db.Column(db.Date, nullable=False)
    preferred_time_range = db.Column(db.String(20), default="morning") # "morning", "afternoon", "any"
    status = db.Column(db.Enum(WaitlistStatus), default=WaitlistStatus.WAITING, nullable=False, index=True)
    offered_slot_start = db.Column(db.String(5), nullable=True)
    offered_slot_date = db.Column(db.Date, nullable=True)
    offer_expires_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "patient_name": self.patient.user.full_name if self.patient and self.patient.user else "Patient",
            "doctor_id": self.doctor_id,
            "doctor_name": f"Dr. {self.doctor.user.first_name} {self.doctor.user.last_name}" if self.doctor and self.doctor.user else "Doctor",
            "specialty": self.doctor.specialty.name if self.doctor and self.doctor.specialty else "General Medicine",
            "preferred_date": self.preferred_date.isoformat(),
            "preferred_time_range": self.preferred_time_range,
            "status": self.status.value if isinstance(self.status, WaitlistStatus) else self.status,
            "offered_slot_start": self.offered_slot_start,
            "offered_slot_date": self.offered_slot_date.isoformat() if self.offered_slot_date else None,
            "offer_expires_at": self.offer_expires_at.isoformat() if self.offer_expires_at else None,
            "created_at": self.created_at.isoformat()
        }

class Notification(db.Model):
    __tablename__ = 'notifications'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    title = db.Column(db.String(120), nullable=False)
    message = db.Column(db.Text, nullable=False)
    notification_type = db.Column(db.Enum(NotificationType), nullable=False)
    is_read = db.Column(db.Boolean, default=False, nullable=False, index=True)
    related_appointment_id = db.Column(db.Integer, db.ForeignKey('appointments.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "message": self.message,
            "notification_type": self.notification_type.value if isinstance(self.notification_type, NotificationType) else self.notification_type,
            "is_read": self.is_read,
            "related_appointment_id": self.related_appointment_id,
            "created_at": self.created_at.isoformat()
        }

class Review(db.Model):
    __tablename__ = 'reviews'

    id = db.Column(db.Integer, primary_key=True)
    appointment_id = db.Column(db.Integer, db.ForeignKey('appointments.id'), unique=True, nullable=False)
    patient_id = db.Column(db.Integer, db.ForeignKey('patient_profiles.id'), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctor_profiles.id'), nullable=False, index=True)
    rating = db.Column(db.Integer, nullable=False) # 1 to 5
    comment = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "doctor_id": self.doctor_id,
            "rating": self.rating,
            "comment": self.comment,
            "created_at": self.created_at.isoformat()
        }

class AuditLog(db.Model):
    __tablename__ = 'audit_logs'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True, index=True)
    action = db.Column(db.String(64), nullable=False)
    target_entity = db.Column(db.String(64), nullable=False)
    target_id = db.Column(db.String(64), nullable=True)
    details_json = db.Column(db.Text, nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "actor_name": self.actor.full_name if self.actor else "System",
            "action": self.action,
            "target_entity": self.target_entity,
            "target_id": self.target_id,
            "details_json": self.details_json,
            "created_at": self.created_at.isoformat()
        }
