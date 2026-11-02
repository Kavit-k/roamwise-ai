import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  Sparkles,
  ArrowRight,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
} from 'lucide-react';

interface DiscoveryDestination {
  city: string;
  country: string;
  tagline: string;
  budgetTier: 'budget' | 'moderate' | 'luxury';
  bestMonths: string;
  highlight: string;
  image: string;
}

const DISCOVERY_DESTINATIONS: DiscoveryDestination[] = [
  {
    city: 'Kyoto',
    country: 'Japan',
    tagline: 'Zen bamboo groves, crimson torii shrines & tranquil tea ceremonies',
    budgetTier: 'moderate',
    bestMonths: 'March - May & Oct - Nov',
    highlight: 'Higashiyama lantern district & matcha food culture',
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
  },
  {
    city: 'Amalfi Coast',
    country: 'Italy',
    tagline: 'Dramatic pastel cliffs, turquoise waters & fragrant lemon orchards',
    budgetTier: 'luxury',
    bestMonths: 'May - September',
    highlight: 'Path of the Gods hike & coastal sunset cruising',
    image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80',
  },
  {
    city: 'Oaxaca',
    country: 'Mexico',
    tagline: 'Artisan craft villages, smoky mezcal tastings & historic plazas',
    budgetTier: 'budget',
    bestMonths: 'October - April',
    highlight: 'Seven moles tasting & Monte Albán pyramids',
    image: 'https://images.unsplash.com/photo-1512813195386-6cf811ad3542?auto=format&fit=crop&w=800&q=80',
  },
  {
    city: 'Swiss Alps',
    country: 'Switzerland',
    tagline: 'Snow-capped peaks, cogwheel mountain trains & mirror lakes',
    budgetTier: 'luxury',
    bestMonths: 'December - March & July - August',
    highlight: 'Jungfraujoch glacier & pristine alpine meadows',
    image: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=800&q=80',
  },
  {
    city: 'Cape Town',
    country: 'South Africa',
    tagline: 'Towering Table Mountain, Atlantic coastlines & Cape winelands',
    budgetTier: 'moderate',
    bestMonths: 'November - March',
    highlight: 'Boulders Beach penguins & Chapman\'s Peak Drive',
    image: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=800&q=80',
  },
  {
    city: 'Bali',
    country: 'Indonesia',
    tagline: 'Emerald rice terraces, sacred sea temples & wellness sanctuaries',
    budgetTier: 'budget',
    bestMonths: 'May - September',
    highlight: 'Ubud cultural craft workshops & seaside sunsets',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80',
  },
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [activePreviewDay, setActivePreviewDay] = useState<number>(1);

  const handleSelectDestination = (dest: DiscoveryDestination) => {
    navigate('/wizard', {
      state: {
        prefill: {
          destination: dest.city,
          country: dest.country,
          budget_tier: dest.budgetTier,
        },
      },
    });
  };

  return (
    <div className="space-y-24 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 md:pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200/60 text-brand-900 text-xs font-semibold mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>High-Speed AI Travel Planner &bull; Powered by Groq Cloud</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.15]">
            Journeys Crafted with <span className="text-brand-700 underline decoration-brand-300 decoration-wavy underline-offset-8">Intelligence</span> & Budget Clarity.
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Turn travel inspiration into realistic day-by-day itineraries. Calibrated to your party, paced to your rhythm, and ready for vector PDF export.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/wizard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-brand-900 text-white font-semibold text-base shadow-lg shadow-brand-900/20 hover:bg-brand-800 hover:shadow-xl transition-all"
            >
              <Compass className="w-5 h-5 text-brand-300" />
              <span>Start Planning Your Trip</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#sample-preview"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-base shadow-sm hover:bg-slate-50 transition-all"
            >
              View Sample Itinerary
            </a>
          </div>

          {/* Value Highlights */}
          <div className="mt-12 pt-8 border-t border-slate-200/60 max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Custom Day Plans</h4>
                <p className="text-xs text-slate-500">Mornings, afternoons & evenings</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Budget Tracker</h4>
                <p className="text-xs text-slate-500">Categorized estimates & totals</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Single-Day Regen</h4>
                <p className="text-xs text-slate-500">Re-plan one day with your notes</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Vector PDF Export</h4>
                <p className="text-xs text-slate-500">Download formatted travel brief</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. DESTINATION DISCOVERY */}
      <section id="destinations" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-sand-200/70 text-slate-700 text-xs font-semibold mb-3">
            <MapPin className="w-3.5 h-3.5 text-brand-700" />
            <span>Curated Travel Inspiration</span>
          </div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
            Discover Your Next Destination
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Select a world-class destination to jump straight into tailored itinerary generation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {DISCOVERY_DESTINATIONS.map((dest) => (
            <div
              key={dest.city}
              className="group bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-card hover:shadow-floating transition-all duration-300 flex flex-col"
            >
              <div className="relative h-48 overflow-hidden bg-slate-100">
                <img
                  src={dest.image}
                  alt={`${dest.city}, ${dest.country}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  onError={(e) => {
                    // Fallback if network blocks external images
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="absolute top-3 right-3">
                  <span
                    className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm ${
                      dest.budgetTier === 'budget'
                        ? 'bg-emerald-100 text-emerald-800'
                        : dest.budgetTier === 'moderate'
                        ? 'bg-sky-100 text-sky-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {dest.budgetTier}
                  </span>
                </div>
                <div className="absolute bottom-3 left-3 bg-slate-900/75 backdrop-blur-sm px-2.5 py-1 rounded-md text-white text-xs font-medium flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-brand-300" />
                  <span>{dest.city}, {dest.country}</span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-xs text-slate-500 mb-2 leading-relaxed">
                    {dest.tagline}
                  </p>
                  <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3 mt-3">
                    <p className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span><b>Best Time:</b> {dest.bestMonths}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                      <span className="line-clamp-1"><b>Highlight:</b> {dest.highlight}</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleSelectDestination(dest)}
                  className="mt-5 w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-brand-700 hover:text-white text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all group-hover:border-transparent border border-slate-200"
                >
                  <span>Plan Trip to {dest.city}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. HOW IT WORKS */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-brand-900 to-slate-900 text-white rounded-3xl p-8 sm:p-14 shadow-floating">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-300">Simple 3-Step Process</span>
            <h2 className="text-3xl font-bold tracking-tight mt-2">How Roamwise AI Works</h2>
            <p className="text-sm text-slate-300 mt-2">
              From your initial travel vision to a fine-tuned, downloadable schedule in under 30 seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/60 p-6 rounded-2xl flex flex-col">
              <div className="w-10 h-10 rounded-xl bg-brand-700 text-white font-bold flex items-center justify-center mb-4 text-base">
                1
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Define Your Journey</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Enter your destination, dates, party style, target budget, and specific interests from culture and food to nature and relaxation.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/60 p-6 rounded-2xl flex flex-col">
              <div className="w-10 h-10 rounded-xl bg-brand-700 text-white font-bold flex items-center justify-center mb-4 text-base">
                2
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Groq AI Orchestration</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                The Groq LPU engine synthesizes a day-by-day plan with timed activities, costs, neighborhood accommodations, and local transit guidance.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/60 p-6 rounded-2xl flex flex-col">
              <div className="w-10 h-10 rounded-xl bg-brand-700 text-white font-bold flex items-center justify-center mb-4 text-base">
                3
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Customize & Export PDF</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Add or edit activities, watch budget numbers balance live, regenerate any day with special instructions, and save as a vector PDF.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SAMPLE ITINERARY PREVIEW */}
      <section id="sample-preview" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-sand-200/70 text-slate-700 text-xs font-semibold mb-3">
            <Clock className="w-3.5 h-3.5 text-brand-700" />
            <span>Interactive Sample Preview</span>
          </div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
            See the Quality of Every Generated Itinerary
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Preview what your generated plan looks like: structured days, clear costs, and practical notes.
          </p>
        </div>

        {/* Preview Container */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-card p-6 sm:p-8">
          {/* Header Card */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-0.5 rounded">Sample Trip</span>
                <span className="text-xs text-slate-400">&bull; 3 Days &bull; Couple Travel</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">Paris: Art, Cafés & Historic Quarters</h3>
              <p className="text-xs text-slate-500 mt-1">Target Budget: $1,800.00 USD &bull; Est. Total: $1,460.00 USD (On Track)</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/wizard"
                className="px-4 py-2 rounded-xl bg-brand-700 text-white text-xs font-semibold hover:bg-brand-800 transition-colors inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Plan Trip Like This
              </Link>
            </div>
          </div>

          {/* Day Switcher */}
          <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-2">
            {[1, 2, 3].map((dayNum) => (
              <button
                key={dayNum}
                onClick={() => setActivePreviewDay(dayNum)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activePreviewDay === dayNum
                    ? 'bg-brand-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Day {dayNum}: {dayNum === 1 ? 'Latin Quarter & Seine' : dayNum === 2 ? 'Le Marais & Modern Art' : 'Montmartre & Panorama'}
              </button>
            ))}
          </div>

          {/* Sample Activities */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Morning */}
            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded">
                Morning
              </span>
              <h4 className="text-sm font-bold text-slate-900 mt-2">
                {activePreviewDay === 1 ? 'Sainte-Chapelle & Conciergerie' : activePreviewDay === 2 ? 'Place des Vosges & Artisans' : 'Sacré-Cœur Funicular Walk'}
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {activePreviewDay === 1
                  ? 'Marvel at 13th-century stained glass windows and stroll along the Île de la Cité.'
                  : activePreviewDay === 2
                  ? 'Explore the oldest planned square in Paris and wander historic courtyard boutiques.'
                  : 'Ascend Montmartre for sweeping views of Paris before artists set up in Place du Tertre.'}
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-400" /> 09:30 AM (90m)</span>
                <span className="font-semibold text-brand-700">$18.00 / person</span>
              </div>
            </div>

            {/* Afternoon */}
            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700 bg-sky-100/70 px-2 py-0.5 rounded">
                Afternoon
              </span>
              <h4 className="text-sm font-bold text-slate-900 mt-2">
                {activePreviewDay === 1 ? 'Jardin du Luxembourg & Latin Bookshops' : activePreviewDay === 2 ? 'Musée Picasso & Coffee Stop' : 'Musée de Montmartre Gardens'}
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {activePreviewDay === 1
                  ? 'Relax beside the Medici Fountain with espresso and browse classic bouquinistes.'
                  : activePreviewDay === 2
                  ? 'View Picasso masterpieces in a 17th-century mansion followed by artisanal specialty coffee.'
                  : 'Wander Renoir\'s historic garden and the secret vineyard of Clos Montmartre.'}
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-400" /> 02:00 PM (120m)</span>
                <span className="font-semibold text-brand-700">$14.00 / person</span>
              </div>
            </div>

            {/* Evening */}
            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded">
                Evening
              </span>
              <h4 className="text-sm font-bold text-slate-900 mt-2">
                {activePreviewDay === 1 ? 'Sunset Seine River Cruise' : activePreviewDay === 2 ? 'Traditional Bistro Dinner' : 'Lantern Walk & Pigalle Jazz'}
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {activePreviewDay === 1
                  ? 'Board near Pont Neuf as twilight illuminates Notre-Dame and the Eiffel Tower.'
                  : activePreviewDay === 2
                  ? 'Enjoy steak frites and tarte tatin in a warm brasserie with local wine.'
                  : 'Descend through quiet cobblestone stairways and catch live acoustic jazz.'}
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-400" /> 07:00 PM (75m)</span>
                <span className="font-semibold text-brand-700">$22.00 / person</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FINAL CALL TO ACTION */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-sand-100 border border-sand-300 rounded-3xl p-10 sm:p-14 shadow-card">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Ready for your next adventure?
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
            Create an account or start planning immediately with our step-by-step trip wizard.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              to="/wizard"
              className="px-8 py-3.5 rounded-xl bg-brand-900 text-white font-semibold text-base shadow-md hover:bg-brand-800 transition-all inline-flex items-center gap-2"
            >
              <Compass className="w-5 h-5 text-brand-300" />
              <span>Launch Trip Planner</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
