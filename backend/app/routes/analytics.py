"""
MediSync AI - Analytics & Reporting Routes
"""
from flask import Blueprint, jsonify, Response
from flask_login import login_required, current_user
from app.models import UserRole
from app.services.analytics_service import AnalyticsService

analytics_bp = Blueprint('analytics', __name__, url_prefix='/api/analytics')

@analytics_bp.route('/overview', methods=['GET'])
@login_required
def get_overview():
    """Returns high-level administrative operational KPIs."""
    if current_user.role not in [UserRole.ADMIN, UserRole.DOCTOR]:
        return jsonify({"error": "Unauthorized access to healthcare analytics."}), 403

    kpis = AnalyticsService.get_overview_kpis()
    return jsonify(kpis), 200

@analytics_bp.route('/specialties', methods=['GET'])
@login_required
def get_specialty_distribution():
    """Returns appointment volume by specialty."""
    if current_user.role not in [UserRole.ADMIN, UserRole.DOCTOR]:
        return jsonify({"error": "Unauthorized."}), 403

    data = AnalyticsService.get_appointment_distribution_by_specialty()
    return jsonify(data), 200

@analytics_bp.route('/demand-trends', methods=['GET'])
@login_required
def get_demand_trends():
    """Returns appointment volume trends."""
    if current_user.role not in [UserRole.ADMIN, UserRole.DOCTOR]:
        return jsonify({"error": "Unauthorized."}), 403

    data = AnalyticsService.get_weekly_demand_trends()
    return jsonify(data), 200

@analytics_bp.route('/doctor-workload', methods=['GET'])
@login_required
def get_doctor_workload():
    """Returns appointment volume per doctor."""
    if current_user.role not in [UserRole.ADMIN, UserRole.DOCTOR]:
        return jsonify({"error": "Unauthorized."}), 403

    data = AnalyticsService.get_doctor_workload_metrics()
    return jsonify(data), 200

@analytics_bp.route('/export-csv', methods=['GET'])
@login_required
def export_csv():
    """Exports appointment report as CSV."""
    if current_user.role != UserRole.ADMIN:
        return jsonify({"error": "Only administrators can export clinical reports."}), 403

    csv_data = AnalyticsService.export_appointments_csv()
    return Response(
        csv_data,
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment;filename=medisync_appointments_report.csv"}
    )
