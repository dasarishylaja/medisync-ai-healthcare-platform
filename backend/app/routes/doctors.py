"""
MediSync AI - Doctor Discovery & Schedule Routes
"""
from datetime import date, datetime
from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app.extensions import db
from app.models import DoctorProfile, Specialty, DoctorAvailability, UserRole
from app.services.recommendation_engine import DoctorRecommendationEngine
from app.services.scheduling_service import SchedulingService

doctors_bp = Blueprint('doctors', __name__, url_prefix='/api/doctors')

@doctors_bp.route('', methods=['GET'])
def list_doctors():
    """Returns active doctors with optional search and specialty filtering."""
    specialty_id = request.args.get('specialty_id', type=int)
    search_query = request.args.get('search', '').strip().lower()

    query = DoctorProfile.query.filter_by(is_accepting_patients=True)
    if specialty_id:
        query = query.filter_by(specialty_id=specialty_id)

    doctors = query.all()
    results = []
    for d in doctors:
        doc_data = d.to_dict()
        if search_query:
            name_match = search_query in doc_data['doctor_name'].lower()
            spec_match = search_query in doc_data['specialty'].lower()
            if not (name_match or spec_match):
                continue
        results.append(doc_data)

    return jsonify(results), 200

@doctors_bp.route('/specialties', methods=['GET'])
def list_specialties():
    """Returns all available medical specialties."""
    specialties = Specialty.query.all()
    return jsonify([s.to_dict() for s in specialties]), 200

@doctors_bp.route('/recommend', methods=['GET'])
def recommend_doctors():
    """
    Intelligent recommendation endpoint returning transparently ranked doctors.
    Query params: specialty_id, date, time_range ('morning', 'afternoon', 'any').
    """
    specialty_id = request.args.get('specialty_id', type=int)
    date_str = request.args.get('date')
    preferred_time_range = request.args.get('time_range', 'any')

    target_date = None
    if date_str:
        try:
            target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400

    engine = DoctorRecommendationEngine()
    recommendations = engine.recommend_doctors(
        specialty_id=specialty_id,
        preferred_date=target_date,
        preferred_time_range=preferred_time_range
    )
    return jsonify(recommendations), 200

@doctors_bp.route('/<int:doctor_id>', methods=['GET'])
def get_doctor(doctor_id):
    """Retrieves single doctor profile with reviews and specialties."""
    doctor = DoctorProfile.query.get_or_404(doctor_id)
    return jsonify(doctor.to_dict()), 200

@doctors_bp.route('/<int:doctor_id>/availability', methods=['GET'])
def get_doctor_availability(doctor_id):
    """Calculates available time slots for a given date."""
    date_str = request.args.get('date')
    if not date_str:
        return jsonify({"error": "date query parameter is required (YYYY-MM-DD)."}), 400

    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400

    slots = SchedulingService.get_available_slots(doctor_id, target_date)
    return jsonify({
        "doctor_id": doctor_id,
        "date": target_date.isoformat(),
        "slots": slots
    }), 200

@doctors_bp.route('/<int:doctor_id>/availability', methods=['POST'])
@login_required
def update_doctor_availability(doctor_id):
    """Allows doctor to update working days, hours, slot duration, and breaks."""
    doctor = DoctorProfile.query.get_or_404(doctor_id)
    if current_user.role != UserRole.ADMIN and current_user.id != doctor.user_id:
        return jsonify({"error": "Forbidden."}), 403

    data = request.get_json() or {}
    day_of_week = data.get('day_of_week')
    start_time = data.get('start_time', '09:00')
    end_time = data.get('end_time', '17:00')
    slot_duration = data.get('slot_duration_minutes', 30)
    break_start = data.get('break_start_time', '12:00')
    break_end = data.get('break_end_time', '13:00')

    avail = DoctorAvailability.query.filter_by(
        doctor_id=doctor_id,
        day_of_week=day_of_week
    ).first()

    if not avail:
        avail = DoctorAvailability(doctor_id=doctor_id, day_of_week=day_of_week)
        db.session.add(avail)

    avail.start_time = start_time
    avail.end_time = end_time
    avail.slot_duration_minutes = slot_duration
    avail.break_start_time = break_start
    avail.break_end_time = break_end
    avail.is_active = data.get('is_active', True)

    db.session.commit()
    return jsonify({"message": "Availability updated successfully.", "availability": avail.to_dict()}), 200
