import React, { useState, useEffect } from 'react';
import { DoctorProfile, AppointmentType } from '../types';
import { api } from '../services/api';
import { X, Calendar, Clock, AlertCircle, CheckCircle, Video, Building2 } from 'lucide-react';

interface BookingModalProps {
  doctor: DoctorProfile | null;
  initialDate?: string;
  onClose: () => void;
  onSuccess: (appointment: any) => void;
  onJoinWaitlist: (doctor: DoctorProfile, date: string) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  doctor,
  initialDate,
  onClose,
  onSuccess,
  onJoinWaitlist
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    initialDate || new Date().toISOString().split('T')[0]
  );
  const [slots, setSlots] = useState<{ start_time: string; end_time: string; is_available: boolean; reason?: string }[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [appointmentType, setAppointmentType] = useState<AppointmentType>('in_person');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (doctor && selectedDate) {
      const computedSlots = api.getAvailableSlots(doctor.id, selectedDate);
      setSlots(computedSlots);
      const firstAvailable = computedSlots.find(s => s.is_available);
      setSelectedSlot(firstAvailable ? firstAvailable.start_time : '');
    }
  }, [doctor, selectedDate]);

  if (!doctor) return null;

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedSlot) {
      setError("Please select an available appointment time slot.");
      return;
    }
    if (!reason.trim()) {
      setError("Please describe the primary reason for consultation.");
      return;
    }

    setLoading(true);
    try {
      const newApp = api.bookAppointment({
        doctorId: doctor.id,
        appointmentDate: selectedDate,
        startTime: selectedSlot,
        reason: reason.trim(),
        appointmentType,
        notes: notes.trim()
      });
      onSuccess(newApp);
    } catch (err: any) {
      setError(err.message || "Failed to schedule appointment.");
    } finally {
      setLoading(false);
    }
  };

  const availableCount = slots.filter(s => s.is_available).length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">Schedule Medical Appointment</h3>
            <p className="text-xs text-slate-500">{doctor.doctor_name} · {doctor.specialty}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleBooking} className="p-6 space-y-5">
          
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Doctor Brief Card */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            {doctor.avatar_url ? (
              <img src={doctor.avatar_url} alt={doctor.doctor_name} className="w-12 h-12 rounded-lg object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-sky-100 text-sky-700 font-bold flex items-center justify-center">
                {doctor.doctor_name.charAt(4)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-slate-900">{doctor.doctor_name}</div>
              <div className="text-slate-500">{doctor.office_room} · {doctor.license_number}</div>
              <div className="text-slate-700 font-mono font-medium">${doctor.consultation_fee.toFixed(2)} standard consultation fee</div>
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Appointment Date
            </label>
            <div className="relative">
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                required
              />
            </div>
          </div>

          {/* Available Slots */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700">
                Available Time Slots ({availableCount} open)
              </label>
              {availableCount === 0 && (
                <button
                  type="button"
                  onClick={() => onJoinWaitlist(doctor, selectedDate)}
                  className="text-xs font-medium text-sky-600 hover:text-sky-700 underline"
                >
                  Join Waitlist for this day
                </button>
              )}
            </div>

            {availableCount === 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center space-y-2">
                <p className="text-xs text-amber-800">
                  All regular consultation slots for this date are fully reserved.
                </p>
                <button
                  type="button"
                  onClick={() => onJoinWaitlist(doctor, selectedDate)}
                  className="px-3.5 py-1.5 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 transition-colors"
                >
                  Join Priority Waitlist
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1">
                {slots.map(slot => (
                  <button
                    key={slot.start_time}
                    type="button"
                    disabled={!slot.is_available}
                    onClick={() => setSelectedSlot(slot.start_time)}
                    className={`py-2 px-1 text-xs font-mono font-medium rounded-lg text-center transition-all ${
                      !slot.is_available 
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed line-through' 
                        : selectedSlot === slot.start_time
                          ? 'bg-sky-600 text-white shadow-sm ring-2 ring-sky-600 ring-offset-1 font-bold'
                          : 'bg-white border border-slate-200 text-slate-700 hover:border-sky-400'
                    }`}
                  >
                    {slot.start_time}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Appointment Format */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Consultation Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAppointmentType('in_person')}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                  appointmentType === 'in_person'
                    ? 'border-sky-600 bg-sky-50 text-sky-800 ring-1 ring-sky-600'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Building2 className="w-4 h-4 text-sky-600" />
                <span>In-Person Clinic Visit</span>
              </button>
              <button
                type="button"
                onClick={() => setAppointmentType('telehealth')}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                  appointmentType === 'telehealth'
                    ? 'border-sky-600 bg-sky-50 text-sky-800 ring-1 ring-sky-600'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Video className="w-4 h-4 text-sky-600" />
                <span>Telehealth Video</span>
              </button>
            </div>
          </div>

          {/* Reason for Visit */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Reason for Consultation <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Annual cardiovascular checkup, routine lab review, persistent symptoms"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              required
            />
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Clinical Notes for Physician (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Any prior medical history or relevant clinical notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            />
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || availableCount === 0 || !selectedSlot}
              className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {loading ? "Confirming..." : "Confirm Booking"}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
