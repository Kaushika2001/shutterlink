import { supabase } from '@/lib/supabaseClient'

export interface AvailabilitySchedule {
  id: string
  provider_id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface BlockedDate {
  id: string
  provider_id: string
  blocked_date: string
  reason?: string
  created_at: string
}

export interface CreateAvailabilitySchedule {
  day_of_week: number
  start_time: string
  end_time: string
  is_active?: boolean
}

export interface CreateBlockedDate {
  blocked_date: string
  reason?: string
}

/* =========================
   GET PROVIDER AVAILABILITY
========================= */

export const getProviderAvailability = async (providerId: string): Promise<AvailabilitySchedule[]> => {
  const { data, error } = await supabase
    .from('availability_schedules')
    .select('*')
    .eq('provider_id', providerId)
    .eq('is_active', true)
    .order('day_of_week', { ascending: true })

  if (error) {
    console.error('Error fetching provider availability:', error)
    throw new Error('Failed to fetch availability schedules')
  }

  return data || []
}

export const getAllAvailabilitySchedules = async (providerId: string): Promise<AvailabilitySchedule[]> => {
  const { data, error } = await supabase
    .from('availability_schedules')
    .select('*')
    .eq('provider_id', providerId)
    .order('day_of_week', { ascending: true })

  if (error) {
    console.error('Error fetching availability schedules:', error)
    throw new Error('Failed to fetch availability schedules')
  }

  return data || []
}

/* =========================
   SET AVAILABILITY
========================= */

export const setAvailabilitySchedules = async (
  providerId: string,
  schedules: CreateAvailabilitySchedule[]
): Promise<AvailabilitySchedule[]> => {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.id !== providerId) {
    throw new Error('You can only set your own availability')
  }

  // Delete existing schedules for this provider
  const { error: deleteError } = await supabase
    .from('availability_schedules')
    .delete()
    .eq('provider_id', providerId)

  if (deleteError) {
    console.error('Error deleting old schedules:', deleteError)
    throw new Error('Failed to update availability')
  }

  // Insert new schedules
  const { data, error } = await supabase
    .from('availability_schedules')
    .insert(
      schedules.map(s => ({
        provider_id: providerId,
        ...s,
        is_active: s.is_active !== false,
      }))
    )
    .select()

  if (error) {
    console.error('Error setting availability:', error)
    throw new Error('Failed to set availability')
  }

  return data || []
}

export const updateAvailabilitySchedule = async (
  scheduleId: string,
  updates: Partial<CreateAvailabilitySchedule>
): Promise<AvailabilitySchedule> => {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('You must be logged in to update availability')
  }

  const { data, error } = await supabase
    .from('availability_schedules')
    .update(updates)
    .eq('id', scheduleId)
    .eq('provider_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('Error updating availability:', error)
    throw new Error('Failed to update availability')
  }

  return data
}

/* =========================
   BLOCKED DATES
========================= */

export const getBlockedDates = async (providerId: string): Promise<BlockedDate[]> => {
  const { data, error } = await supabase
    .from('blocked_dates')
    .select('*')
    .eq('provider_id', providerId)
    .order('blocked_date', { ascending: true })

  if (error) {
    console.error('Error fetching blocked dates:', error)
    throw new Error('Failed to fetch blocked dates')
  }

  return data || []
}

export const blockDate = async (
  providerId: string,
  blockedDate: CreateBlockedDate
): Promise<BlockedDate> => {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.id !== providerId) {
    throw new Error('You can only block your own dates')
  }

  const { data, error } = await supabase
    .from('blocked_dates')
    .insert([
      {
        provider_id: providerId,
        ...blockedDate,
      },
    ])
    .select()
    .single()

  if (error) {
    console.error('Error blocking date:', error)
    if (error.code === '23505') {
      throw new Error('This date is already blocked')
    }
    throw new Error('Failed to block date')
  }

  return data
}

export const unblockDate = async (blockedDateId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('You must be logged in to unblock dates')
  }

  const { error } = await supabase
    .from('blocked_dates')
    .delete()
    .eq('id', blockedDateId)
    .eq('provider_id', user.id)

  if (error) {
    console.error('Error unblocking date:', error)
    throw new Error('Failed to unblock date')
  }
}

/* =========================
   CHECK AVAILABILITY
========================= */

