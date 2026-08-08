export interface PaymentProvider {
  createPaymentIntent(args: { amount: number; currency?: string; metadata?: any }): Promise<any>;
  verifyWebhook(req: any): Promise<any>;
}
