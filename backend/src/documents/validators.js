export function validateSend(doc) {
  if (!doc) return 'Document missing';
  if (!doc.customer_id) return 'Customer missing';
  if (!doc.status || doc.status === 'Draft') return null; // allow send from draft
  return null;
}
