import { supabase } from '@/lib/supabaseClient';

/* =========================
   TYPES
========================= */

export interface Payment {
  id: string;
  booking_id: string;
  payer_id: string;
  amount: number;
  payment_type: 'deposit' | 'full_payment' | 'refund';
  payment_method: string;
  payment_gateway?: string;
  transaction_id?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
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
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('You must be logged in to create a payment');
  }

  const { data, error } = await supabase
    .from('payments')
    .insert({
      payer_id: user.id,
      ...paymentData,
      status: 'pending'
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating payment:', error);
    throw new Error(error.message || 'Failed to create payment');
  }

  return data;
};

/* =========================
   GET PAYMENTS
========================= */

// Get all payments for the current user
export const getUserPayments = async (): Promise<Payment[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('You must be logged in to view payments');
  }

  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('payer_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching payments:', error);
    throw new Error('Failed to fetch payments');
  }

  return data || [];
};

// Get payments for a specific booking
export const getBookingPayments = async (bookingId: string): Promise<Payment[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('You must be logged in to view payments');
  }

  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching booking payments:', error);
    throw new Error('Failed to fetch booking payments');
  }

  return data || [];
};

// Get payment by ID
export const getPaymentById = async (paymentId: string): Promise<Payment> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('You must be logged in to view payment details');
  }

  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .single();

  if (error) {
    console.error('Error fetching payment:', error);
    throw new Error('Payment not found');
  }

  // Verify the user owns this payment
  if (data.payer_id !== user.id) {
    throw new Error('You do not have permission to view this payment');
  }

  return data;
};

/* =========================
   UPDATE PAYMENT
========================= */

export const updatePaymentStatus = async (
  paymentId: string,
  status: 'pending' | 'completed' | 'failed' | 'refunded',
  metadata?: { failure_reason?: string; payment_date?: string; transaction_id?: string }
): Promise<Payment> => {
  const updates: any = { status };

  if (metadata?.failure_reason) {
    updates.failure_reason = metadata.failure_reason;
  }
  if (metadata?.payment_date) {
    updates.payment_date = metadata.payment_date;
  }
  if (metadata?.transaction_id) {
    updates.transaction_id = metadata.transaction_id;
  }

  // If marking as completed, set payment_date
  if (status === 'completed' && !updates.payment_date) {
    updates.payment_date = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('payments')
    .update(updates)
    .eq('id', paymentId)
    .select()
    .single();

  if (error) {
    console.error('Error updating payment:', error);
    throw new Error('Failed to update payment');
  }

  return data;
};

/* =========================
   PAYMENT SUMMARY
========================= */

export const getBookingPaymentSummary = async (bookingId: string): Promise<PaymentSummary> => {
  const { data, error } = await supabase
    .rpc('get_booking_payment_summary', {
      p_booking_id: bookingId
    })
    .single();

  if (error) {
    console.error('Error fetching payment summary:', error);
    throw new Error('Failed to fetch payment summary');
  }

  return data as PaymentSummary;
};

/* =========================
   PAYMENT STATISTICS
========================= */

export const getPaymentStats = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('You must be logged in');
  }

  const { data, error } = await supabase
    .from('payments')
    .select('status, amount, payment_type')
    .eq('payer_id', user.id);

  if (error) {
    console.error('Error fetching payment stats:', error);
    return {
      total_payments: 0,
      total_amount: 0,
      pending: 0,
      completed: 0,
      failed: 0,
      refunded: 0
    };
  }

  const stats = {
    total_payments: data.length,
    total_amount: data
      .filter(p => p.status === 'completed' && p.payment_type !== 'refund')
      .reduce((sum, p) => sum + p.amount, 0),
    pending: data.filter(p => p.status === 'pending').length,
    completed: data.filter(p => p.status === 'completed').length,
    failed: data.filter(p => p.status === 'failed').length,
    refunded: data.filter(p => p.status === 'refunded').length
  };

  return stats;
};

/* =========================
   PROVIDER PAYOUTS
========================= */

// Get provider payouts
export const getProviderPayouts = async (): Promise<ProviderPayout[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('You must be logged in to view payouts');
  }

  // Get provider profile
  const { data: profile, error: profileError } = await supabase
    .from('provider_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (profileError || !profile) {
    throw new Error('Provider profile not found');
  }

  const { data, error } = await supabase
    .from('provider_payouts')
    .select('*')
    .eq('provider_id', profile.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching provider payouts:', error);
    throw new Error('Failed to fetch payouts');
  }

  return data || [];
};

// Get provider earnings summary
export const getProviderEarnings = async (): Promise<EarningsSummary> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('You must be logged in');
  }

  // Get provider profile
  const { data: profile, error: profileError } = await supabase
    .from('provider_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (profileError || !profile) {
    throw new Error('Provider profile not found');
  }

  const { data, error } = await supabase
    .rpc('get_provider_earnings_summary', {
      p_provider_id: profile.id
    })
    .single();

  if (error) {
    console.error('Error fetching provider earnings:', error);
    return {
      total_earnings: 0,
      pending_payouts: 0,
      completed_payouts: 0,
      platform_fees: 0
    };
  }

  return data as EarningsSummary;
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
