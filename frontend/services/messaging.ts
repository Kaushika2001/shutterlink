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
  updated_at?: string;
  sender_name?: string | null;
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

export interface Conversation {
  booking_id: string;
  other_user_id: string;
  other_user_name?: string | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export const getConversations = async (): Promise<Conversation[]> =>
  apiRequest<Conversation[]>('/messages/conversations', {}, true);

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
