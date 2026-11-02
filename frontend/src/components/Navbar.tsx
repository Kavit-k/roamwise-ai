import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, Sparkles, LogOut, User as UserIcon, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-brand-900 text-white flex items-center justify-center shadow-md shadow-brand-900/20 group-hover:scale-105 transition-transform duration-200">
            <Compass className="w-5 h-5 text-brand-300" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
              Roamwise <span className="text-xs font-semibold uppercase px-1.5 py-0.5 rounded bg-brand-100 text-brand-800">AI</span>
            </span>
            <p className="text-[10px] text-slate-600 hidden sm:block -mt-1 font-medium">Smart Travel Planning</p>
          </div>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link to="/#destinations" className="hover:text-brand-700 transition-colors">
            Destinations
          </Link>
          <Link to="/#how-it-works" className="hover:text-brand-700 transition-colors">
            How It Works
          </Link>
          <Link to="/#sample-preview" className="hover:text-brand-700 transition-colors">
            Sample Preview
          </Link>
          {user && (
            <Link to="/dashboard" className="text-brand-700 font-semibold hover:text-brand-800 transition-colors">
              My Saved Trips
            </Link>
          )}
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                to="/wizard"
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg bg-brand-700 text-white hover:bg-brand-800 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                Plan Trip
              </Link>
              <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 text-xs font-medium text-slate-700 hover:text-brand-700 py-1 px-2 rounded-md hover:bg-slate-100 transition-colors"
                >
                  <UserIcon className="w-4 h-4 text-slate-500" />
                  <span className="hidden lg:inline">{user.email?.split('@')[0]}</span>
                </Link>
                <button
                  onClick={handleSignOut}
                  title="Sign Out"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-2 text-sm font-medium text-slate-700 hover:text-brand-800 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/wizard"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-brand-900 text-white hover:bg-brand-800 shadow-sm shadow-brand-900/10 hover:shadow-md transition-all"
              >
                <Sparkles className="w-4 h-4 text-brand-300" />
                Plan My Trip
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
