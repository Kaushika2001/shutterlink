import { supabaseAdmin } from '../config/supabase';
import { isPaymentSandboxMode } from '../config/env';
import { NotFoundError, ValidationError, AuthorizationError } from '../utils/errors';
import { isMissingColumnError, isMissingTableError } from '../utils/supabaseErrors';
import { bookingService } from './booking.service';
import { auditService } from './audit.service';
import { notificationService } from './notification.service';
import { initiateGatewayCheckout, isGatewayConfigured } from './gateways';
import { verifyOnepayTransaction, parseOnepayWebhook } from './gateways/onepay.gateway';
import { verifyPayhereNotify } from './gateways/payhere.gateway';

const PLATFORM_FEE_RATE = 0.1;

export class PaymentService {
  private async fetchPaymentsForUser(userId: string): Promise<any[]> {
    const filters = ['customer_id', 'payer_id', 'user_id'] as const;

    for (const column of filters) {
      const { data, error } = await supabaseAdmin
        .from('payments')
        .select('*')
        .eq(column, userId)
        .order('created_at', { ascending: false });

      if (!error) return data || [];
      if (isMissingTableError(error)) return [];
      if (!isMissingColumnError(error)) {
        throw new ValidationError(error.message || 'Failed to fetch payments');
      }
    }

    const { data: all, error: allError } = await supabaseAdmin
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (allError) {
      if (isMissingTableError(allError)) return [];
      throw new ValidationError(allError.message || 'Failed to fetch payments');
    }

    return (all || []).filter(
      (p: any) => p.customer_id === userId || p.payer_id === userId || p.user_id === userId
    );
  }

  private async enrichCustomerPayments(payments: any[]) {
    if (payments.length === 0) return [];

    const bookingIds = [...new Set(payments.map((p: any) => p.booking_id).filter(Boolean))] as string[];

    let bookings: any[] = [];
    if (bookingIds.length > 0) {
      const { data, error } = await supabaseAdmin
        .from('bookings')
        .select('id, booking_number, provider_id')
        .in('id', bookingIds);
      if (error) throw new ValidationError(error.message || 'Failed to fetch payments');
      bookings = data || [];
    }

    const providerUserIds = [...new Set(bookings.map((b: any) => b.provider_id).filter(Boolean))];
    let profiles: any[] = [];
    if (providerUserIds.length > 0) {
      const { data } = await supabaseAdmin
        .from('provider_profiles')
        .select('user_id, business_name')
        .in('user_id', providerUserIds);
      profiles = data || [];
    }

    const bookingMap = new Map(bookings.map((b: any) => [b.id, b]));
    const profileMap = new Map(profiles.map((p: any) => [p.user_id, p]));

    return payments.map((p: any) => {
      const booking = bookingMap.get(p.booking_id);
      const profile = booking ? profileMap.get(booking.provider_id) : null;
      return {
        ...p,
        customer_id: p.customer_id || p.payer_id || p.user_id,
        payer_id: p.customer_id || p.payer_id || p.user_id,
        payment_method: p.payment_method || p.method || 'unknown',
        payment_type: p.payment_type || 'deposit',
        transaction_id: p.transaction_id || p.payment_gateway_id || null,
        payment_date: p.paid_at || p.payment_date || null,
        updated_at: p.updated_at || p.created_at,
        provider_name: profile?.business_name || null,
        booking_number: booking?.booking_number || null,
      };
    });
  }

  async getUserPayments(userId: string) {
    const payments = await this.fetchPaymentsForUser(userId);
    return this.enrichCustomerPayments(payments);
  }

