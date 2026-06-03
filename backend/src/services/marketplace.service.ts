import { supabaseAdmin } from '../config/supabase';
import { portfolioService } from './portfolio.service';
import { NotFoundError, ValidationError } from '../utils/errors';

export class MarketplaceService {
  // ==================== Packages ====================
  async getProviderPackages(providerId: string) {
    const { data, error } = await supabaseAdmin
      .from('service_packages')
      .select('*')
      .eq('provider_id', providerId)
      .order('price');
    if (error) throw new ValidationError(error.message);
    return data || [];
  }

  async searchAllPackages() {
    const { data, error } = await supabaseAdmin
      .from('service_packages')
      .select('*, provider:provider_profiles(*)')
      .eq('is_active', true)
      .order('price');
    if (error) throw new ValidationError(error.message);
    return data || [];
  }

  async getPackageById(packageId: string) {
    const { data, error } = await supabaseAdmin
      .from('service_packages')
      .select('*, provider:provider_profiles(*)')
      .eq('id', packageId)
      .single();
    if (error || !data) throw new NotFoundError('Package not found');
    return data;
  }

  async createPackage(payload: any) {
    const { data, error } = await supabaseAdmin.from('service_packages').insert(payload).select().single();
    if (error) throw new ValidationError(error.message);
    return data;
  }

  async updatePackage(id: string, payload: any) {
    const { data, error } = await supabaseAdmin.from('service_packages').update(payload).eq('id', id).select().single();
    if (error) throw new ValidationError(error.message);
    return data;
  }

  async deletePackage(id: string) {
    const { error } = await supabaseAdmin.from('service_packages').delete().eq('id', id);
    if (error) throw new ValidationError(error.message);
  }

  // ==================== Portfolio ====================
  async getProviderPortfolio(providerId: string) {
    return portfolioService.getProviderPortfolio(providerId);
  }

  async createPortfolioItem(
    userId: string,
    payload: {
      provider_id: string;
      image_url: string;
      title?: string;
      description?: string;
      category?: string;
      is_featured?: boolean;
      display_order?: number;
    }
  ) {
    return portfolioService.createPortfolioItem(userId, payload);
  }

  // ==================== Payments ====================
  async getUserPayments(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('payer_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw new ValidationError(error.message);
    return data || [];
  }

  async createPayment(userId: string, payload: any) {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .insert({ ...payload, payer_id: userId, status: payload.status || 'pending' })
      .select()
      .single();
    if (error) throw new ValidationError(error.message);
    return data;
  }

  // ==================== Reviews ====================
  async getMyReviews(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .select('*')
      .eq('reviewer_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw new ValidationError(error.message);
    return data || [];
  }

  async getProviderReviews(providerId: string) {
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .select('*')
      .eq('provider_id', providerId)
      .eq('is_visible', true)
      .order('created_at', { ascending: false });
    if (error) throw new ValidationError(error.message);
    return data || [];
  }

  async getPendingReviews(userId: string) {
    const { data: completedBookings, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('id, provider_id, service_date, booking_number')
      .eq('customer_id', userId)
      .eq('status', 'completed');
    if (bookingError) throw new ValidationError(bookingError.message);

    const bookingIds = (completedBookings || []).map((b: any) => b.id);
    if (bookingIds.length === 0) return [];

    const { data: existingReviews, error: reviewError } = await supabaseAdmin
      .from('reviews')
      .select('booking_id')
      .in('booking_id', bookingIds);
    if (reviewError) throw new ValidationError(reviewError.message);

    const reviewed = new Set((existingReviews || []).map((r: any) => r.booking_id));
    return (completedBookings || []).filter((b: any) => !reviewed.has(b.id));
  }

  async createReview(userId: string, payload: any) {
    const { booking_id } = payload;
    if (!booking_id) throw new ValidationError('booking_id is required');

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('id, customer_id, status')
      .eq('id', booking_id)
      .single();
    if (bookingError || !booking) throw new NotFoundError('Booking not found');
    if (booking.customer_id !== userId) throw new ValidationError('Not your booking');
    if (booking.status !== 'completed') throw new ValidationError('Only completed bookings can be reviewed');

    const insertPayload = { ...payload, reviewer_id: userId, would_recommend: payload.would_recommend ?? true };
    const { data, error } = await supabaseAdmin.from('reviews').insert(insertPayload).select().single();
    if (error) throw new ValidationError(error.message);
    return data;
  }

  // ==================== Messages ====================
  async sendMessage(userId: string, payload: any) {
    const insertPayload = { ...payload, sender_id: userId };
    const { data, error } = await supabaseAdmin.from('messages').insert(insertPayload).select().single();
    if (error) throw new ValidationError(error.message);
    return data;
  }

  async getBookingMessages(bookingId: string) {
    const { data, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true });
    if (error) throw new ValidationError(error.message);
    return data || [];
  }

  async getConversations(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    if (error) throw new ValidationError(error.message);
    return data || [];
  }

  async getUnreadMessageCount(userId: string) {
    const { count, error } = await supabaseAdmin
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('is_read', false);
    if (error) throw new ValidationError(error.message);
    return { count: count || 0 };
  }

  async markMessageRead(id: string) {
    const { data, error } = await supabaseAdmin
      .from('messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new ValidationError(error.message);
    return data;
  }

  async markBookingMessagesRead(bookingId: string, userId: string) {
    const { error } = await supabaseAdmin
      .from('messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('booking_id', bookingId)
      .eq('recipient_id', userId)
      .eq('is_read', false);
    if (error) throw new ValidationError(error.message);
  }

  async deleteMessage(id: string) {
    const { error } = await supabaseAdmin.from('messages').delete().eq('id', id);
    if (error) throw new ValidationError(error.message);
  }

  // ==================== Notifications ====================
  async createNotification(payload: any) {
    const { data, error } = await supabaseAdmin.from('notifications').insert(payload).select().single();
    if (error) throw new ValidationError(error.message);
    return data;
  }

  async getNotifications(userId: string, limit: number, offset: number) {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });
    if (error) throw new ValidationError(error.message);
    return data || [];
  }

  async getUnreadNotifications(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false });
    if (error) throw new ValidationError(error.message);
    return data || [];
  }

