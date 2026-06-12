import { supabaseAdmin } from '../config/supabase';
import { generateToken } from '../utils/jwt';
import { ProviderProfile, CreateProviderPayload, ProviderSearchOptions, ProviderType } from '../types';
import { NotFoundError, ValidationError } from '../utils/errors';

export class ProviderService {
  normalizeProfileBody(body: Record<string, unknown>): CreateProviderPayload {
    const allowed: ProviderType[] = ['photographer', 'editor', 'equipment_renter'];
    const rawTypes = Array.isArray(body.service_type) ? (body.service_type as string[]) : ['photographer'];
    let service_type: ProviderType[] = rawTypes
      .map((t) => (t === 'videographer' ? 'photographer' : t))
      .filter((t): t is ProviderType => allowed.includes(t as ProviderType));
    if (service_type.length === 0) service_type = ['photographer'];

    let equipment_list: string[] = [];
    if (typeof body.equipment_list === 'string') {
      equipment_list = body.equipment_list.split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
    } else if (Array.isArray(body.equipment_list)) {
      equipment_list = body.equipment_list as string[];
    }

    let coverage_areas: string[] = [];
    if (Array.isArray(body.coverage_areas)) {
      coverage_areas = body.coverage_areas as string[];
    } else if (typeof body.coverage_areas === 'string') {
      coverage_areas = body.coverage_areas.split(',').map((s) => s.trim()).filter(Boolean);
    }

    const social = (body.social_urls as Record<string, string>) || {};

    return {
      business_name: String(body.business_name || 'My Business').trim(),
      service_type,
      specializations: Array.isArray(body.specializations) ? (body.specializations as string[]) : [],
      years_experience: Math.max(0, Number(body.years_experience) || 0),
      hourly_rate: Math.max(0, Number(body.hourly_rate) || 0),
      bio: body.bio ? String(body.bio) : undefined,
      equipment_list,
      coverage_areas,
      max_travel_distance:
        body.max_travel_distance != null ? Math.max(0, Number(body.max_travel_distance)) : undefined,
      social_urls: {
        instagram: String(body.instagram_url || social.instagram || ''),
        facebook: String(body.facebook_url || social.facebook || ''),
        twitter: String(body.twitter_url || social.twitter || ''),
        linkedin: String(body.linkedin_url || social.linkedin || ''),
      },
    };
  }

  async upsertProfileFromBody(userId: string, body: Record<string, unknown>) {
    const payload = this.normalizeProfileBody(body);
    const row: Record<string, unknown> = {
      ...payload,
      portfolio_url: body.portfolio_url ?? null,
      availability_status: body.availability_status || 'available',
      response_time_hours:
        body.response_time_hours != null ? Math.max(1, Number(body.response_time_hours)) : undefined,
    };

    const { data: existingProvider } = await supabaseAdmin
      .from('provider_profiles')
      .select('id, total_bookings, average_rating, response_time_hours')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingProvider) {
      const { data: updated, error } = await supabaseAdmin
        .from('provider_profiles')
        .update(row)
        .eq('user_id', userId)
        .select()
        .single();

      if (error || !updated) {
        console.error('Failed to update provider profile:', error);
        throw new ValidationError(error?.message || 'Failed to update provider profile');
      }
      return { provider: updated as ProviderProfile, token: undefined };
    }

    const insertRow = {
      ...row,
      user_id: userId,
      is_verified: false,
      total_bookings: 0,
      average_rating: 0,
      response_time_hours:
        row.response_time_hours != null ? row.response_time_hours : 24,
    };

    const { data: created, error } = await supabaseAdmin
      .from('provider_profiles')
      .insert([insertRow])
      .select()
      .single();

    if (error || !created) {
      console.error('Failed to create provider profile:', error);
      throw new ValidationError(error?.message || 'Failed to create provider profile');
    }

    let newToken: string | undefined;
    const { data: currentUser } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (currentUser && currentUser.role !== 'provider') {
      await supabaseAdmin.from('users').update({ role: 'provider' }).eq('id', userId);
      newToken = generateToken({ userId, email: '', role: 'provider' });
    }

