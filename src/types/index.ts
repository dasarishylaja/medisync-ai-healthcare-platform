export type UserRole = 'patient' | 'doctor' | 'admin';

export interface User {
  id: number;
  email: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  full_name: string;
  phone?: string;
  is_active: boolean;
  avatar_url?: string;
  created_at: string;
}

export interface Specialty {
  id: number;
  name: string;
  code: string;
  description: string;
  icon_name: string;
}

export interface DoctorProfile {
  id: number;
  user_id: number;
  doctor_name: string;
  specialty: string;
  specialty_id: number;
  license_number: string;
  consultation_fee: number;
  bio: string;
  experience_years: number;
  average_rating: number;
  total_reviews_count: number;
  is_accepting_patients: boolean;
  office_room: string;
  avatar_url?: string;
}

export interface DoctorAvailability {
  id: number;
  doctor_id: number;
  day_of_week: number; // 0=Mon, 6=Sun
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  break_start_time: string;
  break_end_time: string;
  is_active: boolean;
}

export type AppointmentStatus = 'confirmed' | 'completed' | 'cancelled' | 'rescheduled' | 'no_show' | 'pending';
export type AppointmentType = 'in_person' | 'telehealth';

export interface Appointment {
  id: number;
  booking_reference: string;
  patient_id: number;
  patient_name: string;
  patient_email: string;
  doctor_id: number;
  doctor_name: string;
  specialty: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  appointment_type: AppointmentType;
  reason: string;
  notes?: string;
  cancellation_reason?: string;
  queue_order: number;
  created_at: string;
}

export type WaitlistStatus = 'waiting' | 'offered' | 'claimed' | 'expired' | 'cancelled';

export interface WaitlistEntry {
  id: number;
  patient_id: number;
  patient_name: string;
  doctor_id: number;
  doctor_name: string;
  specialty: string;
  preferred_date: string;
  preferred_time_range: 'morning' | 'afternoon' | 'any';
  status: WaitlistStatus;
  offered_slot_start?: string;
  offered_slot_date?: string;
  offer_expires_at?: string;
  created_at: string;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  related_appointment_id?: number;
  created_at: string;
}

export interface RecommendationResult {
  doctor: DoctorProfile;
  composite_score: number;
  open_slots_count: number;
  target_date: string;
  explanation: string;
  score_breakdown: {
    specialty_fit: number;
    availability_fit: number;
    time_preference_fit: number;
    rating_fit: number;
  };
}

export interface QueueEstimation {
  appointment_id: number;
  booking_reference: string;
  appointment_time: string;
  queue_position: number;
  patients_ahead: number;
  estimated_wait_minutes: number;
  assumed_service_duration_minutes: number;
  last_updated: string;
  status_message: string;
  disclaimer: string;
}

export interface AuditLogItem {
  id: number;
  user_id: number;
  actor_name: string;
  action: string;
  target_entity: string;
  target_id: string;
  details_json: string;
  created_at: string;
}
