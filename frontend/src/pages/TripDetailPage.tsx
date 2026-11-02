import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Download,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Calendar,
  Users,
  Wallet,
  Clock,
  MapPin,
  Lightbulb,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Building,
  Shield,
  Briefcase,
  Loader2,
} from 'lucide-react';
import { api } from '../lib/api';
import type { TripResponse, Activity } from '../types/trip';
import { DEMO_TRIPS } from '../lib/demoData';
import { ActivityModal } from '../components/ActivityModal';
import { RegenerateDayModal } from '../components/RegenerateDayModal';

export const TripDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [trip, setTrip] = useState<TripResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeDayNumber, setActiveDayNumber] = useState(1);
  const [activeTab, setActiveTab] = useState<'itinerary' | 'accommodations' | 'guidance'>('itinerary');

  // Modals state
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [isRegenDayModalOpen, setIsRegenDayModalOpen] = useState(false);
  const [isRegeneratingDay, setIsRegeneratingDay] = useState(false);
  const [isRegenAllModalOpen, setIsRegenAllModalOpen] = useState(false);
  const [isRegeneratingAll, setIsRegeneratingAll] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const fetchTrip = async () => {
    if (!id) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await api.getTrip(id);
      setTrip(data);
    } catch {
      // Check if generated during this web session
      const savedSession = sessionStorage.getItem(id);
      if (savedSession) {
        try {
          setTrip(JSON.parse(savedSession));
          return;
        } catch {
          // ignore parse error
        }
      }
      // Graceful fallback for web demo
      const fallback = DEMO_TRIPS.find((t) => t.id === id) || DEMO_TRIPS[0];
      setTrip(fallback);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrip();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-700 animate-spin" />
          <p className="text-sm font-medium text-slate-500">Loading your customized itinerary...</p>
        </div>
      </div>
    );
  }

  if (errorMsg || !trip || !trip.itinerary) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Trip Not Available</h2>
        <p className="text-xs text-slate-500 mt-2">{errorMsg || 'Could not load itinerary data.'}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            to="/dashboard"
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
          >
            Go to Dashboard
          </Link>
          <button
            onClick={fetchTrip}
            className="px-4 py-2 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { itinerary } = trip;
  const days = itinerary.days || [];
  const currentDay = days.find((d) => d.day_number === activeDayNumber) || days[0];
  const b = itinerary.budget_breakdown;

  // Handlers for Activity Management
  const handleOpenAddActivity = () => {
    setEditingActivity(null);
    setIsActivityModalOpen(true);
  };

  const handleOpenEditActivity = (act: Activity) => {
    setEditingActivity(act);
    setIsActivityModalOpen(true);
  };

  const handleSaveActivity = async (activity: Activity) => {
    if (!id) return;
    try {
      let updated: TripResponse;
      if (editingActivity) {
        updated = await api.updateActivity(id, activeDayNumber, editingActivity.id, activity);
      } else {
        updated = await api.addActivity(id, activeDayNumber, activity);
      }
      setTrip(updated);
    } catch (err: any) {
      alert(`Error saving activity: ${err.message}`);
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!id) return;
    if (!confirm('Are you sure you want to remove this activity from the day?')) return;
    try {
      const updated = await api.deleteActivity(id, activeDayNumber, activityId);
      setTrip(updated);
    } catch (err: any) {
      alert(`Error deleting activity: ${err.message}`);
    }
  };

  const handleMoveActivity = async (slotActivities: Activity[], index: number, direction: 'up' | 'down') => {
    if (!id || !currentDay) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= slotActivities.length) return;

    // Swap
    const newSlotList = [...slotActivities];
    const temp = newSlotList[index];
    newSlotList[index] = newSlotList[targetIdx];
    newSlotList[targetIdx] = temp;

    // Combine all activities in order: morning, afternoon, evening
    let allIds: string[] = [];
    if (temp.time_slot === 'morning') {
      allIds = [
        ...newSlotList.map((a) => a.id),
        ...currentDay.afternoon.map((a) => a.id),
        ...currentDay.evening.map((a) => a.id),
      ];
    } else if (temp.time_slot === 'afternoon') {
      allIds = [
        ...currentDay.morning.map((a) => a.id),
        ...newSlotList.map((a) => a.id),
        ...currentDay.evening.map((a) => a.id),
      ];
    } else {
      allIds = [
        ...currentDay.morning.map((a) => a.id),
        ...currentDay.afternoon.map((a) => a.id),
        ...newSlotList.map((a) => a.id),
      ];
    }

    try {
      const updated = await api.reorderActivities(id, activeDayNumber, allIds);
      setTrip(updated);
    } catch (err: any) {
      alert(`Error reordering activities: ${err.message}`);
    }
  };

  // Handlers for Regeneration
  const handleRegenerateDay = async (instructions: string) => {
    if (!id) return;
    setIsRegeneratingDay(true);
    try {
      const updated = await api.regenerateDay(id, activeDayNumber, instructions);
      setTrip(updated);
    } catch (err: any) {
      alert(`Failed to regenerate Day ${activeDayNumber}: ${err.message}`);
    } finally {
      setIsRegeneratingDay(false);
    }
  };

  const handleRegenerateAll = async () => {
    if (!id) return;
    setIsRegeneratingAll(true);
    try {
      const updated = await api.regenerateAll(id);
      setTrip(updated);
      setIsRegenAllModalOpen(false);
    } catch (err: any) {
      alert(`Failed to regenerate itinerary: ${err.message}`);
    } finally {
      setIsRegeneratingAll(false);
    }
  };

  // PDF Export Download
  const handleExportPdf = async () => {
    if (!id) return;
    setIsExportingPdf(true);
    try {
      const filename = `roamwise-${trip.destination.toLowerCase().replace(/\s+/g, '-')}-itinerary.pdf`;
      await api.downloadPdf(id, filename);
    } catch (err: any) {
      alert(`PDF download failed: ${err.message}`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. TOP HEADER & PRIMARY ACTIONS */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-brand-50 text-brand-800">
                AI Verified Plan
              </span>
              <span className="text-xs text-slate-400">&bull;</span>
              <span className="text-xs text-slate-500 font-medium">
                {trip.destination}, {trip.country}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {itinerary.title}
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
              {itinerary.summary}
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsRegenAllModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Regenerate Entire Trip</span>
            </button>

            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="px-5 py-2.5 rounded-xl bg-brand-900 text-white text-xs font-bold hover:bg-brand-800 shadow-sm flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-brand-300" />
                  Export Vector PDF
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Metadata Bar */}
        <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="flex items-center gap-2.5 text-slate-600">
            <Calendar className="w-4 h-4 text-brand-700 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">Dates</span>
              <span className="font-medium text-slate-800">{trip.start_date} to {trip.end_date}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-slate-600">
            <Users className="w-4 h-4 text-brand-700 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">Travelers</span>
              <span className="font-medium text-slate-800">{trip.travelers} Traveler(s) &bull; {itinerary.travel_type}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-slate-600">
            <Wallet className="w-4 h-4 text-brand-700 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">Target Budget</span>
              <span className="font-bold text-brand-900">{b.user_budget.toLocaleString()} {b.currency}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-slate-600">
            <Clock className="w-4 h-4 text-brand-700 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">Pace</span>
              <span className="font-medium text-slate-800 capitalize">{trip.preferences?.pace || 'Balanced'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. LIVE BUDGET REBALANCER BAR */}
      <div className="bg-sand-50/90 rounded-3xl p-6 border border-sand-200/80 shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${b.is_within_budget ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Estimated Expenses: {b.estimated_total.toLocaleString()} {b.currency}
              </h3>
              <p className="text-xs text-slate-500">
                {b.is_within_budget
                  ? `On track — ${Math.abs(b.budget_difference).toLocaleString()} ${b.currency} cushion remaining within your budget`
                  : `Over budget by ${Math.abs(b.budget_difference).toLocaleString()} ${b.currency}`}
              </p>
            </div>
          </div>

          <span
            className={`text-xs font-bold px-3 py-1 rounded-full ${
              b.is_within_budget
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-amber-100 text-amber-800 border border-amber-200'
            }`}
          >
            {b.is_within_budget ? 'Within Budget' : 'Exceeds Budget'}
          </span>
        </div>

        {/* Categories Pill Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs pt-2">
          <div className="p-2.5 bg-white rounded-xl border border-slate-200/60">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Lodging</span>
            <p className="font-bold text-slate-800 mt-0.5">{b.accommodation.toLocaleString()} {b.currency}</p>
          </div>
          <div className="p-2.5 bg-white rounded-xl border border-slate-200/60">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Food & Dining</span>
            <p className="font-bold text-slate-800 mt-0.5">{b.food.toLocaleString()} {b.currency}</p>
          </div>
          <div className="p-2.5 bg-white rounded-xl border border-slate-200/60">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Local Transit</span>
            <p className="font-bold text-slate-800 mt-0.5">{b.transportation.toLocaleString()} {b.currency}</p>
          </div>
          <div className="p-2.5 bg-white rounded-xl border border-slate-200/60">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Activities (Live)</span>
            <p className="font-bold text-brand-800 mt-0.5">{b.activities.toLocaleString()} {b.currency}</p>
          </div>
          <div className="p-2.5 bg-white rounded-xl border border-slate-200/60">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Misc Buffer</span>
            <p className="font-bold text-slate-800 mt-0.5">{b.miscellaneous.toLocaleString()} {b.currency}</p>
          </div>
        </div>

        {b.budget_notes && (
          <p className="text-xs text-slate-600 bg-white/70 p-3 rounded-xl border border-slate-200/50">
            <b>Financial Guidance:</b> {b.budget_notes}
          </p>
        )}
      </div>

      {/* 3. TABS: Itinerary vs Accommodations vs Guidance */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('itinerary')}
          className={`pb-3 px-4 transition-all relative ${
            activeTab === 'itinerary'
              ? 'text-brand-900 border-b-2 border-brand-900'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Day-by-Day Itinerary ({days.length} Days)
        </button>
        <button
          onClick={() => setActiveTab('accommodations')}
          className={`pb-3 px-4 transition-all relative ${
            activeTab === 'accommodations'
              ? 'text-brand-900 border-b-2 border-brand-900'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Accommodations & Neighborhoods ({itinerary.accommodations?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('guidance')}
          className={`pb-3 px-4 transition-all relative ${
            activeTab === 'guidance'
              ? 'text-brand-900 border-b-2 border-brand-900'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Practical Guidance & Tips
        </button>
      </div>

      {/* 4. TAB CONTENT: ITINERARY */}
      {activeTab === 'itinerary' && (
        <div className="space-y-6">
          {/* Day Selector Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {days.map((day) => (
              <button
                key={day.day_number}
                onClick={() => setActiveDayNumber(day.day_number)}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                  activeDayNumber === day.day_number
                    ? 'bg-brand-900 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>Day {day.day_number}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${activeDayNumber === day.day_number ? 'bg-brand-800 text-brand-200' : 'bg-slate-100 text-slate-500'}`}>
                  {day.date}
                </span>
              </button>
            ))}
          </div>

          {/* Current Day Header Card */}
          {currentDay && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-700">
                      Day {currentDay.day_number} &bull; {currentDay.date}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                    {currentDay.theme}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsRegenDayModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-brand-50 hover:text-brand-800 text-slate-700 text-xs font-semibold transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                    <span>Regenerate Day {currentDay.day_number}</span>
                  </button>

                  <button
                    onClick={handleOpenAddActivity}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-700 text-white text-xs font-semibold hover:bg-brand-800 transition-colors shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Activity</span>
                  </button>
                </div>
              </div>

              {/* Day Logistics: Meals & Transit */}
              {(currentDay.meals || currentDay.transport_advice || currentDay.practical_notes) && (
                <div className="p-4 bg-sand-50/80 rounded-2xl border border-sand-200/70 text-xs space-y-2">
                  {currentDay.meals && (
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-slate-700 shrink-0">Dining Suggestions:</span>
                      <span className="text-slate-600">
                        {[
                          currentDay.meals.breakfast && `Breakfast: ${currentDay.meals.breakfast}`,
                          currentDay.meals.lunch && `Lunch: ${currentDay.meals.lunch}`,
                          currentDay.meals.dinner && `Dinner: ${currentDay.meals.dinner}`,
                        ]
                          .filter(Boolean)
                          .join(' • ')}
                      </span>
                    </div>
                  )}
                  {currentDay.transport_advice && (
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-slate-700 shrink-0">Transit Advice:</span>
                      <span className="text-slate-600">{currentDay.transport_advice}</span>
                    </div>
                  )}
                  {currentDay.practical_notes && (
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-slate-700 shrink-0">Practical Tip:</span>
                      <span className="text-slate-600">{currentDay.practical_notes}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Day Activities Grouped by Slot */}
              {(['morning', 'afternoon', 'evening'] as const).map((slot) => {
                const activities = currentDay[slot] || [];
                const slotTitle = slot.charAt(0).toUpperCase() + slot.slice(1);
                const slotBadgeColor =
                  slot === 'morning'
                    ? 'bg-amber-100/80 text-amber-900 border-amber-200'
                    : slot === 'afternoon'
                    ? 'bg-sky-100/80 text-sky-900 border-sky-200'
                    : 'bg-indigo-100/80 text-indigo-900 border-indigo-200';

                return (
                  <div key={slot} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full border ${slotBadgeColor}`}>
                        {slotTitle}
                      </span>
                      <span className="text-xs text-slate-400">
                        {activities.length} {activities.length === 1 ? 'activity' : 'activities'}
                      </span>
                    </div>

                    {activities.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-2 pl-3">
                        No activities scheduled for this time slot. Use "Add Activity" to plan something.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {activities.map((act, index) => (
                          <div
                            key={act.id}
                            className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 hover:border-slate-300 hover:shadow-subtle transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                          >
                            <div className="space-y-1.5 flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-slate-900">{act.title}</h4>
                                {act.category && (
                                  <span className="text-[10px] uppercase font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                                    {act.category}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-600 leading-relaxed">{act.description}</p>

                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-[11px] text-slate-500">
                                {act.start_time && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    <span>{act.start_time}</span>
                                    {act.duration_mins && <span>({act.duration_mins}m)</span>}
                                  </span>
                                )}
                                {act.location_hint && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-slate-400" />
                                    <span>{act.location_hint}</span>
                                  </span>
                                )}
                                {act.practical_tips && (
                                  <span className="flex items-center gap-1 text-amber-700">
                                    <Lightbulb className="w-3 h-3" />
                                    <span>{act.practical_tips}</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Right side: Cost & Controls */}
                            <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200/60">
                              <span className="text-xs font-bold text-brand-800 bg-brand-50 px-2.5 py-1 rounded-md">
                                {act.estimated_cost > 0
                                  ? `${act.estimated_cost.toLocaleString()} ${b.currency}`
                                  : 'Free / Included'}
                              </span>

                              {/* Controls */}
                              <div className="flex items-center gap-1 text-slate-400">
                                <button
                                  onClick={() => handleMoveActivity(activities, index, 'up')}
                                  disabled={index === 0}
                                  title="Move Up"
                                  className="p-1 hover:text-slate-700 hover:bg-slate-200/60 rounded disabled:opacity-20"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleMoveActivity(activities, index, 'down')}
                                  disabled={index === activities.length - 1}
                                  title="Move Down"
                                  className="p-1 hover:text-slate-700 hover:bg-slate-200/60 rounded disabled:opacity-20"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleOpenEditActivity(act)}
                                  title="Edit Activity"
                                  className="p-1 hover:text-brand-700 hover:bg-brand-50 rounded"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteActivity(act.id)}
                                  title="Delete Activity"
                                  className="p-1 hover:text-rose-600 hover:bg-rose-50 rounded"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. TAB CONTENT: ACCOMMODATIONS */}
      {activeTab === 'accommodations' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {itinerary.accommodations && itinerary.accommodations.length > 0 ? (
            itinerary.accommodations.map((acc, i) => (
              <div key={i} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center mb-4">
                    <Building className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{acc.category}</span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">{acc.area_name}</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">{acc.reason}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Est. Nightly Rate:</span>
                    <span className="font-bold text-brand-900">
                      {acc.estimated_nightly_price.toLocaleString()} {acc.currency || b.currency}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 bg-sand-50 p-2.5 rounded-xl border border-sand-200/50">
                    <b>Tip:</b> {acc.booking_tips}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500">No neighborhood recommendations available.</p>
          )}
        </div>
      )}

      {/* 6. TAB CONTENT: PRACTICAL GUIDANCE */}
      {activeTab === 'guidance' && itinerary.guidance && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Transit */}
            <div className="p-5 rounded-2xl bg-sand-50/80 border border-sand-200/70 space-y-2">
              <div className="flex items-center gap-2 text-brand-900 font-bold text-sm">
                <Briefcase className="w-4 h-4 text-brand-700" />
                <span>Local Transportation</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{itinerary.guidance.local_transport}</p>
            </div>

            {/* Packing */}
            <div className="p-5 rounded-2xl bg-sand-50/80 border border-sand-200/70 space-y-2">
              <div className="flex items-center gap-2 text-brand-900 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-brand-700" />
                <span>Packing Essentials</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {itinerary.guidance.packing_list?.map((item, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-md bg-white border border-sand-200 text-slate-700">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Safety */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-600" />
                Safety & Health Considerations
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-600 list-disc list-inside">
                {itinerary.guidance.safety_tips?.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>

            {/* Reminders */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-brand-700" />
                Important Reminders & Customs
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-600 list-disc list-inside">
                {itinerary.guidance.important_reminders?.map((rem, i) => (
                  <li key={i}>{rem}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 7. FACTUAL LIMITATION DISCLAIMER FOOTER */}
      <div className="p-4 rounded-2xl bg-slate-100 text-slate-500 text-[11px] leading-relaxed border border-slate-200/80 flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <span>
          <b>Factual Disclosure:</b> {itinerary.disclaimer} {itinerary.guidance?.unverified_details_disclaimer}
        </span>
      </div>

      {/* MODALS */}
      <ActivityModal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        onSave={handleSaveActivity}
        initialActivity={editingActivity}
        dayNumber={activeDayNumber}
        currency={b.currency}
      />

      <RegenerateDayModal
        isOpen={isRegenDayModalOpen}
        onClose={() => setIsRegenDayModalOpen(false)}
        onConfirm={handleRegenerateDay}
        dayNumber={activeDayNumber}
        dayTheme={currentDay?.theme || ''}
        isRegenerating={isRegeneratingDay}
      />

      {/* Regenerate All Confirmation Modal */}
      {isRegenAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-floating border border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Regenerate Entire Itinerary?</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              This will request Groq to regenerate the entire {itinerary.days_count}-day itinerary using your original trip preferences. Any custom activity edits made to this trip will be replaced.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsRegenAllModalOpen(false)}
                disabled={isRegeneratingAll}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRegenerateAll}
                disabled={isRegeneratingAll}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-brand-700 hover:bg-brand-800 text-white shadow-sm transition-all disabled:opacity-50"
              >
                {isRegeneratingAll ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  'Confirm & Regenerate'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
