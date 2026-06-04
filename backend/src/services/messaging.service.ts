import { supabaseAdmin } from '../config/supabase';
import { NotFoundError, ValidationError } from '../utils/errors';
import { isMissingTableError } from '../utils/supabaseErrors';
import { notificationService } from './notification.service';

export class MessagingService {
  async sendMessage(data: {
    booking_id: string;
    sender_id: string;
    recipient_id: string;
    message: string;
  }) {
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('id, customer_id, provider_id')
      .eq('id', data.booking_id)
      .maybeSingle();

    if (bookingError || !booking) {
      throw new ValidationError('Invalid booking for this message');
    }

    const participants = [booking.customer_id, booking.provider_id];
    if (!participants.includes(data.sender_id) || !participants.includes(data.recipient_id)) {
      throw new ValidationError('Sender or recipient is not part of this booking');
    }

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

    if (error || !message) {
      if (isMissingTableError(error)) {
        throw new ValidationError(
          'Messages are not set up yet. Run migration 018_ensure_messages_and_notifications.sql in Supabase SQL Editor.'
        );
      }
      throw new ValidationError(error?.message || 'Failed to send message');
    }

    try {
      await notificationService.createNotification({
        user_id: data.recipient_id,
        type: 'message_received',
        title: 'New message',
        message: data.message.slice(0, 120),
        data: { booking_id: data.booking_id, message_id: message.id },
      });
    } catch {
      /* optional */
    }

    return message;
  }

  async getBookingMessages(bookingId: string, userId?: string) {
    if (userId) {
      const { data: booking } = await supabaseAdmin
        .from('bookings')
        .select('customer_id, provider_id')
        .eq('id', bookingId)
        .maybeSingle();

      if (
        booking &&
        booking.customer_id !== userId &&
        booking.provider_id !== userId
      ) {
        throw new ValidationError('Not allowed to view these messages');
      }
    }

    const { data, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true });

    if (error) {
      if (isMissingTableError(error)) return [];
      throw new ValidationError(error.message || 'Failed to fetch messages');
    }

    const messages = data || [];
    const senderIds = [...new Set(messages.map((m: any) => m.sender_id))];
    const userMap = new Map<string, { name: string }>();
    if (senderIds.length > 0) {
      const { data: users } = await supabaseAdmin.from('users').select('id, name').in('id', senderIds);
      for (const u of users || []) {
        userMap.set(u.id, u);
      }
    }

    return messages.map((msg: any) => ({
      ...msg,
      sender_name: userMap.get(msg.sender_id)?.name || null,
    }));
  }

  async getConversations(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      if (isMissingTableError(error)) return [];
      throw new ValidationError(error.message || 'Failed to fetch conversations');
    }

    const byBooking = new Map<string, any>();

    for (const msg of data || []) {
      const key = msg.booking_id;
      const otherId = msg.sender_id === userId ? msg.recipient_id : msg.sender_id;
      const isUnread = msg.recipient_id === userId && !msg.is_read;

      if (!byBooking.has(key)) {
        byBooking.set(key, {
          booking_id: key,
          other_user_id: otherId,
          last_message: msg.message,
          last_message_time: msg.created_at,
          unread_count: isUnread ? 1 : 0,
        });
      } else if (isUnread) {
        byBooking.get(key).unread_count += 1;
      }
    }

    const otherIds = [...new Set([...byBooking.values()].map((c) => c.other_user_id))];
    const userMap = new Map<string, { name: string }>();

    if (otherIds.length > 0) {
      const { data: users } = await supabaseAdmin.from('users').select('id, name').in('id', otherIds);
      for (const u of users || []) {
        userMap.set(u.id, u);
      }
    }

    return [...byBooking.values()]
      .map((c) => ({
        ...c,
        other_user_name: userMap.get(c.other_user_id)?.name || null,
      }))
      .sort(
        (a, b) =>
          new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()
      );
  }

  async getUnreadCount(userId: string) {
    const { count, error } = await supabaseAdmin
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('is_read', false);

    if (error) {
      if (isMissingTableError(error)) return { count: 0 };
      throw new ValidationError('Failed to get unread count');
    }
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

    if (error && !isMissingTableError(error)) {
      throw new ValidationError('Failed to mark messages as read');
    }
  }

  async deleteMessage(messageId: string) {
    const { error } = await supabaseAdmin.from('messages').delete().eq('id', messageId);

    if (error) throw new ValidationError('Failed to delete message');
  }
}

export const messagingService = new MessagingService();
