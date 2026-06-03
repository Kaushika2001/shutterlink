import { supabaseAdmin } from '../config/supabase';
import { ValidationError } from '../utils/errors';

export class AvailabilityService {
  async getSchedules(providerId: string) {
    const { data, error } = await supabaseAdmin
      .from('availability_schedules')
      .select('*')
      .eq('provider_id', providerId)
      .order('day_of_week')
      .order('start_time');

    if (error) throw new ValidationError('Failed to fetch schedules');
    return data || [];
  }

  async setSchedules(providerId: string, schedules: any[]) {
    await supabaseAdmin
      .from('availability_schedules')
      .delete()
      .eq('provider_id', providerId);

    const enriched = schedules.map((s: any) => ({
      provider_id: providerId,
      day_of_week: s.day_of_week,
      start_time: s.start_time,
      end_time: s.end_time,
      is_active: s.is_active ?? true,
    }));

    const { data, error } = await supabaseAdmin
      .from('availability_schedules')
      .insert(enriched)
      .select();

    if (error) throw new ValidationError('Failed to save schedules');
    return data || [];
  }

  async updateSchedule(scheduleId: string, updates: any) {
    const { data, error } = await supabaseAdmin
      .from('availability_schedules')
      .update(updates)
      .eq('id', scheduleId)
      .select()
      .single();

    if (error || !data) throw new ValidationError('Failed to update schedule');
    return data;
  }

  async getBlockedDates(providerId: string) {
    const { data, error } = await supabaseAdmin
      .from('blocked_dates')
      .select('*')
      .eq('provider_id', providerId)
      .order('blocked_date');

    if (error) throw new ValidationError('Failed to fetch blocked dates');
    return data || [];
  }

  async blockDate(providerId: string, data: { blocked_date: string; reason?: string }) {
    const { data: blocked, error } = await supabaseAdmin
      .from('blocked_dates')
      .insert({
        provider_id: providerId,
        blocked_date: data.blocked_date,
        reason: data.reason || '',
      })
      .select()
      .single();

    if (error || !blocked) throw new ValidationError('Failed to block date');
    return blocked;
  }

  async unblockDate(blockedDateId: string) {
    const { error } = await supabaseAdmin
      .from('blocked_dates')
      .delete()
      .eq('id', blockedDateId);

    if (error) throw new ValidationError('Failed to unblock date');
  }
}

export const availabilityService = new AvailabilityService();
