import { supabaseAdmin } from '../config/supabase';
import { ValidationError, NotFoundError } from '../utils/errors';
import { providerService } from './provider.service';
import { disputeService } from './dispute.service';
import { auditService } from './audit.service';

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

    const { count: pendingProviders } = await supabaseAdmin
      .from('provider_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_verified', false);

    const activeDisputes = await disputeService.getActiveDisputes(5);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    const { data: monthlyPayments } = await supabaseAdmin
      .from('payments')
      .select('amount, paid_at, created_at')
      .eq('status', 'completed')
      .gte('created_at', sixMonthsAgo.toISOString());

    const revenueByMonth: { month: string; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleString('default', { month: 'short' });
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const revenue = (monthlyPayments || [])
        .filter((p: any) => {
          const paid = new Date(p.paid_at || p.created_at);
          return paid >= monthStart && paid <= monthEnd;
        })
        .reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
      revenueByMonth.push({ month: key, revenue });
    }

    return {
      users: userCount || 0,
      total_users: userCount || 0,
      providers: providerCount || 0,
      bookings: bookingCount || 0,
      payments: paymentCount || 0,
      total_revenue: totalRevenue,
      pending_providers: pendingProviders || 0,
      active_disputes: activeDisputes,
      revenue_by_month: revenueByMonth,
      recentBookings: await this.getRecentBookings(5),
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
      name: p.users?.name || null,
      user_name: p.users?.name || null,
      user_email: p.users?.email || null,
      is_approved: p.is_verified,
      users: undefined,
    }));
  }

  async verifyProvider(providerProfileId: string, adminUserId: string) {
    await providerService.verifyProvider(providerProfileId);
    await auditService.log({
      userId: adminUserId,
      action: 'provider_verified',
      entityType: 'provider_profile',
      entityId: providerProfileId,
    });
  }

  async revokeProviderVerification(providerProfileId: string, adminUserId: string) {
    const { data, error } = await supabaseAdmin
      .from('provider_profiles')
      .update({ is_verified: false, verification_date: null })
      .eq('id', providerProfileId)
      .select()
      .single();

    if (error || !data) throw new NotFoundError('Provider not found');

    await auditService.log({
      userId: adminUserId,
      action: 'provider_verification_revoked',
      entityType: 'provider_profile',
      entityId: providerProfileId,
    });

    return data;
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
