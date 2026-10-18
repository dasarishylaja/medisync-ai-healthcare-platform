import React, { useState, useEffect } from 'react';
import { Appointment } from '../types';
import { api } from '../services/api';
import { X, Calendar, Clock, AlertCircle } from 'lucide-react';

interface RescheduleModalProps {
  appointment: Appointment | null;
  onClose: () => void;
  onSuccess: (updated: Appointment) => void;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  appointment,
  onClose,
  onSuccess
}) => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [slots, setSlots] = useState<{ start_time: string; end_time: string; is_available: boolean }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (appointment) {
      setSelectedDate(appointment.appointment_date);
    }
  }, [appointment]);

  useEffect(() => {
    if (appointment && selectedDate) {
      const computed = api.getAvailableSlots(appointment.doctor_id, selectedDate);
      setSlots(computed);
      const firstAvail = computed.find(s => s.is_available);
      setSelectedSlot(firstAvail ? firstAvail.start_time : '');
    }
  }, [appointment, selectedDate]);

  if (!appointment) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedSlot) {
      setError("Please choose a valid time slot.");
      return;
    }

    setLoading(true);
    try {
      const updated = api.rescheduleAppointment(appointment.id, selectedDate, selectedSlot);
      onSuccess(updated);
    } catch (err: any) {
      setError(err.message || "Failed to reschedule appointment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">Reschedule Consultation</h3>
            <p className="text-xs text-slate-500">Ref: {appointment.booking_reference}</p>
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

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div className="font-semibold text-slate-900">{appointment.doctor_name}</div>
            <div className="text-slate-500">{appointment.specialty}</div>
            <div className="text-slate-600 mt-1">Current: {appointment.appointment_date} at {appointment.start_time}</div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select New Date
            </label>
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select New Time Slot
            </label>
            <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1">
              {slots.map(slot => (
                <button
                  key={slot.start_time}
                  type="button"
                  disabled={!slot.is_available}
                  onClick={() => setSelectedSlot(slot.start_time)}
                  className={`py-2 px-1 text-xs font-mono font-medium rounded-lg text-center transition-all ${
                    !slot.is_available 
                      ? 'bg-slate-100 text-slate-400 line-through cursor-not-allowed' 
                      : selectedSlot === slot.start_time
                        ? 'bg-sky-600 text-white font-bold shadow-sm ring-2 ring-sky-600'
                        : 'bg-white border border-slate-200 text-slate-700 hover:border-sky-400'
                  }`}
                >
                  {slot.start_time}
                </button>
              ))}
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
              disabled={loading || !selectedSlot}
              className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm disabled:opacity-50"
            >
              {loading ? "Updating..." : "Confirm Reschedule"}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
