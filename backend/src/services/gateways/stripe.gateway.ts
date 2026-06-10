/**
 * Stripe Checkout — sandbox & live card payments.
 * Note: Sri Lankan businesses cannot open live Stripe accounts; use test keys for development.
 */
import Stripe from 'stripe';
import config from '../../config/env';
import type { GatewayCheckoutParams, GatewayCheckoutResult } from './types';

let stripeClient: ReturnType<typeof Stripe> | null = null;

function getStripe() {
  if (!stripeClient) {
    if (!config.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    stripeClient = new Stripe(config.STRIPE_SECRET_KEY);
  }
  return stripeClient;
}

export function isStripeConfigured(): boolean {
  return Boolean(config.STRIPE_SECRET_KEY);
}

export async function createStripeCheckout(
  params: GatewayCheckoutParams
): Promise<GatewayCheckoutResult> {
  if (!isStripeConfigured()) {
    return {
      mode: 'simulate',
      message: 'Stripe is not configured — use Pay (Sandbox) in development',
    };
  }

  const stripe = getStripe();
  const currency = (params.currency || 'lkr').toLowerCase();
  const unitAmount = Math.max(1, Math.round(Number(params.amount) * 100));

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency,
          unit_amount: unitAmount,
          product_data: {
            name: 'ShutterLink booking deposit',
            description: `Booking ${params.bookingId}`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      payment_id: params.paymentId,
      booking_id: params.bookingId,
    },
    success_url: `${config.PAYMENT_RETURN_URL}?gateway=stripe&payment_id=${params.paymentId}&session_id={CHECKOUT_SESSION_ID}&status=return`,
    cancel_url: `${config.PAYMENT_RETURN_URL}?gateway=stripe&payment_id=${params.paymentId}&status=cancel`,
    customer_email: params.customerEmail || undefined,
  });

  if (!session.url) {
    throw new Error('Stripe did not return a checkout URL');
  }

  return {
    mode: 'redirect',
    redirectUrl: session.url,
    gatewayTransactionId: session.id,
  };
}

export async function retrieveStripeCheckoutSession(sessionId: string) {
  const stripe = getStripe();
  return stripe.checkout.sessions.retrieve(sessionId);
}

export function constructStripeWebhookEvent(rawBody: Buffer, signature: string | undefined) {
  if (!config.STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  }
  if (!signature) {
    throw new Error('Missing Stripe-Signature header');
  }
  const stripe = getStripe();
  return stripe.webhooks.constructEvent(rawBody, signature, config.STRIPE_WEBHOOK_SECRET);
}
