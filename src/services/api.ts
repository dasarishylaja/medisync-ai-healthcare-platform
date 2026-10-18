import { 
  User, DoctorProfile, Specialty, Appointment, WaitlistEntry, 
  NotificationItem, RecommendationResult, QueueEstimation, AuditLogItem 
} from '../types';
import { 
  INITIAL_SPECIALTIES, DEMO_USERS, INITIAL_DOCTORS, 
  INITIAL_APPOINTMENTS, INITIAL_WAITLIST, INITIAL_NOTIFICATIONS, INITIAL_AUDIT_LOGS 
} from '../data/mockData';

class MediSyncStore {
  currentUser: User = DEMO_USERS.patient;
  specialties: Specialty[] = [...INITIAL_SPECIALTIES];
  doctors: DoctorProfile[] = [...INITIAL_DOCTORS];
  appointments: Appointment[] = [...INITIAL_APPOINTMENTS];
  waitlist: WaitlistEntry[] = [...INITIAL_WAITLIST];
  notifications: NotificationItem[] = [...INITIAL_NOTIFICATIONS];
  auditLogs: AuditLogItem[] = [...INITIAL_AUDIT_LOGS];

  constructor() {
    this.loadFromStorage();
  }

  private saveToStorage() {
    try {
      localStorage.setItem('medisync_appointments', JSON.stringify(this.appointments));
      localStorage.setItem('medisync_waitlist', JSON.stringify(this.waitlist));
      localStorage.setItem('medisync_notifications', JSON.stringify(this.notifications));
      localStorage.setItem('medisync_doctors', JSON.stringify(this.doctors));
      localStorage.setItem('medisync_user', JSON.stringify(this.currentUser));
      localStorage.setItem('medisync_audit', JSON.stringify(this.auditLogs));
    } catch {
      // ignore
    }
  }

  private loadFromStorage() {
    try {
      const storedApps = localStorage.getItem('medisync_appointments');
      if (storedApps) this.appointments = JSON.parse(storedApps);
      const storedWait = localStorage.getItem('medisync_waitlist');
      if (storedWait) this.waitlist = JSON.parse(storedWait);
      const storedNotifs = localStorage.getItem('medisync_notifications');
      if (storedNotifs) this.notifications = JSON.parse(storedNotifs);
      const storedDocs = localStorage.getItem('medisync_doctors');
      if (storedDocs) this.doctors = JSON.parse(storedDocs);
      const storedUser = localStorage.getItem('medisync_user');
      if (storedUser) this.currentUser = JSON.parse(storedUser);
      const storedAudit = localStorage.getItem('medisync_audit');
      if (storedAudit) this.auditLogs = JSON.parse(storedAudit);
    } catch {
      // ignore
    }
  }

  setCurrentUser(user: User) {
    this.currentUser = user;
    this.saveToStorage();
  }

  // Auth
  login(email: string): User {
    const found = Object.values(DEMO_USERS).find(u => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      this.currentUser = found;
      this.saveToStorage();
      return found;
    }
    // Create new patient session if not found
    const newUser: User = {
      id: Date.now(),
      email,
      role: 'patient',
      first_name: email.split('@')[0],
      last_name: "Patient",
      full_name: `${email.split('@')[0]} (Patient)`,
      is_active: true,
      created_at: new Date().toISOString()
    };
    this.currentUser = newUser;
    this.saveToStorage();
    return newUser;
  }

  register(data: { email: string; first_name: string; last_name: string; role: 'patient' | 'doctor'; phone?: string }): User {
    const newUser: User = {
      id: Date.now(),
      email: data.email,
      role: data.role,
      first_name: data.first_name,
      last_name: data.last_name,
      full_name: `${data.first_name} ${data.last_name}`,
      phone: data.phone,
      is_active: true,
      created_at: new Date().toISOString()
    };
    this.currentUser = newUser;
    this.saveToStorage();
    return newUser;
  }

