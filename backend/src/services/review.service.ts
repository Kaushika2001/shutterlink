import { supabaseAdmin } from '../config/supabase';
import { NotFoundError, ValidationError } from '../utils/errors';
import {
  isMissingColumnError,
  isMissingTableError,
  REVIEWS_SETUP_HINT,
} from '../utils/supabaseErrors';
import { notificationService } from './notification.service';

export class ReviewService {
  private async resolveProviderUserId(providerIdOrUserId: string): Promise<string> {
    const { data: byProfile } = await supabaseAdmin
      .from('provider_profiles')
      .select('user_id')
      .eq('id', providerIdOrUserId)
      .maybeSingle();

    if (byProfile?.user_id) return byProfile.user_id;

    const { data: byUser } = await supabaseAdmin
      .from('provider_profiles')
      .select('user_id')
      .eq('user_id', providerIdOrUserId)
      .maybeSingle();

    return byUser?.user_id || providerIdOrUserId;
  }

  private async getBookingIdsForProvider(providerUserId: string): Promise<string[]> {
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select('id')
      .eq('provider_id', providerUserId);

    if (error) return [];
    return (data || []).map((b) => b.id);
  }

  /** Load reviews for a provider when provider_id column may be missing */
  private async fetchReviewsForProvider(providerUserId: string): Promise<any[]> {
    const byProvider = await supabaseAdmin
      .from('reviews')
      .select('*')
      .eq('provider_id', providerUserId)
      .order('created_at', { ascending: false });

    if (!byProvider.error) return byProvider.data || [];

    if (isMissingTableError(byProvider.error)) return [];

    if (isMissingColumnError(byProvider.error)) {
      const bookingIds = await this.getBookingIdsForProvider(providerUserId);
      if (bookingIds.length === 0) return [];

      const byBooking = await supabaseAdmin
        .from('reviews')
        .select('*')
        .in('booking_id', bookingIds)
        .order('created_at', { ascending: false });

      if (byBooking.error) {
        if (isMissingTableError(byBooking.error)) return [];
        throw new ValidationError(byBooking.error.message || 'Failed to fetch reviews');
      }

      const rows = byBooking.data || [];
      return rows.map((r) => ({
        ...r,
        provider_id: r.provider_id || providerUserId,
        customer_id: r.customer_id || r.reviewer_id,
      }));
    }

    throw new ValidationError(byProvider.error.message || 'Failed to fetch reviews');
  }

  private async attachProviderIdFromBookings(reviews: any[]): Promise<any[]> {
    if (!reviews.length) return reviews;

    const needsProvider = reviews.some((r) => !r.provider_id);
    if (!needsProvider) return reviews;

    const bookingIds = [...new Set(reviews.map((r) => r.booking_id).filter(Boolean))];
    const { data: bookings } = await supabaseAdmin
      .from('bookings')
      .select('id, provider_id')
      .in('id', bookingIds);

    const bookingMap = new Map((bookings || []).map((b) => [b.id, b.provider_id]));

    return reviews.map((r) => ({
      ...r,
      provider_id: r.provider_id || bookingMap.get(r.booking_id) || null,
      customer_id: r.customer_id || r.reviewer_id,
    }));
  }

  private async enrichReviews(reviews: any[]) {
    if (!reviews.length) return [];

    const withProvider = await this.attachProviderIdFromBookings(reviews);

    const customerIds = [
      ...new Set(
        withProvider.map((r) => r.customer_id || r.reviewer_id).filter(Boolean) as string[]
      ),
    ];

    const userMap = new Map<string, string>();
    if (customerIds.length > 0) {
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, name')
        .in('id', customerIds);
      for (const u of users || []) {
        userMap.set(u.id, u.name);
      }
    }

    return withProvider.map((r) => {
      const customerId = r.customer_id || r.reviewer_id;
      const displayName = r.is_anonymous
        ? 'Anonymous'
        : userMap.get(customerId) || 'Customer';

      return {
        ...r,
        customer_id: customerId,
        customer_name: displayName,
        reviewer_name: displayName,
      };
    });
  }

