import { apiRequest } from '@/lib/api';
import { getProviderBookings } from './bookings';

export interface AvailabilitySchedule {
  id: string;
  provider_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
}

export interface BlockedDate {
  id: string;
  provider_id: string;
  blocked_date: string;
  reason?: string;
  created_at: string;
}

export interface CreateAvailabilitySchedule {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active?: boolean;
}

export interface CreateBlockedDate {
  blocked_date: string;
  reason?: string;
}

export const getProviderAvailability = async (providerId: string): Promise<AvailabilitySchedule[]> =>
  apiRequest<AvailabilitySchedule[]>(`/availability/provider/${providerId}/schedules`);

export const getAllAvailabilitySchedules = async (providerId: string): Promise<AvailabilitySchedule[]> =>
  getProviderAvailability(providerId);

export const setAvailabilitySchedules = async (
  providerId: string,
  schedules: CreateAvailabilitySchedule[]
): Promise<AvailabilitySchedule[]> =>
  apiRequest<AvailabilitySchedule[]>(
    `/availability/provider/${providerId}/schedules`,
    { method: 'PUT', body: JSON.stringify({ schedules: schedules.map((s) => ({ ...s, provider_id: providerId })) }) },
    true
  );

export const updateAvailabilitySchedule = async (
  scheduleId: string,
  updates: Partial<CreateAvailabilitySchedule>
): Promise<AvailabilitySchedule> =>
  apiRequest<AvailabilitySchedule>(`/availability/schedules/${scheduleId}`, { method: 'PUT', body: JSON.stringify(updates) }, true);

export const getBlockedDates = async (providerId: string): Promise<BlockedDate[]> =>
  apiRequest<BlockedDate[]>(`/availability/provider/${providerId}/blocked-dates`);

export const blockDate = async (providerId: string, blockedDateData: CreateBlockedDate): Promise<BlockedDate> =>
  apiRequest<BlockedDate>(
    '/availability/blocked-dates',
    { method: 'POST', body: JSON.stringify({ provider_id: providerId, ...blockedDateData }) },
    true
  );

export const unblockDate = async (blockedDateId: string): Promise<void> => {
  await apiRequest(`/availability/blocked-dates/${blockedDateId}`, { method: 'DELETE' }, true);
};

export const checkAvailability = async (
  providerId: string,
  serviceDate: string,
  serviceTime: string,
  durationHours: number
): Promise<boolean> => {
  const params = new URLSearchParams({
    providerId,
    date: serviceDate,
    startTime: serviceTime,
    durationHours: String(durationHours),
  });
  const data = await apiRequest<{ available: boolean }>(`/bookings/availability?${params.toString()}`);
  return data.available;
};

export const getAvailableSlots = async (
  providerId: string,
  date: string,
  slotDurationMinutes = 60
): Promise<string[]> => {
  const dayOfWeek = new Date(date).getDay();
  const schedules = await getProviderAvailability(providerId);
  const daySchedules = schedules.filter((schedule) => schedule.day_of_week === dayOfWeek && schedule.is_active);
  if (daySchedules.length === 0) return [];

  const blockedDates = await getBlockedDates(providerId);
  if (blockedDates.some((entry) => entry.blocked_date === date)) return [];

  const bookings = (await getProviderBookings()).filter(
    (booking) => booking.service_date === date && ['confirmed', 'completed', 'pending'].includes(booking.status)
  );

  const bookedSlots = new Set(bookings.map((booking) => booking.service_time));
  const slots: string[] = [];

  for (const schedule of daySchedules) {
    const [startH, startM] = schedule.start_time.split(':').map(Number);
    const [endH, endM] = schedule.end_time.split(':').map(Number);
    let current = startH * 60 + startM;
    const end = endH * 60 + endM;
    while (current + slotDurationMinutes <= end) {
      const hh = String(Math.floor(current / 60)).padStart(2, '0');
      const mm = String(current % 60).padStart(2, '0');
      const time = `${hh}:${mm}`;
      if (!bookedSlots.has(time)) slots.push(time);
      current += slotDurationMinutes;
    }
  }

  return slots;
};
