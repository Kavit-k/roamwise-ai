import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  ArrowLeft,
  Calendar,
  Users,
  Wallet,
  Sparkles,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sliders,
  DollarSign,
  Info,
} from 'lucide-react';
import { api } from '../lib/api';
import type { TripCreateRequest } from '../types/trip';

const INTERESTS_OPTIONS = [
  { id: 'culture', label: 'Culture & History', emoji: '🏛️' },
  { id: 'food', label: 'Food & Culinary', emoji: '🍜' },
  { id: 'nature', label: 'Nature & Scenery', emoji: '🌲' },
  { id: 'adventure', label: 'Adventure & Outdoors', emoji: '🧗' },
  { id: 'relaxation', label: 'Relaxation & Wellness', emoji: '🧖' },
  { id: 'shopping', label: 'Shopping & Boutiques', emoji: '🛍️' },
  { id: 'nightlife', label: 'Nightlife & Lounges', emoji: '🍸' },
  { id: 'art', label: 'Art & Museums', emoji: '🎨' },
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF'];

export const WizardPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = (location.state as any)?.prefill || {};

  // Stepper state (1 through 6)
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Step 1: Destination
  const [destination, setDestination] = useState(prefill.destination || '');
  const [country, setCountry] = useState(prefill.country || '');

  // Step 2: Dates
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const fiveDaysLater = new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(tomorrow);
  const [endDate, setEndDate] = useState(fiveDaysLater);

  // Step 3: Travelers
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [travelType, setTravelType] = useState<'solo' | 'couple' | 'family' | 'friends' | 'business'>('couple');

  // Step 4: Budget
  const [totalBudget, setTotalBudget] = useState(2500);
  const [currency, setCurrency] = useState('USD');
  const [budgetTier, setBudgetTier] = useState<'budget' | 'moderate' | 'luxury'>(prefill.budget_tier || 'moderate');

  // Step 5: Preferences
  const [interests, setInterests] = useState<string[]>(['culture', 'food']);
  const [pace, setPace] = useState<'relaxed' | 'balanced' | 'packed'>('balanced');
  const [transportPreference, setTransportPreference] = useState('public_transit');
  const [accommodationType, setAccommodationType] = useState('mid-range');
  const [dietaryRequirements, setDietaryRequirements] = useState('');
  const [accessibilityRequirements, setAccessibilityRequirements] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Duration calculation
  const calculateDays = () => {
    if (!startDate || !endDate) return 1;
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diff = Math.round((e.getTime() - s.getTime()) / (1000 * 3600 * 24)) + 1;
    return diff > 0 ? diff : 0;
  };

  const tripDays = calculateDays();

  // Step Validation
  const validateCurrentStep = (): boolean => {
    setErrorMsg('');
    if (currentStep === 1) {
      if (!destination.trim() || !country.trim()) {
        setErrorMsg('Please specify both destination city/region and country.');
        return false;
      }
    } else if (currentStep === 2) {
      if (!startDate || !endDate) {
        setErrorMsg('Please select both start and end dates.');
        return false;
      }
      if (new Date(endDate) < new Date(startDate)) {
        setErrorMsg('End date cannot be earlier than start date.');
        return false;
      }
      if (tripDays > 30) {
        setErrorMsg('Maximum supported trip duration is 30 days for quality day-by-day generation.');
        return false;
      }
    } else if (currentStep === 3) {
      if (adults < 1) {
        setErrorMsg('There must be at least 1 adult traveler.');
        return false;
      }
    } else if (currentStep === 4) {
      if (totalBudget <= 0) {
        setErrorMsg('Please enter a total budget greater than zero.');
        return false;
      }
    } else if (currentStep === 5) {
      if (interests.length === 0) {
        setErrorMsg('Please choose at least one interest to help personalize your days.');
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, 6));
    }
  };

  const prevStep = () => {
    setErrorMsg('');
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const toggleInterest = (id: string) => {
    setInterests((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleGenerateItinerary = async () => {
    if (!validateCurrentStep()) return;
    setLoading(true);
    setErrorMsg('');

    const payload: TripCreateRequest = {
      destination: destination.trim(),
      country: country.trim(),
      start_date: startDate,
      end_date: endDate,
      adults: Number(adults),
      children: Number(children),
      travel_type: travelType,
      total_budget: Number(totalBudget),
      currency,
      preferences: {
        interests,
        pace,
        transport_preference: transportPreference,
        accommodation_type: accommodationType,
        dietary_requirements: dietaryRequirements.trim() || undefined,
        accessibility_requirements: accessibilityRequirements.trim() || undefined,
        additional_notes: additionalNotes.trim() || undefined,
        budget_tier: budgetTier,
      },
    };

    try {
      const trip = await api.createTrip(payload);
      navigate(`/trips/${trip.id}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate itinerary. Please try again.');
      setLoading(false);
    }
  };

  const stepLabels = [
    'Destination',
    'Dates',
    'Travelers',
    'Budget',
    'Preferences',
    'Review',
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Wizard Header & Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
          <span>Step {currentStep} of 6: {stepLabels[currentStep - 1]}</span>
          <span>{Math.round((currentStep / 6) * 100)}% Complete</span>
        </div>
        {/* Progress bar track */}
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-700 transition-all duration-300 ease-out rounded-full"
            style={{ width: `${(currentStep / 6) * 100}%` }}
          />
        </div>

        {/* Stepper Breadcrumb Dots */}
        <div className="hidden sm:flex items-center justify-between mt-3 text-xs text-slate-500">
          {stepLabels.map((label, idx) => {
            const stepNum = idx + 1;
            const isDone = stepNum < currentStep;
            const isCurrent = stepNum === currentStep;
            return (
              <button
                key={label}
                onClick={() => {
                  if (stepNum < currentStep) setCurrentStep(stepNum);
                }}
                disabled={stepNum > currentStep}
                className={`flex items-center gap-1.5 transition-colors ${
                  isCurrent
                    ? 'font-bold text-brand-800'
                    : isDone
                    ? 'text-slate-700 hover:text-brand-700 cursor-pointer'
                    : 'text-slate-400 cursor-not-allowed'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                    isCurrent
                      ? 'bg-brand-800 text-white'
                      : isDone
                      ? 'bg-brand-100 text-brand-800'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isDone ? '✓' : stepNum}
                </span>
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Wizard Form Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-card">
        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-xs text-rose-700 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: DESTINATION */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-brand-50 text-brand-800 text-xs font-semibold mb-2">
                <MapPin className="w-3.5 h-3.5" />
                <span>Step 1: Where are you heading?</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Select Your Destination
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter your target city, region, or island, and its host country.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  City or Region *
                </label>
                <input
                  type="text"
                  required
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Kyoto, Barcelona, Queenstown"
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Country *
                </label>
                <input
                  type="text"
                  required
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. Japan, Spain, New Zealand"
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
                />
              </div>
            </div>

            {/* Popular Presets */}
            <div className="pt-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Popular Inspirations
              </span>
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  { city: 'Tokyo', country: 'Japan' },
                  { city: 'Rome', country: 'Italy' },
                  { city: 'Reykjavik', country: 'Iceland' },
                  { city: 'Lisbon', country: 'Portugal' },
                  { city: 'Bangkok', country: 'Thailand' },
                ].map((item) => (
                  <button
                    key={item.city}
                    type="button"
                    onClick={() => {
                      setDestination(item.city);
                      setCountry(item.country);
                    }}
                    className="text-xs px-3 py-1.5 rounded-full bg-slate-100 hover:bg-brand-50 hover:text-brand-800 text-slate-700 transition-colors"
                  >
                    {item.city}, {item.country}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: DATES */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-brand-50 text-brand-800 text-xs font-semibold mb-2">
                <Calendar className="w-3.5 h-3.5" />
                <span>Step 2: Travel Window</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                When are you traveling?
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Select your departure and return dates. Durations are calculated automatically.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  End Date *
                </label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
                />
              </div>
            </div>

            {/* Duration Display Banner */}
            <div className="p-4 bg-sand-100/70 border border-sand-200 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Calculated Trip Length</span>
                <p className="text-lg font-bold text-brand-900 mt-0.5">
                  {tripDays > 0 ? `${tripDays} Days` : 'Invalid Date Range'}
                </p>
              </div>
              <span className="text-xs text-slate-500">
                {tripDays > 0 ? `${startDate} to ${endDate}` : 'End date must be after start date'}
              </span>
            </div>
          </div>
        )}

        {/* STEP 3: TRAVELERS */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-brand-50 text-brand-800 text-xs font-semibold mb-2">
                <Users className="w-3.5 h-3.5" />
                <span>Step 3: Who is going?</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Party & Travel Style
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Customize who will be on this trip to receive appropriately scaled recommendations.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Adults (18+)
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={adults}
                  onChange={(e) => setAdults(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Children (0-17)
                </label>
                <input
                  type="number"
                  min="0"
                  max="15"
                  value={children}
                  onChange={(e) => setChildren(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                Travel Party Dynamic
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {[
                  { id: 'solo', label: 'Solo Traveler', icon: '👤' },
                  { id: 'couple', label: 'Couple / Duo', icon: '👫' },
                  { id: 'family', label: 'Family with Kids', icon: '👨‍👩‍👧' },
                  { id: 'friends', label: 'Friends Group', icon: '👥' },
                  { id: 'business', label: 'Business / Bleisure', icon: '💼' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTravelType(item.id as any)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      travelType === item.id
                        ? 'bg-brand-50 border-brand-700 text-brand-900 font-bold ring-2 ring-brand-700/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <span className="text-xl mb-1">{item.icon}</span>
                    <span className="text-xs">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: BUDGET */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-brand-50 text-brand-800 text-xs font-semibold mb-2">
                <Wallet className="w-3.5 h-3.5" />
                <span>Step 4: Financial Boundaries</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Budget & Currency
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Roamwise AI will calibrate accommodation, dining, and activities to fit within your specified budget.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Total Trip Budget *
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="number"
                    min="100"
                    step="50"
                    value={totalBudget}
                    onChange={(e) => setTotalBudget(parseFloat(e.target.value) || 0)}
                    placeholder="2500"
                    className="w-full pl-10 pr-4 py-3 text-base font-semibold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-4 py-3 text-sm font-semibold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 bg-white"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                Target Budget Tier
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'budget',
                    title: 'Budget / Thrifty',
                    desc: 'Hostels, public transit, street food & free landmarks',
                  },
                  {
                    id: 'moderate',
                    title: 'Moderate / Balanced',
                    desc: '3-4★ hotels, mixed dining, key paid attractions',
                  },
                  {
                    id: 'luxury',
                    title: 'Luxury / Premium',
                    desc: 'Upscale boutiques, fine dining, private transfers',
                  },
                ].map((tier) => (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setBudgetTier(tier.id as any)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      budgetTier === tier.id
                        ? 'bg-brand-50 border-brand-700 text-brand-900 ring-2 ring-brand-700/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <p className="text-xs font-bold">{tier.title}</p>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{tier.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-2">
              <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>
                <b>What's covered:</b> Estimates will automatically allocate funds across accommodation, daily meals, local transit passes, activities/tours, and a miscellaneous buffer.
              </span>
            </div>
          </div>
        )}

        {/* STEP 5: PREFERENCES */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-brand-50 text-brand-800 text-xs font-semibold mb-2">
                <Sliders className="w-3.5 h-3.5" />
                <span>Step 5: Travel Persona & Interests</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Tailor Your Experiences
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Select your key interests, preferred pace, and special dietary/accessibility requirements.
              </p>
            </div>

            {/* Interests Chips */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                Primary Interests (Select all that apply) *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {INTERESTS_OPTIONS.map((item) => {
                  const selected = interests.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleInterest(item.id)}
                      className={`px-3 py-2.5 rounded-xl border text-xs font-medium text-left flex items-center gap-2 transition-all ${
                        selected
                          ? 'bg-brand-50 border-brand-700 text-brand-900 font-semibold ring-1 ring-brand-700'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                      }`}
                    >
                      <span className="text-base">{item.emoji}</span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Travel Pace */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                Preferred Travel Pace
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'relaxed', label: 'Relaxed', desc: '1-2 major sights, plenty of café time' },
                  { id: 'balanced', label: 'Balanced', desc: 'Curated mix of highlights and free wandering' },
                  { id: 'packed', label: 'Action-Packed', desc: 'Full days seeing every essential landmark' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPace(item.id as any)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      pace === item.id
                        ? 'bg-brand-50 border-brand-700 text-brand-900 font-bold ring-1 ring-brand-700'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <p className="text-xs">{item.label}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Transport & Accommodation Preference */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Preferred Local Transport
                </label>
                <select
                  value={transportPreference}
                  onChange={(e) => setTransportPreference(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 bg-white"
                >
                  <option value="public_transit">Public Transit (Metro / Buses)</option>
                  <option value="walking">Primarily Walking</option>
                  <option value="rental_car">Rental Car / Driving</option>
                  <option value="taxi">Taxis / Rideshare</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Accommodation Style
                </label>
                <select
                  value={accommodationType}
                  onChange={(e) => setAccommodationType(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 bg-white"
                >
                  <option value="mid-range">Mid-range Comfort (3★ - 4★)</option>
                  <option value="boutique">Boutique Hotel / B&B</option>
                  <option value="budget">Hostel / Budget Hotel</option>
                  <option value="apartment">Apartment / Vacation Rental</option>
                  <option value="luxury">Luxury / Resort (5★)</option>
                </select>
              </div>
            </div>

            {/* Dietary & Accessibility Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Dietary Restrictions (Optional)
                </label>
                <input
                  type="text"
                  value={dietaryRequirements}
                  onChange={(e) => setDietaryRequirements(e.target.value)}
                  placeholder="e.g. Vegetarian, Halal, Gluten-Free, None"
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Accessibility & Mobility (Optional)
                </label>
                <input
                  type="text"
                  value={accessibilityRequirements}
                  onChange={(e) => setAccessibilityRequirements(e.target.value)}
                  placeholder="e.g. Wheelchair accessible, low walking"
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
                />
              </div>
            </div>

            {/* Special Instructions */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Additional Instructions or Desired Must-Sees (Optional)
              </label>
              <textarea
                rows={2}
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="e.g. We love local pottery workshops, want at least one day-trip, or prefer staying near train stations..."
                className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 resize-none"
              />
            </div>
          </div>
        )}

        {/* STEP 6: REVIEW & GENERATE */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-brand-50 text-brand-800 text-xs font-semibold mb-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Step 6: Review Trip Specification</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Ready to Generate Your Itinerary
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Confirm your selections below. Groq will generate your personalized day-by-day plan.
              </p>
            </div>

            {/* Summary Review Card */}
            <div className="bg-sand-50/80 border border-sand-200 rounded-2xl p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-sand-200/70">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Destination</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{destination}, {country}</p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Duration & Dates</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {tripDays} Days ({startDate} &rarr; {endDate})
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-sand-200/70">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Travelers</span>
                  <p className="text-xs font-semibold text-slate-800 mt-0.5">
                    {adults} Adult(s), {children} Child(ren) &bull; {travelType}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Target Budget</span>
                  <p className="text-xs font-semibold text-brand-900 mt-0.5">
                    {totalBudget.toLocaleString()} {currency} ({budgetTier})
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Pace</span>
                  <p className="text-xs font-semibold text-slate-800 mt-0.5 capitalize">{pace}</p>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Interests</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {interests.map((i) => (
                    <span key={i} className="text-[11px] px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 capitalize font-medium">
                      {i}
                    </span>
                  ))}
                </div>
              </div>

              {(dietaryRequirements || accessibilityRequirements || additionalNotes) && (
                <div className="pt-2 text-xs text-slate-600 space-y-1">
                  {dietaryRequirements && <p><b>Dietary:</b> {dietaryRequirements}</p>}
                  {accessibilityRequirements && <p><b>Accessibility:</b> {accessibilityRequirements}</p>}
                  {additionalNotes && <p><b>Notes:</b> {additionalNotes}</p>}
                </div>
              )}
            </div>

            {/* Generation CTA Banner */}
            <div className="p-4 bg-brand-50 border border-brand-200/80 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-700 text-white flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-brand-200" />
                </div>
                <div>
                  <p className="text-xs font-bold text-brand-900">Groq High-Speed LLM Inference</p>
                  <p className="text-[11px] text-brand-700">Validating schema and computing budget allocations</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Footer Controls */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < 6 ? (
            <button
              type="button"
              onClick={nextStep}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-brand-900 text-white text-xs font-semibold hover:bg-brand-800 shadow-sm transition-all"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleGenerateItinerary}
              disabled={loading}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-brand-700 text-white text-sm font-bold hover:bg-brand-800 shadow-md shadow-brand-700/20 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Itinerary...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-brand-200" />
                  <span>Generate AI Itinerary</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
