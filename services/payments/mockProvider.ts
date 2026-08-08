import { PaymentProvider } from '../../services/payments/provider';

export const MockProvider: PaymentProvider = {
  async createPaymentIntent({ amount, currency = 'INR', metadata = {} }) {
    // Simulate a provider response
    return {
      id: `mock_${Date.now()}`,
      amount,
      currency,
      status: 'created',
      metadata,
    };
  },
  async verifyWebhook(req) {
    // Accept anything in mock mode
    return { verified: true, payload: await req.json?.() };
  },
};
