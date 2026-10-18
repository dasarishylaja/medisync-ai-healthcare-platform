import React, { useState } from 'react';
import { DoctorProfile } from '../types';
import { api } from '../services/api';
import { X, Calendar, Clock, AlertCircle, CheckCircle } from 'lucide-react';

interface WaitlistModalProps {
  doctor: DoctorProfile | null;
  initialDate?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const WaitlistModal: React.FC<WaitlistModalProps> = ({
  doctor,
  initialDate,
  onClose,
  onSuccess
}) => {
  const [preferredDate, setPreferredDate] = useState<string>(
    initialDate || new Date().toISOString().split('T')[0]
  );
  const [timeRange, setTimeRange] = useState<'morning' | 'afternoon' | 'any'>('any');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!doctor) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      api.joinWaitlist(doctor.id, preferredDate, timeRange);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to join waiting list.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">Join Priority Waitlist</h3>
            <p className="text-xs text-slate-500">{doctor.doctor_name} · {doctor.specialty}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3.5 bg-sky-50 border border-sky-100 rounded-xl text-xs text-sky-900 leading-relaxed">
            <span className="font-semibold block mb-1">Automated Slot Recovery Protocol</span>
            When another patient cancels or reschedules, MediSync AI instantly offers the newly opened slot to you with a 2-hour confirmation window.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Preferred Date
            </label>
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Preferred Time Window
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTimeRange('any')}
                className={`py-2 px-2 text-xs font-medium rounded-lg border transition-all ${
                  timeRange === 'any'
                    ? 'border-sky-600 bg-sky-50 text-sky-800 ring-1 ring-sky-600 font-semibold'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                Any Time
              </button>
              <button
                type="button"
                onClick={() => setTimeRange('morning')}
                className={`py-2 px-2 text-xs font-medium rounded-lg border transition-all ${
                  timeRange === 'morning'
                    ? 'border-sky-600 bg-sky-50 text-sky-800 ring-1 ring-sky-600 font-semibold'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                Morning (&lt;12 PM)
              </button>
              <button
                type="button"
                onClick={() => setTimeRange('afternoon')}
                className={`py-2 px-2 text-xs font-medium rounded-lg border transition-all ${
                  timeRange === 'afternoon'
                    ? 'border-sky-600 bg-sky-50 text-sky-800 ring-1 ring-sky-600 font-semibold'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                Afternoon (12+ PM)
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm disabled:opacity-50"
            >
              {loading ? "Joining..." : "Join Waitlist"}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