  private async enrichProviderPayments(payments: any[]) {
    if (payments.length === 0) return [];

    const bookingIds = [...new Set(payments.map((p: any) => p.booking_id).filter(Boolean))] as string[];
    let bookings: any[] = [];
    if (bookingIds.length > 0) {
      const { data, error } = await supabaseAdmin
        .from('bookings')
        .select('id, booking_number, customer_id')
        .in('id', bookingIds);
      if (!error) bookings = data || [];
    }

    const customerIds = [...new Set(bookings.map((b) => b.customer_id).filter(Boolean))];
    const userMap = new Map<string, string>();
    if (customerIds.length > 0) {
      const { data: users } = await supabaseAdmin.from('users').select('id, name').in('id', customerIds);
      for (const u of users || []) userMap.set(u.id, u.name);
    }

    const bookingMap = new Map(bookings.map((b) => [b.id, b]));

    return payments.map((p: any) => {
      const booking = bookingMap.get(p.booking_id);
      const gross = Number(p.amount) || 0;
      const platformFee = Number(p.platform_fee) || 0;
      const providerAmount =
        p.provider_amount != null ? Number(p.provider_amount) : Math.max(0, gross - platformFee);

      return {
        ...p,
        customer_id: p.customer_id || booking?.customer_id || null,
        customer_name: booking?.customer_id ? userMap.get(booking.customer_id) || 'Customer' : 'Customer',
        payment_method: p.payment_method || p.method || 'unknown',
        payment_type: p.payment_type || 'deposit',
        transaction_id: p.transaction_id || p.payment_gateway_id || null,
        payment_date: p.paid_at || p.payment_date || p.created_at,
        updated_at: p.updated_at || p.created_at,
        provider_amount: providerAmount,
        booking_number: booking?.booking_number || null,
      };
    });
  }

  async getProviderPayments(userId: string) {
    const { data: providerProfile } = await supabaseAdmin
      .from('provider_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!providerProfile) return [];

    let { data, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('provider_id', userId)
      .order('created_at', { ascending: false });

    if ((!data || data.length === 0) && !error) {
      const retry = await supabaseAdmin
        .from('payments')
        .select('*')
        .eq('provider_id', providerProfile.id)
        .order('created_at', { ascending: false });
      data = retry.data;
      error = retry.error;
    }

    if (error && (isMissingColumnError(error) || isMissingTableError(error))) {
      const { data: all, error: allErr } = await supabaseAdmin
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });
      if (allErr && !isMissingTableError(allErr)) {
        throw new ValidationError(allErr.message || 'Failed to fetch provider payments');
      }
      data = (all || []).filter(
        (p: any) => p.provider_id === userId || p.provider_id === providerProfile.id
      );
      error = null;
    }

    if (error) {
      if (isMissingTableError(error)) return [];
      throw new ValidationError(error.message || 'Failed to fetch provider payments');
    }

    return this.enrichProviderPayments(data || []);
  }

  async checkout(userId: string, bookingId: string, paymentMethod: string) {
    const booking = await bookingService.getBookingById(bookingId);

    if (booking.customer_id !== userId) {
      throw new AuthorizationError('Not your booking');
    }

    if (booking.status === 'cancelled' || booking.status === 'rejected') {
      throw new ValidationError('Cannot pay for a cancelled booking');
    }

    if (booking.deposit_paid) {
      throw new ValidationError('Booking is already paid');
    }

    const amount = booking.deposit_amount || booking.total_price;
    const platformFee = Math.round(amount * PLATFORM_FEE_RATE * 100) / 100;
    const providerAmount = Math.round((amount - platformFee) * 100) / 100;

    const { data: existing } = await supabaseAdmin
      .from('payments')
      .select('id')
      .eq('booking_id', bookingId)
      .eq('status', 'pending')
      .maybeSingle();

    if (existing) {
      const gateway = await this.attachGatewayCheckout(existing, booking, userId, paymentMethod, amount);
      return { payment: existing, amount, payment_method: paymentMethod, ...gateway };
    }

    const insertPayload: Record<string, unknown> = {
      booking_id: bookingId,
      customer_id: userId,
      provider_id: booking.provider_id,
      amount,
      platform_fee: platformFee,
      provider_amount: providerAmount,
      payment_method: paymentMethod,
      status: 'pending',
    };

    let { data: payment, error } = await supabaseAdmin
      .from('payments')
      .insert(insertPayload)
      .select()
      .single();

    if (error && isMissingColumnError(error)) {
      const legacyPayload = {
        booking_id: bookingId,
        payer_id: userId,
        provider_id: booking.provider_id,
        amount,
        method: paymentMethod,
        status: 'pending',
      };
      const retry = await supabaseAdmin.from('payments').insert(legacyPayload).select().single();
      payment = retry.data;
      error = retry.error;
    }

    if (error || !payment) {
      if (isMissingTableError(error)) {
        throw new ValidationError(
          'Payments table is not set up. Run migration 019_ensure_payments_columns.sql in Supabase SQL Editor.'
        );
      }
      throw new ValidationError(error?.message || 'Failed to initiate payment');
    }

    await auditService.log({
      userId,
      action: 'payment_checkout',
      entityType: 'payment',
      entityId: payment.id,
      details: { booking_id: bookingId, method: paymentMethod, amount },
    });

    const gateway = await this.attachGatewayCheckout(payment, booking, userId, paymentMethod, amount);
    return { payment, amount, payment_method: paymentMethod, ...gateway };
  }

