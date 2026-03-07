import { supabase } from '@/lib/supabaseClient';

/* =========================
   TYPES
========================= */

export interface Booking {
  id: string;
  booking_number: string;
  customer_id: string;
  provider_id: string;
  package_id: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  service_date: string;
  service_time: string;
  duration_hours: number;
  location_type: 'on_site' | 'studio' | 'remote';
  location_address?: string;
  special_requests?: string;
  total_price: number;
  deposit_amount: number;
  deposit_paid: boolean;
  cancellation_reason?: string;
  cancelled_by?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  provider_name?: string;
  provider_business_name?: string;
  customer_name?: string;
  package_name?: string;
}

export interface CreateBookingData {
  provider_id: string;
  package_id: string;
  service_date: string;
  service_time: string;
  duration_hours: number;
  location_type: 'on_site' | 'studio' | 'remote';
  location_address?: string;
  special_requests?: string;
  total_price: number;
  deposit_amount?: number;
}

export interface UpdateBookingData {
  status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  service_date?: string;
  service_time?: string;
  location_address?: string;
  special_requests?: string;
  deposit_paid?: boolean;
  cancellation_reason?: string;
  cancelled_by?: string;
  cancelled_at?: string;
}

/* =========================
   CREATE BOOKING
========================= */

export const createBooking = async (bookingData: CreateBookingData): Promise<Booking> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('You must be logged in to create a booking');
  }

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      customer_id: user.id,
      ...bookingData,
      status: 'pending'
    })
    .select(`
      *,
      provider:provider_profiles!bookings_provider_id_fkey(
        business_name,
        user:users!provider_profiles_user_id_fkey(full_name)
      ),
      package:service_packages!bookings_package_id_fkey(name)
    `)
    .single();

  if (error) {
    console.error('Error creating booking:', error);
    throw new Error(error.message || 'Failed to create booking');
  }

  return data;
};

/* =========================
   GET BOOKINGS
========================= */

// Get all bookings for the current user (customer)
export const getCustomerBookings = async (): Promise<Booking[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('You must be logged in to view bookings');
  }

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      provider:provider_profiles!bookings_provider_id_fkey(
        id,
        business_name,
        user:users!provider_profiles_user_id_fkey(full_name)
      ),
      package:service_packages!bookings_package_id_fkey(name)
    `)
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching customer bookings:', error);
    throw new Error('Failed to fetch bookings');
  }

  return data || [];
};

// Get upcoming bookings for the current user
export const getUpcomingBookings = async (): Promise<Booking[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('You must be logged in to view bookings');
  }

  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      provider:provider_profiles!bookings_provider_id_fkey(
        id,
        business_name,
        user:users!provider_profiles_user_id_fkey(full_name)
      ),
      package:service_packages!bookings_package_id_fkey(name)
    `)
    .eq('customer_id', user.id)
    .in('status', ['pending', 'confirmed'])
    .gte('service_date', today)
    .order('service_date', { ascending: true })
    .order('service_time', { ascending: true });

  if (error) {
    console.error('Error fetching upcoming bookings:', error);
    throw new Error('Failed to fetch upcoming bookings');
  }

  return data || [];
};

// Get booking history (completed or cancelled)
export const getBookingHistory = async (): Promise<Booking[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('You must be logged in to view booking history');
  }

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      provider:provider_profiles!bookings_provider_id_fkey(
        id,
        business_name,
        user:users!provider_profiles_user_id_fkey(full_name)
      ),
      package:service_packages!bookings_package_id_fkey(name)
    `)
    .eq('customer_id', user.id)
    .in('status', ['completed', 'cancelled'])
    .order('service_date', { ascending: false });

  if (error) {
    console.error('Error fetching booking history:', error);
    throw new Error('Failed to fetch booking history');
  }

  return data || [];
};

// Get single booking by ID
export const getBookingById = async (bookingId: string): Promise<Booking> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('You must be logged in to view booking details');
  }

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      provider:provider_profiles!bookings_provider_id_fkey(
        id,
        business_name,
        user:users!provider_profiles_user_id_fkey(full_name, email, contact_number)
      ),
      package:service_packages!bookings_package_id_fkey(name, description)
    `)
    .eq('id', bookingId)
    .single();

  if (error) {
    console.error('Error fetching booking:', error);
    throw new Error('Booking not found');
  }

  // Verify the user owns this booking
  if (data.customer_id !== user.id) {
    throw new Error('You do not have permission to view this booking');
  }

  return data;
};

