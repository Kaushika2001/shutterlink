import { apiRequest } from '@/lib/api';

/* =========================
   TYPES (Compatible with new frontend)
========================= */
export interface ProviderProfile {
  id: string;
  user_id: string;
  business_name?: string | null;
  service_type: string[];
  specializations: string[];
  years_experience?: number | null;
  hourly_rate?: number | null;
  availability_status: 'available' | 'busy' | 'unavailable';
  portfolio_url?: string | null;
  bio?: string | null;
  equipment_list?: string | null;
  coverage_areas: string[];
  max_travel_distance?: number | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  twitter_url?: string | null;
  linkedin_url?: string | null;
  is_verified: boolean;
  verification_date?: string | null;
  total_bookings: number;
  average_rating: number;
  response_time_hours?: number | null;
  created_at: string;
  updated_at: string;
}

export interface ProviderSearchFilters {
  service_type?: string[];
  specializations?: string[];
  min_rating?: number;
  max_hourly_rate?: number;
  location?: string;
  availability_status?: 'available' | 'busy' | 'unavailable';
  is_verified?: boolean;
}

/* =========================
   GET PROVIDER PROFILE
========================= */
export const getProviderProfile = async (userId: string): Promise<ProviderProfile | null> => {
  try {
    return await apiRequest<ProviderProfile>('/providers/profile', {}, true);
  } catch {
    return null;
  }
};

/* =========================
   GET PROVIDER BY ID
========================= */
export const getProviderById = async (providerId: string): Promise<ProviderProfile | null> => {
  try {
    return await apiRequest<ProviderProfile>(`/providers/by-id/${providerId}`);
  } catch {
    return null;
  }
};

/* =========================
   GET PROVIDER WITH FULL DETAILS
========================= */
export const getProviderWithDetails = async (providerId: string): Promise<any | null> => {
  try {
    return await apiRequest<any>(`/public/providers/${providerId}/details`);
  } catch {
    return null;
  }
};

/* =========================
   UPDATE PROVIDER PROFILE
========================= */
export const updateProviderProfile = async (
  userId: string,
  updates: Partial<ProviderProfile>
): Promise<ProviderProfile | null> => {
  return await apiRequest<ProviderProfile>(
    '/providers/create-or-update',
    { method: 'POST', body: JSON.stringify(updates) },
    true
  );
};

/* =========================
   SEARCH PROVIDERS
========================= */
export const searchProviders = async (
  filters: ProviderSearchFilters = {},
  page: number = 1,
  limit: number = 20
): Promise<{ data: ProviderProfile[]; total: number }> => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (filters.service_type?.[0]) params.set('service_type', filters.service_type[0]);
  if (filters.min_rating) params.set('min_rating', String(filters.min_rating));
  if (filters.max_hourly_rate) params.set('max_price', String(filters.max_hourly_rate));
  if (filters.location) params.set('location', filters.location);
  const data = await apiRequest<ProviderProfile[]>(`/providers/search?${params.toString()}`);
  return { data, total: data.length };
};

/* =========================
   GET FEATURED PROVIDERS
========================= */
export const getFeaturedProviders = async (limit: number = 10): Promise<ProviderProfile[]> => {
  return await apiRequest<ProviderProfile[]>(`/providers/featured?limit=${limit}`);
};

/* =========================
   UPDATE AVAILABILITY STATUS
========================= */
export const updateAvailability = async (
  userId: string,
  status: 'available' | 'busy' | 'unavailable'
): Promise<ProviderProfile | null> => {
  await apiRequest('/providers/availability', { method: 'PUT', body: JSON.stringify({ status }) }, true);
  return getProviderProfile(userId);
};

/* =========================
   INCREMENT BOOKING COUNT
========================= */
export const incrementBookingCount = async (providerId: string): Promise<void> => {
  return;
};

/* =========================
   UPDATE AVERAGE RATING
========================= */
export const updateAverageRating = async (
  providerId: string,
  newAverageRating: number
): Promise<void> => {
  return;
};

/* =========================
   GET NEARBY PROVIDERS
========================= */
export const getNearbyProviders = async (
  location: string,
  limit: number = 20
): Promise<ProviderProfile[]> => {
  const result = await searchProviders({ location }, 1, limit);
  return result.data;
};

/* =========================
   SAVE PROVIDER (FAVORITE)
========================= */
export const saveProvider = async (
  customerId: string,
  providerId: string
): Promise<boolean> => {
  await apiRequest('/providers/save', { method: 'POST', body: JSON.stringify({ providerId }) }, true);
  return true;
};

/* =========================
   UNSAVE PROVIDER (UNFAVORITE)
========================= */
export const unsaveProvider = async (
  customerId: string,
  providerId: string
): Promise<boolean> => {
  await apiRequest('/providers/unsave', { method: 'POST', body: JSON.stringify({ providerId }) }, true);
  return true;
};

/* =========================
   GET SAVED PROVIDERS
========================= */
export const getSavedProviders = async (customerId: string): Promise<ProviderProfile[]> => {
  return await apiRequest<ProviderProfile[]>('/providers/saved', {}, true);
};

/* =========================
   CHECK IF PROVIDER IS SAVED
========================= */
export const isProviderSaved = async (
  customerId: string,
  providerId: string
): Promise<boolean> => {
  const result = await apiRequest<{ isSaved: boolean }>(`/providers/is-saved/${providerId}`, {}, true);
  return result.isSaved;
};
