import { getSupabaseAdmin } from './supabase.mjs';
import { resolveProviderUserId } from './resolve-provider.mjs';

function isMissingColumn(err) {
  const msg = (err?.message || '').toLowerCase();
  return err?.code === '42703' || msg.includes('does not exist') || msg.includes('column');
}

function isMissingTable(err) {
  return err?.code === '42P01' || (err?.message || '').toLowerCase().includes('does not exist');
}

async function getBookingIdsForProvider(supabase, providerUserId) {
  const { data, error } = await supabase
    .from('bookings')
    .select('id')
    .eq('provider_id', providerUserId);
  if (error) return [];
  return (data || []).map((b) => b.id);
}

async function fetchReviewsForProvider(supabase, providerUserId) {
  const byProvider = await supabase
    .from('reviews')
    .select('*')
    .eq('provider_id', providerUserId)
    .order('created_at', { ascending: false });

  if (!byProvider.error) return byProvider.data || [];

  if (isMissingTable(byProvider.error)) return [];

  if (isMissingColumn(byProvider.error)) {
    const bookingIds = await getBookingIdsForProvider(supabase, providerUserId);
    if (bookingIds.length === 0) return [];

    const byBooking = await supabase
      .from('reviews')
      .select('*')
      .in('booking_id', bookingIds)
      .order('created_at', { ascending: false });

    if (byBooking.error) {
      if (isMissingTable(byBooking.error)) return [];
      throw new Error(byBooking.error.message || 'Failed to fetch reviews');
    }

    return (byBooking.data || []).map((r) => ({
      ...r,
      provider_id: r.provider_id || providerUserId,
      customer_id: r.customer_id || r.reviewer_id,
    }));
  }

  throw new Error(byProvider.error.message || 'Failed to fetch reviews');
}

async function enrichReviews(supabase, reviews) {
  if (!reviews.length) return reviews;

  const customerIds = [
    ...new Set(reviews.map((r) => r.customer_id || r.reviewer_id).filter(Boolean)),
  ];

  const userMap = new Map();
  if (customerIds.length > 0) {
    const { data: users } = await supabase.from('users').select('id, name').in('id', customerIds);
    for (const u of users || []) {
      userMap.set(u.id, u.name);
    }
  }

  return reviews.map((r) => {
    const customerId = r.customer_id || r.reviewer_id;
    const displayName = r.is_anonymous ? 'Anonymous' : userMap.get(customerId) || 'Customer';
    return {
      ...r,
      customer_id: customerId,
      customer_name: displayName,
      reviewer_name: displayName,
    };
  });
}

export async function getProviderReviews(providerId) {
  const supabase = getSupabaseAdmin();
  const providerUserId = await resolveProviderUserId(providerId);
  const data = await fetchReviewsForProvider(supabase, providerUserId);
  const filtered = data.filter((r) => r.is_flagged !== true);
  return enrichReviews(supabase, filtered);
}