/* =========================
   UPDATE BOOKING
========================= */

export const updateBooking = async (
  bookingId: string,
  updates: UpdateBookingData
): Promise<Booking> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('You must be logged in to update a booking');
  }

  // If cancelling, add cancelled metadata
  if (updates.status === 'cancelled') {
    updates = {
      ...updates,
      cancelled_by: user.id as any,
      cancelled_at: new Date().toISOString() as any
    };
  }

  const { data, error } = await supabase
    .from('bookings')
    .update(updates)
    .eq('id', bookingId)
    .eq('customer_id', user.id) // Ensure customer owns the booking
    .select(`
      *,
      provider:provider_profiles!bookings_provider_id_fkey(
        id,
        business_name,
        user:users!provider_profiles_user_id_fkey(full_name)
      ),
      package:service_packages!bookings_package_id_fkey(name)
    `)
    .single();

  if (error) {
    console.error('Error updating booking:', error);
    throw new Error('Failed to update booking');
  }

  return data;
};

/* =========================
   CANCEL BOOKING
========================= */

export const cancelBooking = async (
  bookingId: string,
  reason?: string
): Promise<Booking> => {
  return updateBooking(bookingId, {
    status: 'cancelled',
    cancellation_reason: reason
  });
};

/* =========================
   PROVIDER BOOKING MANAGEMENT
========================= */

// Get all bookings for a provider
export const getProviderBookings = async (): Promise<Booking[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('You must be logged in to view bookings');
  }

  // Get provider profile
  const { data: profile, error: profileError } = await supabase
    .from('provider_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (profileError || !profile) {
    throw new Error('Provider profile not found');
  }

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      customer:users!bookings_customer_id_fkey(full_name, email, contact_number),
      package:service_packages!bookings_package_id_fkey(name)
    `)
    .eq('provider_id', profile.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching provider bookings:', error);
    throw new Error('Failed to fetch bookings');
  }

  return data || [];
};

// Provider confirms booking
export const confirmBooking = async (bookingId: string): Promise<Booking> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('You must be logged in');
  }

  // Get provider profile
  const { data: profile, error: profileError } = await supabase
    .from('provider_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (profileError || !profile) {
    throw new Error('Provider profile not found');
  }

  const { data, error } = await supabase
    .from('bookings')
    .update({ status: 'confirmed' })
    .eq('id', bookingId)
    .eq('provider_id', profile.id)
    .select()
    .single();

  if (error) {
    console.error('Error confirming booking:', error);
    throw new Error('Failed to confirm booking');
  }

  return data;
};

// Provider completes booking
export const completeBooking = async (bookingId: string): Promise<Booking> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('You must be logged in');
  }

  // Get provider profile
  const { data: profile, error: profileError } = await supabase
    .from('provider_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (profileError || !profile) {
    throw new Error('Provider profile not found');
  }

  const { data, error } = await supabase
    .from('bookings')
    .update({ status: 'completed' })
    .eq('id', bookingId)
    .eq('provider_id', profile.id)
    .select()
    .single();

  if (error) {
    console.error('Error completing booking:', error);
    throw new Error('Failed to complete booking');
  }

  return data;
};

/* =========================
   AVAILABILITY CHECKS
========================= */

// Check if a time slot is available
export const checkAvailability = async (
  providerId: string,
  serviceDate: string,
  serviceTime: string,
  durationHours: number
): Promise<boolean> => {
  const { data, error } = await supabase
    .rpc('is_time_slot_available', {
      p_provider_id: providerId,
      p_service_date: serviceDate,
      p_service_time: serviceTime,
      p_duration_hours: durationHours
    });

  if (error) {
    console.error('Error checking availability:', error);
    return false;
  }

  return data;
};

/* =========================
   STATISTICS
========================= */

export const getBookingStats = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('You must be logged in');
  }

  const { data, error } = await supabase
    .from('bookings')
    .select('status')
    .eq('customer_id', user.id);

  if (error) {
    console.error('Error fetching booking stats:', error);
    return {
      total: 0,
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0
    };
  }

  const stats = {
    total: data.length,
    pending: data.filter(b => b.status === 'pending').length,
    confirmed: data.filter(b => b.status === 'confirmed').length,
    completed: data.filter(b => b.status === 'completed').length,
    cancelled: data.filter(b => b.status === 'cancelled').length
  };

  return stats;
};
