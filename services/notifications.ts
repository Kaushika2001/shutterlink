import { supabase } from '@/lib/supabaseClient'

export type NotificationType =
  | 'booking_created'
  | 'booking_confirmed'
  | 'booking_completed'
  | 'booking_cancelled'
  | 'payment_received'
  | 'payment_failed'
  | 'review_submitted'
  | 'message_received'
  | 'provider_verified'
  | 'booking_reminder'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message?: string
  related_id?: string
  is_read: boolean
  read_at?: string
  created_at: string
}

export interface CreateNotificationData {
  type: NotificationType
  title: string
  message?: string
  related_id?: string
}

/* =========================
   CREATE NOTIFICATION
========================= */

export const createNotification = async (
  userId: string,
  notification: CreateNotificationData
): Promise<Notification> => {
  const { data, error } = await supabase
    .from('notifications')
    .insert([
      {
        user_id: userId,
        ...notification,
      },
    ])
    .select()
    .single()

  if (error) {
    console.error('Error creating notification:', error)
    throw new Error('Failed to create notification')
  }

  return data
}

/* =========================
   GET NOTIFICATIONS
========================= */

export const getUserNotifications = async (limit = 50, offset = 0): Promise<Notification[]> => {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('You must be logged in to view notifications')
  }

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching notifications:', error)
    throw new Error('Failed to fetch notifications')
  }

  return data || []
}

export const getUnreadNotifications = async (): Promise<Notification[]> => {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('You must be logged in to view notifications')
  }

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_read', false)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching unread notifications:', error)
    throw new Error('Failed to fetch notifications')
  }

  return data || []
}

export const getUnreadCount = async (): Promise<number> => {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('You must be logged in')
  }

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  if (error) {
    console.error('Error fetching unread count:', error)
    return 0
  }

  return count || 0
}

export const getNotificationById = async (notificationId: string): Promise<Notification> => {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('You must be logged in')
  }

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('id', notificationId)
    .eq('user_id', user.id)
    .single()

  if (error) {
    console.error('Error fetching notification:', error)
    throw new Error('Notification not found')
  }

  return data
}

/* =========================
   MARK AS READ
========================= */

export const markNotificationAsRead = async (notificationId: string): Promise<Notification> => {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('You must be logged in')
  }

  const { data, error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', notificationId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('Error marking notification as read:', error)
    throw new Error('Failed to mark notification as read')
  }

  return data
}

export const markAllAsRead = async (): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('You must be logged in')
  }

  const { error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .eq('is_read', false)

  if (error) {
    console.error('Error marking all as read:', error)
    throw new Error('Failed to mark notifications as read')
  }
}

/* =========================
   DELETE NOTIFICATIONS
========================= */

export const deleteNotification = async (notificationId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('You must be logged in')
  }

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting notification:', error)
    throw new Error('Failed to delete notification')
  }
}

export const deleteAllNotifications = async (): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('You must be logged in')
  }

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting notifications:', error)
    throw new Error('Failed to delete notifications')
  }
}

/* =========================
   NOTIFICATION HELPERS
========================= */

export const getNotificationMessage = (type: NotificationType): { title: string; description: string } => {
  const messages: Record<NotificationType, { title: string; description: string }> = {
    booking_created: {
      title: 'Booking Created',
      description: 'Your booking request has been created and is pending confirmation.',
    },
    booking_confirmed: {
      title: 'Booking Confirmed',
      description: 'Your booking has been confirmed by the provider.',
    },
    booking_completed: {
      title: 'Booking Completed',
      description: 'Your booking has been completed. You can now leave a review.',
    },
    booking_cancelled: {
      title: 'Booking Cancelled',
      description: 'Your booking has been cancelled.',
    },
    payment_received: {
      title: 'Payment Received',
      description: 'Your payment has been successfully processed.',
    },
    payment_failed: {
      title: 'Payment Failed',
      description: 'Your payment failed. Please try again.',
    },
    review_submitted: {
      title: 'Review Submitted',
      description: 'You have received a new review.',
    },
    message_received: {
      title: 'New Message',
      description: 'You have received a new message.',
    },
    provider_verified: {
      title: 'Profile Verified',
      description: 'Your provider profile has been verified.',
    },
    booking_reminder: {
      title: 'Booking Reminder',
      description: 'Your booking is coming up soon.',
    },
  }

  return messages[type] || { title: 'Notification', description: 'You have a new notification.' }
}

/* =========================
   SEND BOOKING NOTIFICATIONS
========================= */

export const notifyBookingCreated = async (bookingId: string, providerId: string): Promise<void> => {
  await createNotification(providerId, {
    type: 'booking_created',
    title: 'New Booking Request',
    message: 'You have received a new booking request.',
    related_id: bookingId,
  })
}

export const notifyBookingConfirmed = async (bookingId: string, customerId: string): Promise<void> => {
  await createNotification(customerId, {
    type: 'booking_confirmed',
    title: 'Booking Confirmed',
    message: 'Your booking has been confirmed.',
    related_id: bookingId,
  })
}

export const notifyBookingCompleted = async (bookingId: string, customerId: string): Promise<void> => {
  await createNotification(customerId, {
    type: 'booking_completed',
    title: 'Booking Completed',
    message: 'Your booking has been completed. Leave a review to help others.',
    related_id: bookingId,
  })
}

export const notifyBookingCancelled = async (bookingId: string, userId: string): Promise<void> => {
  await createNotification(userId, {
    type: 'booking_cancelled',
    title: 'Booking Cancelled',
    message: 'Your booking has been cancelled.',
    related_id: bookingId,
  })
}

/* =========================
   SEND PAYMENT NOTIFICATIONS
========================= */

export const notifyPaymentReceived = async (paymentId: string, userId: string): Promise<void> => {
  await createNotification(userId, {
    type: 'payment_received',
    title: 'Payment Received',
    message: 'Payment has been successfully processed.',
    related_id: paymentId,
  })
}

export const notifyPaymentFailed = async (paymentId: string, userId: string): Promise<void> => {
  await createNotification(userId, {
    type: 'payment_failed',
    title: 'Payment Failed',
    message: 'Your payment could not be processed. Please try again.',
    related_id: paymentId,
  })
}

/* =========================
   SEND REVIEW NOTIFICATIONS
========================= */

export const notifyReviewSubmitted = async (reviewId: string, providerId: string): Promise<void> => {
  await createNotification(providerId, {
    type: 'review_submitted',
    title: 'New Review',
    message: 'You have received a new review.',
    related_id: reviewId,
  })
}

/* =========================
   SEND MESSAGE NOTIFICATIONS
========================= */

export const notifyMessageReceived = async (messageId: string, recipientId: string): Promise<void> => {
  await createNotification(recipientId, {
    type: 'message_received',
    title: 'New Message',
    message: 'You have received a new message.',
    related_id: messageId,
  })
}

/* =========================
   SEND PROVIDER VERIFIED
========================= */

export const notifyProviderVerified = async (providerId: string): Promise<void> => {
  await createNotification(providerId, {
    type: 'provider_verified',
    title: 'Profile Verified',
    message: 'Congratulations! Your provider profile has been verified.',
  })
}

/* =========================
   SEND BOOKING REMINDER
========================= */

export const notifyBookingReminder = async (bookingId: string, userId: string): Promise<void> => {
  await createNotification(userId, {
    type: 'booking_reminder',
    title: 'Booking Reminder',
    message: 'Your booking is scheduled for tomorrow. Make sure you are prepared.',
    related_id: bookingId,
  })
}
