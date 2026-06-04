import { supabaseAdmin } from '../config/supabase';
import { ValidationError, NotFoundError } from '../utils/errors';
import { providerService } from './provider.service';
import { disputeService } from './dispute.service';
import { auditService } from './audit.service';

export class AdminService {
  private lastSixMonthKeys(): { key: string; monthStart: Date; monthEnd: Date }[] {
    const months: { key: string; monthStart: Date; monthEnd: Date }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleString('default', { month: 'short' });
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      months.push({ key, monthStart, monthEnd });
    }
    return months;
  }

  private async getUserGrowthByMonth() {
    const { data: users } = await supabaseAdmin.from('users').select('role, created_at');

    return this.lastSixMonthKeys().map(({ key, monthStart, monthEnd }) => {
      const inMonth = (users || []).filter((u: any) => {
        const created = new Date(u.created_at);
        return created >= monthStart && created <= monthEnd;
      });
      return {
        name: key,
        value: inMonth.filter((u: any) => u.role === 'customer').length,
        providers: inMonth.filter((u: any) => u.role === 'provider').length,
      };
    });
  }

  private async getBookingsByCategory() {
    const { data: bookings } = await supabaseAdmin.from('bookings').select('package_id');
    const packageIds = [...new Set((bookings || []).map((b: any) => b.package_id).filter(Boolean))];

    const pkgMap = new Map<string, string>();
    if (packageIds.length > 0) {
      const { data: packages, error: pkgError } = await supabaseAdmin
        .from('service_packages')
        .select('id, service_type, name')
        .in('id', packageIds);

      if (!pkgError) {
        for (const p of packages || []) {
          pkgMap.set(p.id, (p as any).service_type || (p as any).name || 'other');
        }
      }
    }

    const counts = new Map<string, number>();
    for (const b of bookings || []) {
      const cat = pkgMap.get((b as any).package_id) || 'other';
      counts.set(cat, (counts.get(cat) || 0) + 1);
    }

    if (counts.size === 0) {
      return [{ name: 'No bookings', value: 0 }];
    }

    return [...counts.entries()].map(([name, value]) => ({
      name: String(name).replace(/_/g, ' '),
      value,
    }));
  }

  private async getProviderPerformance(limit = 10) {
    const { data: profiles } = await supabaseAdmin
      .from('provider_profiles')
      .select('id, user_id, business_name, average_rating')
      .order('average_rating', { ascending: false })
      .limit(limit);

    if (!profiles?.length) return [];

    const userIds = profiles.map((p: any) => p.user_id);
    const { data: bookings } = await supabaseAdmin
      .from('bookings')
      .select('provider_id, total_price, status')
      .in('provider_id', userIds);

    return profiles.map((p: any) => {
      const providerBookings = (bookings || []).filter((b: any) => b.provider_id === p.user_id);
      const revenue = providerBookings
        .filter((b: any) => b.status === 'completed' || b.status === 'confirmed')
        .reduce((s: number, b: any) => s + Number(b.total_price || 0), 0);

      return {
        name: p.business_name || 'Provider',
        bookings: providerBookings.length,
        revenue,
        rating: p.average_rating ?? 0,
      };
    });
  }

  async getReports() {
    const dashboard = await this.getDashboardStats();
    const { count: completedBookings } = await supabaseAdmin
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    const { count: activeProviders } = await supabaseAdmin
      .from('provider_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_verified', true);

    return {
      revenue: dashboard.total_revenue,
      completed_bookings: completedBookings || 0,
      active_providers: activeProviders || 0,
      revenueData: dashboard.revenueData,
      userGrowthData: dashboard.userGrowthData,
      bookingsByCategory: dashboard.bookingsByCategory,
      providerPerformance: await this.getProviderPerformance(10),
    };
  }

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

    let activeDisputes: any[] = [];
    try {
      activeDisputes = await disputeService.getActiveDisputes(5);
    } catch {
      activeDisputes = [];
    }

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

    const revenueData = revenueByMonth.map((m) => ({ name: m.month, value: m.revenue }));
    const userGrowthData = await this.getUserGrowthByMonth();
    const bookingsByCategory = await this.getBookingsByCategory();

    return {
      users: userCount || 0,
      total_users: userCount || 0,
      total_providers: providerCount || 0,
      providers: providerCount || 0,
      total_bookings: bookingCount || 0,
      bookings: bookingCount || 0,
      payments: paymentCount || 0,
      revenue: totalRevenue,
      total_revenue: totalRevenue,
      pending_providers: pendingProviders || 0,
      active_disputes: activeDisputes,
      revenue_by_month: revenueByMonth,
      revenueData,
      userGrowthData,
      bookingsByCategory,
      recentBookings: await this.getRecentBookings(5),
    };
  }

  private async enrichBookingsList(bookings: any[]) {
    if (!bookings.length) return [];

    const customerIds = [...new Set(bookings.map((b) => b.customer_id).filter(Boolean))];
    const providerUserIds = [...new Set(bookings.map((b) => b.provider_id).filter(Boolean))];

    const customerMap = new Map<string, { name: string; email: string }>();
    if (customerIds.length > 0) {
      const { data: customers } = await supabaseAdmin
        .from('users')
        .select('id, name, email')
        .in('id', customerIds);
      for (const c of customers || []) {
        customerMap.set(c.id, c);
      }
    }

    const profileMap = new Map<string, string>();
    if (providerUserIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('provider_profiles')
        .select('user_id, business_name')
        .in('user_id', providerUserIds);
      for (const p of profiles || []) {
        profileMap.set(p.user_id, p.business_name);
      }
    }

    return bookings.map((b) => ({
      ...b,
      customer_name: customerMap.get(b.customer_id)?.name || null,
      customer_email: customerMap.get(b.customer_id)?.email || null,
      provider_business_name: profileMap.get(b.provider_id) || null,
    }));
  }

  async getRecentBookings(limit: number = 10) {
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new ValidationError('Failed to fetch recent bookings');
    return this.enrichBookingsList(data || []);
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
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new ValidationError('Failed to fetch bookings');
    return this.enrichBookingsList(data || []);
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
