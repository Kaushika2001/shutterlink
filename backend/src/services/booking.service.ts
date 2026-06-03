import { supabaseAdmin } from '../config/supabase';
import { Booking, CreateBookingPayload, BookingStatus } from '../types';
import { NotFoundError, ValidationError } from '../utils/errors';

export class BookingService {
  async createBooking(userId: string, payload: CreateBookingPayload): Promise<Booking> {
    // Fetch package to calculate price
    const { data: pkg, error: pkgError } = await supabaseAdmin
      .from('service_packages')
      .select('price')
      .eq('id', payload.package_id)
      .single();

    if (pkgError || !pkg) {
      throw new ValidationError('Selected package not found');
    }

    const totalPrice = pkg.price * payload.duration_hours;
    const depositAmount = Math.round(totalPrice * 0.5 * 100) / 100; // 50% deposit

    // Generate booking number
    const bookingNumber = `BK${Date.now()}`;

    // Create booking
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .insert([
        {
          booking_number: bookingNumber,
          customer_id: userId,
          provider_id: payload.provider_id,
          package_id: payload.package_id,
          status: 'pending',
          service_date: payload.service_date,
          service_time: payload.service_time,
          duration_hours: payload.duration_hours,
          location_type: payload.location_type,
          location_address: payload.location_address,
          special_requests: payload.special_requests,
          total_price: totalPrice,
          deposit_amount: depositAmount,
          deposit_paid: false,
        },
      ])
      .select()
      .single();

    if (error || !booking) {
      console.error('Failed to create booking:', JSON.stringify({ message: error?.message, details: error?.details, code: error?.code, hint: error?.hint }));
      throw new ValidationError('Failed to create booking');
    }

    return booking as Booking;
  }

  async getCustomerBookings(customerId: string, page: number = 1, limit: number = 20): Promise<Booking[]> {
    const offset = (page - 1) * limit;

    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('customer_id', customerId)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch bookings:', JSON.stringify({ message: error?.message, code: error?.code }));
      throw new ValidationError('Failed to fetch bookings');
    }

    return (bookings || []) as Booking[];
  }

  async getProviderBookings(providerId: string, page: number = 1, limit: number = 20): Promise<Booking[]> {
    const offset = (page - 1) * limit;

    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('provider_id', providerId)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      throw new ValidationError('Failed to fetch bookings');
    }

    return (bookings || []) as Booking[];
  }

  async getUpcomingBookings(userId: string, isProvider: boolean = false): Promise<Booking[]> {
    const field = isProvider ? 'provider_id' : 'customer_id';

    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq(field, userId)
      .in('status', ['pending', 'confirmed'])
      .gt('service_date', new Date().toISOString().split('T')[0])
      .order('service_date', { ascending: true });

    if (error) {
      throw new ValidationError('Failed to fetch upcoming bookings');
    }

    return (bookings || []) as Booking[];
  }

  async getBookingHistory(userId: string, isProvider: boolean = false): Promise<Booking[]> {
    const field = isProvider ? 'provider_id' : 'customer_id';

    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq(field, userId)
      .in('status', ['completed', 'cancelled'])
      .order('service_date', { ascending: false });

    if (error) {
      throw new ValidationError('Failed to fetch booking history');
    }

    return (bookings || []) as Booking[];
  }

  async getBookingById(bookingId: string): Promise<Booking> {
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      throw new NotFoundError('Booking not found');
    }

    return booking as Booking;
  }

  async updateBooking(bookingId: string, updates: Partial<Booking>): Promise<Booking> {
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .update(updates)
      .eq('id', bookingId)
      .select()
      .single();

    if (error || !booking) {
      console.error('Failed to update booking:', JSON.stringify({ message: error?.message, details: error?.details, code: error?.code, hint: error?.hint }));
      throw new ValidationError('Failed to update booking');
    }

    return booking as Booking;
  }

  async confirmBooking(bookingId: string): Promise<Booking> {
    return this.updateBooking(bookingId, { status: 'confirmed' as BookingStatus });
  }

  async completeBooking(bookingId: string): Promise<Booking> {
    return this.updateBooking(bookingId, { status: 'completed' as BookingStatus });
  }

  async cancelBooking(bookingId: string, reason: string, cancelledBy: string): Promise<Booking> {
    return this.updateBooking(bookingId, {
      status: 'cancelled' as BookingStatus,
      cancellation_reason: reason,
      cancelled_by: cancelledBy,
      cancelled_at: new Date().toISOString(),
    });
  }

  async rejectBooking(bookingId: string): Promise<Booking> {
    return this.updateBooking(bookingId, { status: 'rejected' as BookingStatus });
  }

  async checkAvailability(providerId: string, date: string, startTime: string, durationHours: number): Promise<boolean> {
    const { data: conflicts, error } = await supabaseAdmin
      .from('bookings')
      .select('service_time, duration_hours')
      .eq('provider_id', providerId)
      .eq('service_date', date)
      .in('status', ['pending', 'confirmed']);

    if (error) {
      throw new ValidationError('Failed to check availability');
    }

    // Check for time overlap
    const requestedStart = this.timeToMinutes(startTime);
    const requestedEnd = requestedStart + durationHours * 60;

    for (const booking of conflicts || []) {
      const existingStart = this.timeToMinutes(booking.service_time);
      const existingEnd = existingStart + (booking.duration_hours || 0) * 60;

      if (requestedStart < existingEnd && requestedEnd > existingStart) {
        return false;
      }
    }

    return true;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + (minutes || 0);
  }

  async getBookingStats(userId: string, isProvider: boolean = false): Promise<any> {
    const field = isProvider ? 'provider_id' : 'customer_id';

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select('status')
      .eq(field, userId);

    if (error) {
      throw new ValidationError('Failed to get booking stats');
    }

    const stats = {
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      rejected: 0,
    };

    (data || []).forEach((booking: any) => {
      stats[booking.status as BookingStatus]++;
    });

    return stats;
  }
}

export const bookingService = new BookingService();
