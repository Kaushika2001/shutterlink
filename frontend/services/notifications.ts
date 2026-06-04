import { apiRequest } from '@/lib/api';

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
  | 'booking_reminder';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateNotificationData {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

export const createNotification = async (payload: CreateNotificationData): Promise<Notification> =>
  apiRequest<Notification>('/notifications', { method: 'POST', body: JSON.stringify(payload) }, true);

export const getUserNotifications = async (limit = 50, offset = 0): Promise<Notification[]> => {
  try {
    const data = await apiRequest<Notification[] | null>(
      `/notifications?limit=${limit}&offset=${offset}`,
      {},
      true
    );
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

export const getUnreadNotifications = async (): Promise<Notification[]> =>
  apiRequest<Notification[]>('/notifications/unread', {}, true);

export const getUnreadCount = async (): Promise<number> => {
  try {
    const data = await apiRequest<{ count: number }>('/notifications/unread-count', {}, true);
    return data?.count || 0;
  } catch {
    return 0;
  }
};

export const getNotificationById = async (notificationId: string): Promise<Notification> => {
  const items = await getUserNotifications(200, 0);
  const found = items.find((item) => item.id === notificationId);
  if (!found) throw new Error('Notification not found');
  return found;
};

export const markNotificationAsRead = async (notificationId: string): Promise<Notification> =>
  apiRequest<Notification>(`/notifications/${notificationId}/read`, { method: 'PUT' }, true);

export const markAllAsRead = async (): Promise<void> => {
  await apiRequest('/notifications/read-all', { method: 'PUT' }, true);
};

export const deleteNotification = async (notificationId: string): Promise<void> => {
  await apiRequest(`/notifications/${notificationId}`, { method: 'DELETE' }, true);
};

export const deleteAllNotifications = async (): Promise<void> => {
  await apiRequest('/notifications', { method: 'DELETE' }, true);
};

export const getNotificationMessage = (type: NotificationType): { title: string; description: string } => {
  const map: Record<NotificationType, { title: string; description: string }> = {
    booking_created: { title: 'New Booking', description: 'A new booking request has been created.' },
    booking_confirmed: { title: 'Booking Confirmed', description: 'Your booking has been confirmed.' },
    booking_completed: { title: 'Booking Completed', description: 'Your booking has been marked completed.' },
    booking_cancelled: { title: 'Booking Cancelled', description: 'A booking has been cancelled.' },
    payment_received: { title: 'Payment Received', description: 'Payment received successfully.' },
    payment_failed: { title: 'Payment Failed', description: 'Your payment could not be processed.' },
    review_submitted: { title: 'New Review', description: 'A customer submitted a review.' },
    message_received: { title: 'New Message', description: 'You have received a new message.' },
    provider_verified: { title: 'Provider Verified', description: 'Your provider profile has been verified.' },
    booking_reminder: { title: 'Booking Reminder', description: 'Reminder: upcoming booking.' },
  };
  return map[type];
};

export const notifyBookingCreated = async (bookingId: string, providerId: string): Promise<void> => {
  await createNotification({ user_id: providerId, type: 'booking_created', title: 'Booking Created', message: `Booking ${bookingId} created.` });
};
export const notifyBookingConfirmed = async (bookingId: string, customerId: string): Promise<void> => {
  await createNotification({ user_id: customerId, type: 'booking_confirmed', title: 'Booking Confirmed', message: `Booking ${bookingId} confirmed.` });
};
export const notifyBookingCompleted = async (bookingId: string, customerId: string): Promise<void> => {
  await createNotification({ user_id: customerId, type: 'booking_completed', title: 'Booking Completed', message: `Booking ${bookingId} completed.` });
};
export const notifyBookingCancelled = async (bookingId: string, userId: string): Promise<void> => {
  await createNotification({ user_id: userId, type: 'booking_cancelled', title: 'Booking Cancelled', message: `Booking ${bookingId} cancelled.` });
};
export const notifyPaymentReceived = async (paymentId: string, userId: string): Promise<void> => {
  await createNotification({ user_id: userId, type: 'payment_received', title: 'Payment Received', message: `Payment ${paymentId} received.` });
};
export const notifyPaymentFailed = async (paymentId: string, userId: string): Promise<void> => {
  await createNotification({ user_id: userId, type: 'payment_failed', title: 'Payment Failed', message: `Payment ${paymentId} failed.` });
};
export const notifyReviewSubmitted = async (reviewId: string, providerId: string): Promise<void> => {
  await createNotification({ user_id: providerId, type: 'review_submitted', title: 'Review Submitted', message: `Review ${reviewId} submitted.` });
};
export const notifyMessageReceived = async (messageId: string, recipientId: string): Promise<void> => {
  await createNotification({ user_id: recipientId, type: 'message_received', title: 'New Message', message: `Message ${messageId} received.` });
};
export const notifyProviderVerified = async (providerId: string): Promise<void> => {
  await createNotification({ user_id: providerId, type: 'provider_verified', title: 'Verified', message: 'Your provider profile is verified.' });
};
export const notifyBookingReminder = async (bookingId: string, userId: string): Promise<void> => {
  await createNotification({ user_id: userId, type: 'booking_reminder', title: 'Reminder', message: `Reminder for booking ${bookingId}.` });
};