  async getProviderReviews(providerId: string) {
    const providerUserId = await this.resolveProviderUserId(providerId);
    const data = await this.fetchReviewsForProvider(providerUserId);
    const filtered = data.filter((r: any) => r.is_flagged !== true);
    return this.enrichReviews(filtered);
  }

  async getUserReviews(userId: string) {
    let { data, error } = await supabaseAdmin
      .from('reviews')
      .select('*')
      .eq('customer_id', userId)
      .order('created_at', { ascending: false });

    if (error && isMissingColumnError(error)) {
      const fallback = await supabaseAdmin
        .from('reviews')
        .select('*')
        .eq('reviewer_id', userId)
        .order('created_at', { ascending: false });

      if (fallback.error) {
        if (isMissingTableError(fallback.error)) return [];
        throw new ValidationError(fallback.error.message || 'Failed to fetch reviews');
      }
      data = fallback.data;
      error = null;
    }

    if (error) {
      if (isMissingTableError(error)) return [];
      throw new ValidationError(error.message || 'Failed to fetch reviews');
    }

    return this.enrichUserReviews(data || []);
  }

  private async enrichUserReviews(reviews: any[]) {
    const enriched = await this.enrichReviews(reviews);
    const providerUserIds = [
      ...new Set(enriched.map((r) => r.provider_id).filter(Boolean) as string[]),
    ];
    if (providerUserIds.length === 0) return enriched;

    const { data: profiles } = await supabaseAdmin
      .from('provider_profiles')
      .select('user_id, business_name')
      .in('user_id', providerUserIds);

    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

    return enriched.map((review) => ({
      ...review,
      provider_name: profileMap.get(review.provider_id)?.business_name || null,
    }));
  }

  private async enrichPendingBookings(bookings: any[]) {
    if (!bookings.length) return [];

    const providerKeys = [...new Set(bookings.map((b) => b.provider_id))];
    const resolved = new Map<
      string,
      { userId: string; profileId: string | null; businessName: string | null }
    >();

    for (const key of providerKeys) {
      const userId = await this.resolveProviderUserId(key);
      const { data: profile } = await supabaseAdmin
        .from('provider_profiles')
        .select('id, user_id, business_name')
        .eq('user_id', userId)
        .maybeSingle();

      resolved.set(key, {
        userId,
        profileId: profile?.id || (key === userId ? null : key),
        businessName: profile?.business_name || null,
      });
    }

    return bookings.map((b) => {
      const info = resolved.get(b.provider_id);
      return {
        ...b,
        provider_id: b.provider_id,
        provider_user_id: info?.userId || b.provider_id,
        provider_profile_id: info?.profileId || null,
        provider_business_name: info?.businessName || null,
      };
    });
  }

  private bookingMatchesProvider(
    booking: { provider_id: string; provider_user_id?: string; provider_profile_id?: string | null },
    providerIdOrUserId: string
  ): boolean {
    const targetUserId = booking.provider_user_id || booking.provider_id;
    return (
      booking.provider_id === providerIdOrUserId ||
      targetUserId === providerIdOrUserId ||
      booking.provider_profile_id === providerIdOrUserId
    );
  }