  private async attachGatewayCheckout(
    payment: any,
    booking: any,
    userId: string,
    paymentMethod: string,
    amount: number
  ) {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('name, email, phone')
      .eq('id', userId)
      .maybeSingle();

    const nameParts = (user?.name || 'Customer').split(' ');
    const gatewayResult = await initiateGatewayCheckout(paymentMethod, {
      paymentId: payment.id,
      bookingId: booking.id,
      amount,
      currency: 'LKR',
      customerEmail: user?.email,
      customerPhone: user?.phone,
      customerFirstName: nameParts[0],
      customerLastName: nameParts.slice(1).join(' ') || 'User',
    });

    if (gatewayResult.gatewayTransactionId) {
      await supabaseAdmin
        .from('payments')
        .update({ payment_gateway_id: gatewayResult.gatewayTransactionId })
        .eq('id', payment.id);
    }

    return {
      mode: gatewayResult.mode,
      redirect_url: gatewayResult.redirectUrl,
      gateway_configured: isGatewayConfigured(paymentMethod),
      sandbox: gatewayResult.sandbox ?? isPaymentSandboxMode(),
      message: gatewayResult.message,
    };
  }

  async handleOnepayWebhook(body: Record<string, unknown>) {
    const parsed = parseOnepayWebhook(body);
    let success = parsed.success;

    if (parsed.transactionId) {
      const verified = await verifyOnepayTransaction(parsed.transactionId);
      success = success && verified;
    }

    const payment = await this.findPaymentForWebhook(parsed.merchantReference, parsed.transactionId);
    if (!payment) {
      throw new NotFoundError('Payment not found for OnePay callback');
    }

    if (success) {
      return this.finalizePayment(payment.id, 'onepay', parsed.transactionId, 'webhook');
    }

    await supabaseAdmin.from('payments').update({ status: 'failed' }).eq('id', payment.id);
    return { payment_id: payment.id, status: 'failed' };
  }

  async handleHelapayWebhook(body: Record<string, string>) {
    const verified = verifyPayhereNotify(body);
    if (!verified.valid) {
      throw new ValidationError('Invalid PayHere signature');
    }

    const payment = await this.findPaymentForWebhook(verified.orderId, verified.transactionId);
    if (!payment) {
      throw new NotFoundError('Payment not found for HelaPay/PayHere notify');
    }

    if (verified.success) {
      return this.finalizePayment(payment.id, 'helapay', verified.transactionId, 'webhook');
    }

    await supabaseAdmin.from('payments').update({ status: 'failed' }).eq('id', payment.id);
    return { payment_id: payment.id, status: 'failed' };
  }

