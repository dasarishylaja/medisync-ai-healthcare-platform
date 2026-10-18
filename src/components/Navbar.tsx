import React from 'react';
import { User, UserRole } from '../types';
import { Stethoscope, Bell, LogOut, Code2, ShieldAlert } from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  onNavigate: (view: 'landing' | 'dashboard' | 'doctors') => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onSwitchRole: (role: UserRole) => void;
  onLogout: () => void;
  onOpenBackendExplorer: () => void;
  unreadCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onNavigate,
  onOpenAuth,
  onSwitchRole,
  onLogout,
  onOpenBackendExplorer,
  unreadCount
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        
        {/* Zone 1: Brand Wordmark (Clean single-element) */}
        <button
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2.5 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-lg py-1 px-1.5 -ml-1.5"
        >
          <div className="w-9 h-9 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold shadow-sm transition-transform group-hover:scale-105">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
            MediSync <span className="text-sky-600">AI</span>
          </span>
        </button>

        {/* Zone 2: Navigation Links (4-5 single-line clean text links) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button 
            onClick={() => onNavigate('landing')} 
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
          >
            Home
          </button>
          <button 
            onClick={() => onNavigate('doctors')} 
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
          >
            Find Doctors
          </button>
          {currentUser && (
            <button 
              onClick={() => onNavigate('dashboard')} 
              className="hover:text-slate-900 transition-colors font-semibold text-sky-600 whitespace-nowrap shrink-0"
            >
              My Dashboard
            </button>
          )}
          <button 
            onClick={onOpenBackendExplorer} 
            className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 font-mono text-xs bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-md"
            title="Inspect Python Flask backend, Mermaid ER diagrams, and tests"
          >
            <Code2 className="w-3.5 h-3.5 text-sky-600" />
            <span>Python Backend & Architecture</span>
          </button>
        </nav>

        {/* Zone 3: Primary Action / User Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {currentUser ? (
            <div className="flex items-center gap-3">
              {/* Demo Role Switcher Segmented Control */}
              <div className="hidden lg:flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-600">
                <button
                  onClick={() => onSwitchRole('patient')}
                  className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${
                    currentUser.role === 'patient' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'hover:text-slate-900'
                  }`}
                >
                  Patient Mode
                </button>
                <button
                  onClick={() => onSwitchRole('doctor')}
                  className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${
                    currentUser.role === 'doctor' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'hover:text-slate-900'
                  }`}
                >
                  Doctor Mode
                </button>
                <button
                  onClick={() => onSwitchRole('admin')}
                  className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${
                    currentUser.role === 'admin' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'hover:text-slate-900'
                  }`}
                >
                  Admin Mode
                </button>
              </div>

              {/* Notification icon */}
              <button
                onClick={() => onNavigate('dashboard')}
                className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                title={`${unreadCount} notifications`}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
                )}
              </button>

              {/* User profile capsule */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-slate-900 leading-tight">
                    {currentUser.first_name} {currentUser.last_name}
                  </div>
                  <div className="text-[11px] text-slate-500 capitalize leading-tight">
                    {currentUser.role}
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Log In
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors shadow-sm whitespace-nowrap shrink-0"
              >
                Get Started
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
