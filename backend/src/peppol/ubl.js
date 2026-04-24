/**
 * UBL 2.1 Invoice Generator
 * Compliant with Peppol BIS 3.0
 */

export function generateUBL({ document, lines, customer, company }) {
  const issueDate = document.date || new Date().toISOString().split('T')[0];
  const dueDate = document.due_date || issueDate;
  const docNumber = document.number || 'UNKNOWN';
  const docType = document.type || 'FACTUUR';

  // Calculate totals
  const lineExtensionAmount = lines.reduce((sum, line) => sum + (line.quantity * line.unit_price), 0);
  const taxAmount = lines.reduce((sum, line) => {
    const lineTotal = line.quantity * line.unit_price;
    return sum + (lineTotal * (line.vat_rate / 100));
  }, 0);
  const taxInclusiveAmount = lineExtensionAmount + taxAmount;
  const payableAmount = taxInclusiveAmount;

  // Company info
  const supplierName = company.name || 'Unknown Supplier';
  const supplierVAT = company.vat || '';
  const supplierAddress = company.address || '';
  const supplierCity = company.city || '';
  const supplierPostal = company.postal_code || '';
  const supplierCountry = company.country || 'BE';

  // Customer info
  const customerName = customer.name || 'Unknown Customer';
  const customerVAT = customer.vat || '';
  const customerAddress = customer.address || '';
  const customerCity = customer.city || '';
  const customerPostal = customer.postalCode || customer.postal_code || '';
  const customerCountry = customer.country || 'BE';

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0</cbc:CustomizationID>
  <cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>
  <cbc:ID>${escapeXml(docNumber)}</cbc:ID>
  <cbc:IssueDate>${issueDate}</cbc:IssueDate>
  <cbc:DueDate>${dueDate}</cbc:DueDate>
  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>

  <!-- Supplier (AccountingSupplierParty) -->
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cbc:EndpointID schemeID="0208">${escapeXml(supplierVAT)}</cbc:EndpointID>
      <cac:PartyName>
        <cbc:Name>${escapeXml(supplierName)}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${escapeXml(supplierAddress)}</cbc:StreetName>
        <cbc:CityName>${escapeXml(supplierCity)}</cbc:CityName>
        <cbc:PostalZone>${escapeXml(supplierPostal)}</cbc:PostalZone>
        <cac:Country>
          <cbc:IdentificationCode>${supplierCountry}</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${escapeXml(supplierVAT)}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${escapeXml(supplierName)}</cbc:RegistrationName>
        <cbc:CompanyID>${escapeXml(supplierVAT)}</cbc:CompanyID>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>

  <!-- Customer (AccountingCustomerParty) -->
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cbc:EndpointID schemeID="0208">${escapeXml(customerVAT)}</cbc:EndpointID>
      <cac:PartyName>
        <cbc:Name>${escapeXml(customerName)}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${escapeXml(customerAddress)}</cbc:StreetName>
        <cbc:CityName>${escapeXml(customerCity)}</cbc:CityName>
        <cbc:PostalZone>${escapeXml(customerPostal)}</cbc:PostalZone>
        <cac:Country>
          <cbc:IdentificationCode>${customerCountry}</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${escapeXml(customerVAT)}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${escapeXml(customerName)}</cbc:RegistrationName>
        <cbc:CompanyID>${escapeXml(customerVAT)}</cbc:CompanyID>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>

  <!-- Tax Total -->
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="EUR">${taxAmount.toFixed(2)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="EUR">${lineExtensionAmount.toFixed(2)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="EUR">${taxAmount.toFixed(2)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID>S</cbc:ID>
        <cbc:Percent>${lines[0]?.vat_rate || 21}</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>

  <!-- Monetary Totals -->
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="EUR">${lineExtensionAmount.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="EUR">${lineExtensionAmount.toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="EUR">${taxInclusiveAmount.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="EUR">${payableAmount.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>

  <!-- Invoice Lines -->
${lines.map((line, idx) => {
  const lineTotal = line.quantity * line.unit_price;
  const lineTax = lineTotal * (line.vat_rate / 100);
  return `  <cac:InvoiceLine>
    <cbc:ID>${idx + 1}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="EA">${line.quantity}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="EUR">${lineTotal.toFixed(2)}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Description>${escapeXml(line.description)}</cbc:Description>
      <cbc:Name>${escapeXml(line.description)}</cbc:Name>
      <cac:ClassifiedTaxCategory>
        <cbc:ID>S</cbc:ID>
        <cbc:Percent>${line.vat_rate}</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="EUR">${line.unit_price.toFixed(2)}</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>`;
}).join('\n')}
</Invoice>`;

  return xml;
}

function escapeXml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
