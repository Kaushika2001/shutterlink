import { isServiceRoleConfigured, supabaseAdmin } from '../config/supabase';
import { Booking, CreateBookingPayload, BookingStatus } from '../types';
import { NotFoundError, ValidationError } from '../utils/errors';
import { auditService } from './audit.service';
import { notificationService } from './notification.service';

interface EnrichedBooking extends Booking {
  provider_name?: string;
  provider_business_name?: string;
  customer_name?: string;
  package_name?: string;
}

export class BookingService {
  /** Resolve provider_profiles row from profile id or auth user id */
  private async resolveProviderProfile(providerIdOrUserId: string) {
    const { data: byProfileId } = await supabaseAdmin
      .from('provider_profiles')
      .select('id, is_verified, user_id')
      .eq('id', providerIdOrUserId)
      .maybeSingle();

    if (byProfileId) return byProfileId;

    const { data: byUserId } = await supabaseAdmin
      .from('provider_profiles')
      .select('id, is_verified, user_id')
      .eq('user_id', providerIdOrUserId)
      .maybeSingle();

    return byUserId || null;
  }

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

    const providerProfile = await this.resolveProviderProfile(payload.provider_id);
    if (!providerProfile) {
      throw new ValidationError('Provider not found');
    }

    const providerUserId = providerProfile.user_id;

    // Providers with published listings are bookable (sync flag for Explore badges)
    await supabaseAdmin
      .from('provider_profiles')
      .update({ is_verified: true, availability_status: 'available' })
      .eq('id', providerProfile.id);

    const totalPrice = pkg.price * payload.duration_hours;
    const depositAmount = Math.round(totalPrice * 0.5 * 100) / 100; // 50% deposit

    const available = await this.checkAvailability(
      providerUserId,
      payload.service_date,
      payload.service_time,
      payload.duration_hours
    );
    if (!available) {
      throw new ValidationError('Selected date and time are not available');
    }

    const bookingNumber = `BK${Date.now()}`;

    // Create booking
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .insert([
        {
          booking_number: bookingNumber,
          customer_id: userId,
          provider_id: providerUserId,
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
      if (error?.code === '42501' || !isServiceRoleConfigured()) {
        throw new ValidationError(
          'Booking could not be saved: backend needs SUPABASE_SERVICE_ROLE_KEY in backend/.env. ' +
            'Restart the API after adding it (Supabase → Settings → API → service_role).'
        );
      }
      throw new ValidationError(error?.message || 'Failed to create booking');
    }

    await auditService.log({
      userId,
      action: 'booking_created',
      entityType: 'booking',
      entityId: booking.id,
      details: { booking_number: bookingNumber, provider_id: payload.provider_id },
    });

    try {
      await notificationService.createNotification({
        user_id: providerUserId,
        type: 'booking_created',
        title: 'New booking request',
        message: `New booking ${bookingNumber} awaiting payment`,
        data: { booking_id: booking.id },
      });
      await notificationService.createNotification({
        user_id: userId,
        type: 'booking_created',
        title: 'Booking created',
        message: `Your booking ${bookingNumber} was created. Complete payment to confirm.`,
        data: { booking_id: booking.id },
      });
    } catch {
      /* notifications optional */
    }

    return booking as Booking;
  }

  private async enrichCustomerBookings(bookings: EnrichedBooking[]): Promise<EnrichedBooking[]> {
    if (bookings.length === 0) return bookings;

    const providerIds = [...new Set(bookings.map((b) => b.provider_id))];
    const packageIds = [...new Set(bookings.map((b) => b.package_id).filter(Boolean))] as string[];

    const { data: providers } = await supabaseAdmin
      .from('provider_profiles')
      .select('user_id, business_name')
      .in('user_id', providerIds);

    const packageQuery =
      packageIds.length > 0
        ? supabaseAdmin.from('service_packages').select('id, name').in('id', packageIds)
        : Promise.resolve({ data: [] as { id: string; name: string }[] });

    const { data: users } = await supabaseAdmin.from('users').select('id, name').in('id', providerIds);

    const { data: packages } = await packageQuery;

    const providerMap = new Map((providers || []).map((p) => [p.user_id, p]));
    const packageMap = new Map((packages || []).map((p) => [p.id, p]));
    const userMap = new Map((users || []).map((u) => [u.id, u]));

    for (const booking of bookings) {
      const providerProfile = providerMap.get(booking.provider_id);
      const pkg = booking.package_id ? packageMap.get(booking.package_id) : null;
      const user = userMap.get(booking.provider_id);

      booking.provider_business_name = providerProfile?.business_name || null;
      booking.package_name = pkg?.name || null;
      booking.provider_name = user?.name || null;
    }

    return bookings;
  }

  async getCustomerBookings(customerId: string, page: number = 1, limit: number = 50): Promise<EnrichedBooking[]> {
    const offset = (page - 1) * limit;

    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('customer_id', customerId)
      .range(offset, offset + limit - 1)
      .order('service_date', { ascending: false });

    if (error) {
      console.error('Failed to fetch bookings:', JSON.stringify({ message: error?.message, code: error?.code }));
      throw new ValidationError('Failed to fetch bookings');
    }

    return this.enrichCustomerBookings((bookings || []) as EnrichedBooking[]);
  }

  async getProviderBookings(providerId: string, page: number = 1, limit: number = 20): Promise<EnrichedBooking[]> {
    const offset = (page - 1) * limit;

    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('provider_id', providerId)
      .range(offset, offset + limit - 1)
      .order('service_date', { ascending: false });

    if (error) {
      throw new ValidationError('Failed to fetch bookings');
    }

    const result = (bookings || []) as EnrichedBooking[];
    if (result.length === 0) return result;

    const customerIds = [...new Set(result.map(b => b.customer_id))];
    const packageIds = [...new Set(result.map(b => b.package_id))];

    const { data: packages } = await supabaseAdmin
      .from('service_packages')
      .select('id, name')
      .in('id', packageIds);

    const { data: customers } = await supabaseAdmin
      .from('users')
      .select('id, name')
      .in('id', customerIds);

    const customerMap = new Map((customers || []).map(c => [c.id, c]));
    const packageMap = new Map((packages || []).map(p => [p.id, p]));

    for (const booking of result) {
      const cust = customerMap.get(booking.customer_id);
      const pkg = packageMap.get(booking.package_id);

      booking.customer_name = cust?.name || null;
      booking.package_name = pkg?.name || null;
    }

    return result;
  }

  async getUpcomingBookings(userId: string, isProvider: boolean = false): Promise<EnrichedBooking[]> {
    const field = isProvider ? 'provider_id' : 'customer_id';

    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq(field, userId)
      .in('status', ['pending', 'confirmed'])
      .order('service_date', { ascending: true });

    if (error) {
      throw new ValidationError('Failed to fetch upcoming bookings');
    }

    if (isProvider) {
      return (bookings || []) as EnrichedBooking[];
    }

    return this.enrichCustomerBookings((bookings || []) as EnrichedBooking[]);
  }

  async getBookingHistory(userId: string, isProvider: boolean = false): Promise<EnrichedBooking[]> {
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

    if (isProvider) {
      return (bookings || []) as EnrichedBooking[];
    }

    return this.enrichCustomerBookings((bookings || []) as EnrichedBooking[]);
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
      if (error?.message?.includes('rejected') && updates.status === 'rejected') {
        throw new ValidationError(
          'Rejected status is not in the database yet. Run migration 020_add_rejected_booking_status.sql in Supabase SQL Editor.'
        );
      }
      throw new ValidationError(error?.message || 'Failed to update booking');
    }

    return booking as Booking;
  }

