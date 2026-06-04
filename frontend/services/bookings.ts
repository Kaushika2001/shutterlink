import { apiRequest } from '@/lib/api';
import { getUserPayments } from '@/services/payments';

/* =========================
   TYPES
========================= */

export interface Booking {
  id: string;
  booking_number?: string;
  customer_id: string;
  provider_id: string;
  package_id: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected';
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
  return await apiRequest<Booking>(
    '/bookings',
    {
      method: 'POST',
      body: JSON.stringify(bookingData),
    },
    true
  );
};

/* =========================
   GET BOOKINGS
========================= */

// Get all bookings for the current user (customer)
export const getCustomerBookings = async (): Promise<Booking[]> => {
  return await apiRequest<Booking[]>('/bookings/customer', {}, true);
};

// Get upcoming bookings for the current user
export const getUpcomingBookings = async (): Promise<Booking[]> => {
  return await apiRequest<Booking[]>('/bookings/upcoming?isProvider=false', {}, true);
};

// Get booking history (completed or cancelled)
export const getBookingHistory = async (): Promise<Booking[]> => {
  return await apiRequest<Booking[]>('/bookings/history?isProvider=false', {}, true);
};

// Get bookings that need payment
export const getPendingPaymentBookings = async (): Promise<Booking[]> => {
  const [bookings, payments] = await Promise.all([getCustomerBookings(), getUserPayments()]);
  return bookings.filter(
    (b) =>
      b.status === 'pending' &&
      !b.deposit_paid &&
      !payments.some((p) => p.booking_id === b.id && p.status === 'completed')
  );
};

// Get single booking by ID
export const getBookingById = async (bookingId: string): Promise<Booking> => {
  return await apiRequest<Booking>(`/bookings/${bookingId}`, {}, true);
};

/* =========================
   UPDATE BOOKING
========================= */

export const updateBooking = async (
  bookingId: string,
  updates: UpdateBookingData
): Promise<Booking> => {
  if (updates.status === 'cancelled') {
    return await cancelBooking(bookingId, updates.cancellation_reason);
  }
  throw new Error('Unsupported update operation');
};

/* =========================
   CANCEL BOOKING
========================= */

export const cancelBooking = async (
  bookingId: string,
  reason?: string
): Promise<Booking> => {
  return await apiRequest<Booking>(
    `/bookings/${bookingId}/cancel`,
    {
      method: 'PUT',
      body: JSON.stringify({ reason: reason || 'Cancelled by customer' }),
    },
    true
  );
};

/* =========================
   PROVIDER BOOKING MANAGEMENT
========================= */

// Get all bookings for a provider
export const getProviderBookings = async (): Promise<Booking[]> => {
  return await apiRequest<Booking[]>('/bookings/provider', {}, true);
};

// Provider confirms booking
export const confirmBooking = async (bookingId: string): Promise<Booking> => {
  return await apiRequest<Booking>(`/bookings/${bookingId}/confirm`, { method: 'PUT' }, true);
};

// Provider completes booking
export const completeBooking = async (bookingId: string): Promise<Booking> => {
  return await apiRequest<Booking>(`/bookings/${bookingId}/complete`, { method: 'PUT' }, true);
};

// Provider rejects booking
export const rejectBooking = async (bookingId: string): Promise<Booking> => {
  return await apiRequest<Booking>(`/bookings/${bookingId}/reject`, { method: 'PUT' }, true);
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
  const query = new URLSearchParams({
    providerId,
    date: serviceDate,
    startTime: serviceTime,
    durationHours: String(durationHours),
  });
  const data = await apiRequest<{ available: boolean }>(`/bookings/availability?${query.toString()}`);
  return data.available;
};

/* =========================
   STATISTICS
========================= */

export const getBookingStats = async () => {
  return await apiRequest<any>('/bookings/stats?isProvider=false', {}, true);
};
