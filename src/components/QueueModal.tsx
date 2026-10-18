import React from 'react';
import { QueueEstimation, Appointment } from '../types';
import { X, Clock, Users, AlertTriangle, RefreshCw, Calendar, CheckCircle } from 'lucide-react';

interface QueueModalProps {
  appointment: Appointment | null;
  estimation: QueueEstimation | null;
  onClose: () => void;
  onRefresh: () => void;
}

export const QueueModal: React.FC<QueueModalProps> = ({
  appointment,
  estimation,
  onClose,
  onRefresh
}) => {
  if (!appointment || !estimation) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">Live Consultation Queue</h3>
            <p className="text-xs text-slate-500">Ref: {appointment.booking_reference}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Target Appointment Info */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
            <div className="font-semibold text-slate-900 text-sm">{appointment.doctor_name}</div>
            <div className="text-slate-500">{appointment.specialty}</div>
            <div className="flex items-center gap-2 pt-1 font-mono text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-sky-600" />
              <span>{appointment.appointment_date} · Scheduled: {appointment.start_time}</span>
            </div>
          </div>

          {/* Queue Metric Cards */}
          <div className="grid grid-cols-3 gap-3 text-center">
            
            <div className="p-3.5 bg-sky-50 border border-sky-100 rounded-xl">
              <div className="text-xs text-sky-700 font-medium mb-1">Queue Position</div>
              <div className="text-2xl font-bold font-mono text-sky-900 tabular-nums">
                #{estimation.queue_position}
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-xs text-slate-600 font-medium mb-1">Patients Ahead</div>
              <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                {estimation.patients_ahead}
              </div>
            </div>

            <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl">
              <div className="text-xs text-emerald-700 font-medium mb-1">Estimated Wait</div>
              <div className="text-2xl font-bold font-mono text-emerald-900 tabular-nums">
                ~{estimation.estimated_wait_minutes}m
              </div>
            </div>

          </div>

          {/* Status Message */}
          <div className="p-4 bg-sky-50/70 border border-sky-100 rounded-xl flex items-start gap-3">
            <Clock className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
            <div className="text-xs text-sky-900 leading-relaxed">
              <span className="font-semibold block mb-0.5">Pacing Status</span>
              {estimation.status_message} Assumes standard {estimation.assumed_service_duration_minutes}-minute consultation pacing per prior patient.
            </div>
          </div>

          {/* Mandatory Clinical Variance Disclaimer */}
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800 leading-relaxed">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <div>
              <span className="font-semibold block text-amber-900">Illustrative Estimate Only</span>
              {estimation.disclaimer}
            </div>
          </div>

          {/* Footer info & Refresh */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span className="font-mono">Last calculated: {estimation.last_updated}</span>
            <button
              onClick={onRefresh}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
              <span>Refresh Queue</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
