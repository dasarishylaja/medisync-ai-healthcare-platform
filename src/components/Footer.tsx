import React from 'react';
import { Stethoscope, ShieldCheck, HeartHandshake, Database } from 'lucide-react';

interface FooterProps {
  onOpenBackendExplorer: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenBackendExplorer }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold">
                <Stethoscope className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">MediSync AI</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              AI-Powered smart healthcare appointment scheduling, conflict prevention, and patient flow coordination platform.
            </p>
            <div className="text-xs text-slate-500">
              Designed as a final-year academic healthcare informatics & software engineering project.
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Platform Capabilities</h4>
            <ul className="space-y-2 text-xs">
              <li>Intelligent Doctor Discovery</li>
              <li>Smart Conflict-Free Scheduling</li>
              <li>Waitlist & Slot Recovery Engine</li>
              <li>Queue & Wait-Time Estimation</li>
              <li>Clinical Workload Analytics</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">System Architecture</h4>
            <ul className="space-y-2 text-xs">
              <li>Python 3.10 + Flask Backend</li>
              <li>SQLAlchemy ORM + PostgreSQL/SQLite</li>
              <li>Role-Based Access Control (RBAC)</li>
              <li>Docker & Gunicorn Deployment</li>
              <li>
                <button 
                  onClick={onOpenBackendExplorer}
                  className="text-sky-400 hover:text-sky-300 transition-colors inline-flex items-center gap-1"
                >
                  <Database className="w-3 h-3" />
                  <span>Inspect Backend Architecture</span>
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Clinical Ethics & Trust</h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              MediSync AI coordinates clinical logistics and operational schedules. It does not provide medical diagnoses, prescribe drugs, or substitute for professional medical care.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Role-Based Access & Data Minimization Enforced</span>
            </div>
          </div>

        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} MediSync AI Platform. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span>·</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
            <span>·</span>
            <span className="hover:text-slate-400 cursor-pointer">HIPAA Preparedness Architecture</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
