import { supabaseAdmin } from '../config/supabase';
import { ValidationError, NotFoundError } from '../utils/errors';
import { AVAILABILITY_SETUP_HINT, isMissingTableError } from '../utils/supabaseErrors';

export class AvailabilityService {
  /** availability_schedules.provider_id = auth.users.id (not provider_profiles.id) */
  async resolveProviderUserId(providerIdOrUserId: string): Promise<string> {
    const { data: byProfileId } = await supabaseAdmin
      .from('provider_profiles')
      .select('user_id')
      .eq('id', providerIdOrUserId)
      .maybeSingle();

    if (byProfileId?.user_id) return byProfileId.user_id;

    const { data: byUserId } = await supabaseAdmin
      .from('provider_profiles')
      .select('user_id')
      .eq('user_id', providerIdOrUserId)
      .maybeSingle();

    if (byUserId?.user_id) return byUserId.user_id;

    return providerIdOrUserId;
  }

  async assertProviderOwnership(providerIdOrUserId: string, authUserId: string): Promise<string> {
    const providerUserId = await this.resolveProviderUserId(providerIdOrUserId);

    const { data: profile } = await supabaseAdmin
      .from('provider_profiles')
      .select('user_id')
      .eq('user_id', providerUserId)
      .maybeSingle();

    if (!profile || profile.user_id !== authUserId) {
      throw new NotFoundError('Provider profile not found');
    }

    return providerUserId;
  }

  async getSchedules(providerIdOrUserId: string) {
    const providerUserId = await this.resolveProviderUserId(providerIdOrUserId);

    const { data, error } = await supabaseAdmin
      .from('availability_schedules')
      .select('*')
      .eq('provider_id', providerUserId)
      .order('day_of_week')
      .order('start_time');

    if (error) {
      if (isMissingTableError(error)) {
        throw new ValidationError(AVAILABILITY_SETUP_HINT);
      }
      throw new ValidationError(error.message || error.details || 'Failed to fetch schedules');
    }
    return data || [];
  }

  async setSchedules(providerIdOrUserId: string, schedules: any[]) {
    const providerUserId = await this.resolveProviderUserId(providerIdOrUserId);

    const { error: deleteError } = await supabaseAdmin
      .from('availability_schedules')
      .delete()
      .eq('provider_id', providerUserId);

    if (deleteError) {
      if (isMissingTableError(deleteError)) throw new ValidationError(AVAILABILITY_SETUP_HINT);
      throw new ValidationError(deleteError.message || 'Failed to update schedules');
    }

    if (!schedules.length) return [];

    const enriched = schedules.map((s: any) => ({
      provider_id: providerUserId,
      day_of_week: s.day_of_week,
      start_time: s.start_time,
      end_time: s.end_time,
      is_active: s.is_active ?? true,
    }));

    const { data, error } = await supabaseAdmin
      .from('availability_schedules')
      .insert(enriched)
      .select();

    if (error) {
      if (isMissingTableError(error)) throw new ValidationError(AVAILABILITY_SETUP_HINT);
      throw new ValidationError(error.message || 'Failed to save schedules');
    }
    return data || [];
  }

  async updateSchedule(scheduleId: string, updates: any) {
    const { data, error } = await supabaseAdmin
      .from('availability_schedules')
      .update(updates)
      .eq('id', scheduleId)
      .select()
      .single();

    if (error) {
      if (isMissingTableError(error)) throw new ValidationError(AVAILABILITY_SETUP_HINT);
      throw new ValidationError(error.message || 'Failed to update schedule');
    }
    if (!data) throw new ValidationError('Failed to update schedule');
    return data;
  }

  async getBlockedDates(providerIdOrUserId: string) {
    const providerUserId = await this.resolveProviderUserId(providerIdOrUserId);

    const { data, error } = await supabaseAdmin
      .from('blocked_dates')
      .select('*')
      .eq('provider_id', providerUserId)
      .order('blocked_date');

    if (error) {
      if (isMissingTableError(error)) throw new ValidationError(AVAILABILITY_SETUP_HINT);
      throw new ValidationError(error.message || 'Failed to fetch blocked dates');
    }
    return data || [];
  }

  async blockDate(providerIdOrUserId: string, data: { blocked_date: string; reason?: string }) {
    const providerUserId = await this.resolveProviderUserId(providerIdOrUserId);

    const { data: blocked, error } = await supabaseAdmin
      .from('blocked_dates')
      .insert({
        provider_id: providerUserId,
        blocked_date: data.blocked_date,
        reason: data.reason || '',
      })
      .select()
      .single();

    if (error) {
      if (isMissingTableError(error)) throw new ValidationError(AVAILABILITY_SETUP_HINT);
      throw new ValidationError(error.message || 'Failed to block date');
    }
    if (!blocked) throw new ValidationError('Failed to block date');
    return blocked;
  }

  async unblockDate(blockedDateId: string) {
    const { error } = await supabaseAdmin.from('blocked_dates').delete().eq('id', blockedDateId);

    if (error) {
      if (isMissingTableError(error)) return;
      throw new ValidationError(error.message || 'Failed to unblock date');
    }
  }
}

export const availabilityService = new AvailabilityService();
