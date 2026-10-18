"""
MediSync AI - Waitlist Management Routes
"""
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app.models import WaitlistEntry, WaitlistStatus, UserRole
from app.services.waitlist_service import WaitlistService

waitlist_bp = Blueprint('waitlist', __name__, url_prefix='/api/waitlist')

@waitlist_bp.route('', methods=['GET'])
@login_required
def get_waitlist():
    """Returns waitlist entries scoped to patient or admin."""
    if current_user.role == UserRole.PATIENT:
        patient = current_user.patient_profile
        if not patient:
            return jsonify([]), 200
        entries = WaitlistEntry.query.filter_by(patient_id=patient.id).all()
    elif current_user.role == UserRole.DOCTOR:
        doctor = current_user.doctor_profile
        if not doctor:
            return jsonify([]), 200
        entries = WaitlistEntry.query.filter_by(doctor_id=doctor.id).all()
    else:
        entries = WaitlistEntry.query.all()

    return jsonify([e.to_dict() for e in entries]), 200

@waitlist_bp.route('', methods=['POST'])
@login_required
def join_waitlist():
    """Adds current patient to doctor waitlist."""
    if current_user.role != UserRole.PATIENT:
        return jsonify({"error": "Only registered patients can join the waitlist."}), 403

    patient = current_user.patient_profile
    data = request.get_json() or {}
    doctor_id = data.get('doctor_id')
    date_str = data.get('preferred_date')
    time_range = data.get('preferred_time_range', 'any')

    if not doctor_id or not date_str:
        return jsonify({"error": "doctor_id and preferred_date are required."}), 400

    try:
        pref_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400

    try:
        entry = WaitlistService.join_waitlist(
            patient_id=patient.id,
            doctor_id=doctor_id,
            preferred_date=pref_date,
            preferred_time_range=time_range
        )
        return jsonify({
            "message": "Successfully added to the waiting list.",
            "waitlist_entry": entry
        }), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@waitlist_bp.route('/<int:waitlist_id>/claim', methods=['POST'])
@login_required
def claim_slot(waitlist_id):
    """Claims an offered slot."""
    if current_user.role != UserRole.PATIENT:
        return jsonify({"error": "Unauthorized."}), 403

    data = request.get_json() or {}
    reason = data.get('reason', 'Claimed from waitlist offer')

    try:
        result = WaitlistService.claim_offered_slot(
            waitlist_id=waitlist_id,
            patient_id=current_user.patient_profile.id,
            reason=reason
        )
        return jsonify({
            "message": "Waitlist slot claimed successfully and appointment confirmed!",
            "result": result
        }), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@waitlist_bp.route('/<int:waitlist_id>', methods=['DELETE'])
@login_required
def leave_waitlist(waitlist_id):
    """Leaves waitlist."""
    try:
        WaitlistService.leave_waitlist(
            waitlist_id=waitlist_id,
            patient_id=current_user.patient_profile.id
        )
        return jsonify({"message": "Successfully left the waiting list."}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
