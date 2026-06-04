import { supabaseAdmin } from '../config/supabase';
import { NotFoundError, ValidationError } from '../utils/errors';

export class ReviewService {
  async getProviderReviews(providerId: string) {
    const { data: profile } = await supabaseAdmin
      .from('provider_profiles')
      .select('user_id')
      .eq('id', providerId)
      .maybeSingle();

    const providerUserId = profile?.user_id;
    const idFilter = providerUserId
      ? `provider_id.eq.${providerId},provider_id.eq.${providerUserId}`
      : `provider_id.eq.${providerId}`;

    const { data, error } = await supabaseAdmin
      .from('reviews')
      .select('*')
      .or(idFilter)
      .order('created_at', { ascending: false });

    if (error) return [];
    return data || [];
  }

  async getUserReviews(userId: string) {
    let { data, error } = await supabaseAdmin
      .from('reviews')
      .select('*')
      .eq('customer_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      const fallback = await supabaseAdmin
        .from('reviews')
        .select('*')
        .eq('reviewer_id', userId)
        .order('created_at', { ascending: false });
      data = fallback.data;
      error = fallback.error;
    }

    if (error) return [];

    const reviews = data || [];
    const providerUserIds = [...new Set(reviews.map((r: any) => r.provider_id))];
    if (providerUserIds.length === 0) return reviews;

    const { data: profiles } = await supabaseAdmin
      .from('provider_profiles')
      .select('user_id, business_name')
      .in('user_id', providerUserIds);

    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

    return reviews.map((review: any) => ({
      ...review,
      provider_name: profileMap.get(review.provider_id)?.business_name || null,
    }));
  }

  async getPendingReviews(userId: string) {
    const { data: completedBookings, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('id, provider_id, service_date, booking_number, package_id')
      .eq('customer_id', userId)
      .eq('status', 'completed');

    if (bookingError) throw new ValidationError('Failed to fetch completed bookings');

    const bookingIds = (completedBookings || []).map((b: any) => b.id);
    if (bookingIds.length === 0) return [];

    const { data: existingReviews, error: reviewError } = await supabaseAdmin
      .from('reviews')
      .select('booking_id')
      .in('booking_id', bookingIds);

    const reviewed = reviewError
      ? new Set<string>()
      : new Set((existingReviews || []).map((r: any) => r.booking_id));

    const pending = (completedBookings || []).filter((b: any) => !reviewed.has(b.id));
    const providerUserIds = [...new Set(pending.map((b: any) => b.provider_id))];

    const { data: profiles } = await supabaseAdmin
      .from('provider_profiles')
      .select('user_id, business_name')
      .in('user_id', providerUserIds);

    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

    return pending.map((b: any) => ({
      ...b,
      provider_business_name: profileMap.get(b.provider_id)?.business_name || null,
      provider_id: b.provider_id,
    }));
  }

  async createReview(userId: string, data: { booking_id: string; rating: number; comment?: string }) {
    const { booking_id, rating, comment } = data;
    if (!booking_id) throw new ValidationError('booking_id is required');

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('id, customer_id, provider_id, status')
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) throw new NotFoundError('Booking not found');
    if (booking.customer_id !== userId) throw new ValidationError('Not your booking');
    if (booking.status !== 'completed') throw new ValidationError('Only completed bookings can be reviewed');

    const basePayload = {
      booking_id,
      provider_id: booking.provider_id,
      rating,
      comment: comment || null,
    };

    let { data: review, error } = await supabaseAdmin
      .from('reviews')
      .insert({ ...basePayload, customer_id: userId })
      .select()
      .single();

    if (error) {
      const retry = await supabaseAdmin
        .from('reviews')
        .insert({ ...basePayload, reviewer_id: userId, comment: comment || '' })
        .select()
        .single();
      review = retry.data;
      error = retry.error;
    }

    if (error || !review) throw new ValidationError(error?.message || 'Failed to create review');

    await this.updateProviderRating(booking.provider_id);

    return review;
  }

  async getProviderReviewStats(providerId: string) {
    const { data: profile } = await supabaseAdmin
      .from('provider_profiles')
      .select('user_id')
      .eq('id', providerId)
      .maybeSingle();

    const providerUserId = profile?.user_id;
    const idFilter = providerUserId
      ? `provider_id.eq.${providerId},provider_id.eq.${providerUserId}`
      : `provider_id.eq.${providerId}`;

    const { data: reviews, error } = await supabaseAdmin
      .from('reviews')
      .select('rating')
      .or(idFilter);

    if (error) throw new ValidationError('Failed to fetch review stats');

    const all = reviews || [];
    const total = all.length;
    const sum = all.reduce((acc: number, r: any) => acc + (r.rating || 0), 0);
    const avg_rating = total > 0 ? Math.round((sum / total) * 100) / 100 : 0;

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    all.forEach((r: any) => {
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