  async getUnreadNotificationCount(userId: string) {
    const { count, error } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (error) throw new ValidationError(error.message);
    return { count: count || 0 };
  }

  async markNotificationRead(id: string) {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new ValidationError(error.message);
    return data;
  }

  async markAllNotificationsRead(userId: string) {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (error) throw new ValidationError(error.message);
  }

  async deleteNotification(id: string) {
    const { error } = await supabaseAdmin.from('notifications').delete().eq('id', id);
    if (error) throw new ValidationError(error.message);
  }

  async deleteAllNotifications(userId: string) {
    const { error } = await supabaseAdmin.from('notifications').delete().eq('user_id', userId);
    if (error) throw new ValidationError(error.message);
  }

  // ==================== Availability ====================
  async getProviderSchedules(providerId: string) {
    const { data, error } = await supabaseAdmin
      .from('availability_schedules')
      .select('*')
      .eq('provider_id', providerId)
      .order('day_of_week')
      .order('start_time');
    if (error) throw new ValidationError(error.message);
    return data || [];
  }

  async updateProviderSchedules(providerId: string, schedules: any[]) {
    await supabaseAdmin.from('availability_schedules').delete().eq('provider_id', providerId);
    const { data, error } = await supabaseAdmin.from('availability_schedules').insert(schedules).select();
    if (error) throw new ValidationError(error.message);
    return data || [];
  }

  async updateSchedule(id: string, payload: any) {
    const { data, error } = await supabaseAdmin.from('availability_schedules').update(payload).eq('id', id).select().single();
    if (error) throw new ValidationError(error.message);
    return data;
  }

  async getProviderBlockedDates(providerId: string) {
    const { data, error } = await supabaseAdmin
      .from('blocked_dates')
      .select('*')
      .eq('provider_id', providerId)
      .order('blocked_date');
    if (error) throw new ValidationError(error.message);
    return data || [];
  }

  async createBlockedDate(payload: any) {
    const { data, error } = await supabaseAdmin.from('blocked_dates').insert(payload).select().single();
    if (error) throw new ValidationError(error.message);
    return data;
  }

  async deleteBlockedDate(id: string) {
    const { error } = await supabaseAdmin.from('blocked_dates').delete().eq('id', id);
    if (error) throw new ValidationError(error.message);
  }

  // ==================== Public ====================
  async getPublicProviderDetails(providerId: string) {
    const { data, error } = await supabaseAdmin
      .from('provider_profiles')
      .select(
        `*, user:users(id,name,email), portfolio_items(*), service_packages(*)`
      )
      .eq('id', providerId)
      .single();
    if (error || !data) throw new NotFoundError('Provider not found');
    const packages = (data.service_packages || []).filter((p: any) => p.is_active !== false);
    return { ...data, service_packages: packages };
  }

  async getPublicPortfolios() {
    const { data: items, error: itemError } = await supabaseAdmin
      .from('portfolio_items')
      .select('*')
      .order('created_at', { ascending: false });
    if (itemError) throw new ValidationError(itemError.message);

    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('provider_profiles')
      .select('id, user_id, business_name, service_type');
    if (profileError) throw new ValidationError(profileError.message);

    return { items: items || [], profiles: profiles || [] };
  }

  async getPublicPortfolioAlbums() {
    const { data: items, error: itemError } = await supabaseAdmin
      .from('portfolio_items')
      .select('*')
      .order('display_order', { ascending: true });
    if (itemError) throw new ValidationError(itemError.message);

    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('provider_profiles')
      .select(
        'id, user_id, business_name, service_type, average_rating, is_verified, coverage_areas, bio, availability_status'
      );
    if (profileError) throw new ValidationError(profileError.message);

    const { data: packages, error: packageError } = await supabaseAdmin
      .from('service_packages')
      .select('id, provider_id, name, price, service_type')
      .eq('is_active', true);
    if (packageError) throw new ValidationError(packageError.message);

    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
    const packageCountByProvider = new Map<string, number>();
    for (const pkg of packages || []) {
      packageCountByProvider.set(
        pkg.provider_id,
        (packageCountByProvider.get(pkg.provider_id) || 0) + 1
      );
    }

    const itemsByProvider = new Map<string, any[]>();
    for (const item of items || []) {
      const list = itemsByProvider.get(item.provider_id) || [];
      list.push(item);
      itemsByProvider.set(item.provider_id, list);
    }

    const albums = Array.from(itemsByProvider.entries())
      .map(([providerId, providerItems]) => {
        const provider = profileMap.get(providerId);
        if (!provider) return null;

        const featured = providerItems.find((i: any) => i.is_featured);
        const cover = featured || providerItems[0];
        const categories = [
          ...new Set(providerItems.map((i: any) => i.category).filter(Boolean)),
        ] as string[];

        return {
          provider_id: providerId,
          provider,
          cover_image_url: cover?.image_url || null,
          cover_title: cover?.title || null,
          item_count: providerItems.length,
          package_count: packageCountByProvider.get(providerId) || 0,
          featured_count: providerItems.filter((i: any) => i.is_featured).length,
          categories,
          preview_items: providerItems.slice(0, 4),
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.item_count - a.item_count);

    return { albums, total: albums.length };
  }
}

export const marketplaceService = new MarketplaceService();
