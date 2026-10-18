import { User, DoctorProfile, Specialty, Appointment, WaitlistEntry, NotificationItem, AuditLogItem } from '../types';

export const INITIAL_SPECIALTIES: Specialty[] = [
  { id: 1, name: "Internal Medicine & Cardiology", code: "CARDIO", description: "Cardiovascular health, hypertension, preventive heart care.", icon_name: "HeartPulse" },
  { id: 2, name: "Neurology & Neurosciences", code: "NEURO", description: "Brain, spine, migraine management, and nerve consultations.", icon_name: "Brain" },
  { id: 3, name: "Pediatrics & Child Care", code: "PEDI", description: "Comprehensive infant, child, and adolescent wellness.", icon_name: "Baby" },
  { id: 4, name: "Dermatology & Skin Health", code: "DERM", description: "Clinical skin evaluations, eczema, and allergy assessments.", icon_name: "Sparkles" },
  { id: 5, name: "Orthopedics & Joint Care", code: "ORTHO", description: "Musculoskeletal injuries, joints, sports medicine, and rehab.", icon_name: "Activity" },
  { id: 6, name: "Family & Preventative Medicine", code: "FAMILY", description: "Routine health checkups and chronic illness coordination.", icon_name: "ShieldCheck" }
];

export const DEMO_USERS: Record<string, User> = {
  patient: {
    id: 1,
    email: "patient.emma@example.com",
    role: "patient",
    first_name: "Emma",
    last_name: "Watson",
    full_name: "Emma Watson",
    phone: "+1 (555) 876-5432",
    is_active: true,
    created_at: "2026-01-15T08:00:00Z"
  },
  doctor: {
    id: 2,
    email: "sarah.chen@medisync.io",
    role: "doctor",
    first_name: "Sarah",
    last_name: "Chen",
    full_name: "Dr. Sarah Chen, MD",
    phone: "+1 (555) 234-5678",
    is_active: true,
    avatar_url: "/src/assets/images/doc_sarah_chen_1792303936307.jpg",
    created_at: "2025-11-10T08:00:00Z"
  },
  admin: {
    id: 3,
    email: "admin@medisync.io",
    role: "admin",
    first_name: "Eleanor",
    last_name: "Vance",
    full_name: "Eleanor Vance",
    phone: "+1 (555) 100-2000",
    is_active: true,
    created_at: "2025-09-01T08:00:00Z"
  }
};

export const INITIAL_DOCTORS: DoctorProfile[] = [
  {
    id: 1,
    user_id: 2,
    doctor_name: "Dr. Sarah Chen, MD",
    specialty: "Internal Medicine & Cardiology",
    specialty_id: 1,
    license_number: "MD-NY-84920",
    consultation_fee: 120.0,
    bio: "Board-certified cardiologist specializing in preventive heart health, cardiovascular wellness, and hypertension management with 12+ years of clinical experience.",
    experience_years: 12,
    average_rating: 4.9,
    total_reviews_count: 142,
    is_accepting_patients: true,
    office_room: "Suite 401A",
    avatar_url: "/src/assets/images/doc_sarah_chen_1792303936307.jpg"
  },
  {
    id: 2,
    user_id: 4,
    doctor_name: "Dr. Marcus Vance, MD",
    specialty: "Neurology & Neurosciences",
    specialty_id: 2,
    license_number: "MD-NY-77412",
    consultation_fee: 140.0,
    bio: "Chief of Clinical Neurology. Expert in chronic migraine management, cognitive wellness, and vestibular disorders with leading academic affiliations.",
    experience_years: 16,
    average_rating: 4.95,
    total_reviews_count: 98,
    is_accepting_patients: true,
    office_room: "Suite 502B",
    avatar_url: "/src/assets/images/doc_marcus_vance_1792303952095.jpg"
  },
  {
    id: 3,
    user_id: 5,
    doctor_name: "Dr. Elena Rodriguez, MD",
    specialty: "Pediatrics & Child Care",
    specialty_id: 3,
    license_number: "MD-NY-65109",
    consultation_fee: 95.0,
    bio: "Compassionate pediatric specialist focusing on developmental milestones, childhood preventative medicine, and comprehensive adolescent care.",
    experience_years: 9,
    average_rating: 4.88,
    total_reviews_count: 175,
    is_accepting_patients: true,
    office_room: "Suite 204C",
    avatar_url: "/src/assets/images/doc_elena_rodriguez_1792303965310.jpg"
  }
];

