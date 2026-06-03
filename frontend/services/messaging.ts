import { apiRequest } from '@/lib/api';

export interface Message {
  id: string;
  booking_id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateMessageData {
  booking_id: string;
  recipient_id: string;
  message: string;
}

export const sendMessage = async (data: CreateMessageData): Promise<Message> =>
  apiRequest<Message>('/messages', { method: 'POST', body: JSON.stringify(data) }, true);

export const getBookingMessages = async (bookingId: string): Promise<Message[]> =>
  apiRequest<Message[]>(`/messages/booking/${bookingId}`, {}, true);

export const getConversations = async (): Promise<
  Array<{
    booking_id: string;
    other_user_id: string;
    last_message: string;
    last_message_time: string;
    unread_count: number;
    other_user_name?: string;
  }>
> => {
  const messages = await apiRequest<Message[]>('/messages/conversations', {}, true);
  const map = new Map<string, any>();

  for (const message of messages) {
    const key = message.booking_id;
    if (!map.has(key)) {
      map.set(key, {
        booking_id: message.booking_id,
        other_user_id: message.sender_id,
        last_message: message.message,
        last_message_time: message.created_at,
        unread_count: 0,
      });
    }
  }

  return Array.from(map.values());
};

export const getUnreadMessagesCount = async (): Promise<number> => {
  const response = await apiRequest<{ count: number }>('/messages/unread-count', {}, true);
  return response.count || 0;
};

export const markMessageAsRead = async (messageId: string): Promise<Message> =>
  apiRequest<Message>(`/messages/${messageId}/read`, { method: 'PUT' }, true);

export const markBookingMessagesAsRead = async (bookingId: string): Promise<void> => {
  await apiRequest(`/messages/booking/${bookingId}/read`, { method: 'PUT' }, true);
};

export const deleteMessage = async (messageId: string): Promise<void> => {
  await apiRequest(`/messages/${messageId}`, { method: 'DELETE' }, true);
};

export const searchMessages = async (bookingId: string, query: string): Promise<Message[]> => {
  const messages = await getBookingMessages(bookingId);
  const q = query.toLowerCase();
  return messages.filter((message) => message.message.toLowerCase().includes(q));
};

export const getMessageStats = async (bookingId: string): Promise<{ total_messages: number; unread_count: number }> => {
  const messages = await getBookingMessages(bookingId);
  return {
    total_messages: messages.length,
    unread_count: messages.filter((message) => !message.is_read).length,
  };
};
