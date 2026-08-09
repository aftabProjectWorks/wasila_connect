import { processPaymentMock } from './mock';

export async function processPayment(provider: string | undefined, params: any) {
  const p = provider || process.env.PAYMENT_PROVIDER || 'mock';
  if (p === 'mock') return processPaymentMock(params);

  // Placeholder: other providers (razorpay) require credentials and setup
  throw new Error(`Payment provider ${p} not implemented or not configured`);
}

export default { processPayment };
