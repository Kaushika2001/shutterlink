import { supabaseAdmin } from '../config/supabase';
import { NotFoundError, ValidationError } from '../utils/errors';

export class ReviewService {
  async getProviderReviews(providerId: string) {
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .select('*, users(name)')
      .eq('provider_id', providerId)
      .eq('is_visible', true)
      .order('created_at', { ascending: false });

    if (error) throw new ValidationError('Failed to fetch reviews');
    return (data || []).map((review: any) => ({
      ...review,
      customer_name: review.users?.name || null,
      users: undefined,
    }));
  }

  async getUserReviews(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .select('*, provider_profiles(business_name)')
      .eq('reviewer_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new ValidationError('Failed to fetch reviews');
    return (data || []).map((review: any) => ({
      ...review,
      provider_business_name: review.provider_profiles?.business_name || null,
      provider_profiles: undefined,
    }));
  }

  async getPendingReviews(userId: string) {
    const { data: completedBookings, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('id, provider_id, service_date, booking_number')
      .eq('customer_id', userId)
      .eq('status', 'completed');

    if (bookingError) throw new ValidationError('Failed to fetch completed bookings');

    const bookingIds = (completedBookings || []).map((b: any) => b.id);
    if (bookingIds.length === 0) return [];

    const { data: existingReviews, error: reviewError } = await supabaseAdmin
      .from('reviews')
      .select('booking_id')
      .in('booking_id', bookingIds);

    if (reviewError) throw new ValidationError('Failed to fetch existing reviews');

    const reviewed = new Set((existingReviews || []).map((r: any) => r.booking_id));
    return (completedBookings || []).filter((b: any) => !reviewed.has(b.id));
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

    const { data: review, error } = await supabaseAdmin
      .from('reviews')
      .insert({
        booking_id,
        reviewer_id: userId,
        provider_id: booking.provider_id,
        rating,
        comment: comment || '',
        is_visible: true,
        is_verified_booking: true,
      })
      .select()
      .single();

    if (error || !review) throw new ValidationError('Failed to create review');

    await this.updateProviderRating(booking.provider_id);

    return review;
  }

  async getProviderReviewStats(providerId: string) {
    const { data: reviews, error } = await supabaseAdmin
      .from('reviews')
      .select('rating')
      .eq('provider_id', providerId)
      .eq('is_visible', true);

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

  private async updateProviderRating(providerId: string) {
    const stats = await this.getProviderReviewStats(providerId);
    await supabaseAdmin
      .from('provider_profiles')
      .update({ average_rating: stats.avg_rating })
      .eq('id', providerId);
  }
}

export const reviewService = new ReviewService();
