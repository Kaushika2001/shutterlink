import { isServiceRoleConfigured, supabaseAdmin } from '../config/supabase';
import { Booking, CreateBookingPayload, BookingStatus } from '../types';
import { NotFoundError, ValidationError } from '../utils/errors';
import { isMissingColumnError } from '../utils/supabaseErrors';
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

    if (!providerProfile.is_verified) {
      throw new ValidationError('This provider is not verified yet and cannot accept bookings');
    }

    const providerUserId = providerProfile.user_id;

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
      if (!isServiceRoleConfigured()) {
        throw new ValidationError(
          'Booking could not be saved: add SUPABASE_SERVICE_ROLE_KEY to backend/.env ' +
            '(Supabase → Settings → API → service_role), then restart the API.'
        );
      }
      if (error?.code === '42501') {
        throw new ValidationError(
          'Booking blocked by database security (RLS). Restart the backend after saving backend/.env, ' +
            'and run backend/supabase/RUN_BOOKINGS_RLS_SETUP.sql in the Supabase SQL Editor.'
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

  private normalizeBookingRow(row: Record<string, unknown>): EnrichedBooking {
    const booking = { ...row } as unknown as EnrichedBooking;
    const legacy = row as Record<string, unknown>;
    if (!booking.service_date && legacy.booking_date) {
      booking.service_date = String(legacy.booking_date);
    }
    if (!booking.service_time && legacy.start_time) {
      booking.service_time = String(legacy.start_time);
    }
    if (!booking.location_address && legacy.location) {
      booking.location_address = String(legacy.location);
    }
    return booking;
  }

  private async listBookingsByField(
    field: 'customer_id' | 'provider_id',
    userId: string,
    options?: { page?: number; limit?: number; statuses?: string[] }
  ): Promise<EnrichedBooking[]> {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 50;
    const offset = (page - 1) * limit;
    const orderColumns = ['service_date', 'booking_date', 'created_at'];
    let lastError: { message?: string; code?: string; details?: string } | null = null;
    let rows: Record<string, unknown>[] | null = null;

    for (const orderCol of orderColumns) {
      let query = supabaseAdmin.from('bookings').select('*').eq(field, userId);
      if (options?.statuses?.length) {
        query = query.in('status', options.statuses);
      }
      const { data, error } = await query
        .order(orderCol, { ascending: false })
        .range(offset, offset + limit - 1);

      if (!error) {
        rows = (data || []) as Record<string, unknown>[];
        break;
      }
      lastError = error;
      if (!isMissingColumnError(error)) break;
    }

    if (rows === null) {
      console.error('Failed to fetch bookings:', JSON.stringify(lastError));
      throw new ValidationError(lastError?.message || 'Failed to fetch bookings');
    }

    return rows.map((r) => this.normalizeBookingRow(r));
  }

  private async enrichCustomerBookings(bookings: EnrichedBooking[]): Promise<EnrichedBooking[]> {
    if (bookings.length === 0) return bookings;

    const providerIds = [...new Set(bookings.map((b) => b.provider_id))];
    const packageIds = [...new Set(bookings.map((b) => b.package_id).filter(Boolean))] as string[];

    const [{ data: providersByUser }, { data: providersByProfile }] = await Promise.all([
      supabaseAdmin.from('provider_profiles').select('id, user_id, business_name').in('user_id', providerIds),
      supabaseAdmin.from('provider_profiles').select('id, user_id, business_name').in('id', providerIds),
    ]);

    const packageQuery =
      packageIds.length > 0
        ? supabaseAdmin.from('service_packages').select('id, name').in('id', packageIds)
        : Promise.resolve({ data: [] as { id: string; name: string }[] });

    const providerUserIds = [
      ...new Set(
        [...(providersByUser || []), ...(providersByProfile || [])].map((p) => p.user_id)
      ),
      ...providerIds,
    ];
    const { data: users } = await supabaseAdmin.from('users').select('id, name').in('id', providerUserIds);

    const { data: packages } = await packageQuery;

    const providerByUserId = new Map((providersByUser || []).map((p) => [p.user_id, p]));
    const providerByProfileId = new Map((providersByProfile || []).map((p) => [p.id, p]));
    const packageMap = new Map((packages || []).map((p) => [p.id, p]));
    const userMap = new Map((users || []).map((u) => [u.id, u]));

    for (const booking of bookings) {
      const byUser = providerByUserId.get(booking.provider_id);
      const byProfile = providerByProfileId.get(booking.provider_id);
      const providerUserId = byUser?.user_id || byProfile?.user_id || booking.provider_id;
      const pkg = booking.package_id ? packageMap.get(booking.package_id) : null;
      const user = userMap.get(providerUserId);

      booking.provider_business_name = byUser?.business_name || byProfile?.business_name || null;
      booking.package_name = pkg?.name || null;
      booking.provider_name = user?.name || null;
    }

    return bookings;
  }

  async getCustomerBookings(customerId: string, page: number = 1, limit: number = 50): Promise<EnrichedBooking[]> {
    const bookings = await this.listBookingsByField('customer_id', customerId, { page, limit });
    return this.enrichCustomerBookings(bookings);
  }

  async getProviderBookings(providerId: string, page: number = 1, limit: number = 50): Promise<EnrichedBooking[]> {
    const providerUserId = (await this.resolveProviderProfile(providerId))?.user_id || providerId;
    const result = await this.listBookingsByField('provider_id', providerUserId, { page, limit });
    if (result.length === 0) return result;

    const customerIds = [...new Set(result.map((b) => b.customer_id).filter(Boolean))];
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
    const lookupId = isProvider
      ? (await this.resolveProviderProfile(userId))?.user_id || userId
      : userId;
    const bookings = await this.listBookingsByField(field, lookupId, {
      limit: 100,
      statuses: ['pending', 'confirmed'],
    });

    if (isProvider) return bookings;
    return this.enrichCustomerBookings(bookings);
  }

  async getBookingHistory(userId: string, isProvider: boolean = false): Promise<EnrichedBooking[]> {
    const field = isProvider ? 'provider_id' : 'customer_id';
    const lookupId = isProvider
      ? (await this.resolveProviderProfile(userId))?.user_id || userId
      : userId;
    const bookings = await this.listBookingsByField(field, lookupId, {
      limit: 100,
      statuses: ['completed', 'cancelled', 'rejected'],
    });

    if (isProvider) return bookings;
    return this.enrichCustomerBookings(bookings);
  }

  async getBookingById(bookingId: string, requesterId?: string): Promise<EnrichedBooking> {
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      throw new NotFoundError('Booking not found');
    }

    if (requesterId) {
      const providerUserId = await this.resolveProviderProfile(booking.provider_id);
      const ownerProviderId = providerUserId?.user_id || booking.provider_id;
      const isCustomer = booking.customer_id === requesterId;
      const isProvider = ownerProviderId === requesterId;
      if (!isCustomer && !isProvider) {
        throw new ValidationError('You do not have access to this booking');
      }
    }

    const [enriched] = await this.enrichCustomerBookings([
      this.normalizeBookingRow(booking as Record<string, unknown>),
    ]);
    return enriched;
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

    const updated = await this.updateBooking(bookingId, { status: 'completed' as BookingStatus });

    try {
      const balance =
        Math.max(
          0,
          Math.round((Number(booking.total_price) - Number(booking.deposit_amount || 0)) * 100) / 100
        );
      if (booking.deposit_paid && balance > 0 && !booking.balance_paid) {
        await notificationService.createNotification({
          user_id: booking.customer_id,
          type: 'payment_due',
          title: 'Balance payment due',
          message: `Your shoot is complete. Pay the remaining LKR ${balance.toLocaleString()} online or at the shoot location from Payments.`,
          data: { booking_id: booking.id, amount: balance, payment_type: 'balance' },
        });
      }
    } catch {
      /* optional */
    }

    return updated;
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
