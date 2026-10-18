import React from 'react';
import { 
  Calendar, Clock, Bell, UserCheck, BarChart3, Users,
  ArrowRight, ShieldCheck, CheckCircle2, Search, HeartPulse, Activity
} from 'lucide-react';
import { UserRole } from '../types';

interface LandingPageProps {
  onFindDoctors: () => void;
  onGetStarted: () => void;
  onSelectDemoRole: (role: UserRole) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onFindDoctors,
  onGetStarted,
  onSelectDemoRole
}) => {
  return (
    <div className="bg-slate-50 text-slate-900">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-7 space-y-6">
              
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-sky-700 bg-sky-50 px-3 py-1.5 rounded-full border border-sky-100">
                <HeartPulse className="w-4 h-4 text-sky-600" />
                <span>Next-Generation Healthcare Coordination</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]" style={{ textWrap: 'balance' }}>
                Smarter Healthcare. <br />
                <span className="text-sky-600">Simpler Appointments.</span>
              </h1>

              <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
                Discover doctors, schedule appointments intelligently, and manage your healthcare journey in one connected platform. Eliminates double-booking hazards, long waiting-room delays, and scheduling friction.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={onFindDoctors}
                  className="px-6 py-3.5 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-all shadow-sm hover:shadow-md flex items-center gap-2 whitespace-nowrap"
                >
                  <Search className="w-4 h-4" />
                  <span>Find a Doctor</span>
                </button>
                <button
                  onClick={onGetStarted}
                  className="px-6 py-3.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors whitespace-nowrap"
                >
                  Get Started
                </button>
              </div>

              {/* Verified Trust Strip */}
              <div className="pt-6 border-t border-slate-100 grid grid-cols-3 gap-6 text-xs text-slate-500">
                <div>
                  <div className="font-bold text-slate-900 text-lg font-mono tabular-nums">0%</div>
                  <div>Double-booking guarantee</div>
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-lg font-mono tabular-nums">15 min</div>
                  <div>Pacing & wait estimation</div>
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-lg font-mono tabular-nums">100%</div>
                  <div>Role-based access control</div>
                </div>
              </div>

            </div>

            {/* Hero Image */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden shadow-xl border border-slate-200 bg-slate-100">
                <img
                  src="/src/assets/images/hero_healthcare_clinic_1792303919147.jpg"
                  alt="Doctor consulting with patient over interactive scheduling tablet"
                  className="w-full h-full object-cover aspect-[4/3]"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent flex items-end p-6">
                  <div className="text-white">
                    <div className="text-xs font-semibold text-sky-300">Live Coordination</div>
                    <div className="text-sm font-medium">Real-time slot recovery & automated waitlist protection</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. INSTANT DEMO EVALUATION STRIP */}
      <section className="bg-sky-900 text-white py-8 border-b border-sky-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="text-xs uppercase tracking-wider font-semibold text-sky-300 mb-1">
                Portfolio Evaluator Fast-Track
              </div>
              <h2 className="text-lg font-bold text-white">
                Experience MediSync AI in any role with pre-loaded clinical scenarios
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => onSelectDemoRole('patient')}
                className="px-4 py-2.5 bg-white text-sky-900 hover:bg-sky-50 text-xs font-semibold rounded-lg shadow-sm transition-colors whitespace-nowrap"
              >
                Launch as Patient (Emma)
              </button>
              <button
                onClick={() => onSelectDemoRole('doctor')}
                className="px-4 py-2.5 bg-sky-800 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg border border-sky-600 transition-colors whitespace-nowrap"
              >
                Launch as Doctor (Dr. Chen)
              </button>
              <button
                onClick={() => onSelectDemoRole('admin')}
                className="px-4 py-2.5 bg-sky-800 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg border border-sky-600 transition-colors whitespace-nowrap"
              >
                Launch as Admin (Eleanor)
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PLATFORM CORE FEATURES */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Engineered for Modern Healthcare Operations
            </h2>
            <p className="mt-3 text-base text-slate-600">
              Unlike generic appointment websites, MediSync AI solves underlying scheduling friction with intelligent workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            <div className="bg-white p-7 rounded-xl border border-slate-200 shadow-sm transition-all hover:border-sky-300">
              <div className="w-11 h-11 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center mb-5">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Intelligent Doctor Discovery</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Multi-criteria recommendation engine matching patients with board-certified specialists based on specialty fit, open consultation slots, time preference, and verified ratings with transparent explanations.
              </p>
            </div>

            <div className="bg-white p-7 rounded-xl border border-slate-200 shadow-sm transition-all hover:border-sky-300">
              <div className="w-11 h-11 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center mb-5">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Smart Conflict Prevention</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Database-level concurrency locking and validation prevents double-booking for physicians while strictly enforcing clinic hours, break intervals, and blocked periods.
              </p>
            </div>

            <div className="bg-white p-7 rounded-xl border border-slate-200 shadow-sm transition-all hover:border-sky-300">
              <div className="w-11 h-11 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Estimated Waiting Times</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Transparent queue tracking displays exact queue position, patients ahead, and estimated consultation wait times using standard clinical service pacing and clear variance notices.
              </p>
            </div>

            <div className="bg-white p-7 rounded-xl border border-slate-200 shadow-sm transition-all hover:border-sky-300">
              <div className="w-11 h-11 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Waitlist & Slot Recovery</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                When an appointment is cancelled, MediSync AI immediately evaluates the waiting list, offers the vacant slot to an eligible patient with a 2-hour window, and prevents schedule waste.
              </p>
            </div>

            <div className="bg-white p-7 rounded-xl border border-slate-200 shadow-sm transition-all hover:border-sky-300">
              <div className="w-11 h-11 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-5">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Automated Notifications</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                In-app alerts and notification channels deliver instant booking confirmations, rescheduling updates, queue reminders, and cancellation recovery notices.
              </p>
            </div>

            <div className="bg-white p-7 rounded-xl border border-slate-200 shadow-sm transition-all hover:border-sky-300">
              <div className="w-11 h-11 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center mb-5">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Healthcare Operational Analytics</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Executive clinical dashboards analyze appointment demand trends, specialty distributions, physician workloads, cancellation attrition, and exportable CSV audit records.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS (3 CLEAR STEPS) */}
      <section className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              How MediSync AI Works
            </h2>
            <p className="mt-3 text-base text-slate-600">
              A frictionless clinical scheduling flow designed for patients and medical staff.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            
            <div className="relative p-6 rounded-xl border border-slate-200 bg-slate-50">
              <div className="text-3xl font-extrabold text-sky-600 font-mono mb-4">01</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Discover a Doctor</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Select your preferred specialty, available dates, and morning or afternoon preferences. Review transparent AI ranking recommendations and physician credentials.
              </p>
            </div>

            <div className="relative p-6 rounded-xl border border-slate-200 bg-slate-50">
              <div className="text-3xl font-extrabold text-sky-600 font-mono mb-4">02</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Choose an Available Slot</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Select an open consultation slot validated against physician working hours and breaks. Or join the automated waitlist if all slots for that day are occupied.
              </p>
            </div>

            <div className="relative p-6 rounded-xl border border-slate-200 bg-slate-50">
              <div className="text-3xl font-extrabold text-sky-600 font-mono mb-4">03</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Coordinate from Dashboard</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Track queue order, estimated consultation times, reschedule or cancel if needed, and receive instant in-app alerts throughout your clinical journey.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 5. TRUST, PRIVACY & ETHICS SECTION */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 lg:p-12 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              <div className="lg:col-span-8 space-y-4">
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Healthcare Trust & Data Minimization</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  Built on Security, Transparency & Clinical Ethics
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  MediSync AI enforces strict server-side authorization checks, session security, and role-based permissions separating patient health records, doctor management, and hospital operations.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700 pt-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>No diagnostic claims or algorithmic prescriptions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Strict double-booking transactional prevention</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Comprehensive administrative security audit logging</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Data minimization: only scheduling metadata collected</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 bg-slate-50 p-6 rounded-xl border border-slate-200 text-center">
                <div className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-2">
                  Final-Year Academic Portfolio
                </div>
                <div className="text-lg font-bold text-slate-900 mb-2">
                  MediSync AI Platform
                </div>
                <p className="text-xs text-slate-600 mb-4">
                  Full-Stack Architecture featuring Python 3.10 Flask API, SQLAlchemy ORM, and React 19 Frontend.
                </p>
                <button
                  onClick={onFindDoctors}
                  className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <span>Explore Available Doctors</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
