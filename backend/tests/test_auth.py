"""
MediSync AI - Automated Authentication Tests
"""
import unittest
from app import create_app, db
from app.models import User, UserRole

class AuthTestCase(unittest.TestCase):

    def setUp(self):
        self.app = create_app('testing')
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()
        db.create_all()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    def test_patient_registration(self):
        """Test patient registration creates hashed password and patient profile."""
        res = self.client.post('/api/auth/register', json={
            "email": "test.patient@example.com",
            "password": "Password123!",
            "first_name": "Clara",
            "last_name": "Oswald",
            "role": "patient"
        })
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertEqual(data["user"]["email"], "test.patient@example.com")
        self.assertEqual(data["user"]["role"], "patient")

        # Verify password is not plaintext
        user = User.query.filter_by(email="test.patient@example.com").first()
        self.assertNotEqual(user.password_hash, "Password123!")
        self.assertTrue(user.check_password("Password123!"))

    def test_prevent_admin_public_registration(self):
        """Test system strictly forbids public registration for admin role."""
        res = self.client.post('/api/auth/register', json={
            "email": "attacker@evil.com",
            "password": "Password123!",
            "first_name": "Malicious",
            "last_name": "User",
            "role": "admin"
        })
        self.assertEqual(res.status_code, 403)

    def test_login_invalid_credentials(self):
        """Test login with incorrect password returns 401."""
        # Create user
        user = User(email="valid@example.com", first_name="Valid", last_name="User", role=UserRole.PATIENT)
        user.set_password("CorrectPass123!")
        db.session.add(user)
        db.session.commit()

        res = self.client.post('/api/auth/login', json={
            "email": "valid@example.com",
            "password": "WrongPassword!"
        })
        self.assertEqual(res.status_code, 401)

if __name__ == '__main__':
    unittest.main()
