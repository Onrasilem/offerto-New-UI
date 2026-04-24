// Stub to convert quote → invoice
export function convertQuoteToInvoice(quote) {
  return {
    ...quote,
    type: 'Invoice',
    status: 'Draft',
    number: null, // assign new number
    due_date: null,
  };
}
