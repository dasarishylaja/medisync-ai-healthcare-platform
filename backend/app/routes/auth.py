"""
MediSync AI - Authentication & Session Routes
Provides secure registration, login, logout, and current user retrieval.
"""
from flask import Blueprint, request, jsonify, session
from flask_login import login_user, logout_user, login_required, current_user
from app.extensions import db
from app.models import User, UserRole, PatientProfile, DoctorProfile

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    first_name = data.get('first_name', '').strip()
    last_name = data.get('last_name', '').strip()
    role_str = data.get('role', 'patient').lower()

    if not email or not password or not first_name or not last_name:
        return jsonify({"error": "All fields are required."}), 400

    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters."}), 400

    # Public registration security: Never allow public registration as 'admin'
    if role_str == 'admin':
        return jsonify({"error": "Administrative accounts cannot be registered publicly."}), 403

    role = UserRole.DOCTOR if role_str == 'doctor' else UserRole.PATIENT

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "An account with this email address already exists."}), 409

    user = User(
        email=email,
        role=role,
        first_name=first_name,
        last_name=last_name,
        phone=data.get('phone', '')
    )
    user.set_password(password)
    db.session.add(user)
    db.session.flush()

    if role == UserRole.PATIENT:
        profile = PatientProfile(user_id=user.id, emergency_contact=data.get('emergency_contact', ''))
        db.session.add(profile)

    db.session.commit()
    login_user(user)

    return jsonify({
        "message": "Registration successful.",
        "user": user.to_dict()
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid email or password."}), 401

    if not user.is_active:
        return jsonify({"error": "This account is inactive. Please contact system administration."}), 403

    login_user(user, remember=True)
    return jsonify({
        "message": "Login successful.",
        "user": user.to_dict()
    }), 200

@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({"message": "Successfully logged out."}), 200

@auth_bp.route('/me', methods=['GET'])
def get_current_user():
    if current_user.is_authenticated:
        return jsonify({
            "authenticated": True,
            "user": current_user.to_dict()
        }), 200
    return jsonify({"authenticated": False, "user": None}), 200
