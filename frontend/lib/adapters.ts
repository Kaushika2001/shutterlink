import type { ProviderProfile } from '@/services/provider'
import type { Provider } from '@/types'

/**
 * Adapter to transform database ProviderProfile to UI Provider type
 */
export function adaptProviderForUI(profile: ProviderProfile): Provider {
  return {
    // User fields
    id: profile.id,
    email: '', // Would need to join with users table
    name: profile.business_name || '',
    role: 'provider',
    created_at: profile.created_at,
    is_verified: profile.is_verified,
    
    // Provider-specific fields
    provider_type: profile.service_type[0] as any || 'photographer',
    business_name: profile.business_name || '',
    description: profile.bio || '',
    categories: profile.specializations as any[],
    price_range: {
      min: profile.hourly_rate || 0,
      max: (profile.hourly_rate || 0) * 8, // Estimate max as 8 hours
    },
    rating: profile.average_rating,
    total_reviews: 0, // Would need to count from reviews table
    portfolio: [], // Would need to fetch separately
    availability: [], // Would need to fetch separately
    location: profile.coverage_areas[0] || '',
    is_approved: profile.is_verified,
    total_bookings: profile.total_bookings,
  }
}

/**
 * Adapt multiple providers
 */
export function adaptProvidersForUI(profiles: ProviderProfile[]): Provider[] {
  return profiles.map(adaptProviderForUI)
}
