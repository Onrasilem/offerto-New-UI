// src/lib/pdf.js
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

const escapeHtml = (str) => {
  if (!str) return '';
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
};
const currency = (n) => new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR' }).format(Number(n) || 0);

export async function buildPdf({ company, klant, lines, exTotal, btwTotal, incTotal, docType, nummer, docDatum, signatureData }) {
  console.log('buildPdf called with:', { 
    company: company?.bedrijfsnaam, 
    klant: klant?.bedrijfsnaam || klant?.contactpersoon,
    linesCount: lines?.length,
    exTotal, 
    btwTotal, 
    incTotal,
    docType,
    nummer,
    docDatum
  });

  // Validate required data
  if (!company || !company.bedrijfsnaam) {
    throw new Error('Bedrijfsgegevens ontbreken');
  }
  
  if (!klant || (!klant.bedrijfsnaam && !klant.contactpersoon)) {
    throw new Error('Klantgegevens ontbreken');
  }

  const rows = (lines || []).map((r, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>${escapeHtml(r.omschrijving || '')}</td>
      <td style="text-align:right;">${Number(r.aantal) || 0}</td>
      <td style="text-align:right;">${currency(Number(r.eenheidsprijs) || 0)}</td>
      <td style="text-align:right;">${Number(r.btwPerc) || 0}%</td>
      <td style="text-align:right;">${currency(Number(r.ex) || 0)}</td>
    </tr>`).join('');

  const rates = {};
  (lines || []).forEach(l => {
    const rr = Number(l.btwPerc) || 0;
    rates[rr] = rates[rr] || { ex: 0, vat: 0 };
    rates[rr].ex += Number(l.ex) || 0;
    rates[rr].vat += Number(l.btwA) || 0;
  });
  const vatRows = Object.keys(rates).sort((a, b) => Number(a) - Number(b)).map(r => `
    <tr><td>BTW ${r}% over ${currency(rates[r].ex)}</td><td style="text-align:right;">${currency(rates[r].vat)}</td></tr>
  `).join('');

  const signatureBlock = signatureData ? `
    <h2>Goedkeuring</h2>
    <div style="border:1px solid #e2e8f0; border-radius:8px; padding:10px;">
      <div style="margin-bottom:8px; color:#334155;">Onderstaande handtekening werd toegevoegd in Offerto.</div>
      <img src="${signatureData}" style="height:100px;"/>
      <div style="margin-top:6px; font-size:11px; color:#64748b;">Datum: ${escapeHtml(docDatum)} — Document: ${escapeHtml(docType)} ${escapeHtml(nummer)}</div>
    </div>
  ` : '';

  // Calculate due date for invoices
  const dueDate = docType === 'FACTUUR' ? (() => {
    const betalingstermijn = parseInt(company.betalingsTermijn) || 14;
    const date = new Date(docDatum);
    date.setDate(date.getDate() + betalingstermijn);
    return date.toLocaleDateString('nl-NL');
  })() : null;

  // Calculate validity date for quotes
  const validityDate = docType === 'OFFERTE' ? (() => {
    const geldigheid = parseInt(company.offerteGeldigheidDagen) || 30;
    const date = new Date(docDatum);
    date.setDate(date.getDate() + geldigheid);
    return date.toLocaleDateString('nl-NL');
  })() : null;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${escapeHtml(docType)} ${escapeHtml(nummer)}</title>
      <style>
        @page { 
          size: A4; 
          margin: 20mm 15mm;
        }
        * { 
          box-sizing: border-box; 
          margin: 0; 
          padding: 0; 
        }
        body { 
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          color: #1a1a1a;
          font-size: 10pt;
          line-height: 1.4;
        }
        .header {
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 3px solid #2563EB;
        }
        .logo {
          margin-bottom: 10px;
        }
        .logo img {
          max-height: 60px;
          max-width: 200px;
        }
        h1 {
          font-size: 24pt;
          color: #2563EB;
          margin: 10px 0;
          font-weight: bold;
        }
        h2 {
          font-size: 12pt;
          color: #333;
          margin: 15px 0 8px 0;
          font-weight: bold;
          border-bottom: 2px solid #2563EB;
          padding-bottom: 4px;
        }
        .document-info {
          background: #f8f9fa;
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 20px;
          border-left: 4px solid #2563EB;
        }
        .document-info table {
          width: 100%;
        }
        .document-info td {
          padding: 3px 0;
          border: none;
        }
        .document-info td:first-child {
          font-weight: bold;
          width: 40%;
        }
        .parties {
          display: table;
          width: 100%;
          margin-bottom: 20px;
        }
        .party {
          display: table-cell;
          width: 48%;
          vertical-align: top;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: #fafafa;
        }
        .party:first-child {
          margin-right: 4%;
        }
        .party-title {
          font-weight: bold;
          font-size: 11pt;
          color: #2563EB;
          margin-bottom: 8px;
          border-bottom: 1px solid #ddd;
          padding-bottom: 4px;
        }
        .party-content {
          font-size: 9pt;
          line-height: 1.6;
        }
        table.items {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        table.items th {
          background: #2563EB;
          color: white;
          padding: 8px 6px;
          text-align: left;
          font-weight: bold;
          font-size: 9pt;
        }
        table.items th.right {
          text-align: right;
        }
        table.items td {
          padding: 6px;
          border-bottom: 1px solid #e0e0e0;
          font-size: 9pt;
        }
        table.items td.right {
          text-align: right;
        }
        table.items tr:last-child td {
          border-bottom: 2px solid #2563EB;
        }
        table.items tbody tr:hover {
          background: #f8f9fa;
        }
        .summary {
          margin: 20px 0;
          display: table;
          width: 100%;
        }
        .summary-left {
          display: table-cell;
          width: 55%;
          vertical-align: top;
        }
        .summary-right {
          display: table-cell;
          width: 40%;
          vertical-align: top;
          margin-left: 5%;
        }
        table.totals {
          width: 100%;
          border: 2px solid #2563EB;
          border-radius: 4px;
          background: #f8f9fa;
        }
        table.totals td {
          padding: 6px 10px;
          border: none;
          font-size: 10pt;
        }
        table.totals td:first-child {
          font-weight: 500;
        }
        table.totals td:last-child {
          text-align: right;
          font-weight: bold;
        }
        table.totals tr:last-child {
          background: #2563EB;
          color: white;
          font-size: 11pt;
        }
        table.totals tr:last-child td {
          padding: 10px;
        }
        .vat-breakdown {
          background: #fff;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          margin-bottom: 10px;
        }
        .vat-breakdown table {
          width: 100%;
        }
        .vat-breakdown td {
          padding: 4px 0;
          font-size: 9pt;
          border: none;
        }
        .payment-info {
          background: #e8f4f8;
          padding: 12px;
          border-left: 4px solid #2563EB;
          margin: 15px 0;
          border-radius: 4px;
        }
        .payment-info h3 {
          font-size: 11pt;
          margin-bottom: 8px;
          color: #2563EB;
        }
        .payment-info table {
          width: 100%;
        }
        .payment-info td {
          padding: 3px 0;
          font-size: 9pt;
          border: none;
        }
        .payment-info td:first-child {
          font-weight: bold;
          width: 35%;
        }
        .legal-info {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 2px solid #ddd;
          font-size: 8pt;
          color: #666;
          line-height: 1.5;
        }
        .legal-info h3 {
          font-size: 9pt;
          margin-bottom: 6px;
          color: #333;
        }
        .legal-info p {
          margin: 4px 0;
        }
        .terms {
          background: #fafafa;
          padding: 10px;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          margin: 10px 0;
          font-size: 8pt;
          line-height: 1.5;
        }
        .signature-section {
          margin: 20px 0;
          padding: 12px;
          border: 2px solid #e0e0e0;
          border-radius: 4px;
          background: #fafafa;
        }
        .signature-section h3 {
          font-size: 11pt;
          margin-bottom: 10px;
          color: #2563EB;
        }
        .signature-image {
          max-height: 80px;
          margin: 10px 0;
        }
        .footer {
          margin-top: 20px;
          padding-top: 10px;
          border-top: 1px solid #ddd;
          text-align: center;
          font-size: 8pt;
          color: #666;
        }
        .highlight {
          background: #fff3cd;
          padding: 10px;
          border-left: 4px solid #ffc107;
          margin: 10px 0;
          border-radius: 4px;
        }
        strong { font-weight: bold; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .mb-10 { margin-bottom: 10px; }
        .mt-10 { margin-top: 10px; }
      </style>
    </head>
    <body>
      <!-- Header -->
      <div class="header">
        ${company.logoUrl ? `<div class="logo"><img src="${company.logoUrl}" alt="Logo" /></div>` : ''}
        <h1>${escapeHtml(docType)} ${escapeHtml(nummer)}</h1>
      </div>

      <!-- Document Info Box -->
      <div class="document-info">
        <table>
          <tr>
            <td>${docType === 'FACTUUR' ? 'Factuurdatum:' : 'Offertedatum:'}</td>
            <td>${new Date(docDatum).toLocaleDateString('nl-NL', { day: '2-digit', month: 'long', year: 'numeric' })}</td>
          </tr>
          <tr>
            <td>Documentnummer:</td>
            <td><strong>${escapeHtml(nummer)}</strong></td>
          </tr>
          ${docType === 'FACTUUR' ? `
          <tr>
            <td>Vervaldatum:</td>
            <td><strong>${dueDate}</strong> (${escapeHtml(company.betalingsTermijn || '14')} dagen)</td>
          </tr>` : ''}
          ${docType === 'OFFERTE' ? `
          <tr>
            <td>Geldig tot:</td>
            <td><strong>${validityDate}</strong></td>
          </tr>` : ''}
        </table>
      </div>

      <!-- Parties -->
      <div class="parties">
        <div class="party">
          <div class="party-title">Van (Leverancier)</div>
          <div class="party-content">
            <strong>${escapeHtml(company.bedrijfsnaam || '')}</strong><br/>
            ${escapeHtml(company.adres || '')}<br/>
            ${escapeHtml(company.postcode || '')} ${escapeHtml(company.stad || '')}<br/>
            ${company.land ? escapeHtml(company.land) + '<br/>' : ''}<br/>
            ${company.btwNummer ? '<strong>BTW-nummer:</strong> ' + escapeHtml(company.btwNummer) + '<br/>' : ''}
            ${company.kvkNummer ? '<strong>KvK-nummer:</strong> ' + escapeHtml(company.kvkNummer) + '<br/>' : ''}
            ${company.telefoon ? '<strong>Tel:</strong> ' + escapeHtml(company.telefoon) + '<br/>' : ''}
            ${company.email ? '<strong>E-mail:</strong> ' + escapeHtml(company.email) : ''}
          </div>
        </div>
        <div class="party">
          <div class="party-title">Aan (Klant)</div>
          <div class="party-content">
            <strong>${escapeHtml(klant.bedrijfsnaam || klant.contactpersoon || '')}</strong><br/>
            ${klant.contactpersoon && klant.bedrijfsnaam ? 't.a.v. ' + escapeHtml(klant.contactpersoon) + '<br/>' : ''}
            ${escapeHtml(klant.adres || '')}<br/>
            ${escapeHtml(klant.postcode || '')} ${escapeHtml(klant.stad || '')}<br/>
            ${klant.land ? escapeHtml(klant.land) + '<br/>' : ''}<br/>
            ${klant.btwNummer ? '<strong>BTW-nummer:</strong> ' + escapeHtml(klant.btwNummer) + '<br/>' : ''}
            ${klant.email ? '<strong>E-mail:</strong> ' + escapeHtml(klant.email) + '<br/>' : ''}
            ${klant.telefoon ? '<strong>Tel:</strong> ' + escapeHtml(klant.telefoon) : ''}
          </div>
        </div>
      </div>

      <!-- Items Table -->
      <h2>Omschrijving</h2>
      <table class="items">
        <thead>
          <tr>
            <th style="width: 5%;">#</th>
            <th style="width: 45%;">Omschrijving</th>
            <th class="right" style="width: 10%;">Aantal</th>
            <th class="right" style="width: 12%;">Prijs/stuk</th>
            <th class="right" style="width: 10%;">BTW%</th>
            <th class="right" style="width: 18%;">Totaal excl.</th>
          </tr>
        </thead>
        <tbody>
          ${rows || '<tr><td colspan="6" style="text-align: center; color: #999;">Geen items</td></tr>'}
        </tbody>
      </table>

      <!-- Summary Section -->
      <div class="summary">
        <div class="summary-left">
          ${docType === 'FACTUUR' ? `
          <div class="payment-info">
            <h3>Betalingsinformatie</h3>
            <table>
              <tr>
                <td>IBAN:</td>
                <td><strong>${escapeHtml(company.iban || 'Niet ingevuld')}</strong></td>
              </tr>
              ${company.bic ? `<tr><td>BIC/SWIFT:</td><td><strong>${escapeHtml(company.bic)}</strong></td></tr>` : ''}
              <tr>
                <td>Betalingstermijn:</td>
                <td><strong>${escapeHtml(company.betalingsTermijn || '14')} dagen</strong></td>
              </tr>
              <tr>
                <td>Vervaldatum:</td>
                <td><strong>${dueDate}</strong></td>
              </tr>
            </table>
          </div>` : ''}
          
          <div class="vat-breakdown">
            <h3 style="font-size: 10pt; margin-bottom: 6px;">BTW Specificatie</h3>
            <table>
              ${vatRows}
            </table>
          </div>
        </div>
        
        <div class="summary-right">
          <table class="totals">
            <tr>
              <td>Subtotaal (excl. BTW)</td>
              <td>${currency(exTotal)}</td>
            </tr>
            <tr>
              <td>BTW totaal</td>
              <td>${currency(btwTotal)}</td>
            </tr>
            <tr>
              <td><strong>TE BETALEN</strong></td>
              <td><strong>${currency(incTotal)}</strong></td>
            </tr>
          </table>
        </div>
      </div>

      ${signatureBlock ? `
      <div class="signature-section">
        <h3>✍️ Digitale Goedkeuring</h3>
        <p style="margin-bottom: 8px;">Dit document is digitaal goedgekeurd via Offerto.</p>
        <img src="${signatureData || ''}" class="signature-image" alt="Handtekening" />
        <p style="font-size: 8pt; color: #666; margin-top: 8px;">
          Getekend op: ${new Date(docDatum).toLocaleDateString('nl-NL')} | Document: ${escapeHtml(docType)} ${escapeHtml(nummer)}
        </p>
      </div>` : ''}

      ${company.voorwaarden ? `
      <div class="terms">
        <h3 style="font-size: 9pt; margin-bottom: 6px;">Algemene Voorwaarden & Opmerkingen</h3>
        <p>${escapeHtml(company.voorwaarden).replace(/\n/g, '<br/>')}</p>
      </div>` : ''}

      <!-- Legal Information -->
      <div class="legal-info">
        <h3>Wettelijke Informatie</h3>
        <p><strong>${escapeHtml(company.bedrijfsnaam || '')}</strong></p>
        <p>
          ${company.btwNummer ? 'BTW-nummer: ' + escapeHtml(company.btwNummer) + ' | ' : ''}
          ${company.kvkNummer ? 'KvK-nummer: ' + escapeHtml(company.kvkNummer) + ' | ' : ''}
          ${company.iban ? 'IBAN: ' + escapeHtml(company.iban) : ''}
        </p>
        <p style="margin-top: 8px;">
          ${docType === 'FACTUUR' ? 
            `Deze factuur dient binnen ${escapeHtml(company.betalingsTermijn || '14')} dagen na factuurdatum te worden voldaan. 
            Bij te late betaling zijn wij gerechtigd de wettelijke rente en incassokosten in rekening te brengen.` : 
            `Deze offerte is geldig tot ${validityDate}. Na deze datum kunnen prijzen en voorwaarden wijzigen.`
          }
        </p>
        <p style="margin-top: 4px; font-size: 7pt;">
          ${docType === 'FACTUUR' ? 
            'Facturen zijn opgesteld conform de BTW-wetgeving en voldoen aan de vereisten voor e-facturering (EN16931).' : 
            'Door ondertekening van deze offerte gaat u akkoord met de vermelde voorwaarden en prijzen.'
          }
        </p>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p>
          ${escapeHtml(company.bedrijfsnaam || '')} | 
          ${company.telefoon ? escapeHtml(company.telefoon) + ' | ' : ''}
          ${company.email ? escapeHtml(company.email) : ''}
        </p>
        <p style="margin-top: 4px;">
          Document gegenereerd op ${new Date().toLocaleDateString('nl-NL')} via Offerto
        </p>
      </div>
    </body>
    </html>
  `;

  console.log('Generating PDF with HTML length:', html.length);
  
  try {
    const { uri } = await Print.printToFileAsync({ 
      html,
      base64: false,
      width: 595, // A4 width in points
      height: 842, // A4 height in points
    });
    
    console.log('PDF generated at temp URI:', uri);
    
    const target = FileSystem.documentDirectory + `${docType}-${nummer}-${Date.now()}.pdf`;
    await FileSystem.copyAsync({ from: uri, to: target });
    
    console.log('PDF copied to target:', target);
    
    return target;
  } catch (error) {
    console.error('Error in printToFileAsync:', error);
    throw error;
  }
}

export async function sharePdf(target) {
  try {
    console.log('Sharing PDF from:', target);
    
    // Check if file exists
    const fileInfo = await FileSystem.getInfoAsync(target);
    console.log('File info:', fileInfo);
    
    if (!fileInfo.exists) {
      throw new Error('PDF bestand niet gevonden');
    }
    
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(target, { 
        mimeType: 'application/pdf',
        dialogTitle: 'Deel PDF'
      });
      console.log('PDF shared successfully');
    } else {
      throw new Error('Delen is niet beschikbaar op dit apparaat');
    }
  } catch (error) {
    console.error('Error sharing PDF:', error);
    throw error;
  }
}
