export async function processPaymentMock({ amount, currency, payer_member_id, payee_member_id, metadata }: any) {
  // Simulate a payment provider: return succeeded transaction reference
  const reference = `mock_${Date.now()}`;
  return {
    success: true,
    provider: 'mock',
    provider_reference: reference,
    amount,
    currency,
    payer_member_id,
    payee_member_id,
    metadata,
  };
}
