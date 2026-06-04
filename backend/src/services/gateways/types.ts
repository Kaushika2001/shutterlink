export type PaymentGatewayId = 'onepay' | 'helapay' | 'card' | 'bank_transfer';

export interface GatewayCheckoutParams {
  paymentId: string;
  bookingId: string;
  amount: number;
  currency: string;
  customerEmail?: string;
  customerPhone?: string;
  customerFirstName?: string;
  customerLastName?: string;
}

export interface GatewayCheckoutResult {
  mode: 'redirect' | 'simulate';
  redirectUrl?: string;
  gatewayTransactionId?: string;
  message?: string;
  sandbox?: boolean;
}

export interface GatewayWebhookPayload {
  gateway: PaymentGatewayId;
  transactionId: string;
  merchantReference: string;
  status: 'success' | 'failed' | 'pending';
  raw: Record<string, unknown>;
}
