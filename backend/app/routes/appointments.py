"""
MediSync AI - Appointments Management Routes
"""
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app.extensions import db
from app.models import (
    Appointment, AppointmentStatus, AppointmentType, 
    PatientProfile, DoctorProfile, UserRole
)
from app.services.scheduling_service import SchedulingService
from app.services.queue_estimator import QueueEstimator

appointments_bp = Blueprint('appointments', __name__, url_prefix='/api/appointments')

@appointments_bp.route('', methods=['GET'])
@login_required
def get_appointments():
    """Returns appointments scoped to user role."""
    status_filter = request.args.get('status')
    
    if current_user.role == UserRole.PATIENT:
        patient = current_user.patient_profile
        if not patient:
            return jsonify([]), 200
        query = Appointment.query.filter_by(patient_id=patient.id)
    elif current_user.role == UserRole.DOCTOR:
        doctor = current_user.doctor_profile
        if not doctor:
            return jsonify([]), 200
        query = Appointment.query.filter_by(doctor_id=doctor.id)
    else: # ADMIN
        query = Appointment.query

    if status_filter:
        try:
            status_enum = AppointmentStatus(status_filter)
            query = query.filter_by(status=status_enum)
        except ValueError:
            pass

    appointments = query.order_by(Appointment.appointment_date.desc(), Appointment.start_time.asc()).all()
    return jsonify([a.to_dict() for a in appointments]), 200

@appointments_bp.route('', methods=['POST'])
@login_required
def create_appointment():
    """Books a new appointment."""
    data = request.get_json() or {}
    doctor_id = data.get('doctor_id')
    date_str = data.get('appointment_date')
    start_time = data.get('start_time')
    reason = data.get('reason', '').strip()
    app_type_str = data.get('appointment_type', 'in_person')

    if not doctor_id or not date_str or not start_time or not reason:
        return jsonify({"error": "Doctor, appointment date, time slot, and reason are required."}), 400

    try:
        app_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400

    app_type = AppointmentType.TELEHEALTH if app_type_str == 'telehealth' else AppointmentType.IN_PERSON

    # Determine patient ID
    if current_user.role == UserRole.PATIENT:
        if not current_user.patient_profile:
            patient_profile = PatientProfile(user_id=current_user.id)
            db.session.add(patient_profile)
            db.session.commit()
        patient_id = current_user.patient_profile.id
    elif current_user.role == UserRole.ADMIN:
        patient_id = data.get('patient_id')
        if not patient_id:
            return jsonify({"error": "patient_id required for admin booking."}), 400
    else:
        return jsonify({"error": "Doctors cannot book appointments for themselves."}), 403

    try:
        appointment_data = SchedulingService.book_appointment(
            patient_id=patient_id,
            doctor_id=doctor_id,
            appointment_date=app_date,
            start_time=start_time,
            reason=reason,
            appointment_type=app_type,
            notes=data.get('notes')
        )
        return jsonify({
            "message": "Appointment scheduled successfully.",
            "appointment": appointment_data
        }), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@appointments_bp.route('/<int:appointment_id>', methods=['GET'])
@login_required
def get_appointment_details(appointment_id):
    """Retrieves appointment details and dynamic queue estimation."""
    appointment = Appointment.query.get_or_404(appointment_id)

    # Permission check
    is_owner_patient = current_user.patient_profile and current_user.patient_profile.id == appointment.patient_id
    is_owner_doctor = current_user.doctor_profile and current_user.doctor_profile.id == appointment.doctor_id
    if not (is_owner_patient or is_owner_doctor or current_user.role == UserRole.ADMIN):
        return jsonify({"error": "Forbidden."}), 403

    queue_info = QueueEstimator.estimate_wait_time(appointment_id)

    return jsonify({
        "appointment": appointment.to_dict(),
        "queue_estimation": queue_info
    }), 200

@appointments_bp.route('/<int:appointment_id>/cancel', methods=['POST'])
@login_required
def cancel_appointment(appointment_id):
    """Cancels an appointment and offers slot to waitlist."""
    appointment = Appointment.query.get_or_404(appointment_id)
    data = request.get_json() or {}
    reason = data.get('reason', 'Cancelled by user')

    try:
        result = SchedulingService.cancel_appointment(
            appointment_id=appointment_id,
            actor_user_id=current_user.id,
            cancellation_reason=reason
        )
        return jsonify({
            "message": "Appointment cancelled successfully.",
            "result": result
        }), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@appointments_bp.route('/<int:appointment_id>/reschedule', methods=['POST'])
@login_required
def reschedule_appointment(appointment_id):
    """Reschedules appointment to a new date and time."""
    data = request.get_json() or {}
    new_date_str = data.get('new_date')
    new_time = data.get('new_start_time')

    if not new_date_str or not new_time:
        return jsonify({"error": "new_date and new_start_time are required."}), 400

    try:
        new_date = datetime.strptime(new_date_str, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Invalid date format."}), 400

    try:
        updated = SchedulingService.reschedule_appointment(
            appointment_id=appointment_id,
            new_date=new_date,
            new_start_time=new_time,
            actor_user_id=current_user.id,
            reason=data.get('reason')
        )
        return jsonify({
            "message": "Appointment rescheduled successfully.",
            "appointment": updated
        }), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@appointments_bp.route('/<int:appointment_id>/status', methods=['POST'])
@login_required
def update_appointment_status(appointment_id):
    """Allows doctors or admins to advance status (completed, no_show)."""
    appointment = Appointment.query.get_or_404(appointment_id)
    data = request.get_json() or {}
    new_status_str = data.get('status')

    try:
        new_status = AppointmentStatus(new_status_str)
        appointment.status = new_status
        db.session.commit()
        return jsonify({
            "message": f"Appointment status updated to {new_status.value}.",
            "appointment": appointment.to_dict()
        }), 200
    except ValueError:
        return jsonify({"error": "Invalid status."}), 400
