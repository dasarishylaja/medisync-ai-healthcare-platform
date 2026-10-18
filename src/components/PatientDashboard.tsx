import React, { useState, useMemo } from 'react';
import { User, Appointment, DoctorProfile, Specialty, WaitlistEntry, NotificationItem } from '../types';
import { api } from '../services/api';
import { 
  Calendar, Clock, Search, Bell, AlertCircle, CheckCircle2, 
  ChevronRight, ArrowRight, Video, Building2, User as UserIcon,
  RefreshCw, Check, Sparkles, Filter, ShieldCheck, HeartPulse
} from 'lucide-react';

interface PatientDashboardProps {
  user: User;
  onBookDoctor: (doctor: DoctorProfile, date?: string) => void;
  onOpenQueue: (appointment: Appointment) => void;
  onReschedule: (appointment: Appointment) => void;
  onCancelSuccess: () => void;
  refreshTrigger: number;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({
  user,
  onBookDoctor,
  onOpenQueue,
  onReschedule,
  onCancelSuccess,
  refreshTrigger
}) => {
  const [activeTab, setActiveTab] = useState<'appointments' | 'discovery' | 'waitlist' | 'notifications'>('appointments');
  
  // Discovery filters
  const [selectedSpecialty, setSelectedSpecialty] = useState<number | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [preferredDate, setPreferredDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [timeRange, setTimeRange] = useState<'morning' | 'afternoon' | 'any'>('any');

  // Cancel dialog state
  const [cancellingApp, setCancellingApp] = useState<Appointment | null>(null);
  const [cancellationReason, setCancellationReason] = useState<string>('');
  const [cancelToast, setCancelToast] = useState<{ message: string; waitlistOffered: boolean } | null>(null);

  // Data queries
  const specialties = api.specialties;
  const myAppointments = api.appointments.filter(a => a.patient_id === user.id);
  const upcomingAppointments = myAppointments.filter(a => a.status === 'confirmed' || a.status === 'rescheduled');
  const pastAppointments = myAppointments.filter(a => a.status === 'completed' || a.status === 'cancelled');
  const myWaitlist = api.waitlist.filter(w => w.patient_id === user.id);
  const myNotifications = api.notifications.filter(n => n.user_id === user.id);
  const unreadCount = myNotifications.filter(n => !n.is_read).length;

  // Recommendations with transparent scoring
  const recommendations = useMemo(() => {
    return api.recommendDoctors(selectedSpecialty, preferredDate, timeRange);
  }, [selectedSpecialty, preferredDate, timeRange, refreshTrigger]);

  const handleCancelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingApp) return;

    try {
      const res = api.cancelAppointment(cancellingApp.id, cancellationReason || "Patient personal scheduling adjustment");
      setCancelToast({
        message: `Appointment ${cancellingApp.booking_reference} cancelled successfully.`,
        waitlistOffered: res.waitlistOffered
      });
      setCancellingApp(null);
      setCancellationReason('');
      onCancelSuccess();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleClaimWaitlist = (waitlistId: number) => {
    try {
      api.claimWaitlistSlot(waitlistId);
      alert("Successfully confirmed appointment for your offered waitlist slot!");
      onCancelSuccess();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* A. WELCOME SECTION */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-sky-600 mb-1">
            Patient Health Coordination Hub
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {user.first_name}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage consultations, track live queue positions, and discover board-certified physicians.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('discovery')}
          className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-2 whitespace-nowrap"
        >
          <Search className="w-4 h-4" />
          <span>Find & Book a Doctor</span>
        </button>
      </div>

      {cancelToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start justify-between gap-3 text-xs text-emerald-800">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">{cancelToast.message}</span>
              {cancelToast.waitlistOffered && (
                <div className="mt-1 text-emerald-700">
                  <Sparkles className="w-3.5 h-3.5 inline mr-1" />
                  <strong>Automated Waitlist Recovery:</strong> The vacated slot was immediately matched and offered to the next patient on the waiting list!
                </div>
              )}
            </div>
          </div>
          <button onClick={() => setCancelToast(null)} className="text-emerald-600 hover:text-emerald-900 font-bold">✕</button>
        </div>
      )}

      {/* B. SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 mb-1">Upcoming Visits</div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {upcomingAppointments.length}
          </div>
          <div className="text-[11px] text-sky-600 mt-1 font-medium">
            {upcomingAppointments[0] ? `Next: ${upcomingAppointments[0].appointment_date}` : 'None scheduled'}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 mb-1">Completed Visits</div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {pastAppointments.filter(a => a.status === 'completed').length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Clinical records archived</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 mb-1">Active Waitlists</div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {myWaitlist.filter(w => w.status === 'waiting' || w.status === 'offered').length}
          </div>
          <div className="text-[11px] text-teal-600 mt-1 font-medium">Slot recovery active</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 mb-1">Unread Alerts</div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {unreadCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">In-app notifications</div>
        </div>

      </div>

      {/* TABS CONTROLLER */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('appointments')}
          className={`py-3 border-b-2 transition-colors ${
            activeTab === 'appointments' ? 'border-sky-600 text-sky-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          My Appointments ({myAppointments.length})
        </button>
        <button
          onClick={() => setActiveTab('discovery')}
          className={`py-3 border-b-2 transition-colors ${
            activeTab === 'discovery' ? 'border-sky-600 text-sky-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Intelligent Doctor Discovery
        </button>
        <button
          onClick={() => setActiveTab('waitlist')}
          className={`py-3 border-b-2 transition-colors ${
            activeTab === 'waitlist' ? 'border-sky-600 text-sky-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Waitlist Manager ({myWaitlist.length})
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'notifications' ? 'border-sky-600 text-sky-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Notifications</span>
          {unreadCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500" />
          )}
        </button>
      </div>

      {/* TAB 1: MY APPOINTMENTS */}
      {activeTab === 'appointments' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-3">Upcoming Appointments</h2>
            {upcomingAppointments.length === 0 ? (
              <div className="bg-white p-8 rounded-xl border border-slate-200 text-center">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500 mb-3">You have no upcoming consultations scheduled.</p>
                <button
                  onClick={() => setActiveTab('discovery')}
                  className="px-4 py-2 bg-sky-600 text-white rounded-lg text-xs font-semibold hover:bg-sky-700"
                >
                  Schedule Your First Appointment
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingAppointments.map(app => (
                  <div
                    key={app.id}
                    className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-sky-300 transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-slate-900">{app.doctor_name}</span>
                        <span className="text-xs text-slate-500 font-medium">·</span>
                        <span className="text-xs text-sky-700 font-medium">{app.specialty}</span>
                        <span className="text-[11px] font-mono text-slate-400">Ref: {app.booking_reference}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-600">
                        <div className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{app.appointment_date}</span>
                        </div>
                        <div className="flex items-center gap-1 font-mono">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{app.start_time} - {app.end_time}</span>
                        </div>
                        <div className="flex items-center gap-1 capitalize">
                          {app.appointment_type === 'telehealth' ? <Video className="w-3.5 h-3.5 text-indigo-500" /> : <Building2 className="w-3.5 h-3.5 text-slate-500" />}
                          <span>{app.appointment_type.replace('_', ' ')}</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 italic pt-1">
                        Reason: {app.reason}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      <button
                        onClick={() => onOpenQueue(app)}
                        className="px-3 py-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                        title="View queue position and estimated waiting time"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Live Queue</span>
                      </button>
                      <button
                        onClick={() => onReschedule(app)}
                        className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-medium transition-colors"
                      >
                        Reschedule
                      </button>
                      <button
                        onClick={() => setCancellingApp(app)}
                        className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past History */}
          {pastAppointments.length > 0 && (
            <div>
              <h2 className="text-base font-bold text-slate-900 mb-3">Past Consultation Records</h2>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <tr>
                      <th className="py-3 px-4">Booking Ref</th>
                      <th className="py-3 px-4">Doctor & Specialty</th>
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Clinical Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pastAppointments.map(app => (
                      <tr key={app.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-medium text-slate-900">{app.booking_reference}</td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{app.doctor_name}</div>
                          <div className="text-slate-500 text-[11px]">{app.specialty}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {app.appointment_date} · {app.start_time}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`capitalize font-medium ${
                            app.status === 'completed' ? 'text-emerald-700' : 'text-slate-400 line-through'
                          }`}>
                            {app.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">{app.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INTELLIGENT DOCTOR DISCOVERY */}
      {activeTab === 'discovery' && (
        <div className="space-y-6">
          
          {/* Discovery Filter Header */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Multi-Criteria Doctor Matching Engine</h3>
                <p className="text-xs text-slate-500">
                  Ranks specialists transparently by specialty match (40%), open slot density (25%), time window (20%), and rating (15%).
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-sky-700 bg-sky-50 px-3 py-1 rounded-full font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Explainable AI Discovery</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Medical Specialty</label>
                <select
                  value={selectedSpecialty || ''}
                  onChange={(e) => setSelectedSpecialty(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">All Specialties</option>
                  {specialties.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Consultation Date</label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Time of Day Preference</label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="any">Any Time Window</option>
                  <option value="morning">Morning (&lt; 12:00 PM)</option>
                  <option value="afternoon">Afternoon (12:00 PM+)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Doctor Name Search</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Sarah Chen"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

            </div>
          </div>

          {/* Ranked Results Grid */}
          <div className="space-y-4">
            {recommendations
              .filter(r => !searchQuery || r.doctor.doctor_name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map(rec => (
                <div
                  key={rec.doctor.id}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-sky-300 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={rec.doctor.avatar_url || "/src/assets/images/doc_sarah_chen_1792303936307.jpg"}
                      alt={rec.doctor.doctor_name}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-sm shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <h3 className="text-base font-bold text-slate-900">{rec.doctor.doctor_name}</h3>
                        <span className="text-xs text-sky-700 font-semibold">{rec.doctor.specialty}</span>
                        <div className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md">
                          {rec.composite_score}% match
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
                        {rec.doctor.bio}
                      </p>

                      {/* Transparent Explanation */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="font-medium text-slate-700">Recommendation Rationale:</span>
                        <span>{rec.explanation}</span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                        <span>{rec.doctor.office_room}</span>
                        <span>·</span>
                        <span>{rec.doctor.experience_years} years experience</span>
                        <span>·</span>
                        <span className="font-mono font-medium text-slate-900">${rec.doctor.consultation_fee.toFixed(2)} fee</span>
                        <span>·</span>
                        <span className="text-amber-600 font-bold">★ {rec.doctor.average_rating.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 self-stretch md:self-center shrink-0">
                    <div className="text-xs text-slate-500">
                      {rec.open_slots_count > 0 ? (
                        <span className="text-emerald-600 font-semibold">{rec.open_slots_count} slots open on {preferredDate}</span>
                      ) : (
                        <span className="text-amber-600 font-semibold">Fully booked · Waitlist open</span>
                      )}
                    </div>
                    <button
                      onClick={() => onBookDoctor(rec.doctor, preferredDate)}
                      className="w-full md:w-auto px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>{rec.open_slots_count > 0 ? "Book Consultation" : "Join Waitlist"}</span>
                    </button>
                  </div>
                </div>
              ))}
          </div>

        </div>
      )}

      {/* TAB 3: WAITLIST MANAGER */}
      {activeTab === 'waitlist' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-1">Automated Waitlist & Slot Recovery</h2>
            <p className="text-xs text-slate-500">
              When full clinical days experience cancellations, MediSync AI matches waiting patients and reserves the slot with an automated 2-hour claim window.
            </p>
          </div>

          {myWaitlist.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
              You are currently not on any doctor's waiting list.
            </div>
          ) : (
            <div className="space-y-3">
              {myWaitlist.map(w => (
                <div
                  key={w.id}
                  className={`p-5 rounded-xl border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
                    w.status === 'offered' ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-slate-900">{w.doctor_name}</span>
                      <span className="text-xs text-slate-500">·</span>
                      <span className="text-xs text-sky-700">{w.specialty}</span>
                      <span className={`text-xs font-semibold uppercase tracking-wider ${
                        w.status === 'offered' ? 'text-amber-800' : w.status === 'claimed' ? 'text-emerald-700' : 'text-slate-600'
                      }`}>
                        [{w.status}]
                      </span>
                    </div>

                    <div className="text-xs text-slate-600">
                      Target Date: <strong>{w.preferred_date}</strong> · Preferred window: <strong>{w.preferred_time_range}</strong>
                    </div>

                    {w.status === 'offered' && (
                      <div className="p-2.5 bg-amber-100/70 rounded-lg text-xs text-amber-900 mt-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>
                          <strong>Slot Recovered!</strong> A cancelled slot on {w.offered_slot_date} at <strong>{w.offered_slot_start}</strong> has been offered to you. Confirm your booking before the offer window expires!
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {w.status === 'offered' ? (
                      <button
                        onClick={() => handleClaimWaitlist(w.id)}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Claim Offered Slot</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => { api.leaveWaitlist(w.id); onCancelSuccess(); }}
                        className="px-3 py-1.5 text-xs text-slate-500 hover:text-rose-600 transition-colors"
                      >
                        Leave Waitlist
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">In-App Notifications Log</h2>
            {unreadCount > 0 && (
              <button
                onClick={() => { api.markAllNotificationsRead(); onCancelSuccess(); }}
                className="text-xs text-sky-600 hover:text-sky-800 font-semibold"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden text-xs">
            {myNotifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400">No notifications.</div>
            ) : (
              myNotifications.map(n => (
                <div key={n.id} className={`p-4 flex items-start justify-between gap-4 ${n.is_read ? 'bg-white' : 'bg-sky-50/50'}`}>
                  <div className="space-y-1">
                    <div className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                      {!n.is_read && <span className="w-2 h-2 rounded-full bg-sky-600" />}
                      <span>{n.title}</span>
                    </div>
                    <p className="text-slate-600">{n.message}</p>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {new Date(n.created_at).toLocaleString()}
                    </div>
                  </div>
                  {!n.is_read && (
                    <button
                      onClick={() => { api.markNotificationRead(n.id); onCancelSuccess(); }}
                      className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* CANCELLATION CONFIRMATION MODAL */}
      {cancellingApp && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Confirm Appointment Cancellation</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to cancel your consultation with <strong>{cancellingApp.doctor_name}</strong> on {cancellingApp.appointment_date} at {cancellingApp.start_time}?
            </p>
            <div className="p-3 bg-sky-50 rounded-xl text-xs text-sky-800">
              <strong>Slot Recovery Note:</strong> Upon cancellation, this open slot will immediately be offered to waiting patients on MediSync AI's waitlist.
            </div>

            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Cancellation
                </label>
                <input
                  type="text"
                  placeholder="e.g. Schedule conflict, feeling better, need different date"
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCancellingApp(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Keep Appointment
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
                >
                  Confirm Cancellation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
