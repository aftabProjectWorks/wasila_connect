import { PaymentProvider } from '../../services/payments/provider';

// Razorpay adapter skeleton. Disabled until credentials are configured.
export const RazorpayProvider = (opts: { keyId: string; keySecret: string }): PaymentProvider => {
  const { keyId, keySecret } = opts;
  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials not configured');
  }
  return {
    async createPaymentIntent({ amount, currency = 'INR', metadata = {} }) {
      // Implementation would call Razorpay Orders API
      throw new Error('Razorpay provider not implemented in this branch');
    },
    async verifyWebhook(req) {
      throw new Error('Razorpay webhook verification not implemented in this branch');
    },
  };
};