  // Doctor discovery & recommendation engine (mirrors Python RecommendationEngine)
  recommendDoctors(specialtyId?: number, preferredDate?: string, timeRange: 'morning' | 'afternoon' | 'any' = 'any'): RecommendationResult[] {
    const targetDate = preferredDate || new Date().toISOString().split('T')[0];
    const docs = specialtyId ? this.doctors.filter(d => d.specialty_id === specialtyId) : this.doctors;

    const results: RecommendationResult[] = docs.map(doc => {
      const openSlots = this.getAvailableSlots(doc.id, targetDate).filter(s => s.is_available);
      const specFit = (!specialtyId || doc.specialty_id === specialtyId) ? 100 : 40;
      
      let matchingTimeSlot = false;
      openSlots.forEach(s => {
        const hour = parseInt(s.start_time.split(':')[0], 10);
        if (timeRange === 'morning' && hour < 12) matchingTimeSlot = true;
        else if (timeRange === 'afternoon' && hour >= 12) matchingTimeSlot = true;
        else if (timeRange === 'any') matchingTimeSlot = true;
      });

      const availFit = Math.min(100, openSlots.length * 20);
      const timeFit = matchingTimeSlot ? 100 : (openSlots.length > 0 ? 50 : 10);
      const ratingFit = (doc.average_rating / 5) * 100;

      const compositeScore = Math.round((specFit * 0.40) + (availFit * 0.25) + (timeFit * 0.20) + (ratingFit * 0.15));

      const reasons: string[] = [];
      reasons.push(`Direct match for ${doc.specialty}`);
      if (matchingTimeSlot && timeRange !== 'any') {
        reasons.push(`Has open ${timeRange} consultation slots`);
      } else if (openSlots.length > 0) {
        reasons.push(`${openSlots.length} appointment slots open`);
      } else {
        reasons.push("Waitlist available for this date");
      }
      if (doc.average_rating >= 4.9) {
        reasons.push(`High satisfaction rating (${doc.average_rating.toFixed(2)}/5.0)`);
      }

      return {
        doctor: doc,
        composite_score: compositeScore,
        open_slots_count: openSlots.length,
        target_date: targetDate,
        explanation: reasons.join(' · '),
        score_breakdown: {
          specialty_fit: specFit,
          availability_fit: availFit,
          time_preference_fit: timeFit,
          rating_fit: Math.round(ratingFit)
        }
      };
    });

    return results.sort((a, b) => b.composite_score - a.composite_score);
  }

  // Available slots calculation with break & double-booking prevention
  getAvailableSlots(doctorId: number, dateStr: string): { start_time: string; end_time: string; is_available: boolean; reason?: string }[] {
    const booked = this.appointments.filter(a => 
      a.doctor_id === doctorId && 
      a.appointment_date === dateStr && 
      (a.status === 'confirmed' || a.status === 'rescheduled')
    );
    const bookedSet = new Set(booked.map(b => b.start_time));

    const allSlots = [
      "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
      "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"
    ];

    const todayStr = new Date().toISOString().split('T')[0];
    const nowHour = new Date().getHours();
    const nowMin = new Date().getMinutes();

    return allSlots.map(time => {
      const [h, m] = time.split(':').map(Number);
      const endH = m === 30 ? h + 1 : h;
      const endM = m === 30 ? "00" : "30";
      const endTime = `${endH.toString().padStart(2, '0')}:${endM}`;

      const isPast = (dateStr < todayStr) || (dateStr === todayStr && (h < nowHour || (h === nowHour && m <= nowMin)));
      const isBooked = bookedSet.has(time);

      return {
        start_time: time,
        end_time: endTime,
        is_available: !isPast && !isBooked,
        reason: isPast ? "past" : (isBooked ? "booked" : undefined)
      };
    });
  }

