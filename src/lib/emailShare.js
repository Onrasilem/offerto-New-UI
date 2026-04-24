import { Linking, Platform } from 'react-native';
import { showErrorToast, showSuccessToast } from './toast';
import { api } from './api';

/**
 * Share a document via email
 * @param {Object} doc - Document object with type, number, date, total
 * @param {string} pdfBase64 - PDF content as base64 string
 * @param {Object} company - Company details for signature
 * @param {string} recipient - Email address to send to
 */
export const shareDocumentViaEmail = async (doc, pdfBase64, company, recipient) => {
  try {
    // Use backend API to send email
    const subject = `${doc.type} ${doc.number} - ${formatDate(doc.date)}`;
    const body = `
Beste,

Hierbij zend ik u de ${doc.type} ${doc.number} voor verder behandeling.

Bedrag: €${formatCurrency(doc.total)}

Bedrijf: ${company.bedrijfsnaam || ''}
${company.email ? `E-mail: ${company.email}` : ''}
${company.telefoon ? `Telefoon: ${company.telefoon}` : ''}

Met vriendelijke groeten,
${company.bedrijfsnaam || ''}
    `.trim();

    // If we have a document ID, use backend API
    if (doc.id) {
      try {
        await api.sendDocument(doc.id, recipient);
        showSuccessToast('Email verzonden!');
        return true;
      } catch (error) {
        console.error('Backend email failed:', error);
        // Fall through to mailto: method
      }
    }

    // Fallback: Open mailto link (works on all platforms)
    const mailtoUrl = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    const canOpen = await Linking.canOpenURL(mailtoUrl);
    if (canOpen) {
      await Linking.openURL(mailtoUrl);
      showSuccessToast('Email client geopend');
      return true;
    } else {
      showErrorToast('Kon email client niet openen');
      return false;
    }
  } catch (error) {
    console.error('Email sharing error:', error);
    showErrorToast(error.message || 'Kon email niet verzenden');
    return false;
  }
};

/**
 * Share document details via email (without PDF)
 */
export const shareDocumentInfoViaEmail = async (doc, company, recipient) => {
  return shareDocumentViaEmail(doc, null, company, recipient);
};

/**
 * Format date for display
 */
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('nl-BE', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

/**
 * Format currency
 */
const formatCurrency = (amount) => {
  return Number(amount || 0).toFixed(2);
};

/**
 * Share document via multiple email addresses
 */
export const shareDocumentToMultiple = async (doc, pdfBase64, company, recipients) => {
  const results = [];
  
  for (const recipient of recipients) {
    try {
      const success = await shareDocumentViaEmail(doc, pdfBase64, company, recipient);
      results.push({ recipient, success });
    } catch (error) {
      results.push({ recipient, success: false, error });
    }
  }
  
  return results;
};

/**
 * Generate shareable link for document
 */
export const generateShareLink = (doc, baseUrl = 'https://offerto.app') => {
  const params = new URLSearchParams({
    doc: doc.number,
    type: doc.type,
    date: doc.date,
    total: doc.total,
  });
  return `${baseUrl}/share?${params.toString()}`;
};
