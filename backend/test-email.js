/**
 * Test Email Provider
 * Run: node test-email.js
 */

import { sendEmail } from './src/email/sender.js';
import { templates } from './src/email/templates.js';

async function testEmails() {
  console.log('🧪 Testing Email Provider\n');

  try {
    // Test 1: Document sent
    console.log('1️⃣  Testing document sent email...');
    const docEmail = templates.documentSent({
      customerName: 'Jan Janssen',
      companyName: 'Mijn Bedrijf BV',
      documentType: 'Offerte',
      documentNumber: 'OFF-2025-001',
      documentUrl: 'https://offerto.app/view/abc123',
      message: 'Graag uw reactie binnen 7 dagen.',
    });
    
    await sendEmail('test@example.com', docEmail.subject, docEmail.text, docEmail.html);
    console.log('✅ Document email sent\n');

    // Test 2: Follow-up reminder
    console.log('2️⃣  Testing follow-up reminder...');
    const reminderEmail = templates.followup({
      customerName: 'Jan Janssen',
      companyName: 'Mijn Bedrijf BV',
      documentType: 'Offerte',
      documentNumber: 'OFF-2025-001',
      daysOverdue: 5,
      documentUrl: 'https://offerto.app/view/abc123',
    });
    
    await sendEmail('test@example.com', reminderEmail.subject, reminderEmail.text, reminderEmail.html);
    console.log('✅ Reminder email sent\n');

    // Test 3: Payment received
    console.log('3️⃣  Testing payment confirmation...');
    const paymentEmail = templates.paymentReceived({
      customerName: 'Jan Janssen',
      companyName: 'Mijn Bedrijf BV',
      documentNumber: 'INV-2025-001',
      amount: '1.500,00',
      currency: 'EUR',
    });
    
    await sendEmail('test@example.com', paymentEmail.subject, paymentEmail.text, paymentEmail.html);
    console.log('✅ Payment email sent\n');

    // Test 4: Welcome email
    console.log('4️⃣  Testing welcome email...');
    const welcomeEmail = templates.welcome({
      userName: 'Jan Janssen',
      companyName: 'Mijn Bedrijf BV',
    });
    
    await sendEmail('test@example.com', welcomeEmail.subject, welcomeEmail.text, welcomeEmail.html);
    console.log('✅ Welcome email sent\n');

    console.log('✅ All email tests passed!');
    console.log('\nTo use real email provider, set EMAIL_PROVIDER in .env:');
    console.log('  EMAIL_PROVIDER=ses (AWS SES)');
    console.log('  EMAIL_PROVIDER=sendgrid');
    console.log('  EMAIL_PROVIDER=smtp (Gmail, etc.)');
    
  } catch (error) {
    console.error('❌ Email test failed:', error);
    process.exit(1);
  }
}

testEmails();
