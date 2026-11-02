import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ShieldCheck, Cpu, Database } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-700 text-white flex items-center justify-center">
                <Compass className="w-4 h-4 text-brand-200" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">Roamwise AI</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Curating practical, budget-conscious, personalized travel itineraries using high-speed Groq LLMs and modern PostgreSQL.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">Quick Navigation</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link to="/#destinations" className="hover:text-white transition-colors">Destinations</Link></li>
              <li><Link to="/#how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
              <li><Link to="/wizard" className="hover:text-white transition-colors">Trip Planning Wizard</Link></li>
              <li><Link to="/dashboard" className="hover:text-white transition-colors">Saved Trips Hub</Link></li>
            </ul>
          </div>

          {/* Tech Stack Callout */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">Architecture</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-brand-400" />
                <span>Groq LPU LLM Engine</span>
              </li>
              <li className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>Supabase PostgreSQL & RLS</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>ReportLab Vector PDF Export</span>
              </li>
            </ul>
          </div>

          {/* Factual Disclaimer */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">Important Notice</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
              Roamwise AI provides AI-generated estimates for budgeting and inspiration. Opening hours, transit schedules, and prices must be verified prior to booking travel.
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>&copy; {new Date().getFullYear()} Roamwise AI. Built with precision and care.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Powered by Groq Cloud</span>
            <span>&bull;</span>
            <span>Supabase Auth & RLS</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
