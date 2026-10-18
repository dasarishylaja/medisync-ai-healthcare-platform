import React, { useState } from 'react';
import { User, UserRole, DoctorProfile, Appointment } from './types';
import { api } from './services/api';
import { DEMO_USERS } from './data/mockData';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './components/LandingPage';
import { PatientDashboard } from './components/PatientDashboard';
import { DoctorDashboard } from './components/DoctorDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { BookingModal } from './components/BookingModal';
import { QueueModal } from './components/QueueModal';
import { RescheduleModal } from './components/RescheduleModal';
import { WaitlistModal } from './components/WaitlistModal';
import { AuthModal } from './components/AuthModal';
import { BackendExplorerModal } from './components/BackendExplorerModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(api.currentUser);
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'doctors'>('landing');
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Modals state
  const [bookingDoctor, setBookingDoctor] = useState<{ doctor: DoctorProfile; initialDate?: string } | null>(null);
  const [queueAppointment, setQueueAppointment] = useState<Appointment | null>(null);
  const [rescheduleAppointment, setRescheduleAppointment] = useState<Appointment | null>(null);
  const [waitlistTarget, setWaitlistTarget] = useState<{ doctor: DoctorProfile; date?: string } | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);
  const [backendExplorerOpen, setBackendExplorerOpen] = useState<boolean>(false);

  // Success Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleSwitchRole = (role: UserRole) => {
    const targetUser = DEMO_USERS[role];
    api.setCurrentUser(targetUser);
    setCurrentUser(targetUser);
    setCurrentView('dashboard');
    showToast(`Switched to ${role.toUpperCase()} perspective (${targetUser.full_name})`);
    handleRefresh();
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('landing');
    showToast("Signed out successfully.");
  };

  const handleBookingSuccess = (app: Appointment) => {
    setBookingDoctor(null);
    showToast(`Appointment confirmed! Booking Reference: ${app.booking_reference}`);
    setCurrentView('dashboard');
    handleRefresh();
  };

  const handleQueueOpen = (app: Appointment) => {
    setQueueAppointment(app);
  };

  const handleRescheduleSuccess = (updated: Appointment) => {
    setRescheduleAppointment(null);
    showToast(`Appointment rescheduled to ${updated.appointment_date} at ${updated.start_time}`);
    handleRefresh();
  };

  const handleWaitlistSuccess = () => {
    setWaitlistTarget(null);
    showToast("Added to physician's priority waitlist. You will be notified when a slot opens.");
    handleRefresh();
  };

  const unreadCount = currentUser 
    ? api.notifications.filter(n => n.user_id === currentUser.id && !n.is_read).length 
    : 0;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 selection:bg-sky-500 selection:text-white">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-xl border border-slate-800 flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        currentUser={currentUser}
        onNavigate={(view) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAuth={(mode) => setAuthMode(mode)}
        onSwitchRole={handleSwitchRole}
        onLogout={handleLogout}
        onOpenBackendExplorer={() => setBackendExplorerOpen(true)}
        unreadCount={unreadCount}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {currentView === 'landing' && (
          <LandingPage
            onFindDoctors={() => {
              if (currentUser) {
                setCurrentView('dashboard');
              } else {
                handleSwitchRole('patient');
              }
            }}
            onGetStarted={() => {
              if (currentUser) {
                setCurrentView('dashboard');
              } else {
                setAuthMode('register');
              }
            }}
            onSelectDemoRole={(role) => handleSwitchRole(role)}
          />
        )}

        {currentView === 'doctors' && (
          <div className="py-6">
            <PatientDashboard
              user={currentUser || DEMO_USERS.patient}
              onBookDoctor={(doc, date) => setBookingDoctor({ doctor: doc, initialDate: date })}
              onOpenQueue={handleQueueOpen}
              onReschedule={(app) => setRescheduleAppointment(app)}
              onCancelSuccess={handleRefresh}
              refreshTrigger={refreshTrigger}
            />
          </div>
        )}

        {currentView === 'dashboard' && currentUser && (
          <div>
            {currentUser.role === 'patient' && (
              <PatientDashboard
                user={currentUser}
                onBookDoctor={(doc, date) => setBookingDoctor({ doctor: doc, initialDate: date })}
                onOpenQueue={handleQueueOpen}
                onReschedule={(app) => setRescheduleAppointment(app)}
                onCancelSuccess={handleRefresh}
                refreshTrigger={refreshTrigger}
              />
            )}

            {currentUser.role === 'doctor' && (
              <DoctorDashboard
                user={currentUser}
                refreshTrigger={refreshTrigger}
                onRefresh={handleRefresh}
              />
            )}

            {currentUser.role === 'admin' && (
              <AdminDashboard
                user={currentUser}
                refreshTrigger={refreshTrigger}
                onRefresh={handleRefresh}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer onOpenBackendExplorer={() => setBackendExplorerOpen(true)} />

      {/* Modals */}
      {bookingDoctor && (
        <BookingModal
          doctor={bookingDoctor.doctor}
          initialDate={bookingDoctor.initialDate}
          onClose={() => setBookingDoctor(null)}
          onSuccess={handleBookingSuccess}
          onJoinWaitlist={(doc, date) => {
            setBookingDoctor(null);
            setWaitlistTarget({ doctor: doc, date });
          }}
        />
      )}

      {queueAppointment && (
        <QueueModal
          appointment={queueAppointment}
          estimation={api.getQueueEstimation(queueAppointment.id)}
          onClose={() => setQueueAppointment(null)}
          onRefresh={() => handleRefresh()}
        />
      )}

      {rescheduleAppointment && (
        <RescheduleModal
          appointment={rescheduleAppointment}
          onClose={() => setRescheduleAppointment(null)}
          onSuccess={handleRescheduleSuccess}
        />
      )}

      {waitlistTarget && (
        <WaitlistModal
          doctor={waitlistTarget.doctor}
          initialDate={waitlistTarget.date}
          onClose={() => setWaitlistTarget(null)}
          onSuccess={handleWaitlistSuccess}
        />
      )}

      {authMode && (
        <AuthModal
          initialMode={authMode}
          onClose={() => setAuthMode(null)}
          onSuccess={(u) => {
            setCurrentUser(u);
            setAuthMode(null);
            setCurrentView('dashboard');
            showToast(`Welcome back, ${u.first_name}!`);
            handleRefresh();
          }}
        />
      )}

      {backendExplorerOpen && (
        <BackendExplorerModal
          onClose={() => setBackendExplorerOpen(false)}
        />
      )}

    </div>
  );
}
