import { supabase, isSupabaseConfigured } from './supabase';
import type { TripCreateRequest, TripResponse, Activity } from '../types/trip';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

async function getAuthHeaders(): Promise<HeadersInit> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (isSupabaseConfigured) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
  }

  return headers;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const authHeaders = await getAuthHeaders();

  const response = await fetch(url, {
    ...options,
    headers: {
      ...authHeaders,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    let errorDetail = 'An unexpected error occurred';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || JSON.stringify(errJson);
    } catch {
      errorDetail = `${response.status} ${response.statusText}`;
    }
    throw new Error(errorDetail);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  // Health
  checkHealth: async () => {
    return request<{ status: string; groq_configured: boolean; supabase_configured: boolean }>('/api/health');
  },

  // Trips CRUD
  createTrip: async (payload: TripCreateRequest): Promise<TripResponse> => {
    return request<TripResponse>('/api/trips', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  listTrips: async (): Promise<TripResponse[]> => {
    return request<TripResponse[]>('/api/trips');
  },

  getTrip: async (id: string): Promise<TripResponse> => {
    return request<TripResponse>(`/api/trips/${id}`);
  },

  updateTrip: async (id: string, updates: Partial<TripResponse>): Promise<TripResponse> => {
    return request<TripResponse>(`/api/trips/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  deleteTrip: async (id: string): Promise<void> => {
    return request<void>(`/api/trips/${id}`, {
      method: 'DELETE',
    });
  },

  // Itinerary Customization
  regenerateDay: async (
    tripId: string,
    dayNumber: number,
    instructions?: string
  ): Promise<TripResponse> => {
    return request<TripResponse>(`/api/trips/${tripId}/regenerate-day`, {
      method: 'POST',
      body: JSON.stringify({
        day_number: dayNumber,
        user_instructions: instructions || null,
      }),
    });
  },

  regenerateAll: async (tripId: string): Promise<TripResponse> => {
    return request<TripResponse>(`/api/trips/${tripId}/regenerate-all`, {
      method: 'POST',
    });
  },

  addActivity: async (
    tripId: string,
    dayNumber: number,
    activity: Activity
  ): Promise<TripResponse> => {
    return request<TripResponse>(`/api/trips/${tripId}/activities`, {
      method: 'POST',
      body: JSON.stringify({ day_number: dayNumber, activity }),
    });
  },

  updateActivity: async (
    tripId: string,
    dayNumber: number,
    activityId: string,
    updates: Activity
  ): Promise<TripResponse> => {
    return request<TripResponse>(`/api/trips/${tripId}/activities/${activityId}?day_number=${dayNumber}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  deleteActivity: async (
    tripId: string,
    dayNumber: number,
    activityId: string
  ): Promise<TripResponse> => {
    return request<TripResponse>(
      `/api/trips/${tripId}/activities/${activityId}?day_number=${dayNumber}`,
      { method: 'DELETE' }
    );
  },

  reorderActivities: async (
    tripId: string,
    dayNumber: number,
    activityIds: string[]
  ): Promise<TripResponse> => {
    return request<TripResponse>(`/api/trips/${tripId}/activities/reorder`, {
      method: 'POST',
      body: JSON.stringify({ day_number: dayNumber, activity_ids: activityIds }),
    });
  },

  // PDF Export
  downloadPdf: async (tripId: string, filename: string): Promise<void> => {
    const url = `${API_BASE_URL}/api/trips/${tripId}/export/pdf`;
    const authHeaders = await getAuthHeaders();

    const response = await fetch(url, { headers: authHeaders });
    if (!response.ok) {
      throw new Error(`Failed to download PDF (${response.status})`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || `roamwise-trip.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  },
};
