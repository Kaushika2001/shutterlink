import crypto from 'crypto';
import config from '../../config/env';

const ONEPAY_API = 'https://api.onepay.lk';

export function isOnepayConfigured(): boolean {
  return Boolean(
    config.ONEPAY_APP_ID &&
      config.ONEPAY_HASH_SALT &&
      (config.ONEPAY_APP_TOKEN || config.ONEPAY_HASH_TOKEN)
  );
}

function buildHash(appId: string, currency: string, amount: number, hashSalt: string): string {
  const raw = `${appId}${currency}${amount.toFixed(2)}${hashSalt}`;
  return crypto.createHash('sha256').update(raw).digest('hex').toUpperCase();
}

export async function createOnepayCheckoutLink(
  params: import('./types').GatewayCheckoutParams
): Promise<import('./types').GatewayCheckoutResult> {
  if (!isOnepayConfigured()) {
    return {
      mode: 'simulate',
      message: 'OnePay credentials not configured — use complete endpoint in development',
    };
  }

  const currency = params.currency || 'LKR';
  const amount = Number(params.amount);
  const hash = buildHash(config.ONEPAY_APP_ID, currency, amount, config.ONEPAY_HASH_SALT);

  const body = {
    currency,
    app_id: config.ONEPAY_APP_ID,
    hash,
    amount,
    customer_first_name: params.customerFirstName || 'ShutterLink',
    customer_last_name: params.customerLastName || 'Customer',
    customer_phone_number: params.customerPhone || '0770000000',
    customer_email: params.customerEmail || 'customer@shutterlink.local',
    transaction_redirect_url: `${config.PAYMENT_RETURN_URL}?gateway=onepay&payment_id=${params.paymentId}`,
    additionalData: params.paymentId,
  };

  const res = await fetch(`${ONEPAY_API}/v3/checkout/link/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: config.ONEPAY_APP_TOKEN ? `Bearer ${config.ONEPAY_APP_TOKEN}` : '',
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as any;
  if (!res.ok || !json?.data?.gateway?.redirect_url) {
    throw new Error(json?.message || 'OnePay checkout link creation failed');
  }

  return {
    mode: 'redirect',
    redirectUrl: json.data.gateway.redirect_url,
    gatewayTransactionId: json.data.ipg_transaction_id,
  };
}

export async function verifyOnepayTransaction(transactionId: string): Promise<boolean> {
  if (!isOnepayConfigured()) return false;

  const res = await fetch(`${ONEPAY_API}/v3/transaction/status/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: config.ONEPAY_APP_TOKEN ? `Bearer ${config.ONEPAY_APP_TOKEN}` : '',
    },
    body: JSON.stringify({
      app_id: config.ONEPAY_APP_ID,
      transaction_id: transactionId,
    }),
  });

  const json = (await res.json()) as any;
  const paid =
    json?.data?.status === 1 ||
    json?.data?.status === '1' ||
    json?.status === 1 ||
    String(json?.data?.status_message || '').toUpperCase() === 'SUCCESS';
  return Boolean(paid);
}

export function parseOnepayWebhook(body: Record<string, unknown>): {
  transactionId: string;
  merchantReference: string;
  success: boolean;
} {
  const transactionId = String(body.transaction_id || body.ipg_transaction_id || '');
  const merchantReference = String(body.additional_data || body.additionalData || '');
  const status = body.status;
  const success = status === 1 || status === '1' || String(body.status_message).toUpperCase() === 'SUCCESS';
  return { transactionId, merchantReference, success };
}
