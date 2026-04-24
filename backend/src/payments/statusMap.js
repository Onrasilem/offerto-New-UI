// Map Mollie/Stripe statuses to internal invoice status
export function mapPaymentStatus(provider, status) {
  if (provider === 'mollie') {
    if (status === 'paid') return 'Paid';
    if (status === 'open') return 'Sent';
    if (status === 'expired') return 'Overdue';
    if (status === 'canceled') return 'Cancelled';
  }
  return 'Sent';
}
