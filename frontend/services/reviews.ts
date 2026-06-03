import { apiRequest } from '@/lib/api';

export interface Review {
  id: string;
  booking_id: string;
  reviewer_id: string;
  provider_id: string;
  rating: number;
  title?: string;
  comment?: string;
  would_recommend: boolean;
  professionalism_rating?: number;
  quality_rating?: number;
  value_rating?: number;
  is_verified_booking: boolean;
  is_visible: boolean;
  flagged_count: number;
  helpful_count: number;
  provider_response?: string;
  provider_response_date?: string;
  created_at: string;
  updated_at: string;
  reviewer_name?: string;
  provider_name?: string;
}

export interface CreateReviewData {
  booking_id: string;
  provider_id: string;
  rating: number;
  title?: string;
  comment?: string;
  would_recommend?: boolean;
  professionalism_rating?: number;
  quality_rating?: number;
  value_rating?: number;
}

export interface UpdateReviewData {
  rating?: number;
  title?: string;
  comment?: string;
  would_recommend?: boolean;
  professionalism_rating?: number;
  quality_rating?: number;
  value_rating?: number;
}

export interface ReviewResponse {
  id: string;
  review_id: string;
  provider_id: string;
  response_text: string;
  created_at: string;
  updated_at: string;
}

export interface ReviewStats {
  total_reviews: number;
  average_rating: number;
  five_star_count: number;
  four_star_count: number;
  three_star_count: number;
  two_star_count: number;
  one_star_count: number;
  avg_professionalism: number;
  avg_quality: number;
  avg_value: number;
  recommend_percentage: number;
}

export const createReview = async (reviewData: CreateReviewData): Promise<Review> =>
  apiRequest<Review>('/reviews', { method: 'POST', body: JSON.stringify(reviewData) }, true);

export const getUserReviews = async (): Promise<Review[]> => apiRequest<Review[]>('/reviews/me', {}, true);

export const getProviderReviews = async (providerId: string): Promise<Review[]> =>
  apiRequest<Review[]>(`/reviews/provider/${providerId}`);

export const getPendingReviews = async (): Promise<any[]> => apiRequest<any[]>('/reviews/pending', {}, true);

export const getReviewById = async (reviewId: string): Promise<Review> => {
  const all = await getUserReviews();
  const found = all.find((review) => review.id === reviewId);
  if (!found) throw new Error('Review not found');
  return found;
};

export const updateReview = async (_reviewId: string, _updates: UpdateReviewData): Promise<Review> => {
  throw new Error('Review update endpoint not implemented yet');
};

export const deleteReview = async (_reviewId: string): Promise<void> => {
  throw new Error('Review delete endpoint not implemented yet');
};

export const addHelpfulVote = async (_reviewId: string): Promise<void> => {
  throw new Error('Helpful vote endpoint not implemented yet');
};

export const removeHelpfulVote = async (_reviewId: string): Promise<void> => {
  throw new Error('Helpful vote endpoint not implemented yet');
};

export const checkHelpfulVote = async (_reviewId: string): Promise<boolean> => false;

export const createReviewResponse = async (_reviewId: string, _responseText: string): Promise<ReviewResponse> => {
  throw new Error('Review response endpoint not implemented yet');
};

export const updateReviewResponse = async (_responseId: string, _responseText: string): Promise<ReviewResponse> => {
  throw new Error('Review response update endpoint not implemented yet');
};

export const getProviderReviewStats = async (_providerId: string): Promise<ReviewStats> => ({
  total_reviews: 0,
  average_rating: 0,
  five_star_count: 0,
  four_star_count: 0,
  three_star_count: 0,
  two_star_count: 0,
  one_star_count: 0,
  avg_professionalism: 0,
  avg_quality: 0,
  avg_value: 0,
  recommend_percentage: 0,
});

export const flagReview = async (
  _reviewId: string,
  _reason: 'spam' | 'inappropriate' | 'fake' | 'offensive' | 'other',
  _details?: string
): Promise<void> => {
  throw new Error('Review flag endpoint not implemented yet');
};
