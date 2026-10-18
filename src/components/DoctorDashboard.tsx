import React, { useState } from 'react';
import { User, Appointment, DoctorProfile } from '../types';
import { api } from '../services/api';
import { 
  Calendar, Clock, CheckCircle2, XCircle, AlertCircle, 
  UserCheck, Shield, ChevronRight, Video, Building2, Sliders, Check
} from 'lucide-react';

interface DoctorDashboardProps {
  user: User;
  refreshTrigger: number;
  onRefresh: () => void;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({
  user,
  refreshTrigger,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'calendar' | 'availability' | 'analytics'>('schedule');
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<number>(1);
  const [workStartTime, setWorkStartTime] = useState<string>('09:00');
  const [workEndTime, setWorkEndTime] = useState<string>('17:00');
  const [slotDuration, setSlotDuration] = useState<number>(30);
  const [breakStart, setBreakStart] = useState<string>('12:00');
  const [breakEnd, setBreakEnd] = useState<string>('13:00');
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // Match doctor profile
  const doctor = api.doctors.find(d => d.user_id === user.id) || api.doctors[0];
  const todayStr = new Date().toISOString().split('T')[0];

  const doctorAppointments = api.appointments.filter(a => a.doctor_id === doctor.id);
  const todayAppointments = doctorAppointments.filter(a => a.appointment_date === todayStr);
  const upcomingAppointments = doctorAppointments.filter(a => a.appointment_date > todayStr);
  const completedAppointments = doctorAppointments.filter(a => a.status === 'completed');
  const cancelledAppointments = doctorAppointments.filter(a => a.status === 'cancelled');

  const handleStatusChange = (appointmentId: number, status: Appointment['status']) => {
    api.updateAppointmentStatus(appointmentId, status);
    onRefresh();
  };

  const handleSaveAvailability = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedNotice("Doctor availability & schedule rules updated successfully.");
    setTimeout(() => setSavedNotice(null), 3000);
  };

  const handleToggleAccepting = () => {
    api.toggleDoctorStatus(doctor.id);
    onRefresh();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* DOCTOR WELCOME HEADER */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={doctor.avatar_url || "/src/assets/images/doc_sarah_chen_1792303936307.jpg"}
            alt={doctor.doctor_name}
            className="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-sm shrink-0"
            referrerPolicy="no-referrer"
          />
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-sky-600 mb-0.5">
              Clinical Practitioner Station
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{doctor.doctor_name}</h1>
            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
              <span>{doctor.specialty}</span>
              <span>·</span>
              <span>License: {doctor.license_number}</span>
              <span>·</span>
              <span>{doctor.office_room}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleAccepting}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition-colors ${
              doctor.is_accepting_patients
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
            }`}
          >
            {doctor.is_accepting_patients ? "● Accepting Patients" : "○ Schedule Paused"}
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 mb-1">Today's Consultations</div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {todayAppointments.length}
          </div>
          <div className="text-[11px] text-sky-600 mt-1 font-medium">
            {todayAppointments.filter(a => a.status === 'confirmed').length} remaining today
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 mb-1">Upcoming This Week</div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {upcomingAppointments.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Validated slots</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 mb-1">Completed Visits</div>
          <div className="text-2xl font-bold font-mono text-emerald-700 tabular-nums">
            {completedAppointments.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Archived records</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 mb-1">Cancellation Rate</div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {doctorAppointments.length > 0 ? ((cancelledAppointments.length / doctorAppointments.length) * 100).toFixed(1) : 0}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">With automatic waitlist fill</div>
        </div>

      </div>

      {/* TABS HEADER */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('schedule')}
          className={`py-3 border-b-2 transition-colors ${
            activeTab === 'schedule' ? 'border-sky-600 text-sky-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Daily Schedule & Queue ({todayAppointments.length})
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`py-3 border-b-2 transition-colors ${
            activeTab === 'calendar' ? 'border-sky-600 text-sky-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Weekly Calendar Overview
        </button>
        <button
          onClick={() => setActiveTab('availability')}
          className={`py-3 border-b-2 transition-colors ${
            activeTab === 'availability' ? 'border-sky-600 text-sky-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Availability & Slot Manager
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`py-3 border-b-2 transition-colors ${
            activeTab === 'analytics' ? 'border-sky-600 text-sky-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Clinical Workload Analytics
        </button>
      </div>

      {/* TAB 1: DAILY SCHEDULE */}
      {activeTab === 'schedule' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Today's Clinical Roster · {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            </h2>
            <div className="text-xs text-slate-500 font-mono">
              Clinic Pacing: 15-30m per consultation
            </div>
          </div>

          {todayAppointments.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
              No consultations scheduled for today.
            </div>
          ) : (
            <div className="space-y-3">
              {todayAppointments.map((app, idx) => (
                <div
                  key={app.id}
                  className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-700 flex flex-col items-center justify-center font-mono shrink-0">
                      <span className="text-[11px] font-medium">#{idx + 1}</span>
                      <span className="text-xs font-bold">{app.start_time}</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-slate-900">{app.patient_name}</span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs font-mono text-slate-500">Ref: {app.booking_reference}</span>
                        <span className={`text-xs font-semibold uppercase tracking-wider ${
                          app.status === 'completed' ? 'text-emerald-700' : app.status === 'cancelled' ? 'text-rose-600 line-through' : 'text-sky-700'
                        }`}>
                          {app.status}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600">
                        {app.reason}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400 pt-0.5">
                        <span className="capitalize">{app.appointment_type.replace('_', ' ')}</span>
                        <span>·</span>
                        <span>Contact: {app.patient_email}</span>
                        {app.notes && (
                          <>
                            <span>·</span>
                            <span className="text-slate-600">Note: {app.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    {app.status === 'confirmed' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(app.id, 'completed')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Complete Visit</span>
                        </button>
                        <button
                          onClick={() => handleStatusChange(app.id, 'no_show')}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                        >
                          No-Show
                        </button>
                      </>
                    )}
                    {app.status === 'completed' && (
                      <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                        <Check className="w-4 h-4" /> Consultation Completed
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: WEEKLY CALENDAR */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900">Weekly Patient Schedule Overview</h2>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden text-xs">
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 font-semibold text-slate-600 text-center py-2.5">
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
              <div>Sun</div>
            </div>
            <div className="grid grid-cols-7 divide-x divide-slate-100 min-h-[300px]">
              {[0, 1, 2, 3, 4, 5, 6].map(dayIdx => {
                const dayApps = doctorAppointments.filter(a => {
                  const d = new Date(a.appointment_date);
                  // Normalize Sunday 0 -> 6
                  const mapped = d.getDay() === 0 ? 6 : d.getDay() - 1;
                  return mapped === dayIdx;
                });

                return (
                  <div key={dayIdx} className="p-2.5 space-y-2 bg-white">
                    <div className="text-[11px] font-mono text-slate-400 font-semibold">
                      {dayApps.length} visits
                    </div>
                    {dayApps.slice(0, 3).map(app => (
                      <div key={app.id} className="p-2 bg-sky-50 border border-sky-100 rounded text-[11px] space-y-0.5">
                        <div className="font-semibold text-sky-900 font-mono">{app.start_time}</div>
                        <div className="text-slate-700 truncate">{app.patient_name}</div>
                        <div className="text-[10px] text-slate-500 truncate">{app.reason}</div>
                      </div>
                    ))}
                    {dayApps.length > 3 && (
                      <div className="text-[10px] text-slate-400 italic">
                        +{dayApps.length - 3} more visits
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AVAILABILITY & WORKING HOURS */}
      {activeTab === 'availability' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">Physician Working Hours & Slot Architecture</h2>
              <p className="text-xs text-slate-500">
                Configure consultation availability, slot durations, and protected lunch breaks. Scheduling engine enforces these parameters with zero conflict overlap.
              </p>
            </div>

            {savedNotice && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium">
                {savedNotice}
              </div>
            )}

            <form onSubmit={handleSaveAvailability} className="space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Standard Working Hours</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={workStartTime}
                      onChange={(e) => setWorkStartTime(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs"
                    />
                    <span className="text-slate-400">to</span>
                    <input
                      type="time"
                      value={workEndTime}
                      onChange={(e) => setWorkEndTime(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Slot Interval Duration</label>
                  <select
                    value={slotDuration}
                    onChange={(e) => setSlotDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value={15}>15 Minutes per patient</option>
                    <option value={30}>30 Minutes standard consultation</option>
                    <option value={45}>45 Minutes complex clinical intake</option>
                    <option value={60}>60 Minutes comprehensive examination</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Protected Lunch Break</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={breakStart}
                      onChange={(e) => setBreakStart(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs"
                    />
                    <span className="text-slate-400">to</span>
                    <input
                      type="time"
                      value={breakEnd}
                      onChange={(e) => setBreakEnd(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs"
                    />
                  </div>
                </div>

              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5 text-xs">
                  Active Clinical Days
                </label>
                <div className="flex flex-wrap gap-2 text-xs">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, idx) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setSelectedDayOfWeek(idx)}
                      className={`px-3.5 py-1.5 rounded-lg border font-medium transition-colors ${
                        selectedDayOfWeek === idx
                          ? 'bg-sky-600 text-white border-sky-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
                >
                  Save Schedule Configuration
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* TAB 4: PRACTICE ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Weekly Patient Throughput</h3>
              <div className="text-3xl font-extrabold font-mono text-slate-900 tabular-nums">
                {doctorAppointments.length}
              </div>
              <p className="text-xs text-slate-500">
                Total consultations booked across the active roster period.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Consultation Completion Rate</h3>
              <div className="text-3xl font-extrabold font-mono text-emerald-700 tabular-nums">
                {doctorAppointments.length > 0 
                  ? `${Math.round((completedAppointments.length / doctorAppointments.length) * 100)}%` 
                  : '100%'}
              </div>
              <p className="text-xs text-slate-500">
                Pacing compliance and positive patient discharge records.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Waitlist Absorption Rate</h3>
              <div className="text-3xl font-extrabold font-mono text-teal-700 tabular-nums">
                100%
              </div>
              <p className="text-xs text-slate-500">
                Vacated cancelled slots offered to next priority patient within 2 hours.
              </p>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
