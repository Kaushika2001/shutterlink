import type { GatewayCheckoutParams, GatewayCheckoutResult, PaymentGatewayId } from './types';
import { createOnepayCheckoutLink, isOnepayConfigured } from './onepay.gateway';
import { createPayhereCheckout, isPayhereConfigured } from './payhere.gateway';

export function isGatewayConfigured(method: string): boolean {
  if (method === 'onepay') return isOnepayConfigured();
  if (method === 'helapay') return isPayhereConfigured();
  return false;
}

export async function initiateGatewayCheckout(
  method: string,
  params: GatewayCheckoutParams
): Promise<GatewayCheckoutResult> {
  const m = method as PaymentGatewayId;
  if (m === 'onepay') {
    return createOnepayCheckoutLink(params);
  }
  if (m === 'helapay') {
    return createPayhereCheckout(params);
  }
  return {
    mode: 'simulate',
    message: 'Use card/bank_transfer complete flow or configure OnePay/HelaPay',
  };
}

export { isOnepayConfigured, isPayhereConfigured };
