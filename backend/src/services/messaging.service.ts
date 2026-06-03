import { supabaseAdmin } from '../config/supabase';
import { NotFoundError, ValidationError } from '../utils/errors';

export class MessagingService {
  async sendMessage(data: {
    booking_id: string;
    sender_id: string;
    recipient_id: string;
    message: string;
  }) {
    const { data: message, error } = await supabaseAdmin
      .from('messages')
      .insert({
        booking_id: data.booking_id,
        sender_id: data.sender_id,
        recipient_id: data.recipient_id,
        message: data.message,
      })
      .select()
      .single();

    if (error || !message) throw new ValidationError('Failed to send message');
    return message;
  }

  async getBookingMessages(bookingId: string) {
    const { data, error } = await supabaseAdmin
      .from('messages')
      .select('*, users(name)')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true });

    if (error) throw new ValidationError('Failed to fetch messages');
    return (data || []).map((msg: any) => ({
      ...msg,
      sender_name: msg.users?.name || null,
      users: undefined,
    }));
  }

  async getConversations(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw new ValidationError('Failed to fetch conversations');

    const messages = data || [];
    const conversationMap = new Map<string, any>();

    for (const msg of messages) {
      const otherId = msg.sender_id === userId ? msg.recipient_id : msg.sender_id;
      if (!conversationMap.has(otherId)) {
        conversationMap.set(otherId, {
          participant_id: otherId,
          booking_id: msg.booking_id,
          last_message: msg.message,
          last_message_at: msg.created_at,
          is_read: msg.is_read,
        });
      }
    }

    const participantIds = [...conversationMap.keys()];
    if (participantIds.length > 0) {
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, name, email')
        .in('id', participantIds);

      const userMap = new Map((users || []).map((u: any) => [u.id, u]));
      for (const [id, conv] of conversationMap) {
        conv.participant_name = userMap.get(id)?.name || null;
      }
    }

    return [...conversationMap.values()];
  }

  async getUnreadCount(userId: string) {
    const { count, error } = await supabaseAdmin
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('is_read', false);

    if (error) throw new ValidationError('Failed to get unread count');
    return { count: count || 0 };
  }

  async markAsRead(messageId: string) {
    const { data, error } = await supabaseAdmin
      .from('messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', messageId)
      .select()
      .single();

    if (error || !data) throw new NotFoundError('Message not found');
    return data;
  }

  async markBookingAsRead(bookingId: string, userId: string) {
    const { error } = await supabaseAdmin
      .from('messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('booking_id', bookingId)
      .eq('recipient_id', userId)
      .eq('is_read', false);

    if (error) throw new ValidationError('Failed to mark messages as read');
  }

  async deleteMessage(messageId: string) {
    const { error } = await supabaseAdmin
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (error) throw new ValidationError('Failed to delete message');
  }
}

export const messagingService = new MessagingService();