  private assertProviderOwnsBooking(booking: Booking, providerUserId: string): void {
    if (booking.provider_id !== providerUserId) {
      throw new ValidationError('You can only manage your own bookings');
    }
  }

  async confirmBooking(bookingId: string, providerUserId: string): Promise<Booking> {
    const booking = await this.getBookingById(bookingId);
    this.assertProviderOwnsBooking(booking, providerUserId);

    if (booking.status !== 'pending') {
      throw new ValidationError('Only pending bookings can be accepted');
    }

    const updated = await this.updateBooking(bookingId, { status: 'confirmed' as BookingStatus });

    try {
      await notificationService.createNotification({
        user_id: booking.customer_id,
        type: 'booking_confirmed',
        title: 'Booking accepted',
        message: `Your booking ${booking.booking_number || bookingId} was accepted by the provider`,
        data: { booking_id: booking.id },
      });
    } catch {
      /* optional */
    }

    return updated;
  }

  async completeBooking(bookingId: string, providerUserId: string): Promise<Booking> {
    const booking = await this.getBookingById(bookingId);
    this.assertProviderOwnsBooking(booking, providerUserId);

    if (booking.status !== 'confirmed') {
      throw new ValidationError('Only confirmed bookings can be marked complete');
    }

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

  async rejectBooking(bookingId: string, providerUserId: string): Promise<Booking> {
    const booking = await this.getBookingById(bookingId);
    this.assertProviderOwnsBooking(booking, providerUserId);

    if (booking.status !== 'pending') {
      throw new ValidationError('Only pending bookings can be rejected');
    }

    return this.updateBooking(bookingId, { status: 'rejected' as BookingStatus });
  }

  async checkAvailability(providerId: string, date: string, startTime: string, durationHours: number): Promise<boolean> {
    const { data: blocked } = await supabaseAdmin
      .from('blocked_dates')
      .select('id')
      .eq('provider_id', providerId)
      .eq('blocked_date', date)
      .maybeSingle();

    if (blocked) return false;

    const dayOfWeek = new Date(`${date}T12:00:00`).getDay();
    const { data: schedules } = await supabaseAdmin
      .from('availability_schedules')
      .select('start_time, end_time, is_active')
      .eq('provider_id', providerId)
      .eq('day_of_week', dayOfWeek);

    if (schedules && schedules.length > 0) {
      const activeSchedules = schedules.filter((s: any) => s.is_active !== false);
      if (activeSchedules.length > 0) {
        const requestedStart = this.timeToMinutes(startTime);
        const requestedEnd = requestedStart + durationHours * 60;
        const inSchedule = activeSchedules.some((s: any) => {
          const schedStart = this.timeToMinutes(s.start_time);
          const schedEnd = this.timeToMinutes(s.end_time);
          return requestedStart >= schedStart && requestedEnd <= schedEnd;
        });
        if (!inSchedule) return false;
      }
    }

    const { data: conflicts, error } = await supabaseAdmin
      .from('bookings')
      .select('service_time, duration_hours')
      .eq('provider_id', providerId)
      .eq('service_date', date)
      .in('status', ['pending', 'confirmed']);

    if (error) {
      throw new ValidationError('Failed to check availability');
    }

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
