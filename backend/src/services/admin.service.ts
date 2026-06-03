import { supabaseAdmin } from '../config/supabase';
import { ValidationError } from '../utils/errors';

export class AdminService {
  async getDashboardStats() {
    const { count: userCount, error: userError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true });
    if (userError) throw new ValidationError('Failed to get user count');

    const { count: providerCount, error: providerError } = await supabaseAdmin
      .from('provider_profiles')
      .select('*', { count: 'exact', head: true });
    if (providerError) throw new ValidationError('Failed to get provider count');

    const { count: bookingCount, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('*', { count: 'exact', head: true });
    if (bookingError) throw new ValidationError('Failed to get booking count');

    const { count: paymentCount, error: paymentCountError } = await supabaseAdmin
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');
    if (paymentCountError) throw new ValidationError('Failed to get payment count');

    const { data: payments, error: revenueError } = await supabaseAdmin
      .from('payments')
      .select('amount')
      .eq('status', 'completed');
    if (revenueError) throw new ValidationError('Failed to get revenue');

    const totalRevenue = (payments || []).reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);

    return {
      users: userCount || 0,
      providers: providerCount || 0,
      bookings: bookingCount || 0,
      payments: paymentCount || 0,
      total_revenue: totalRevenue,
    };
  }

  async getRecentBookings(limit: number = 10) {
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select('*, users!customer_id(name, email), provider_profiles(business_name)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new ValidationError('Failed to fetch recent bookings');
    return (data || []).map((b: any) => ({
      ...b,
      customer_name: b.users?.name || null,
      customer_email: b.users?.email || null,
      provider_business_name: b.provider_profiles?.business_name || null,
      users: undefined,
      provider_profiles: undefined,
    }));
  }

  async getUsers() {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new ValidationError('Failed to fetch users');
    return data || [];
  }

  async getProviders() {
    const { data, error } = await supabaseAdmin
      .from('provider_profiles')
      .select('*, users(name, email)')
      .order('created_at', { ascending: false });

    if (error) throw new ValidationError('Failed to fetch providers');
    return (data || []).map((p: any) => ({
      ...p,
      user_name: p.users?.name || null,
      user_email: p.users?.email || null,
      users: undefined,
    }));
  }

  async getBookings() {
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select('*, users!customer_id(name, email), provider_profiles(business_name)')
      .order('created_at', { ascending: false });

    if (error) throw new ValidationError('Failed to fetch bookings');
    return (data || []).map((b: any) => ({
      ...b,
      customer_name: b.users?.name || null,
      customer_email: b.users?.email || null,
      provider_business_name: b.provider_profiles?.business_name || null,
      users: undefined,
      provider_profiles: undefined,
    }));
  }

  async getPayments() {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('*, bookings(booking_number, users(name))')
      .order('created_at', { ascending: false });

    if (error) throw new ValidationError('Failed to fetch payments');
    return (data || []).map((p: any) => ({
      ...p,
      customer_name: p.bookings?.users?.name || null,
      booking_number: p.bookings?.booking_number || null,
      bookings: undefined,
    }));
  }

  async updateUserStatus(userId: string, isActive: boolean) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ is_active: isActive })
      .eq('id', userId)
      .select()
      .single();

    if (error || !data) throw new ValidationError('Failed to update user status');
    return data;
  }
}

export const adminService = new AdminService();
