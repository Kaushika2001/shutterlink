import { supabaseAdmin } from '../config/supabase';
import { ValidationError } from '../utils/errors';

export class NotificationService {
  async createNotification(data: {
    user_id: string;
    type: string;
    title: string;
    message: string;
    data?: Record<string, any>;
  }) {
    const { data: notification, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: data.user_id,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data || null,
      })
      .select()
      .single();

    if (error || !notification) throw new ValidationError('Failed to create notification');
    return notification;
  }

  async getUserNotifications(userId: string, limit: number = 50, offset: number = 0) {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) throw new ValidationError('Failed to fetch notifications');
    return data || [];
  }

  async getUnreadNotifications(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false });

    if (error) throw new ValidationError('Failed to fetch unread notifications');
    return data || [];
  }

  async getUnreadCount(userId: string) {
    const { count, error } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw new ValidationError('Failed to get unread count');
    return { count: count || 0 };
  }

  async markAsRead(notificationId: string) {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .select()
      .single();

    if (error || !data) throw new ValidationError('Failed to mark notification as read');
    return data;
  }

  async markAllAsRead(userId: string) {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw new ValidationError('Failed to mark all as read');
  }

  async deleteNotification(notificationId: string) {
    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw new ValidationError('Failed to delete notification');
  }

  async deleteAllNotifications(userId: string) {
    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('user_id', userId);

    if (error) throw new ValidationError('Failed to delete notifications');
  }
}

export const notificationService = new NotificationService();