  async getPendingReviews(userId: string, providerIdOrUserId?: string) {
    const { data: eligibleBookings, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('id, provider_id, service_date, booking_number, package_id, status')
      .eq('customer_id', userId)
      .in('status', ['completed', 'confirmed']);

    if (bookingError) throw new ValidationError('Failed to fetch bookings eligible for review');

    const bookingIds = (eligibleBookings || []).map((b: any) => b.id);
    if (bookingIds.length === 0) return [];

    const { data: existingReviews, error: reviewError } = await supabaseAdmin
      .from('reviews')
      .select('booking_id')
      .in('booking_id', bookingIds);

    const reviewed = reviewError
      ? new Set<string>()
      : new Set((existingReviews || []).map((r: any) => r.booking_id));

    let pending = (eligibleBookings || []).filter((b: any) => !reviewed.has(b.id));
    pending = await this.enrichPendingBookings(pending);

    if (providerIdOrUserId) {
      const targetUserId = await this.resolveProviderUserId(providerIdOrUserId);
      pending = pending.filter(
        (b) =>
          this.bookingMatchesProvider(b, providerIdOrUserId) ||
          this.bookingMatchesProvider(b, targetUserId)
      );
    }

    return pending;
  }

  async getPendingReviewsForProvider(userId: string, providerId: string) {
    return this.getPendingReviews(userId, providerId);
  }

  private async insertReview(
    userId: string,
    bookingId: string,
    providerUserId: string,
    rating: number,
    comment?: string,
    title?: string
  ) {
    const attempts: Record<string, unknown>[] = [
      {
        booking_id: bookingId,
        customer_id: userId,
        provider_id: providerUserId,
        rating,
        comment: comment || null,
        title: title || null,
      },
      {
        booking_id: bookingId,
        reviewer_id: userId,
        provider_id: providerUserId,
        rating,
        comment: comment || '',
        title: title || null,
      },
      {
        booking_id: bookingId,
        reviewer_id: userId,
        rating,
        comment: comment || '',
      },
    ];

    let lastError: { message?: string } | null = null;

    for (const payload of attempts) {
      const { data, error } = await supabaseAdmin.from('reviews').insert(payload).select().single();
      if (!error && data) return data;
      lastError = error;
      if (!isMissingColumnError(error)) break;
    }

    if (lastError && isMissingColumnError(lastError)) {
      throw new ValidationError(REVIEWS_SETUP_HINT);
    }

    throw new ValidationError(lastError?.message || 'Failed to create review');
  }

  async createReview(
    userId: string,
    data: { booking_id: string; rating: number; comment?: string; title?: string }
  ) {
    const { booking_id, rating, comment, title } = data;
    if (!booking_id) throw new ValidationError('booking_id is required');
    if (!rating || rating < 1 || rating > 5) {
      throw new ValidationError('Rating must be between 1 and 5');
    }

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('id, customer_id, provider_id, status')
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) throw new NotFoundError('Booking not found');
    if (booking.customer_id !== userId) throw new ValidationError('Not your booking');
    if (booking.status !== 'completed' && booking.status !== 'confirmed') {
      throw new ValidationError('Only confirmed or completed bookings can be reviewed');
    }

    const { data: existing } = await supabaseAdmin
      .from('reviews')
      .select('id')
      .eq('booking_id', booking_id)
      .maybeSingle();

    if (existing) throw new ValidationError('You already reviewed this booking');

    const providerUserId = await this.resolveProviderUserId(booking.provider_id);

    const review = await this.insertReview(
      userId,
      booking_id,
      providerUserId,
      rating,
      comment,
      title
    );

    await this.updateProviderRating(providerUserId);

    try {
      await notificationService.createNotification({
        user_id: providerUserId,
        type: 'review_submitted',
        title: 'New review',
        message: `You received a ${rating}-star review`,
        data: { booking_id, review_id: review.id },
      });
    } catch {
      /* optional */
    }

    const [enriched] = await this.enrichReviews([review]);
    return enriched || review;
  }

  async getProviderReviewStats(providerId: string) {
    const providerUserId = await this.resolveProviderUserId(providerId);
    const all = await this.fetchReviewsForProvider(providerUserId);
    const reviews = all.filter((r: any) => r.is_flagged !== true);

    const total = reviews.length;
    const sum = reviews.reduce((acc: number, r: any) => acc + (r.rating || 0), 0);
    const avg_rating = total > 0 ? Math.round((sum / total) * 100) / 100 : 0;

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r: any) => {
      if (distribution[r.rating] !== undefined) distribution[r.rating]++;
    });

    return { avg_rating, total_reviews: total, distribution };
  }

  private async updateProviderRating(providerUserId: string) {
    const stats = await this.getProviderReviewStats(providerUserId);
    await supabaseAdmin
      .from('provider_profiles')
      .update({ average_rating: stats.avg_rating })
      .eq('user_id', providerUserId);
  }
}

export const reviewService = new ReviewService();
