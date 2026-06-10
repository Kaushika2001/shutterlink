/**
 * PayHere IPG — card & local payments for Sri Lanka (LKR).
 * @see https://support.payhere.lk/api-&-notification-&-plugins/payhere-checkout
 */
import crypto from 'crypto';
import config from '../../config/env';
import type { GatewayCheckoutParams, GatewayCheckoutResult } from './types';

export function isPayhereConfigured(): boolean {
  return Boolean(config.PAYHERE_MERCHANT_ID && config.PAYHERE_MERCHANT_SECRET);
}

function md5(text: string): string {
  return crypto.createHash('md5').update(text).digest('hex').toUpperCase();
}

export function buildPayhereCheckoutFields(
  params: GatewayCheckoutParams
): Record<string, string> {
  const currency = params.currency || 'LKR';
  const amount = Number(params.amount).toFixed(2);
  const orderId = params.paymentId;
  const merchantId = config.PAYHERE_MERCHANT_ID;
  const secret = config.PAYHERE_MERCHANT_SECRET;

  const hash = md5(
    `${merchantId}${orderId}${amount}${currency}${md5(secret).toUpperCase()}`
  );

  const base = config.PAYHERE_SANDBOX
    ? 'https://sandbox.payhere.lk/pay/checkout'
    : 'https://www.payhere.lk/pay/checkout';

  return {
    action: base,
    merchant_id: merchantId,
    return_url: `${config.PAYMENT_RETURN_URL}?gateway=payhere&payment_id=${params.paymentId}&status=return`,
    cancel_url: `${config.PAYMENT_RETURN_URL}?gateway=payhere&payment_id=${params.paymentId}&status=cancel`,
    notify_url: `${config.PAYMENT_WEBHOOK_BASE_URL}/api/payments/webhooks/payhere`,
    order_id: orderId,
    items: `ShutterLink Booking ${params.bookingId}`,
    currency,
    amount,
    first_name: params.customerFirstName || 'ShutterLink',
    last_name: params.customerLastName || 'Customer',
    email: params.customerEmail || 'customer@shutterlink.local',
    phone: params.customerPhone || '0770000000',
    hash,
  };
}

export function createPayhereCheckout(params: GatewayCheckoutParams): GatewayCheckoutResult {
  if (!isPayhereConfigured()) {
    return {
      mode: 'simulate',
      message: 'PayHere credentials not configured — use Pay (Sandbox) in development',
    };
  }

  const fields = buildPayhereCheckoutFields(params);
  const query = new URLSearchParams(fields);
  const redirectUrl = `${fields.action}?${query.toString()}`;

  return {
    mode: 'redirect',
    redirectUrl,
  };
}

export function verifyPayhereNotify(body: Record<string, string>): {
  valid: boolean;
  orderId: string;
  transactionId: string;
  success: boolean;
} {
  const merchantId = body.merchant_id;
  const orderId = body.order_id;
  const payhereAmount = body.payhere_amount;
  const payhereCurrency = body.payhere_currency;
  const statusCode = body.status_code;
  const md5sig = body.md5sig;

  const localSig = md5(
    `${merchantId}${orderId}${payhereAmount}${payhereCurrency}${statusCode}${md5(
      config.PAYHERE_MERCHANT_SECRET
    ).toUpperCase()}`
  );

  const valid = localSig === md5sig;
  const success = statusCode === '2';
  return {
    valid,
    orderId,
    transactionId: body.payment_id || orderId,
    success,
  };
}
