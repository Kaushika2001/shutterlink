import { supabaseAdmin } from '../config/supabase';
import { isPaymentSandboxMode } from '../config/env';
import { NotFoundError, ValidationError, AuthorizationError } from '../utils/errors';
import { isMissingColumnError, isMissingTableError } from '../utils/supabaseErrors';
import { bookingService } from './booking.service';
import { auditService } from './audit.service';
import { notificationService } from './notification.service';
import { initiateGatewayCheckout, isGatewayConfigured } from './gateways';
import {
  constructStripeWebhookEvent,
  retrieveStripeCheckoutSession,
} from './gateways/stripe.gateway';

const PLATFORM_FEE_RATE = 0.1;

type PaymentInsertInput = {
  booking_id: string;
  customer_id: string;
  provider_id: string;
  amount: number;
  payment_method?: string;
  platform_fee?: number;
  provider_amount?: number;
  status?: string;
  transaction_id?: string | null;
  paid_at?: string | null;
};

export class PaymentService {
  /** Insert with progressively smaller payloads when optional columns are missing */
  private async insertPaymentRecord(base: PaymentInsertInput): Promise<any> {
    const payloads: Record<string, unknown>[] = [
      {
        booking_id: base.booking_id,
        customer_id: base.customer_id,
        provider_id: base.provider_id,
        amount: base.amount,
        platform_fee: base.platform_fee,
        provider_amount: base.provider_amount,
        payment_method: base.payment_method,
        status: base.status || 'pending',
        transaction_id: base.transaction_id ?? null,
        paid_at: base.paid_at ?? null,
      },
      {
        booking_id: base.booking_id,
        customer_id: base.customer_id,
        provider_id: base.provider_id,
        amount: base.amount,
        payment_method: base.payment_method,
        status: base.status || 'pending',
      },
      {
        booking_id: base.booking_id,
        customer_id: base.customer_id,
        provider_id: base.provider_id,
        amount: base.amount,
        status: base.status || 'pending',
      },
      {
        booking_id: base.booking_id,
        amount: base.amount,
        method: base.payment_method || 'stripe',
        status: base.status || 'pending',
      },
    ];

    let lastError: { message?: string; code?: string } | null = null;
    for (const payload of payloads) {
      const cleaned = Object.fromEntries(
        Object.entries(payload).filter(([, value]) => value !== undefined)
      );
      const { data, error } = await supabaseAdmin
        .from('payments')
        .insert(cleaned)
        .select()
        .single();

      if (!error && data) return data;
      lastError = error;
      if (error && !isMissingColumnError(error)) break;
    }

    if (isMissingTableError(lastError)) {
      throw new ValidationError(
        'Payments table is not set up. Run backend/supabase/RUN_PAYMENTS_SETUP.sql in Supabase SQL Editor.'
      );
    }
    throw new ValidationError(lastError?.message || 'Failed to create payment');
  }

  private async updatePaymentRecord(
    paymentId: string,
    modern: Record<string, unknown>,
    legacy: Record<string, unknown>
  ): Promise<any> {
    let lastError: { message?: string; code?: string } | null = null;
    for (const payload of [modern, legacy]) {
      const cleaned = Object.fromEntries(
        Object.entries(payload).filter(([, value]) => value !== undefined)
      );
      const { data, error } = await supabaseAdmin
        .from('payments')
        .update(cleaned)
        .eq('id', paymentId)
        .select()
        .single();

      if (!error && data) return data;
      lastError = error;
      if (error && !isMissingColumnError(error)) break;
    }
    throw new ValidationError(lastError?.message || 'Failed to update payment');
  }

