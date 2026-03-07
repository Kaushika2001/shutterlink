import { supabase } from '@/lib/supabaseClient';

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
  const { data, error } = await supabase
    .from('provider_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching provider profile:', error);
    return null;
  }

  return data;
};

/* =========================
   GET PROVIDER BY ID
========================= */
export const getProviderById = async (providerId: string): Promise<ProviderProfile | null> => {
  const { data, error } = await supabase
    .from('provider_profiles')
    .select('*')
    .eq('id', providerId)
    .single();

  if (error) {
    console.error('Error fetching provider:', error);
    return null;
  }

  return data;
};

/* =========================
   GET PROVIDER WITH FULL DETAILS
========================= */
export const getProviderWithDetails = async (providerId: string): Promise<any | null> => {
  const { data, error } = await supabase
    .from('provider_profiles')
    .select(`
      *,
      user:users(id, name, email),
      portfolio_items(*),
      service_packages(*)
    `)
    .eq('id', providerId)
    .single();

  if (error) {
    console.error('Error fetching provider with details:', error);
    return null;
  }

  return data;
};

/* =========================
   UPDATE PROVIDER PROFILE
========================= */
export const updateProviderProfile = async (
  userId: string,
  updates: Partial<ProviderProfile>
): Promise<ProviderProfile | null> => {
  console.log('updateProviderProfile called with:', { userId, updates });
  
  // First, check if profile exists
  const existing = await getProviderProfile(userId);
  
  console.log('Existing profile:', existing ? 'Found' : 'Not found');
  
  if (existing) {
    // Update existing profile
    console.log('Updating existing profile with:', updates);
    
    const { data, error } = await supabase
      .from('provider_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating provider profile:', error);
      throw new Error('Failed to update provider profile: ' + error.message);
    }

    console.log('Profile updated successfully:', data);
    return data;
  } else {
    // Create new profile
    console.log('Creating new profile with:', updates);
    
    const { data, error } = await supabase
      .from('provider_profiles')
      .insert({
        user_id: userId,
        ...updates,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating provider profile:', error);
      throw new Error('Failed to create provider profile: ' + error.message);
    }

    console.log('Profile created successfully:', data);
    return data;
  }
};

/* =========================
   SEARCH PROVIDERS
========================= */
export const searchProviders = async (
  filters: ProviderSearchFilters = {},
  page: number = 1,
  limit: number = 20
): Promise<{ data: ProviderProfile[]; total: number }> => {
  let query = supabase
    .from('provider_profiles')
    .select('*', { count: 'exact' });

  // Apply filters
  if (filters.service_type && filters.service_type.length > 0) {
    query = query.overlaps('service_type', filters.service_type);
  }

  if (filters.specializations && filters.specializations.length > 0) {
    query = query.overlaps('specializations', filters.specializations);
  }

  if (filters.min_rating) {
    query = query.gte('average_rating', filters.min_rating);
  }

  if (filters.max_hourly_rate) {
    query = query.lte('hourly_rate', filters.max_hourly_rate);
  }

  if (filters.location) {
    query = query.contains('coverage_areas', [filters.location]);
  }

  if (filters.availability_status) {
    query = query.eq('availability_status', filters.availability_status);
  }

  if (filters.is_verified !== undefined) {
    query = query.eq('is_verified', filters.is_verified);
  }

  // Pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  // Sort by rating by default
  query = query.order('average_rating', { ascending: false });

  const { data, error, count } = await query;

  if (error) {
    console.error('Error searching providers:', error);
    throw new Error('Failed to search providers');
  }

  return {
    data: data || [],
    total: count || 0,
  };
};

/* =========================
   GET FEATURED PROVIDERS
========================= */
export const getFeaturedProviders = async (limit: number = 10): Promise<ProviderProfile[]> => {
  const { data, error } = await supabase
    .from('provider_profiles')
    .select('*')
    .eq('is_verified', true)
    .gte('average_rating', 4.0)
    .order('average_rating', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching featured providers:', error);
    return [];
  }

  return data || [];
};

/* =========================
   UPDATE AVAILABILITY STATUS
========================= */
export const updateAvailability = async (
  userId: string,
  status: 'available' | 'busy' | 'unavailable'
): Promise<ProviderProfile | null> => {
  return updateProviderProfile(userId, {
    availability_status: status,
  });
};

/* =========================
   INCREMENT BOOKING COUNT
========================= */
export const incrementBookingCount = async (providerId: string): Promise<void> => {
  // Get current count
  const provider = await getProviderById(providerId);
  if (!provider) return;

  const { error } = await supabase
    .from('provider_profiles')
    .update({ total_bookings: provider.total_bookings + 1 })
    .eq('id', providerId);

  if (error) {
    console.error('Error incrementing booking count:', error);
  }
};

/* =========================
   UPDATE AVERAGE RATING
========================= */
export const updateAverageRating = async (
  providerId: string,
  newAverageRating: number
): Promise<void> => {
  const { error } = await supabase
    .from('provider_profiles')
    .update({ average_rating: newAverageRating })
    .eq('id', providerId);

  if (error) {
    console.error('Error updating average rating:', error);
  }
};

/* =========================
   GET NEARBY PROVIDERS
========================= */
export const getNearbyProviders = async (
  location: string,
  limit: number = 20
): Promise<ProviderProfile[]> => {
  const { data, error } = await supabase
    .from('provider_profiles')
    .select('*')
    .contains('coverage_areas', [location])
    .eq('availability_status', 'available')
    .order('average_rating', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching nearby providers:', error);
    return [];
  }

  return data || [];
};

/* =========================
   SAVE PROVIDER (FAVORITE)
========================= */
export const saveProvider = async (
  customerId: string,
  providerId: string
): Promise<boolean> => {
  const { error } = await supabase
    .from('saved_providers')
    .insert({
      customer_id: customerId,
      provider_id: providerId,
    });

  if (error) {
    if (error.code === '23505') {
      // Already saved
      return true;
    }
    console.error('Error saving provider:', error);
    return false;
  }

  return true;
};

/* =========================
   UNSAVE PROVIDER (UNFAVORITE)
========================= */
export const unsaveProvider = async (
  customerId: string,
  providerId: string
): Promise<boolean> => {
  const { error } = await supabase
    .from('saved_providers')
    .delete()
    .eq('customer_id', customerId)
    .eq('provider_id', providerId);

  if (error) {
    console.error('Error unsaving provider:', error);
    return false;
  }

  return true;
};

/* =========================
   GET SAVED PROVIDERS
========================= */
export const getSavedProviders = async (customerId: string): Promise<ProviderProfile[]> => {
  const { data, error } = await supabase
    .from('saved_providers')
    .select(`
      provider_id,
      provider:provider_profiles(*)
    `)
    .eq('customer_id', customerId);

  if (error) {
    console.error('Error fetching saved providers:', error);
    return [];
  }

  return data?.map((item: any) => item.provider) || [];
};

/* =========================
   CHECK IF PROVIDER IS SAVED
========================= */
export const isProviderSaved = async (
  customerId: string,
  providerId: string
): Promise<boolean> => {
  const { data, error } = await supabase
    .from('saved_providers')
    .select('id')
    .eq('customer_id', customerId)
    .eq('provider_id', providerId)
    .single();

  return !error && data !== null;
};
