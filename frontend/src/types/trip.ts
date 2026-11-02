export interface Activity {
  id: string;
  title: string;
  time_slot: 'morning' | 'afternoon' | 'evening';
  start_time?: string;
  duration_mins?: number;
  description: string;
  estimated_cost: number;
  category?: string;
  location_hint?: string;
  practical_tips?: string;
}

export interface MealSuggestions {
  breakfast?: string;
  lunch?: string;
  dinner?: string;
}

export interface DayPlan {
  day_number: number;
  date: string;
  theme: string;
  morning: Activity[];
  afternoon: Activity[];
  evening: Activity[];
  meals?: MealSuggestions;
  transport_advice?: string;
  practical_notes?: string;
  alternatives?: string[];
}

export interface AccommodationSuggestion {
  area_name: string;
  category: string;
  reason: string;
  estimated_nightly_price: number;
  currency: string;
  booking_tips: string;
}

export interface BudgetBreakdown {
  accommodation: number;
  food: number;
  transportation: number;
  activities: number;
  miscellaneous: number;
  estimated_total: number;
  currency: string;
  user_budget: number;
  is_within_budget: boolean;
  budget_difference: number;
  budget_notes?: string;
}

export interface TravelGuidance {
  packing_list: string[];
  local_transport: string;
  safety_tips: string[];
  important_reminders: string[];
  unverified_details_disclaimer: string;
}

export interface Itinerary {
  title: string;
  destination: string;
  country: string;
  start_date: string;
  end_date: string;
  days_count: number;
  travelers: number;
  travel_type: string;
  summary: string;
  budget_breakdown: BudgetBreakdown;
  days: DayPlan[];
  accommodations: AccommodationSuggestion[];
  guidance: TravelGuidance;
  disclaimer: string;
}

export interface TripPreferences {
  interests: string[];
  pace: 'relaxed' | 'balanced' | 'packed';
  transport_preference?: string;
  accommodation_type?: string;
  dietary_requirements?: string;
  accessibility_requirements?: string;
  additional_notes?: string;
  budget_tier: 'budget' | 'moderate' | 'luxury';
}

export interface TripCreateRequest {
  destination: string;
  country: string;
  start_date: string;
  end_date: string;
  adults: number;
  children: number;
  travel_type: 'solo' | 'couple' | 'family' | 'friends' | 'business';
  total_budget: number;
  currency: string;
  preferences: TripPreferences;
}

export interface TripResponse {
  id: string;
  user_id: string;
  title: string;
  destination: string;
  country: string;
  start_date: string;
  end_date: string;
  travelers: number;
  budget: number;
  currency: string;
  preferences: TripPreferences;
  itinerary: Itinerary;
  status: string;
  created_at: string;
  updated_at: string;
}