  private async fetchPaymentsViaBookings(
    userId: string,
    role: 'customer' | 'provider'
  ): Promise<any[]> {
    const column = role === 'customer' ? 'customer_id' : 'provider_id';
    const { data: bookings, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('id')
      .eq(column, userId);

    if (bookingError) {
      throw new ValidationError(bookingError.message || 'Failed to fetch payments');
    }

    const bookingIds = (bookings || []).map((b) => b.id);
    if (bookingIds.length === 0) return [];

    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .in('booking_id', bookingIds);

    if (error) {
      if (isMissingTableError(error)) return [];
      throw new ValidationError(error.message || 'Failed to fetch payments');
    }

    return data || [];
  }

  private async paymentBelongsToCustomer(payment: any, userId: string): Promise<boolean> {
    if (
      payment.customer_id === userId ||
      payment.payer_id === userId ||
      payment.user_id === userId
    ) {
      return true;
    }
    if (!payment.booking_id) return false;
    const booking = await bookingService.getBookingById(payment.booking_id);
    return booking.customer_id === userId;
  }

  private async fetchPaymentsForUser(userId: string): Promise<any[]> {
    const filters = ['customer_id', 'payer_id', 'user_id'] as const;

    for (const column of filters) {
      let { data, error } = await supabaseAdmin
        .from('payments')
        .select('*')
        .eq(column, userId)
        .order('created_at', { ascending: false });

      if (error && isMissingColumnError(error)) continue;
      if (error && error.message?.toLowerCase().includes('created_at')) {
        const retry = await supabaseAdmin.from('payments').select('*').eq(column, userId);
        data = retry.data;
        error = retry.error;
      }

      if (!error) return data || [];
      if (isMissingTableError(error)) return [];
      if (!isMissingColumnError(error)) {
        throw new ValidationError(error.message || 'Failed to fetch payments');
      }
    }

    return this.fetchPaymentsViaBookings(userId, 'customer');
  }

  private async enrichCustomerPayments(payments: any[]) {
    if (payments.length === 0) return [];

    const bookingIds = [...new Set(payments.map((p: any) => p.booking_id).filter(Boolean))] as string[];

    let bookings: any[] = [];
    if (bookingIds.length > 0) {
      const { data, error } = await supabaseAdmin
        .from('bookings')
        .select('id, booking_number, provider_id, customer_id')
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
      const customerId = p.customer_id || p.payer_id || p.user_id || booking?.customer_id;
      return {
        ...p,
        customer_id: customerId,
        payer_id: customerId,
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
      data = await this.fetchPaymentsViaBookings(userId, 'provider');
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

    const payment = await this.insertPaymentRecord({
      booking_id: bookingId,
      customer_id: userId,
      provider_id: booking.provider_id,
      amount,
      platform_fee: platformFee,
      provider_amount: providerAmount,
      payment_method: paymentMethod,
      status: 'pending',
    });

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
      try {
        await this.updatePaymentRecord(
          payment.id,
          { payment_gateway_id: gatewayResult.gatewayTransactionId },
          {}
        );
      } catch {
        /* legacy schema has no payment_gateway_id — return URL carries session_id */
      }
    }

    return {
      mode: gatewayResult.mode,
      redirect_url: gatewayResult.redirectUrl,
      gateway_configured: isGatewayConfigured(paymentMethod),
      sandbox: gatewayResult.sandbox ?? isPaymentSandboxMode(),
      message: gatewayResult.message,
    };
  }

  async handleStripeWebhook(rawBody: Buffer, signature: string | undefined) {
    const event = constructStripeWebhookEvent(rawBody, signature);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as {
        id: string;
        payment_status?: string;
        payment_intent?: string | { id: string } | null;
        metadata?: { payment_id?: string };
      };

      const paymentId = session.metadata?.payment_id;
      const transactionRef =
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id || session.id;

      const payment = await this.findPaymentForWebhook(paymentId || '', session.id);
      if (!payment) {
        throw new NotFoundError('Payment not found for Stripe checkout session');
      }

      if (session.payment_status === 'paid') {
        return this.finalizePayment(payment.id, 'stripe', transactionRef, 'webhook');
      }
    }

    return { received: true, type: event.type };
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

    const paidAt = new Date().toISOString();
    const updated = await this.updatePaymentRecord(
      paymentId,
      {
        status: 'completed',
        payment_method: paymentMethod,
        transaction_id: transactionRef,
        payment_gateway_id: payment.payment_gateway_id || transactionRef,
        paid_at: paidAt,
      },
      {
        status: 'completed',
        method: paymentMethod,
        payment_date: paidAt,
      }
    );

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

    if (!(await this.paymentBelongsToCustomer(payment, userId))) {
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

    if (!sandbox && isGatewayConfigured(paymentMethod)) {
      throw new ValidationError(
        'Stripe is configured. Complete payment on Stripe Checkout or wait for the webhook.'
      );
    }

    return this.finalizePayment(paymentId, paymentMethod, gatewayRef, 'manual', userId);
  }

  async syncPaymentStatus(paymentId: string, userId: string, stripeSessionId?: string) {
    const { data: payment } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (!payment || !(await this.paymentBelongsToCustomer(payment, userId))) {
      throw new NotFoundError('Payment not found');
    }

    if (payment.status === 'completed') return payment;

    const gatewaySessionId = payment.payment_gateway_id || stripeSessionId;
    if (gatewaySessionId) {
      try {
        const session = await retrieveStripeCheckoutSession(gatewaySessionId);
        if (session.payment_status === 'paid') {
          const transactionRef =
            typeof session.payment_intent === 'string'
              ? session.payment_intent
              : session.payment_intent?.id || session.id;
          return this.finalizePayment(paymentId, 'stripe', transactionRef, 'manual');
        }
      } catch {
        /* pending */
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

    return this.insertPaymentRecord({
      booking_id: data.booking_id,
      customer_id: data.payer_id,
      provider_id: booking.provider_id,
      amount: data.amount,
      payment_method: data.method || 'card',
      status: data.status || 'pending',
      transaction_id: data.transaction_ref || null,
      paid_at: data.status === 'completed' ? new Date().toISOString() : null,
    });
  }

  async getPaymentStats(userId: string, isProvider: boolean) {
    const payments = isProvider
      ? await this.getProviderPayments(userId)
      : await this.getUserPayments(userId);
    return this.aggregateStats(payments);
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
