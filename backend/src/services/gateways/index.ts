import type { GatewayCheckoutParams, GatewayCheckoutResult } from './types';
import { isPaymentSandboxMode } from '../../config/env';
import { createStripeCheckout, isStripeConfigured } from './stripe.gateway';

export function isGatewayConfigured(method: string): boolean {
  return method === 'stripe' && isStripeConfigured();
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

  if (method === 'stripe') {
    const result = await createStripeCheckout(params);
    if (result.mode === 'simulate') return { ...result, sandbox: true };
    return result;
  }

  return {
    mode: 'simulate',
    sandbox: true,
    message: 'Use Pay (Sandbox) to complete this test payment',
  };
}

export { isStripeConfigured };
