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

function buildHtml({ company, klant, lines, exTotal, btwTotal, incTotal, docType, nummer, docDatum, signatureData }) {
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
    <div class="signature-section">
      <h3>Digitale goedkeuring</h3>
      <p style="margin-bottom:8px;color:#334155;">Onderstaande handtekening werd toegevoegd in Offerto.</p>
      <img src="${signatureData}" class="signature-image" alt="Handtekening" />
      <p style="margin-top:6px;font-size:11px;color:#64748b;">Datum: ${escapeHtml(docDatum)} — Document: ${escapeHtml(docType)} ${escapeHtml(nummer)}</p>
    </div>
  ` : '';

  const dueDate = docType === 'FACTUUR' ? (() => {
    const days = parseInt(company.betalingsTermijn) || 14;
    const d = new Date(docDatum);
    d.setDate(d.getDate() + days);
    return d.toLocaleDateString('nl-NL');
  })() : null;

  const validityDate = docType === 'OFFERTE' ? (() => {
    const days = parseInt(company.offerteGeldigheidDagen) || 30;
    const d = new Date(docDatum);
    d.setDate(d.getDate() + days);
    return d.toLocaleDateString('nl-NL');
  })() : null;

  const missingCompany = !company.bedrijfsnaam;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(docType)} ${escapeHtml(nummer)}</title>
  <style>
    @page { size: A4; margin: 20mm 15mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1a1a1a; font-size: 10pt; line-height: 1.4; }
    .header { margin-bottom: 20px; padding-bottom: 15px; border-bottom: 3px solid #2563EB; }
    .logo { margin-bottom: 10px; }
    .logo img { max-height: 60px; max-width: 200px; object-fit: contain; }
    h1 { font-size: 24pt; color: #2563EB; margin: 10px 0; font-weight: bold; }
    h2 { font-size: 12pt; color: #333; margin: 15px 0 8px 0; font-weight: bold; border-bottom: 2px solid #2563EB; padding-bottom: 4px; }
    .document-info { background: #f8f9fa; padding: 12px; border-radius: 4px; margin-bottom: 20px; border-left: 4px solid #2563EB; }
    .document-info table { width: 100%; }
    .document-info td { padding: 3px 0; border: none; }
    .document-info td:first-child { font-weight: bold; width: 40%; }
    .parties { display: table; width: 100%; margin-bottom: 20px; }
    .party { display: table-cell; width: 48%; vertical-align: top; padding: 12px; border: 1px solid #ddd; border-radius: 4px; background: #fafafa; }
    .party:first-child { margin-right: 4%; }
    .party-title { font-weight: bold; font-size: 11pt; color: #2563EB; margin-bottom: 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
    .party-content { font-size: 9pt; line-height: 1.6; }
    table.items { width: 100%; border-collapse: collapse; margin: 15px 0; }
    table.items th { background: #2563EB; color: white; padding: 8px 6px; text-align: left; font-weight: bold; font-size: 9pt; }
    table.items th.right { text-align: right; }
    table.items td { padding: 6px; border-bottom: 1px solid #e0e0e0; font-size: 9pt; }
    table.items td.right { text-align: right; }
    table.items tr:last-child td { border-bottom: 2px solid #2563EB; }
    .summary { margin: 20px 0; display: table; width: 100%; }
    .summary-left { display: table-cell; width: 55%; vertical-align: top; }
    .summary-right { display: table-cell; width: 40%; vertical-align: top; padding-left: 5%; }
    table.totals { width: 100%; border: 2px solid #2563EB; border-radius: 4px; background: #f8f9fa; }
    table.totals td { padding: 6px 10px; border: none; font-size: 10pt; }
    table.totals td:first-child { font-weight: 500; }
    table.totals td:last-child { text-align: right; font-weight: bold; }
    table.totals tr:last-child { background: #2563EB; color: white; font-size: 11pt; }
    table.totals tr:last-child td { padding: 10px; }
    .vat-breakdown { background: #fff; padding: 10px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 10px; }
    .vat-breakdown table { width: 100%; }
    .vat-breakdown td { padding: 4px 0; font-size: 9pt; border: none; }
    .payment-info { background: #EFF6FF; padding: 12px; border-left: 4px solid #2563EB; margin: 15px 0; border-radius: 4px; }
    .payment-info h3 { font-size: 11pt; margin-bottom: 8px; color: #2563EB; }
    .payment-info table { width: 100%; }
    .payment-info td { padding: 3px 0; font-size: 9pt; border: none; }
    .payment-info td:first-child { font-weight: bold; width: 35%; }
    .signature-section { margin: 20px 0; padding: 12px; border: 2px solid #e0e0e0; border-radius: 4px; background: #fafafa; }
    .signature-section h3 { font-size: 11pt; margin-bottom: 10px; color: #2563EB; }
    .signature-image { max-height: 80px; margin: 10px 0; }
    .terms { background: #fafafa; padding: 10px; border: 1px solid #e0e0e0; border-radius: 4px; margin: 10px 0; font-size: 8pt; line-height: 1.5; }
    .legal-info { margin-top: 30px; padding-top: 15px; border-top: 2px solid #ddd; font-size: 8pt; color: #666; line-height: 1.5; }
    .legal-info p { margin: 4px 0; }
    .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #ddd; text-align: center; font-size: 8pt; color: #666; }
    strong { font-weight: bold; }
  </style>
</head>
<body>
  ${missingCompany ? `<div style="background:#FFF3CD;border-left:4px solid #F59E0B;padding:10px 14px;margin-bottom:16px;border-radius:4px;font-size:10pt;">
    <strong>Tip:</strong> Vul je bedrijfsgegevens in via Instellingen &rarr; Bewerk voor een professionele PDF.
  </div>` : ''}
  <div class="header">
    ${company.logoUrl ? `<div class="logo"><img src="${company.logoUrl}" alt="Logo" /></div>` : ''}
    <h1>${escapeHtml(docType)} ${escapeHtml(nummer)}</h1>
  </div>

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
        <td><strong>${dueDate}</strong> (${escapeHtml(company.betalingsTermijn || '14 dagen')})</td>
      </tr>` : ''}
      ${docType === 'OFFERTE' ? `
      <tr>
        <td>Geldig tot:</td>
        <td><strong>${validityDate}</strong></td>
      </tr>` : ''}
    </table>
  </div>

  <div class="parties">
    <div class="party">
      <div class="party-title">Van (Leverancier)</div>
      <div class="party-content">
        <strong>${escapeHtml(company.bedrijfsnaam || '')}</strong><br/>
        ${escapeHtml(company.adres || '')}<br/>
        ${escapeHtml(company.postcode || '')} ${escapeHtml(company.stad || '')}<br/>
        ${company.land ? escapeHtml(company.land) + '<br/>' : ''}
        ${company.btwNummer ? '<strong>BTW:</strong> ' + escapeHtml(company.btwNummer) + '<br/>' : ''}
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
        ${klant.btwNummer ? '<strong>BTW:</strong> ' + escapeHtml(klant.btwNummer) + '<br/>' : ''}
        ${klant.email ? '<strong>E-mail:</strong> ' + escapeHtml(klant.email) + '<br/>' : ''}
        ${klant.telefoon ? '<strong>Tel:</strong> ' + escapeHtml(klant.telefoon) : ''}
      </div>
    </div>
  </div>

  <h2>Omschrijving</h2>
  <table class="items">
    <thead>
      <tr>
        <th style="width:5%;">#</th>
        <th style="width:45%;">Omschrijving</th>
        <th class="right" style="width:10%;">Aantal</th>
        <th class="right" style="width:13%;">Prijs/stuk</th>
        <th class="right" style="width:9%;">BTW%</th>
        <th class="right" style="width:18%;">Totaal excl.</th>
      </tr>
    </thead>
    <tbody>
      ${rows || '<tr><td colspan="6" style="text-align:center;color:#999;">Geen items</td></tr>'}
    </tbody>
  </table>

  <div class="summary">
    <div class="summary-left">
      ${docType === 'FACTUUR' ? `
      <div class="payment-info">
        <h3>Betalingsinformatie</h3>
        <table>
          <tr><td>IBAN:</td><td><strong>${escapeHtml(company.iban || 'Niet ingevuld')}</strong></td></tr>
          ${company.bic ? `<tr><td>BIC/SWIFT:</td><td><strong>${escapeHtml(company.bic)}</strong></td></tr>` : ''}
          <tr><td>Betalingstermijn:</td><td><strong>${escapeHtml(company.betalingsTermijn || '14 dagen')}</strong></td></tr>
          <tr><td>Vervaldatum:</td><td><strong>${dueDate}</strong></td></tr>
        </table>
      </div>` : ''}
      <div class="vat-breakdown">
        <p style="font-size:10pt;font-weight:bold;margin-bottom:6px;">BTW-specificatie</p>
        <table>${vatRows}</table>
      </div>
    </div>
    <div class="summary-right">
      <table class="totals">
        <tr><td>Subtotaal excl. BTW</td><td>${currency(exTotal)}</td></tr>
        <tr><td>BTW totaal</td><td>${currency(btwTotal)}</td></tr>
        <tr><td><strong>TE BETALEN</strong></td><td><strong>${currency(incTotal)}</strong></td></tr>
      </table>
    </div>
  </div>

  ${signatureBlock}

  ${company.voorwaarden ? `
  <div class="terms">
    <p style="font-weight:bold;margin-bottom:6px;">Algemene Voorwaarden &amp; Opmerkingen</p>
    <p>${escapeHtml(company.voorwaarden).replace(/\n/g, '<br/>')}</p>
  </div>` : ''}

  <div class="legal-info">
    <p><strong>${escapeHtml(company.bedrijfsnaam || '')}</strong></p>
    <p>
      ${company.btwNummer ? 'BTW: ' + escapeHtml(company.btwNummer) + ' | ' : ''}
      ${company.iban ? 'IBAN: ' + escapeHtml(company.iban) : ''}
    </p>
    <p style="margin-top:8px;">
      ${docType === 'FACTUUR'
        ? `Gelieve te betalen binnen ${escapeHtml(company.betalingsTermijn || '14 dagen')} na factuurdatum.`
        : `Deze offerte is geldig tot ${validityDate}.`
      }
    </p>
  </div>

  <div class="footer">
    <p>${escapeHtml(company.bedrijfsnaam || '')}${company.telefoon ? ' | ' + escapeHtml(company.telefoon) : ''}${company.email ? ' | ' + escapeHtml(company.email) : ''}</p>
    <p style="margin-top:4px;">Gegenereerd via Offerto</p>
  </div>
</body>
</html>`;
}

/** Preview PDF in native viewer (iOS/Android) */
export async function previewPdf(params) {
  const safeParams = { ...params, company: params.company || {}, klant: params.klant || {} };
  const html = buildHtml(safeParams);
  await Print.printAsync({ html, width: 595, height: 842 });
}

/** Generate PDF file and return its URI */
export async function buildPdf(params) {
  const { docType, nummer } = params;
  const safeParams = { ...params, company: params.company || {}, klant: params.klant || {} };

  const html = buildHtml(safeParams);
  const { uri } = await Print.printToFileAsync({ html, base64: false, width: 595, height: 842 });
  const target = FileSystem.documentDirectory + `${docType}-${nummer}-${Date.now()}.pdf`;
  await FileSystem.copyAsync({ from: uri, to: target });
  return target;
}

/** Share an already-generated PDF file */
export async function sharePdf(target) {
  const fileInfo = await FileSystem.getInfoAsync(target);
  if (!fileInfo.exists) throw new Error('PDF bestand niet gevonden');
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(target, { mimeType: 'application/pdf', dialogTitle: 'Deel PDF' });
  } else {
    throw new Error('Delen is niet beschikbaar op dit apparaat');
  }
}
