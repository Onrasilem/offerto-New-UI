/**
 * Email Sender - Multi-Provider Support
 * Supports: AWS SES, SendGrid, Mailgun, SMTP (Gmail, etc.)
 */

import nodemailer from 'nodemailer';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { query } from '../db.js';

const sentEmails = [];

// Provider configuration
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'console';
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@offerto.app';

let transporter = null;
let sesClient = null;

// Initialize provider
function initProvider() {
  if (EMAIL_PROVIDER === 'ses') {
    sesClient = new SESClient({
      region: process.env.AWS_SES_REGION || 'eu-west-1',
      credentials: {
        accessKeyId: process.env.AWS_SES_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SES_SECRET_KEY,
      },
    });
    console.log('✅ Email provider: AWS SES');
  } else if (EMAIL_PROVIDER === 'sendgrid') {
    transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    });
    console.log('✅ Email provider: SendGrid');
  } else if (EMAIL_PROVIDER === 'mailgun') {
    transporter = nodemailer.createTransport({
      host: 'smtp.mailgun.org',
      port: 587,
      auth: {
        user: process.env.MAILGUN_SMTP_USER,
        pass: process.env.MAILGUN_SMTP_PASS,
      },
    });
    console.log('✅ Email provider: Mailgun');
  } else if (EMAIL_PROVIDER === 'smtp') {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log('✅ Email provider: SMTP');
  } else {
    console.log('⚠️  Email provider: Console (dev mode)');
  }
}

initProvider();

/**
 * Send email via configured provider
 */
export async function sendEmail(to, subject, text, html = null) {
  const emailData = { to, subject, text, sentAt: new Date().toISOString() };
  
  try {
    let messageId;

    if (EMAIL_PROVIDER === 'ses' && sesClient) {
      // AWS SES
      const command = new SendEmailCommand({
        Source: EMAIL_FROM,
        Destination: { ToAddresses: [to] },
        Message: {
          Subject: { Data: subject },
          Body: html 
            ? { Html: { Data: html } } 
            : { Text: { Data: text } },
        },
      });
      const result = await sesClient.send(command);
      messageId = result.MessageId;
      
    } else if (transporter) {
      // Nodemailer (SendGrid, Mailgun, SMTP)
      const mailOptions = {
        from: EMAIL_FROM,
        to,
        subject,
      };
      
      if (html) {
        mailOptions.html = html;
        mailOptions.text = text;
      } else {
        mailOptions.text = text;
      }
      
      const info = await transporter.sendMail(mailOptions);
      messageId = info.messageId;
      
    } else {
      // Console fallback (dev)
      console.log(`\n📧 Email sent to ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body: ${text.substring(0, 100)}...`);
      messageId = `console-${Date.now()}`;
    }

    sentEmails.push({ ...emailData, messageId, success: true });
    
    // Log to database if possible
    try {
      await query(
        `INSERT INTO email_events(type, meta_json) 
         VALUES($1, $2)`,
        ['sent', JSON.stringify({ to, subject, messageId })]
      );
    } catch (dbError) {
      // Ignore DB errors for email logging
    }

    return { ok: true, message_id: messageId };
    
  } catch (error) {
    console.error('❌ Email send failed:', error.message);
    sentEmails.push({ ...emailData, success: false, error: error.message });
    throw error;
  }
}

export function getSentEmails() {
  return sentEmails;
}
