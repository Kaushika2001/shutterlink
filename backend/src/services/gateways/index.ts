import type { GatewayCheckoutParams, GatewayCheckoutResult, PaymentGatewayId } from './types';
import { isPaymentSandboxMode } from '../../config/env';
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
  if (isPaymentSandboxMode()) {
    return {
      mode: 'simulate',
      sandbox: true,
      message: 'Sandbox mode: no real charge. Click Pay (Sandbox) to complete the test booking.',
    };
  }

  const m = method as PaymentGatewayId;
  if (m === 'onepay') {
    const result = await createOnepayCheckoutLink(params);
    if (result.mode === 'simulate') return { ...result, sandbox: true };
    return result;
  }
  if (m === 'helapay') {
    const result = await createPayhereCheckout(params);
    if (result.mode === 'simulate') return { ...result, sandbox: true };
    return result;
  }
  return {
    mode: 'simulate',
    sandbox: true,
    message: 'Use Pay (Sandbox) to complete this test payment',
  };
}

export { isOnepayConfigured, isPayhereConfigured };