export const checkAvailability = async (
  providerId: string,
  bookingDate: string,
  startTime: string,
  endTime: string
): Promise<{ available: boolean; reason?: string }> => {
  // Check if date is blocked
  const { data: blocked, error: blockedError } = await supabase
    .from('blocked_dates')
    .select('id')
    .eq('provider_id', providerId)
    .eq('blocked_date', bookingDate)
    .maybeSingle()

  if (blockedError && blockedError.code !== 'PGRST116') {
    throw blockedError
  }

  if (blocked) {
    return {
      available: false,
      reason: 'This date is blocked by the provider',
    }
  }

  // Check if date is in the past
  const now = new Date()
  const bookingDateTime = new Date(bookingDate)
  if (bookingDateTime < now) {
    return {
      available: false,
      reason: 'Cannot book dates in the past',
    }
  }

  // Get day of week (0 = Sunday, 6 = Saturday)
  const dayOfWeek = bookingDateTime.getDay()

  // Check if provider works on this day
  const { data: schedules, error: scheduleError } = await supabase
    .from('availability_schedules')
    .select('*')
    .eq('provider_id', providerId)
    .eq('day_of_week', dayOfWeek)
    .eq('is_active', true)

  if (scheduleError) {
    throw scheduleError
  }

  if (!schedules || schedules.length === 0) {
    return {
      available: false,
      reason: 'Provider is not available on this day',
    }
  }

  // Check if requested time slot matches provider's availability
  const timeMatches = schedules.some(
    schedule => startTime >= schedule.start_time && endTime <= schedule.end_time
  )

  if (!timeMatches) {
    return {
      available: false,
      reason: `Provider is only available between ${schedules[0].start_time} and ${schedules[0].end_time}`,
    }
  }

  // Check for conflicting bookings
  const { data: conflicts, error: conflictError } = await supabase
    .from('bookings')
    .select('*')
    .eq('provider_id', providerId)
    .eq('booking_date', bookingDate)
    .in('status', ['confirmed', 'completed'])

  if (conflictError) {
    throw conflictError
  }

  const hasConflict = conflicts?.some(
    booking =>
      (startTime < booking.end_time || !booking.end_time) &&
      (endTime > booking.start_time || !booking.start_time)
  )

  if (hasConflict) {
    return {
      available: false,
      reason: 'Provider has a conflicting booking at this time',
    }
  }

  return { available: true }
}

/* =========================
   GET AVAILABLE SLOTS
========================= */

export const getAvailableSlots = async (
  providerId: string,
  bookingDate: string
): Promise<Array<{ start_time: string; end_time: string }>> => {
  const { available, reason } = await checkAvailability(
    providerId,
    bookingDate,
    '00:00',
    '23:59'
  )

  if (!available) {
    return []
  }

  // Get day of week
  const dayOfWeek = new Date(bookingDate).getDay()

  // Get provider's availability for this day
  const { data: schedules, error: scheduleError } = await supabase
    .from('availability_schedules')
    .select('*')
    .eq('provider_id', providerId)
    .eq('day_of_week', dayOfWeek)
    .eq('is_active', true)

  if (scheduleError) {
    throw scheduleError
  }

  if (!schedules || schedules.length === 0) {
    return []
  }

  // Get existing bookings for this day
  const { data: bookings, error: bookingError } = await supabase
    .from('bookings')
    .select('start_time, end_time')
    .eq('provider_id', providerId)
    .eq('booking_date', bookingDate)
    .in('status', ['confirmed', 'completed'])

  if (bookingError) {
    throw bookingError
  }

  // Calculate available slots (subtract booked times from provider's availability)
  const slots: Array<{ start_time: string; end_time: string }> = []

  schedules.forEach(schedule => {
    let currentStart = schedule.start_time

    const sortedBookings = (bookings || []).sort((a, b) =>
      a.start_time?.localeCompare(b.start_time || '') || 0
    )

    sortedBookings.forEach(booking => {
      if (currentStart < (booking.start_time || '')) {
        slots.push({
          start_time: currentStart,
          end_time: booking.start_time || '',
        })
      }
      currentStart = booking.end_time || currentStart
    })

    if (currentStart < schedule.end_time) {
      slots.push({
        start_time: currentStart,
        end_time: schedule.end_time,
      })
    }
  })

  return slots
}
