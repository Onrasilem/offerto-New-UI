export const QuoteStatus = ['Draft', 'Sent', 'Signed', 'Converted', 'Archived'];
export const InvoiceStatus = ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled', 'Archived'];

export function canTransition(type, from, to) {
  // Simple guard; extend as needed
  const allowed = {
    Quote: {
      Draft: ['Sent'],
      Sent: ['Signed', 'Converted', 'Archived'],
      Signed: ['Converted', 'Archived'],
      Converted: ['Archived'],
    },
    Invoice: {
      Draft: ['Sent'],
      Sent: ['Paid', 'Overdue', 'Cancelled'],
      Overdue: ['Paid', 'Cancelled'],
      Paid: ['Archived'],
      Cancelled: ['Archived'],
    },
  };
  return allowed[type]?.[from]?.includes(to) || false;
}