const today = new Date();
const formatDate = (d: Date) => d.toISOString().split('T')[0];
const todayStr = formatDate(today);
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowStr = formatDate(tomorrow);
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);
const yesterdayStr = formatDate(yesterday);

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 1,
    booking_reference: "MS-784210",
    patient_id: 1,
    patient_name: "Emma Watson",
    patient_email: "patient.emma@example.com",
    doctor_id: 1,
    doctor_name: "Dr. Sarah Chen, MD",
    specialty: "Internal Medicine & Cardiology",
    appointment_date: todayStr,
    start_time: "10:00",
    end_time: "10:30",
    status: "confirmed",
    appointment_type: "in_person",
    reason: "Quarterly blood pressure review and cardiovascular checkup",
    notes: "Patient reports consistent morning blood pressure readings.",
    queue_order: 1,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 2,
    booking_reference: "MS-891244",
    patient_id: 6,
    patient_name: "David Kim",
    patient_email: "patient.david@example.com",
    doctor_id: 1,
    doctor_name: "Dr. Sarah Chen, MD",
    specialty: "Internal Medicine & Cardiology",
    appointment_date: todayStr,
    start_time: "10:30",
    end_time: "11:00",
    status: "confirmed",
    appointment_type: "in_person",
    reason: "Follow-up on lipid panel lab results",
    notes: "Fasting lipid panel completed yesterday.",
    queue_order: 2,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: 3,
    booking_reference: "MS-345091",
    patient_id: 1,
    patient_name: "Emma Watson",
    patient_email: "patient.emma@example.com",
    doctor_id: 2,
    doctor_name: "Dr. Marcus Vance, MD",
    specialty: "Neurology & Neurosciences",
    appointment_date: tomorrowStr,
    start_time: "14:00",
    end_time: "14:30",
    status: "confirmed",
    appointment_type: "telehealth",
    reason: "Migraine frequency assessment and headache diary review",
    notes: "Virtual video consultation link prepared.",
    queue_order: 1,
    created_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 4,
    booking_reference: "MS-112344",
    patient_id: 1,
    patient_name: "Emma Watson",
    patient_email: "patient.emma@example.com",
    doctor_id: 3,
    doctor_name: "Dr. Elena Rodriguez, MD",
    specialty: "Pediatrics & Child Care",
    appointment_date: yesterdayStr,
    start_time: "11:00",
    end_time: "11:30",
    status: "completed",
    appointment_type: "in_person",
    reason: "Routine preventive wellness checkup",
    notes: "Vitals within nominal range. Completed without complications.",
    queue_order: 1,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString()
  }
];

export const INITIAL_WAITLIST: WaitlistEntry[] = [
  {
    id: 1,
    patient_id: 6,
    patient_name: "David Kim",
    doctor_id: 2,
    doctor_name: "Dr. Marcus Vance, MD",
    specialty: "Neurology & Neurosciences",
    preferred_date: todayStr,
    preferred_time_range: "morning",
    status: "waiting",
    created_at: new Date(Date.now() - 3600000 * 4).toISOString()
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 1,
    user_id: 1,
    title: "Appointment Confirmed: Dr. Sarah Chen",
    message: `Your cardiovascular consultation is confirmed for today at 10:00 AM (Ref: MS-784210).`,
    notification_type: "appointment_confirmed",
    related_appointment_id: 1,
    is_read: false,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 2,
    user_id: 2,
    title: "Today's Clinic Schedule",
    message: "You have 2 scheduled patient consultations today starting at 10:00 AM in Suite 401A.",
    notification_type: "reminder",
    is_read: false,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString()
  }
];

export const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 1,
    user_id: 1,
    actor_name: "Emma Watson (Patient)",
    action: "APPOINTMENT_BOOKED",
    target_entity: "Appointment",
    target_id: "MS-784210",
    details_json: JSON.stringify({ doctor: "Dr. Sarah Chen", specialty: "Cardiology", slot: "10:00" }),
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 2,
    user_id: 3,
    actor_name: "Eleanor Vance (Admin)",
    action: "DOCTOR_VERIFIED",
    target_entity: "DoctorProfile",
    target_id: "MD-NY-77412",
    details_json: JSON.stringify({ doctor: "Dr. Marcus Vance", status: "Active" }),
    created_at: new Date(Date.now() - 86400000 * 10).toISOString()
  }
];
