import React, { useState } from 'react';
import { User, Appointment, DoctorProfile, AuditLogItem } from '../types';
import { api } from '../services/api';
import { 
  Users, UserCheck, Calendar, CheckCircle2, XCircle, 
  BarChart3, Download, Shield, Search, Sliders, Activity, Clock
} from 'lucide-react';

interface AdminDashboardProps {
  user: User;
  refreshTrigger: number;
  onRefresh: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  user,
  refreshTrigger,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'doctors' | 'appointments' | 'audit'>('overview');
  const [appointmentSearch, setAppointmentSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  const kpis = api.getAnalyticsKPIs();
  const doctors = api.doctors;
  const allAppointments = api.appointments;
  const auditLogs = api.auditLogs;

  // Filtered appointments
  const filteredAppointments = allAppointments.filter(app => {
    const matchesSearch = !appointmentSearch || 
      app.booking_reference.toLowerCase().includes(appointmentSearch.toLowerCase()) ||
      app.patient_name.toLowerCase().includes(appointmentSearch.toLowerCase()) ||
      app.doctor_name.toLowerCase().includes(appointmentSearch.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate specialty counts
  const specialtyCounts = api.specialties.map(spec => {
    const count = allAppointments.filter(a => a.specialty === spec.name).length;
    return { name: spec.name, count };
  });

  const handleToggleDoctor = (doctorId: number) => {
    api.toggleDoctorStatus(doctorId);
    onRefresh();
  };

  const handleExportCSV = () => {
    const csvContent = api.exportAppointmentsCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `medisync_appointments_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* ADMIN HEADER */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-sky-600 mb-0.5">
            Hospital System Administration & Operations
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Hospital Command Center</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Enterprise clinical oversight, resource scheduling management, and real-time audit logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-sky-400" />
            <span>Export Master Report (CSV)</span>
          </button>
        </div>
      </div>

      {downloadSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Clinical appointment log exported successfully to CSV.</span>
        </div>
      )}

      {/* SUMMARY KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 mb-1">Total Patients</div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {kpis.totalPatients}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 mb-1">Active Doctors</div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {kpis.activeDoctors}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 mb-1">Total Bookings</div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {kpis.totalAppointments}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 mb-1">Confirmed</div>
          <div className="text-2xl font-bold font-mono text-sky-700 tabular-nums">
            {kpis.confirmedAppointments}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 mb-1">Completed</div>
          <div className="text-2xl font-bold font-mono text-emerald-700 tabular-nums">
            {kpis.completedAppointments}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 mb-1">Attrition Rate</div>
          <div className="text-2xl font-bold font-mono text-rose-600 tabular-nums">
            {kpis.cancellationRate}%
          </div>
        </div>

      </div>

      {/* TABS CONTROLLER */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-3 border-b-2 transition-colors ${
            activeTab === 'overview' ? 'border-sky-600 text-sky-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Operational Analytics & Demand
        </button>
        <button
          onClick={() => setActiveTab('doctors')}
          className={`py-3 border-b-2 transition-colors ${
            activeTab === 'doctors' ? 'border-sky-600 text-sky-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Physician Roster & Credentials ({doctors.length})
        </button>
        <button
          onClick={() => setActiveTab('appointments')}
          className={`py-3 border-b-2 transition-colors ${
            activeTab === 'appointments' ? 'border-sky-600 text-sky-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Master Appointments Register ({allAppointments.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`py-3 border-b-2 transition-colors ${
            activeTab === 'audit' ? 'border-sky-600 text-sky-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          System Audit Trail ({auditLogs.length})
        </button>
      </div>

      {/* TAB 1: OPERATIONAL ANALYTICS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Specialty Distribution Bar Chart */}
            <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Appointment Demand by Clinical Specialty</h3>
                  <p className="text-xs text-slate-500">Distribution of patient intake volume</p>
                </div>
                <Activity className="w-4 h-4 text-sky-600" />
              </div>

              <div className="space-y-3 pt-2">
                {specialtyCounts.map(item => {
                  const maxCount = Math.max(...specialtyCounts.map(s => s.count), 1);
                  const percentage = Math.round((item.count / maxCount) * 100);

                  return (
                    <div key={item.name} className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-700">{item.name}</span>
                        <span className="font-mono font-bold text-slate-900 tabular-nums">{item.count} visits</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-sky-600 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(percentage, 8)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Waitlist Recovery Performance */}
            <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold text-slate-900">Waitlist & Slot Recovery Conversion</h3>
                  <Clock className="w-4 h-4 text-teal-600" />
                </div>
                <p className="text-xs text-slate-500">
                  Measures efficiency of re-allocating cancelled appointment slots to queued patients.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center my-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[11px] text-slate-500">Queue Entries</div>
                  <div className="text-xl font-bold font-mono text-slate-900 tabular-nums">{kpis.waitlistTotal}</div>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <div className="text-[11px] text-emerald-700">Slots Claimed</div>
                  <div className="text-xl font-bold font-mono text-emerald-800 tabular-nums">{kpis.waitlistClaimed}</div>
                </div>
                <div className="p-3 bg-teal-50 rounded-xl border border-teal-100">
                  <div className="text-[11px] text-teal-700">Conversion</div>
                  <div className="text-xl font-bold font-mono text-teal-800 tabular-nums">{kpis.waitlistConversion}%</div>
                </div>
              </div>

              <div className="p-4 bg-sky-50 rounded-xl border border-sky-100 text-xs text-sky-900 leading-relaxed">
                <strong>Pacing Impact:</strong> MediSync AI prevents schedule vacancy losses. When a cancellation occurs, the 2-hour reservation window preserves provider capacity without manual staff phone calls.
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: DOCTOR MANAGEMENT */}
      {activeTab === 'doctors' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Physician Roster & Scheduling Activation</h2>
            <div className="text-xs text-slate-500">{doctors.length} Registered Medical Providers</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="py-3 px-4">Physician</th>
                  <th className="py-3 px-4">Specialty & License</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Consultation Fee</th>
                  <th className="py-3 px-4">Patient Rating</th>
                  <th className="py-3 px-4">Intake Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {doctors.map(doc => (
                  <tr key={doc.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={doc.avatar_url || "/src/assets/images/doc_sarah_chen_1792303936307.jpg"}
                          alt={doc.doctor_name}
                          className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <div className="font-bold text-slate-900">{doc.doctor_name}</div>
                          <div className="text-[11px] text-slate-400">{doc.experience_years} years experience</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">{doc.specialty}</div>
                      <div className="font-mono text-slate-400 text-[11px]">{doc.license_number}</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">{doc.office_room}</td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-900">${doc.consultation_fee.toFixed(2)}</td>
                    <td className="py-3.5 px-4 font-mono text-amber-600 font-bold">★ {doc.average_rating.toFixed(2)}</td>
                    <td className="py-3.5 px-4">
                      <span className={`text-xs font-semibold ${
                        doc.is_accepting_patients ? 'text-emerald-700' : 'text-slate-400'
                      }`}>
                        {doc.is_accepting_patients ? '● Active' : '○ Inactive'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleDoctor(doc.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          doc.is_accepting_patients
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {doc.is_accepting_patients ? 'Pause Intake' : 'Activate Roster'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: APPOINTMENTS MASTER LOG */}
      {activeTab === 'appointments' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by ref, patient, doctor..."
                  value={appointmentSearch}
                  onChange={(e) => setAppointmentSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="all">All Statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="rescheduled">Rescheduled</option>
              </select>
            </div>

            <div className="text-xs text-slate-500 font-mono">
              Showing {filteredAppointments.length} of {allAppointments.length} records
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Physician</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Clinical Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAppointments.map(app => (
                  <tr key={app.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{app.booking_reference}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{app.appointment_date} · {app.start_time}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{app.doctor_name}</div>
                      <div className="text-[11px] text-slate-400">{app.specialty}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{app.patient_name}</div>
                      <div className="text-[11px] text-slate-400">{app.patient_email}</div>
                    </td>
                    <td className="py-3 px-4 capitalize text-slate-600">{app.appointment_type.replace('_', ' ')}</td>
                    <td className="py-3 px-4">
                      <span className={`capitalize font-semibold ${
                        app.status === 'confirmed' ? 'text-sky-700' :
                        app.status === 'completed' ? 'text-emerald-700' :
                        app.status === 'cancelled' ? 'text-rose-600 line-through' : 'text-amber-700'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 truncate max-w-xs">{app.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOG */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Hospital Security & Event Audit Log</h2>
              <p className="text-xs text-slate-500">Immutable record of bookings, cancellations, doctor activations, and status changes.</p>
            </div>
            <Shield className="w-5 h-5 text-emerald-600" />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden text-xs">
            <table className="w-full text-left font-mono">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold font-sans">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Target Ref</th>
                  <th className="py-3 px-4">Payload Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="py-3 px-4 text-slate-900 font-semibold font-sans">{log.actor_name}</td>
                    <td className="py-3 px-4 text-sky-700 font-bold">{log.action}</td>
                    <td className="py-3 px-4 text-slate-600">{log.target_entity}</td>
                    <td className="py-3 px-4 text-slate-800">{log.target_id}</td>
                    <td className="py-3 px-4 text-slate-500 truncate max-w-sm">{log.details_json}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