  async finalizePayment(
    paymentId: string,
    paymentMethod: string,
    transactionRef: string,
    source: 'webhook' | 'manual',
    userId?: string
  ) {
    const { data: payment } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (!payment) throw new NotFoundError('Payment not found');
    if (payment.status === 'completed') {
      return payment;
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('payments')
      .update({
        status: 'completed',
        payment_method: paymentMethod,
        transaction_id: transactionRef,
        payment_gateway_id: payment.payment_gateway_id || transactionRef,
        paid_at: new Date().toISOString(),
      })
      .eq('id', paymentId)
      .select()
      .single();

    if (updateError || !updated) {
      throw new ValidationError('Failed to finalize payment');
    }

    // Mark deposit paid; provider accepts pending booking → confirmed
    await bookingService.updateBooking(payment.booking_id, {
      deposit_paid: true,
    });

    await auditService.log({
      userId,
      action: 'payment_completed',
      entityType: 'payment',
      entityId: paymentId,
      details: { booking_id: payment.booking_id, transaction_id: transactionRef, source },
    });

    try {
      const booking = await bookingService.getBookingById(payment.booking_id);
      await notificationService.createNotification({
        user_id: booking.provider_id,
        type: 'payment_received',
        title: 'Payment received',
        message: `Booking ${booking.booking_number} paid via ${paymentMethod}`,
        data: { booking_id: booking.id, payment_id: paymentId },
      });
      await notificationService.createNotification({
        user_id: booking.customer_id,
        type: 'payment_received',
        title: 'Payment received',
        message: `Deposit paid for booking ${booking.booking_number}. Awaiting provider confirmation.`,
        data: { booking_id: booking.id },
      });
    } catch {
      /* optional */
    }

    return updated;
  }

  private async findPaymentForWebhook(merchantReference: string, gatewayTransactionId: string) {
    if (merchantReference) {
      const { data } = await supabaseAdmin
        .from('payments')
        .select('*')
        .eq('id', merchantReference)
        .maybeSingle();
      if (data) return data;
    }

    if (gatewayTransactionId) {
      const { data } = await supabaseAdmin
        .from('payments')
        .select('*')
        .eq('payment_gateway_id', gatewayTransactionId)
        .maybeSingle();
      if (data) return data;

      const { data: byTxn } = await supabaseAdmin
        .from('payments')
        .select('*')
        .eq('transaction_id', gatewayTransactionId)
        .maybeSingle();
      if (byTxn) return byTxn;
    }

    return null;
  }

  /**
   * Complete payment (OnePay/HelaPay/card gateway callback simulation for MVP).
   * SRS: booking confirmed only after successful payment.
   */
  async completePayment(
    userId: string,
    paymentId: string,
    paymentMethod: string,
    transactionRef?: string
  ) {
    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (error || !payment) throw new NotFoundError('Payment not found');

    if (payment.customer_id !== userId) {
      throw new AuthorizationError('Not your payment');
    }

    if (payment.status === 'completed') {
      return payment;
    }

    const sandbox = isPaymentSandboxMode();
    const gatewayRef =
      transactionRef ||
      (sandbox
        ? `SBX-${paymentMethod.toUpperCase()}-${Date.now()}`
        : `${paymentMethod.toUpperCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);

    if (
      !sandbox &&
      isGatewayConfigured(paymentMethod) &&
      paymentMethod !== 'card' &&
      paymentMethod !== 'bank_transfer'
    ) {
      throw new ValidationError(
        'Gateway is configured. Complete payment on the OnePay/HelaPay redirect page or wait for the webhook.'
      );
    }

    return this.finalizePayment(paymentId, paymentMethod, gatewayRef, 'manual', userId);
  }

  async syncPaymentStatus(paymentId: string, userId: string) {
    const { data: payment } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (!payment || payment.customer_id !== userId) {
      throw new NotFoundError('Payment not found');
    }

    if (payment.status === 'completed') return payment;

    if (payment.payment_method === 'onepay' && payment.payment_gateway_id) {
      const ok = await verifyOnepayTransaction(payment.payment_gateway_id);
      if (ok) {
        return this.finalizePayment(paymentId, 'onepay', payment.payment_gateway_id, 'manual');
      }
    }

    return payment;
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
    const booking = await bookingService.getBookingById(data.booking_id);

    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .insert({
        booking_id: data.booking_id,
        customer_id: data.payer_id,
        provider_id: booking.provider_id,
        amount: data.amount,
        payment_method: data.method || 'card',
        status: data.status || 'pending',
        transaction_id: data.transaction_ref || null,
        paid_at: data.status === 'completed' ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error || !payment) throw new ValidationError('Failed to create payment');
    return payment;
  }

  async getPaymentStats(userId: string, isProvider: boolean) {
    if (isProvider) {
      const { data, error } = await supabaseAdmin
        .from('payments')
        .select('status, amount')
        .eq('provider_id', userId);

      if (error) throw new ValidationError('Failed to fetch payment stats');
      return this.aggregateStats(data || []);
    }

    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('status, amount')
      .eq('customer_id', userId);

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
