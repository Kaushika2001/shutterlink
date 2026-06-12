import { apiRequest } from '@/lib/api';
import { getApiBaseUrl } from '@/lib/env';

/* =========================
   TYPES
========================= */

export interface Payment {
  id: string;
  booking_id: string;
  customer_id?: string;
  payer_id?: string;
  provider_name?: string | null;
  customer_name?: string | null;
  provider_amount?: number;
  platform_fee?: number;
  booking_number?: string | null;
  amount: number;
  payment_type?: 'deposit' | 'full_payment' | 'refund' | string;
  payment_method?: string;
  payment_gateway?: string;
  transaction_id?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | string;
  payment_date?: string;
  failure_reason?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentData {
  booking_id: string;
  amount: number;
  payment_type: 'deposit' | 'full_payment' | 'refund';
  payment_method: string;
  payment_gateway?: string;
  transaction_id?: string;
}

export interface PaymentSummary {
  total_paid: number;
  total_refunded: number;
  pending_amount: number;
  payment_status: 'paid' | 'partial' | 'unpaid';
}

export interface ProviderPayout {
  id: string;
  provider_id: string;
  booking_id: string;
  gross_amount: number;
  platform_fee: number;
  net_amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  payout_method?: string;
  payout_date?: string;
  payout_transaction_id?: string;
  failure_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface EarningsSummary {
  total_earnings: number;
  pending_payouts: number;
  completed_payouts: number;
  platform_fees: number;
}

/* =========================
   CREATE PAYMENT
========================= */

export const createPayment = async (paymentData: CreatePaymentData): Promise<Payment> => {
  return await apiRequest<Payment>('/payments', { method: 'POST', body: JSON.stringify(paymentData) }, true);
};

export type CheckoutPaymentType = 'deposit' | 'balance';

export interface CheckoutResponse {
  payment: Payment;
  amount: number;
  payment_type?: CheckoutPaymentType;
  payment_method: string;
  mode?: 'redirect' | 'simulate';
  redirect_url?: string;
  gateway_configured?: boolean;
  sandbox?: boolean;
  message?: string;
}

export async function getPaymentSandboxMode(): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/config/public`);
    const json = await res.json();
    return Boolean(json?.data?.payment_sandbox_mode);
  } catch {
    return process.env.NODE_ENV !== 'production';
  }
}

export interface InPersonBalanceResponse {
  payment: Payment;
  amount: number;
  payment_method: string;
  mode: 'in_person';
  location_address?: string;
  service_date?: string;
  service_time?: string;
  message: string;
}

export const scheduleInPersonBalance = async (bookingId: string): Promise<InPersonBalanceResponse> =>
  apiRequest<InPersonBalanceResponse>(
    '/payments/balance/in-person',
    { method: 'POST', body: JSON.stringify({ booking_id: bookingId }) },
    true
  );

/** Provider confirms cash received at shoot */
export const confirmInPersonBalance = async (bookingId: string): Promise<Payment> =>
  apiRequest<Payment>(
    '/payments/balance/confirm-in-person',
    { method: 'POST', body: JSON.stringify({ booking_id: bookingId }) },
    true
  );

export const checkoutPayment = async (
  bookingId: string,
  paymentMethod: string,
  paymentType: CheckoutPaymentType = 'deposit'
): Promise<CheckoutResponse> =>
  apiRequest<CheckoutResponse>(
    '/payments/checkout',
    {
      method: 'POST',
      body: JSON.stringify({
        booking_id: bookingId,
        payment_method: paymentMethod,
        payment_type: paymentType,
      }),
    },
    true
  );

export const syncPaymentStatus = async (
  paymentId: string,
  stripeSessionId?: string | null
): Promise<Payment> => {
  const query = stripeSessionId
    ? `?session_id=${encodeURIComponent(stripeSessionId)}`
    : '';
  return apiRequest<Payment>(`/payments/${paymentId}/status${query}`, {}, true);
};

export const completePayment = async (
  paymentId: string,
  paymentMethod: string,
  transactionRef?: string
): Promise<Payment> =>
  apiRequest<Payment>(
    `/payments/${paymentId}/complete`,
    {
      method: 'POST',
      body: JSON.stringify({ payment_method: paymentMethod, transaction_ref: transactionRef }),
    },
    true
  );

/* =========================
   GET PAYMENTS
========================= */

// Get all payments for the current user
export const getUserPayments = async (): Promise<Payment[]> => {
  try {
    const data = await apiRequest<Payment[] | null>('/payments/me', {}, true);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

export const getProviderPayments = async (): Promise<Payment[]> => {
  try {
    return await apiRequest<Payment[]>('/payments/provider', {}, true);
  } catch {
    return [];
  }
};

// Get payments for a specific booking
export const getBookingPayments = async (bookingId: string): Promise<Payment[]> => {
  const all = await getUserPayments();
  return all.filter((p) => p.booking_id === bookingId);
};

// Get payment by ID
export const getPaymentById = async (paymentId: string): Promise<Payment> => {
  const all = await getUserPayments();
  const payment = all.find((p) => p.id === paymentId);
  if (!payment) throw new Error('Payment not found');
  return payment;
};

/* =========================
   UPDATE PAYMENT
========================= */

export const updatePaymentStatus = async (
  paymentId: string,
  status: 'pending' | 'completed' | 'failed' | 'refunded',
  metadata?: { failure_reason?: string; payment_date?: string; transaction_id?: string }
): Promise<Payment> => {
  throw new Error('Not implemented in backend yet');
};

/* =========================
   PAYMENT SUMMARY
========================= */

export const getBookingPaymentSummary = async (bookingId: string): Promise<PaymentSummary> => {
  const payments = await getBookingPayments(bookingId);
  const total_paid = payments.filter((p) => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
  return { total_paid, total_refunded: 0, pending_amount: 0, payment_status: total_paid > 0 ? 'partial' : 'unpaid' };
};

/* =========================
   PAYMENT STATISTICS
========================= */

export const getPaymentStats = async () => {
  const data = await getUserPayments();
  return {
    total_payments: data.length,
    total_amount: data.filter((p) => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0),
    pending: data.filter((p) => p.status === 'pending').length,
    completed: data.filter((p) => p.status === 'completed').length,
    failed: data.filter((p) => p.status === 'failed').length,
    refunded: data.filter((p) => p.status === 'refunded').length,
  };
};

/* =========================
   PROVIDER PAYOUTS
========================= */

// Get provider payouts
export const getProviderPayouts = async (): Promise<ProviderPayout[]> => {
  try {
    return await apiRequest<ProviderPayout[]>('/payments/provider', {}, true);
  } catch {
    return [];
  }
};

// Get provider earnings summary
export const getProviderEarnings = async (): Promise<EarningsSummary> => {
  try {
    const payments: Payment[] = await apiRequest<Payment[]>('/payments/provider', {}, true);
    const completed = payments.filter(p => p.status === 'completed');
    const total = completed.reduce((s, p) => s + p.amount, 0);
    const fees = completed.reduce((s, p) => s + (p.payment_type === 'deposit' ? 0 : p.amount * 0.15), 0);
    return {
      total_earnings: total,
      pending_payouts: payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0),
      completed_payouts: total,
      platform_fees: Math.round(fees * 100) / 100,
    };
  } catch {
    return { total_earnings: 0, pending_payouts: 0, completed_payouts: 0, platform_fees: 0 };
  }
};

/* =========================
   HELPER FUNCTIONS
========================= */

// Calculate platform fee
export const calculatePlatformFee = (amount: number): number => {
  return Math.round(amount * 0.15 * 100) / 100; // 15% fee, rounded to 2 decimals
};

// Format currency
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};
