import { apiRequest } from '@/lib/api';

export interface Review {
  id: string;
  booking_id: string;
  customer_id?: string;
  reviewer_id?: string;
  provider_id: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
  is_anonymous?: boolean;
  customer_name?: string | null;
  reviewer_name?: string | null;
  provider_name?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface CreateReviewData {
  booking_id: string;
  rating: number;
  title?: string;
  comment?: string;
}

export interface ReviewStats {
  total_reviews: number;
  average_rating: number;
  five_star_count: number;
  four_star_count: number;
  three_star_count: number;
  two_star_count: number;
  one_star_count: number;
}

type ApiReviewStats = {
  avg_rating: number;
  total_reviews: number;
  distribution: Record<number, number>;
};

function mapStats(raw: ApiReviewStats): ReviewStats {
  const d = raw.distribution || {};
  return {
    total_reviews: raw.total_reviews,
    average_rating: raw.avg_rating,
    five_star_count: d[5] || 0,
    four_star_count: d[4] || 0,
    three_star_count: d[3] || 0,
    two_star_count: d[2] || 0,
    one_star_count: d[1] || 0,
  };
}

export const createReview = async (reviewData: CreateReviewData): Promise<Review> =>
  apiRequest<Review>(
    '/reviews',
    {
      method: 'POST',
      body: JSON.stringify({
        booking_id: reviewData.booking_id,
        rating: reviewData.rating,
        comment: reviewData.comment,
        title: reviewData.title,
      }),
    },
    true
  );

export const getUserReviews = async (): Promise<Review[]> => {
  try {
    const data = await apiRequest<Review[] | null>('/reviews/me', {}, true);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

export const getProviderReviews = async (providerId: string): Promise<Review[]> => {
  try {
    return await apiRequest<Review[]>(`/reviews/provider/${providerId}`);
  } catch {
    return [];
  }
};

export interface PendingReviewBooking {
  id: string;
  provider_id: string;
  provider_user_id?: string;
  provider_profile_id?: string | null;
  service_date: string;
  booking_number?: string;
  provider_business_name?: string | null;
  status?: string;
}

export const getPendingReviews = async (): Promise<PendingReviewBooking[]> =>
  apiRequest<PendingReviewBooking[]>('/reviews/pending', {}, true);

export const getPendingReviewsForProvider = async (
  providerId: string
): Promise<PendingReviewBooking[]> =>
  apiRequest<PendingReviewBooking[]>(`/reviews/pending/provider/${providerId}`, {}, true);

export const getProviderReviewStats = async (providerId: string): Promise<ReviewStats> => {
  try {
    const raw = await apiRequest<ApiReviewStats>(`/reviews/stats/${providerId}`);
    return mapStats(raw);
  } catch {
    return {
      total_reviews: 0,
      average_rating: 0,
      five_star_count: 0,
      four_star_count: 0,
      three_star_count: 0,
      two_star_count: 0,
      one_star_count: 0,
    };
  }
};
