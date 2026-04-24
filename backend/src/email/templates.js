/**
 * Email Templates
 * Professional email templates for all customer communications
 */

export const templates = {
  // Document sent email
  documentSent: ({ customerName, companyName, documentType, documentNumber, documentUrl, message }) => ({
    subject: `${companyName} - ${documentType} ${documentNumber}`,
    text: `Beste ${customerName},\n\nHierbij ontvangt u ${documentType} ${documentNumber}.\n\n${message || ''}\n\nMet vriendelijke groet,\n${companyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Beste ${customerName},</h2>
        <p>Hierbij ontvangt u <strong>${documentType} ${documentNumber}</strong>.</p>
        ${message ? `<p>${message}</p>` : ''}
        ${documentUrl ? `<p><a href="${documentUrl}" style="background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Bekijk ${documentType}</a></p>` : ''}
        <p style="margin-top: 30px; color: #666;">Met vriendelijke groet,<br><strong>${companyName}</strong></p>
      </div>
    `
  }),

  // Follow-up reminder
  followup: ({ customerName, companyName, documentType, documentNumber, daysOverdue, documentUrl }) => ({
    subject: `Herinnering: ${documentType} ${documentNumber}`,
    text: `Beste ${customerName},\n\nWij willen u vriendelijk herinneren aan ${documentType} ${documentNumber}.\n\n${daysOverdue ? `Deze is ${daysOverdue} dagen geleden verzonden.` : ''}\n\nMet vriendelijke groet,\n${companyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Beste ${customerName},</h2>
        <p>Wij willen u vriendelijk herinneren aan <strong>${documentType} ${documentNumber}</strong>.</p>
        ${daysOverdue ? `<p style="color: #666;">Deze is ${daysOverdue} dagen geleden verzonden.</p>` : ''}
        ${documentUrl ? `<p><a href="${documentUrl}" style="background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Bekijk ${documentType}</a></p>` : ''}
        <p style="margin-top: 30px; color: #666;">Met vriendelijke groet,<br><strong>${companyName}</strong></p>
      </div>
    `
  }),

  // Payment received
  paymentReceived: ({ customerName, companyName, documentNumber, amount, currency = 'EUR' }) => ({
    subject: `Betaling ontvangen voor ${documentNumber}`,
    text: `Beste ${customerName},\n\nWij hebben uw betaling van ${currency} ${amount} ontvangen voor ${documentNumber}.\n\nHartelijk dank!\n\nMet vriendelijke groet,\n${companyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">✓ Betaling ontvangen</h2>
        <p>Beste ${customerName},</p>
        <p>Wij hebben uw betaling van <strong>${currency} ${amount}</strong> ontvangen voor <strong>${documentNumber}</strong>.</p>
        <p>Hartelijk dank!</p>
        <p style="margin-top: 30px; color: #666;">Met vriendelijke groet,<br><strong>${companyName}</strong></p>
      </div>
    `
  }),

  // Welcome email (after registration)
  welcome: ({ userName, companyName }) => ({
    subject: 'Welkom bij Offerto!',
    text: `Beste ${userName},\n\nWelkom bij Offerto! Je account is succesvol aangemaakt.\n\nJe kunt nu direct beginnen met het maken van professionele offertes en facturen.\n\nVeel succes!\n\nHet Offerto Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #0066cc;">Welkom bij Offerto! 👋</h1>
        <p>Beste ${userName},</p>
        <p>Je account is succesvol aangemaakt${companyName ? ` voor <strong>${companyName}</strong>` : ''}.</p>
        <p>Je kunt nu direct beginnen met:</p>
        <ul style="line-height: 1.8;">
          <li>✓ Professionele offertes maken</li>
          <li>✓ Facturen versturen</li>
          <li>✓ Klanten beheren</li>
          <li>✓ Betalingen volgen</li>
        </ul>
        <p style="margin-top: 30px;">Veel succes!</p>
        <p style="color: #666;">Het Offerto Team</p>
      </div>
    `
  }),
};