  // Smart Booking with Concurrency & Conflict Prevention
  bookAppointment(data: {
    doctorId: number;
    appointmentDate: string;
    startTime: string;
    reason: string;
    appointmentType?: 'in_person' | 'telehealth';
    notes?: string;
  }): Appointment {
    const doctor = this.doctors.find(d => d.id === data.doctorId);
    if (!doctor) throw new Error("Doctor not found.");
    if (!doctor.is_accepting_patients) throw new Error("Doctor is not accepting appointments.");

    // Conflict Check
    const conflict = this.appointments.find(a => 
      a.doctor_id === data.doctorId &&
      a.appointment_date === data.appointmentDate &&
      a.start_time === data.startTime &&
      (a.status === 'confirmed' || a.status === 'rescheduled')
    );
    if (conflict) {
      throw new Error(`Slot ${data.startTime} on ${data.appointmentDate} has already been reserved. Please choose another slot or join the waitlist.`);
    }

    const [h, m] = data.startTime.split(':').map(Number);
    const endH = m === 30 ? h + 1 : h;
    const endM = m === 30 ? "00" : "30";
    const endTime = `${endH.toString().padStart(2, '0')}:${endM}`;

    const ref = `MS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const newApp: Appointment = {
      id: Date.now(),
      booking_reference: ref,
      patient_id: this.currentUser.id,
      patient_name: this.currentUser.full_name,
      patient_email: this.currentUser.email,
      doctor_id: doctor.id,
      doctor_name: doctor.doctor_name,
      specialty: doctor.specialty,
      appointment_date: data.appointmentDate,
      start_time: data.startTime,
      end_time: endTime,
      status: 'confirmed',
      appointment_type: data.appointmentType || 'in_person',
      reason: data.reason,
      notes: data.notes,
      queue_order: this.appointments.filter(a => a.doctor_id === doctor.id && a.appointment_date === data.appointmentDate).length + 1,
      created_at: new Date().toISOString()
    };

    this.appointments.unshift(newApp);

    // Add confirmation notification
    this.notifications.unshift({
      id: Date.now(),
      user_id: this.currentUser.id,
      title: "Appointment Confirmed",
      message: `Your appointment with ${doctor.doctor_name} is confirmed for ${data.appointmentDate} at ${data.startTime} (Ref: ${ref}).`,
      notification_type: "appointment_confirmed",
      related_appointment_id: newApp.id,
      is_read: false,
      created_at: new Date().toISOString()
    });

    this.auditLogs.unshift({
      id: Date.now(),
      user_id: this.currentUser.id,
      actor_name: `${this.currentUser.full_name} (${this.currentUser.role})`,
      action: "APPOINTMENT_BOOKED",
      target_entity: "Appointment",
      target_id: ref,
      details_json: JSON.stringify({ doctor: doctor.doctor_name, date: data.appointmentDate, time: data.startTime }),
      created_at: new Date().toISOString()
    });

    this.saveToStorage();
    return newApp;
  }

  // Cancel with Waitlist Slot Recovery
  cancelAppointment(appointmentId: number, cancellationReason: string): { appointment: Appointment; waitlistOffered: boolean } {
    const app = this.appointments.find(a => a.id === appointmentId);
    if (!app) throw new Error("Appointment not found.");
    if (app.status === 'cancelled') throw new Error("Appointment already cancelled.");

    app.status = 'cancelled';
    app.cancellation_reason = cancellationReason;

    // Check waitlist for this doctor and date!
    const candidate = this.waitlist.find(w => 
      w.doctor_id === app.doctor_id && 
      w.preferred_date === app.appointment_date && 
      w.status === 'waiting'
    );

    let waitlistOffered = false;
    if (candidate) {
      candidate.status = 'offered';
      candidate.offered_slot_start = app.start_time;
      candidate.offered_slot_date = app.appointment_date;
      candidate.offer_expires_at = new Date(Date.now() + 7200000).toISOString(); // 2 hours
      waitlistOffered = true;

      // Add notification for the waiting patient
      this.notifications.unshift({
        id: Date.now() + 1,
        user_id: candidate.patient_id,
        title: "Waitlist Slot Recovered!",
        message: `A cancellation has opened a slot with ${candidate.doctor_name} on ${candidate.preferred_date} at ${app.start_time}. Claim your slot within 2 hours!`,
        notification_type: "waitlist_offered",
        is_read: false,
        created_at: new Date().toISOString()
      });
    }

    this.auditLogs.unshift({
      id: Date.now(),
      user_id: this.currentUser.id,
      actor_name: `${this.currentUser.full_name} (${this.currentUser.role})`,
      action: "APPOINTMENT_CANCELLED",
      target_entity: "Appointment",
      target_id: app.booking_reference,
      details_json: JSON.stringify({ reason: cancellationReason, waitlist_recovered: waitlistOffered }),
      created_at: new Date().toISOString()
    });

    this.saveToStorage();
    return { appointment: app, waitlistOffered };
  }

  // Reschedule
  rescheduleAppointment(appointmentId: number, newDate: string, newTime: string): Appointment {
    const app = this.appointments.find(a => a.id === appointmentId);
    if (!app) throw new Error("Appointment not found.");

    // Conflict check
    const conflict = this.appointments.find(a => 
      a.id !== appointmentId &&
      a.doctor_id === app.doctor_id &&
      a.appointment_date === newDate &&
      a.start_time === newTime &&
      (a.status === 'confirmed' || a.status === 'rescheduled')
    );
    if (conflict) {
      throw new Error(`Slot ${newTime} on ${newDate} is already reserved.`);
    }

    const [h, m] = newTime.split(':').map(Number);
    const endH = m === 30 ? h + 1 : h;
    const endM = m === 30 ? "00" : "30";
    const endTime = `${endH.toString().padStart(2, '0')}:${endM}`;

    app.appointment_date = newDate;
    app.start_time = newTime;
    app.end_time = endTime;
    app.status = 'rescheduled';

    this.notifications.unshift({
      id: Date.now(),
      user_id: app.patient_id,
      title: "Appointment Rescheduled",
      message: `Your appointment with ${app.doctor_name} has been rescheduled to ${newDate} at ${newTime}.`,
      notification_type: "appointment_rescheduled",
      is_read: false,
      created_at: new Date().toISOString()
    });

    this.saveToStorage();
    return app;
  }

  // Waitlist Operations
  joinWaitlist(doctorId: number, preferredDate: string, timeRange: 'morning' | 'afternoon' | 'any'): WaitlistEntry {
    const doctor = this.doctors.find(d => d.id === doctorId);
    if (!doctor) throw new Error("Doctor not found.");

    const entry: WaitlistEntry = {
      id: Date.now(),
      patient_id: this.currentUser.id,
      patient_name: this.currentUser.full_name,
      doctor_id: doctor.id,
      doctor_name: doctor.doctor_name,
      specialty: doctor.specialty,
      preferred_date: preferredDate,
      preferred_time_range: timeRange,
      status: 'waiting',
      created_at: new Date().toISOString()
    };
    this.waitlist.unshift(entry);
    this.saveToStorage();
    return entry;
  }

  claimWaitlistSlot(waitlistId: number): Appointment {
    const entry = this.waitlist.find(w => w.id === waitlistId);
    if (!entry) throw new Error("Waitlist entry not found.");
    if (entry.status !== 'offered' || !entry.offered_slot_start || !entry.offered_slot_date) {
      throw new Error("This waitlist slot is not currently offered.");
    }

    const app = this.bookAppointment({
      doctorId: entry.doctor_id,
      appointmentDate: entry.offered_slot_date,
      startTime: entry.offered_slot_start,
      reason: "Claimed via MediSync Waitlist Recovery"
    });

    entry.status = 'claimed';
    this.saveToStorage();
    return app;
  }

  leaveWaitlist(waitlistId: number) {
    const entry = this.waitlist.find(w => w.id === waitlistId);
    if (entry) {
      entry.status = 'cancelled';
      this.saveToStorage();
    }
  }

  // Queue & Estimated Wait Time
  getQueueEstimation(appointmentId: number): QueueEstimation {
    const app = this.appointments.find(a => a.id === appointmentId);
    if (!app) throw new Error("Appointment not found.");

    const priorCount = this.appointments.filter(a => 
      a.doctor_id === app.doctor_id &&
      a.appointment_date === app.appointment_date &&
      a.start_time < app.start_time &&
      (a.status === 'confirmed' || a.status === 'rescheduled')
    ).length;

    const waitMins = priorCount * 15;

    return {
      appointment_id: app.id,
      booking_reference: app.booking_reference,
      appointment_time: app.start_time,
      queue_position: priorCount + 1,
      patients_ahead: priorCount,
      estimated_wait_minutes: waitMins,
      assumed_service_duration_minutes: 15,
      last_updated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      status_message: priorCount === 0 
        ? `You are next in queue for ${app.doctor_name}.` 
        : `There ${priorCount === 1 ? 'is' : 'are'} ${priorCount} patient${priorCount > 1 ? 's' : ''} scheduled ahead of you.`,
      disclaimer: "Illustrative operational estimate based on standard 15-minute consultation pacing. Actual clinical times may vary due to urgent cases and patient complexity."
    };
  }

  // Notifications
  markNotificationRead(id: number) {
    const notif = this.notifications.find(n => n.id === id);
    if (notif) {
      notif.is_read = true;
      this.saveToStorage();
    }
  }

  markAllNotificationsRead() {
    this.notifications.forEach(n => { n.is_read = true; });
    this.saveToStorage();
  }

  // Admin / Doctor toggles
  toggleDoctorStatus(doctorId: number): DoctorProfile {
    const doc = this.doctors.find(d => d.id === doctorId);
    if (!doc) throw new Error("Doctor not found.");
    doc.is_accepting_patients = !doc.is_accepting_patients;
    this.saveToStorage();
    return doc;
  }

  updateAppointmentStatus(appointmentId: number, status: Appointment['status']) {
    const app = this.appointments.find(a => a.id === appointmentId);
    if (!app) throw new Error("Appointment not found.");
    app.status = status;
    this.saveToStorage();
    return app;
  }

  // Analytics Metrics Calculation
  getAnalyticsKPIs() {
    const totalPatients = new Set(this.appointments.map(a => a.patient_id)).size + 2;
    const activeDoctors = this.doctors.filter(d => d.is_accepting_patients).length;
    const totalApps = this.appointments.length;
    const confirmed = this.appointments.filter(a => a.status === 'confirmed').length;
    const completed = this.appointments.filter(a => a.status === 'completed').length;
    const cancelled = this.appointments.filter(a => a.status === 'cancelled').length;
    const cancellationRate = totalApps > 0 ? ((cancelled / totalApps) * 100).toFixed(1) : "0.0";
    
    const waitlistTotal = this.waitlist.length;
    const waitlistClaimed = this.waitlist.filter(w => w.status === 'claimed').length;
    const waitlistConversion = waitlistTotal > 0 ? ((waitlistClaimed / waitlistTotal) * 100).toFixed(1) : "0.0";

    return {
      totalPatients,
      activeDoctors,
      totalAppointments: totalApps,
      confirmedAppointments: confirmed,
      completedAppointments: completed,
      cancelledAppointments: cancelled,
      cancellationRate,
      waitlistTotal,
      waitlistClaimed,
      waitlistConversion,
      averageWaitMinutes: 18.5
    };
  }

  exportAppointmentsCSV(): string {
    const headers = ["Booking Reference", "Date", "Start Time", "End Time", "Doctor", "Specialty", "Patient", "Status", "Reason"];
    const rows = this.appointments.map(a => [
      a.booking_reference,
      a.appointment_date,
      a.start_time,
      a.end_time,
      `"${a.doctor_name}"`,
      `"${a.specialty}"`,
      `"${a.patient_name}"`,
      a.status,
      `"${a.reason}"`
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }
}

export const api = new MediSyncStore();
