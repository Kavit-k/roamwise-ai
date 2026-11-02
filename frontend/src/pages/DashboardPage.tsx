import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  Plus,
  Calendar,
  Users,
  Wallet,
  Trash2,
  ExternalLink,
  MapPin,
  AlertCircle,
  Loader2,
  Search,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import type { TripResponse } from '../types/trip';
import { DEMO_TRIPS } from '../lib/demoData';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const [trips, setTrips] = useState<TripResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [tripToDelete, setTripToDelete] = useState<TripResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTrips = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await api.listTrips();
      if (data && data.length > 0) {
        setTrips(data);
      } else {
        setTrips(DEMO_TRIPS);
      }
    } catch {
      // Graceful fallback for web demo
      setTrips(DEMO_TRIPS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleDeleteTrip = async () => {
    if (!tripToDelete) return;
    setDeleting(true);
    try {
      await api.deleteTrip(tripToDelete.id);
      setTrips((prev) => prev.filter((t) => t.id !== tripToDelete.id));
      setTripToDelete(null);
    } catch (err: any) {
      alert(`Error deleting trip: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const filteredTrips = trips.filter(
    (t) =>
      t.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Traveler';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-700">Trip Command Hub</span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Welcome, {userName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your AI-crafted journeys, customize daily schedules, and download travel briefs.
          </p>
        </div>
        <div>
          <Link
            to="/wizard"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-900 text-white font-semibold text-sm shadow-md shadow-brand-900/10 hover:bg-brand-800 transition-all"
          >
            <Plus className="w-4 h-4 text-brand-300" />
            <span>Create New Trip</span>
          </Link>
        </div>
      </div>

      {/* Search & Counter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search saved trips..."
            className="w-full pl-9 pr-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 bg-white"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Showing <b>{filteredTrips.length}</b> of <b>{trips.length}</b> trips
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start justify-between gap-3 text-xs text-rose-800">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Unable to fetch saved trips</p>
              <p className="mt-0.5 text-rose-700">{errorMsg}</p>
            </div>
          </div>
          <button
            onClick={fetchTrips}
            className="px-3 py-1 bg-white border border-rose-300 rounded-lg text-rose-800 font-semibold hover:bg-rose-100"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm animate-pulse space-y-4">
              <div className="h-5 bg-slate-200 rounded w-3/4"></div>
              <div className="h-4 bg-slate-100 rounded w-1/2"></div>
              <div className="space-y-2 pt-4">
                <div className="h-3 bg-slate-100 rounded w-full"></div>
                <div className="h-3 bg-slate-100 rounded w-4/5"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredTrips.length === 0 ? (
        /* Empty State */
        <div className="text-center py-16 px-4 bg-white rounded-3xl border border-dashed border-slate-200 shadow-subtle max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-700 mx-auto flex items-center justify-center mb-4">
            <Compass className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No saved itineraries found</h3>
          <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
            {searchQuery
              ? `No itineraries matched your search for "${searchQuery}".`
              : 'You have not generated any trips yet. Use the smart trip wizard to generate your first personalized itinerary!'}
          </p>
          <div className="mt-6">
            <Link
              to="/wizard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-700 text-white font-semibold text-xs hover:bg-brand-800 shadow-sm transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Plan Your First Trip</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Trips Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrips.map((trip) => (
            <div
              key={trip.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-card hover:shadow-floating transition-all duration-300 flex flex-col justify-between overflow-hidden"
            >
              <div className="p-6">
                {/* Header: Destination badge & status */}
                <div className="flex items-center justify-between mb-3">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-brand-50 text-brand-800 text-[11px] font-semibold">
                    <MapPin className="w-3 h-3 text-brand-600" />
                    <span>{trip.destination}, {trip.country}</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {trip.status}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-slate-900 line-clamp-1 hover:text-brand-700 transition-colors">
                  <Link to={`/trips/${trip.id}`}>{trip.title}</Link>
                </h3>

                {/* Metadata */}
                <div className="mt-4 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Dates</span>
                    </span>
                    <span className="font-medium text-slate-800">
                      {trip.start_date} to {trip.end_date}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Users className="w-3.5 h-3.5" />
                      <span>Travelers</span>
                    </span>
                    <span className="font-medium text-slate-800">
                      {trip.travelers} {trip.travelers === 1 ? 'person' : 'people'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Wallet className="w-3.5 h-3.5" />
                      <span>Budget</span>
                    </span>
                    <span className="font-semibold text-brand-800">
                      {trip.budget.toLocaleString()} {trip.currency}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setTripToDelete(trip)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Delete trip"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <Link
                  to={`/trips/${trip.id}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand-700 hover:bg-brand-800 text-white text-xs font-semibold transition-all shadow-sm"
                >
                  <span>Open Itinerary</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {tripToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white max-w-sm w-full rounded-2xl p-6 shadow-floating border border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Delete Trip?</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Are you sure you want to permanently delete <b>"{tripToDelete.title}"</b>? This action cannot be undone.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setTripToDelete(null)}
                disabled={deleting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTrip}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Confirm Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