    return { provider: created as ProviderProfile, token: newToken };
  }

  async getProviderProfile(userId: string): Promise<ProviderProfile> {
    const { data: provider, error } = await supabaseAdmin
      .from('provider_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !provider) {
      throw new NotFoundError('Provider profile not found');
    }

    return provider as ProviderProfile;
  }

  async getProviderById(providerId: string): Promise<ProviderProfile> {
    const { data: provider, error } = await supabaseAdmin
      .from('provider_profiles')
      .select('*')
      .eq('id', providerId)
      .single();

    if (error || !provider) {
      throw new NotFoundError('Provider not found');
    }

    return provider as ProviderProfile;
  }

  async createOrUpdateProvider(userId: string, payload: CreateProviderPayload): Promise<{ provider: ProviderProfile; token?: string }> {
    // Auto-upgrade user role to provider if not already
    const { data: currentUser } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    let newToken: string | undefined;

    if (currentUser && currentUser.role !== 'provider') {
      await supabaseAdmin
        .from('users')
        .update({ role: 'provider' })
        .eq('id', userId);

      newToken = generateToken({
        userId,
        email: '',
        role: 'provider',
      });
    }

    // Check if provider profile exists
    const { data: existingProvider } = await supabaseAdmin
      .from('provider_profiles')
      .select('id, total_bookings, average_rating, response_time_hours')
      .eq('user_id', userId)
      .single();

    if (existingProvider) {
      // Update existing - preserve accumulated fields
      const { data: updated, error } = await supabaseAdmin
        .from('provider_profiles')
        .update({
          ...payload,
          user_id: userId,
          availability_status: 'available',
          total_bookings: existingProvider.total_bookings,
          average_rating: existingProvider.average_rating,
          response_time_hours: existingProvider.response_time_hours,
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error || !updated) {
        console.error('Failed to update provider profile:', JSON.stringify({ message: error?.message, details: error?.details, code: error?.code, hint: error?.hint }));
        throw new ValidationError('Failed to update provider profile');
      }

      return { provider: updated as ProviderProfile, token: newToken };
    } else {
      // Create new with defaults
      const { data: created, error } = await supabaseAdmin
        .from('provider_profiles')
        .insert([
          {
            ...payload,
            user_id: userId,
            availability_status: 'available',
            is_verified: false,
            total_bookings: 0,
            average_rating: 0,
            response_time_hours: 24,
          },
        ])
        .select()
        .single();

      if (error || !created) {
        console.error('Failed to create provider profile:', JSON.stringify({ message: error?.message, details: error?.details, code: error?.code, hint: error?.hint }));
        throw new ValidationError('Failed to create provider profile');
      }

      return { provider: created as ProviderProfile, token: newToken };
    }
  }

  async searchProviders(options: ProviderSearchOptions): Promise<ProviderProfile[]> {
    let query = supabaseAdmin
      .from('provider_profiles')
      .select('*');

    if (options.is_verified !== false) {
      query = query.eq('is_verified', true);
    }

    if (options.service_type) {
      query = query.contains('service_type', [options.service_type]);
    }

    if (options.min_rating) {
      query = query.gte('average_rating', options.min_rating);
    }

    if (options.min_price) {
      query = query.gte('hourly_rate', options.min_price);
    }

    if (options.max_price) {
      query = query.lte('hourly_rate', options.max_price);
    }

    if (options.specialization) {
      query = query.contains('specializations', [options.specialization]);
    }

    if (options.location) {
      query = query.contains('coverage_areas', [options.location]);
    }

    const limit = options.limit || 20;
    const page = options.page || 1;
    const offset = (page - 1) * limit;

    query = query.range(offset, offset + limit - 1);

    const { data: providers, error } = await query;

    if (error) {
      throw new ValidationError('Search failed');
    }

    return (providers || []) as ProviderProfile[];
  }

  async getFeaturedProviders(limit: number = 6): Promise<ProviderProfile[]> {
    const { data: providers, error } = await supabaseAdmin
      .from('provider_profiles')
      .select('*')
      .eq('is_verified', true)
      .order('average_rating', { ascending: false })
      .limit(limit);

    if (error) {
      throw new ValidationError('Failed to fetch featured providers');
    }

    return (providers || []) as ProviderProfile[];
  }

  async saveProvider(userId: string, providerId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('saved_providers')
      .insert([{ user_id: userId, provider_id: providerId }]);

    if (error && error.code !== '23505') { // 23505 = unique violation (already saved)
      throw new ValidationError('Failed to save provider');
    }
  }

  async unsaveProvider(userId: string, providerId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('saved_providers')
      .delete()
      .eq('user_id', userId)
      .eq('provider_id', providerId);

    if (error) {
      throw new ValidationError('Failed to unsave provider');
    }
  }

  async getSavedProviders(userId: string): Promise<ProviderProfile[]> {
    const { data: saved, error: savedError } = await supabaseAdmin
      .from('saved_providers')
      .select('provider_id')
      .eq('user_id', userId);

    if (savedError) {
      throw new ValidationError('Failed to fetch saved providers');
    }

    if (!saved || saved.length === 0) {
      return [];
    }

    const providerIds = saved.map(s => s.provider_id);

    const { data: providers, error } = await supabaseAdmin
      .from('provider_profiles')
      .select('*')
      .in('id', providerIds);

    if (error) {
      throw new ValidationError('Failed to fetch saved providers');
    }

    return (providers || []) as ProviderProfile[];
  }

  async isProviderSaved(userId: string, providerId: string): Promise<boolean> {
    const { data, error } = await supabaseAdmin
      .from('saved_providers')
      .select('id')
      .eq('user_id', userId)
      .eq('provider_id', providerId)
      .single();

    return !!data;
  }

  async updateAvailability(providerId: string, status: 'available' | 'busy' | 'unavailable'): Promise<void> {
    const { error } = await supabaseAdmin
      .from('provider_profiles')
      .update({ availability_status: status })
      .eq('id', providerId);

    if (error) {
      throw new ValidationError('Failed to update availability');
    }
  }

  async verifyProvider(providerId: string, userId?: string): Promise<void> {
    // Only admins should be able to verify (userId check can be added for authorization)
    const { error } = await supabaseAdmin
      .from('provider_profiles')
      .update({
        is_verified: true,
        verification_date: new Date().toISOString(),
      })
      .eq('id', providerId);

    if (error) {
      throw new ValidationError('Failed to verify provider');
    }
  }

  async incrementBookingCount(providerId: string): Promise<void> {
    const { data: provider } = await supabaseAdmin
      .from('provider_profiles')
      .select('total_bookings')
      .eq('id', providerId)
      .single();

    if (provider) {
      await supabaseAdmin
        .from('provider_profiles')
        .update({ total_bookings: (provider.total_bookings || 0) + 1 })
        .eq('id', providerId);
    }
  }

  async updateAverageRating(providerId: string, rating: number): Promise<void> {
    const { data: provider } = await supabaseAdmin
      .from('provider_profiles')
      .select('average_rating')
      .eq('id', providerId)
      .single();

    if (provider) {
      // This is simplified - in production, you'd calculate properly
      const newAverage = (provider.average_rating + rating) / 2;
      await supabaseAdmin
        .from('provider_profiles')
        .update({ average_rating: newAverage })
        .eq('id', providerId);
    }
  }

  async getNearbyProviders(lat: number, lng: number, radiusKm: number = 50): Promise<ProviderProfile[]> {
    // This is a simplified version - real implementation would use PostGIS
    const { data: providers, error } = await supabaseAdmin
      .from('provider_profiles')
      .select('*')
      .eq('is_verified', true);

    if (error) {
      throw new ValidationError('Failed to fetch nearby providers');
    }

    return (providers || []) as ProviderProfile[];
  }
}

export const providerService = new ProviderService();
