import { supabase } from '@/lib/supabaseClient';

/* =========================
   TYPES
========================= */

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
  // Joined data
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

/* =========================
   CREATE REVIEW
========================= */

export const createReview = async (reviewData: CreateReviewData): Promise<Review> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('You must be logged in to create a review');
  }

  // Verify the booking is completed and belongs to the user
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, customer_id, status')
    .eq('id', reviewData.booking_id)
    .single();

  if (bookingError || !booking) {
    throw new Error('Booking not found');
  }

  if (booking.customer_id !== user.id) {
    throw new Error('You can only review your own bookings');
  }

  if (booking.status !== 'completed') {
    throw new Error('You can only review completed bookings');
  }

  // Check if review already exists
  const { data: existingReview } = await supabase
    .from('reviews')
    .select('id')
    .eq('booking_id', reviewData.booking_id)
    .single();

  if (existingReview) {
    throw new Error('You have already reviewed this booking');
  }

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      reviewer_id: user.id,
      ...reviewData,
      would_recommend: reviewData.would_recommend ?? true
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating review:', error);
    throw new Error(error.message || 'Failed to create review');
  }

  return data;
};

/* =========================
   GET REVIEWS
========================= */

// Get all reviews written by the current user
export const getUserReviews = async (): Promise<Review[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('You must be logged in to view reviews');
  }

  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      provider:provider_profiles!reviews_provider_id_fkey(
        business_name,
        user:users!provider_profiles_user_id_fkey(full_name)
      )
    `)
    .eq('reviewer_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user reviews:', error);
    throw new Error('Failed to fetch reviews');
  }

  return data || [];
};

// Get reviews for a specific provider
export const getProviderReviews = async (providerId: string): Promise<Review[]> => {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      reviewer:users!reviews_reviewer_id_fkey(full_name)
    `)
    .eq('provider_id', providerId)
    .eq('is_visible', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching provider reviews:', error);
    throw new Error('Failed to fetch reviews');
  }

  return data || [];
};

// Get reviews for bookings that need reviews
export const getPendingReviews = async (): Promise<any[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('You must be logged in');
  }

  // Get completed bookings without reviews
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id,
      booking_number,
      service_date,
      provider:provider_profiles!bookings_provider_id_fkey(
        id,
        business_name,
        user:users!provider_profiles_user_id_fkey(full_name)
      )
    `)
    .eq('customer_id', user.id)
    .eq('status', 'completed')
    .not('id', 'in', 
      supabase
        .from('reviews')
        .select('booking_id')
    );

  if (error) {
    console.error('Error fetching pending reviews:', error);
    throw new Error('Failed to fetch pending reviews');
  }

  return data || [];
};

// Get review by ID
export const getReviewById = async (reviewId: string): Promise<Review> => {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      reviewer:users!reviews_reviewer_id_fkey(full_name),
      provider:provider_profiles!reviews_provider_id_fkey(
        business_name,
        user:users!provider_profiles_user_id_fkey(full_name)
      )
    `)
    .eq('id', reviewId)
    .single();

  if (error) {
    console.error('Error fetching review:', error);
    throw new Error('Review not found');
  }

  return data;
};

/* =========================
   UPDATE REVIEW
========================= */

export const updateReview = async (
  reviewId: string,
  updates: UpdateReviewData
): Promise<Review> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('You must be logged in to update a review');
  }

  const { data, error } = await supabase
    .from('reviews')
    .update(updates)
    .eq('id', reviewId)
    .eq('reviewer_id', user.id) // Ensure user owns the review
    .select()
    .single();

  if (error) {
    console.error('Error updating review:', error);
    throw new Error('Failed to update review');
  }

  return data;
};

/* =========================
   DELETE REVIEW
========================= */

export const deleteReview = async (reviewId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('You must be logged in to delete a review');
  }

  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId)
    .eq('reviewer_id', user.id); // Ensure user owns the review

  if (error) {
    console.error('Error deleting review:', error);
    throw new Error('Failed to delete review');
  }
};

/* =========================
   HELPFUL VOTES
========================= */

export const addHelpfulVote = async (reviewId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('You must be logged in to vote');
  }

  const { error } = await supabase
    .from('review_helpful_votes')
    .insert({
      review_id: reviewId,
      user_id: user.id
    });

  if (error) {
    console.error('Error adding helpful vote:', error);
    if (error.code === '23505') { // Unique violation
      throw new Error('You have already voted this review as helpful');
    }
    throw new Error('Failed to add vote');
  }
};

export const removeHelpfulVote = async (reviewId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('You must be logged in');
  }

  const { error } = await supabase
    .from('review_helpful_votes')
    .delete()
    .eq('review_id', reviewId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error removing helpful vote:', error);
    throw new Error('Failed to remove vote');
  }
};

export const checkHelpfulVote = async (reviewId: string): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return false;
  }

  const { data, error } = await supabase
    .from('review_helpful_votes')
    .select('id')
    .eq('review_id', reviewId)
    .eq('user_id', user.id)
    .single();

  return !error && !!data;
};

/* =========================
   PROVIDER RESPONSES
========================= */

export const createReviewResponse = async (
  reviewId: string,
  responseText: string
): Promise<ReviewResponse> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('You must be logged in');
  }

  // Get provider profile
  const { data: profile, error: profileError } = await supabase
    .from('provider_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (profileError || !profile) {
    throw new Error('Provider profile not found');
  }

  // Verify the review is for this provider
  const { data: review } = await supabase
    .from('reviews')
    .select('provider_id')
    .eq('id', reviewId)
    .single();

  if (!review || review.provider_id !== profile.id) {
    throw new Error('You can only respond to reviews for your services');
  }

  const { data, error } = await supabase
    .from('review_responses')
    .insert({
      review_id: reviewId,
      provider_id: profile.id,
      response_text: responseText
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating review response:', error);
    if (error.code === '23505') { // Unique violation
      throw new Error('You have already responded to this review');
    }
    throw new Error('Failed to create response');
  }

  return data;
};

export const updateReviewResponse = async (
  responseId: string,
  responseText: string
): Promise<ReviewResponse> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('You must be logged in');
  }

  // Get provider profile
  const { data: profile } = await supabase
    .from('provider_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!profile) {
    throw new Error('Provider profile not found');
  }

  const { data, error } = await supabase
    .from('review_responses')
    .update({ response_text: responseText })
    .eq('id', responseId)
    .eq('provider_id', profile.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating review response:', error);
    throw new Error('Failed to update response');
  }

  return data;
};

/* =========================
   REVIEW STATISTICS
========================= */

export const getProviderReviewStats = async (providerId: string): Promise<ReviewStats> => {
  const { data, error } = await supabase
    .rpc('get_provider_review_stats', {
      p_provider_id: providerId
    })
    .single();

  if (error) {
    console.error('Error fetching review stats:', error);
    return {
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
      recommend_percentage: 0
    };
  }

  return data as ReviewStats;
};

/* =========================
   FLAG REVIEWS
========================= */

export const flagReview = async (
  reviewId: string,
  reason: 'spam' | 'inappropriate' | 'fake' | 'offensive' | 'other',
  details?: string
): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('You must be logged in to flag a review');
  }

  const { error } = await supabase
    .from('review_flags')
    .insert({
      review_id: reviewId,
      flagger_id: user.id,
      reason,
      details
    });

  if (error) {
    console.error('Error flagging review:', error);
    if (error.code === '23505') { // Unique violation
      throw new Error('You have already flagged this review');
    }
    throw new Error('Failed to flag review');
  }
};
