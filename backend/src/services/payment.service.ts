import { supabaseAdmin } from '../config/supabase';
import { NotFoundError, ValidationError } from '../utils/errors';

export class PaymentService {
  async getUserPayments(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('*, provider_profiles(business_name)')
      .eq('payer_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new ValidationError('Failed to fetch payments');
    return (data || []).map((payment: any) => ({
      ...payment,
      provider_business_name: payment.provider_profiles?.business_name || null,
      provider_profiles: undefined,
    }));
  }

  async getProviderPayments(userId: string) {
    const { data: providerProfile, error: profileError } = await supabaseAdmin
      .from('provider_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (profileError || !providerProfile) throw new NotFoundError('Provider profile not found');

    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('*, bookings(customer_id, booking_number, users(name))')
      .eq('provider_id', providerProfile.id)
      .order('created_at', { ascending: false });

    if (error) throw new ValidationError('Failed to fetch provider payments');
    return (data || []).map((payment: any) => ({
      ...payment,
      customer_name: payment.bookings?.users?.name || null,
      bookings: undefined,
    }));
  }

  async createPayment(data: {
    booking_id: string;
    payer_id: string;
    amount: number;
    method?: string;
    payment_type?: string;
    status?: string;
    transaction_ref?: string;
  }) {
    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .insert({
        booking_id: data.booking_id,
        payer_id: data.payer_id,
        amount: data.amount,
        payment_method: data.method || 'card',
        payment_type: data.payment_type || 'full_payment',
        status: data.status || 'pending',
        transaction_id: data.transaction_ref || null,
        payment_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (error || !payment) throw new ValidationError('Failed to create payment');
    return payment;
  }

  async getPaymentStats(userId: string, isProvider: boolean) {
    if (isProvider) {
      const { data: providerProfile, error: profileError } = await supabaseAdmin
        .from('provider_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (profileError || !providerProfile) throw new NotFoundError('Provider profile not found');

      const { data, error } = await supabaseAdmin
        .from('payments')
        .select('status, amount')
        .eq('provider_id', providerProfile.id);

      if (error) throw new ValidationError('Failed to fetch payment stats');
      return this.aggregateStats(data || []);
    }

    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('status, amount')
      .eq('payer_id', userId);

    if (error) throw new ValidationError('Failed to fetch payment stats');
    return this.aggregateStats(data || []);
  }

  private aggregateStats(payments: any[]) {
    const stats: Record<string, { count: number; total: number }> = {
      pending: { count: 0, total: 0 },
      completed: { count: 0, total: 0 },
      failed: { count: 0, total: 0 },
      refunded: { count: 0, total: 0 },
    };

    payments.forEach((p: any) => {
      const key = p.status as string;
      if (stats[key]) {
        stats[key].count++;
        stats[key].total += Number(p.amount || 0);
      }
    });

    return stats;
  }
}

export const paymentService = new PaymentService();
