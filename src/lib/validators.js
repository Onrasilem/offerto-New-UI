/**
 * Validation utilities for common input types.
 * Used across forms for email, phone, IBAN, BTW, postcodes, and text sanitization.
 */

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(String(email).toLowerCase());
};

/**
 * Validate phone number (international format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid phone format
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
  return phoneRegex.test(String(phone).replace(/\s/g, ''));
};

/**
 * Validate IBAN (simplified check for European format)
 * @param {string} iban - IBAN to validate
 * @returns {boolean} True if valid IBAN format
 */
export const isValidIBAN = (iban) => {
  const ibanRegex = /^[A-Z]{2}[0-9]{2}(?:[ ]?[0-9]{4}){4}(?:[ ]?[0-9]{1,2})?$/;
  return ibanRegex.test(String(iban).replace(/\s/g, '').toUpperCase());
};

/**
 * Validate BIC (Bank Identifier Code)
 * @param {string} bic - BIC to validate
 * @returns {boolean} True if valid BIC format
 */
export const isValidBIC = (bic) => {
  const bicRegex = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
  return bicRegex.test(String(bic).toUpperCase());
};

/**
 * Validate BTW number (Belgian format: BE + 10 digits)
 * @param {string} btw - BTW number to validate
 * @returns {boolean} True if valid Belgian BTW format
 */
export const isValidBTW = (btw) => {
  const btwRegex = /^BE[0-9]{10}$/;
  return btwRegex.test(String(btw).toUpperCase().replace(/[\s\.]/g, ''));
};

/**
 * Validate postcode (Belgian format: 4 digits)
 * @param {string} postcode - Postcode to validate
 * @returns {boolean} True if valid Belgian postcode format
 */
export const isValidPostcode = (postcode) => {
  return /^[0-9]{4}$/.test(String(postcode));
};

/**
 * Check if a value is not empty
 * @param {*} value - Value to check
 * @returns {boolean} True if value is not empty/null/undefined
 */
export const isRequired = (value) => {
  return value !== null && value !== undefined && String(value).trim().length > 0;
};

/**
 * Validate that a value is a positive number
 * @param {*} value - Value to validate
 * @returns {boolean} True if positive number
 */
export const isPositiveNumber = (value) => {
  const num = parseFloat(value);
  return !isNaN(num) && num > 0;
};

/**
 * Check if value meets minimum length requirement
 * @param {string} value - String value
 * @param {number} min - Minimum length
 * @returns {boolean} True if length >= min
 */
export const hasMinLength = (value, min) => {
  return String(value).length >= min;
};

/**
 * Check if value meets maximum length requirement
 * @param {string} value - String value
 * @param {number} max - Maximum length
 * @returns {boolean} True if length <= max
 */
export const hasMaxLength = (value, max) => {
  return String(value).length <= max;
};

/**
 * Sanitize HTML - removes script tags and event handlers
 * @param {string} html - HTML string to sanitize
 * @returns {string} Sanitized HTML
 */
export const sanitizeHtml = (html) => {
  if (!html) return '';
  return String(html)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]*/gi, '');
};

/**
 * Sanitize text - removes all HTML tags
 * @param {string} text - Text to sanitize
 * @returns {string} Plain text without HTML tags
 */
export const sanitizeText = (text) => {
  if (!text) return '';
  return String(text).replace(/<[^>]*>/g, '');
};

/**
 * General sanitization - removes tags and trims
 * @param {*} value - Value to sanitize
 * @returns {*} Sanitized value
 */
export const sanitize = (value) => {
  if (typeof value === 'string') {
    return sanitizeText(value).trim();
  }
  return value;
};

// Batch validation for company object
/**
 * Validate company profile information
 * @param {Object} company - Company object with fields: bedrijfsnaam, adres, postcode, stad, land, btwNummer, email, telefoon, iban, bic
 * @returns {Object} Object with error messages (empty if valid)
 */
export const validateCompany = (company) => {
  const errors = {};

  if (!isRequired(company.bedrijfsnaam)) {
    errors.bedrijfsnaam = 'Company name is required';
  }

  if (!isRequired(company.adres)) {
    errors.adres = 'Address is required';
  }

  if (!isRequired(company.postcode)) {
    errors.postcode = 'Postcode is required';
  } else if (!isValidPostcode(company.postcode)) {
    errors.postcode = 'Invalid postcode format';
  }

  if (company.email && !isValidEmail(company.email)) {
    errors.email = 'Invalid email address';
  }

  if (company.telefoon && !isValidPhone(company.telefoon)) {
    errors.telefoon = 'Invalid phone number';
  }

  if (company.iban && !isValidIBAN(company.iban)) {
    errors.iban = 'Invalid IBAN';
  }

  if (company.bic && !isValidBIC(company.bic)) {
    errors.bic = 'Invalid BIC';
  }

  if (company.btwNummer && !isValidBTW(company.btwNummer)) {
    errors.btwNummer = 'Invalid BTW number';
  }

  return errors;
};

/**
 * Validate customer (klant) information
 * @param {Object} klant - Customer object with fields: bedrijfsnaam, email, telefoon, adres, btwNummer, btwTariefDefault
 * @returns {Object} Object with error messages (empty if valid)
 */
export const validateKlant = (klant) => {
  const errors = {};

  if (!isRequired(klant.bedrijfsnaam)) {
    errors.bedrijfsnaam = 'Company name is required';
  }

  if (!isRequired(klant.email)) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(klant.email)) {
    errors.email = 'Invalid email address';
  }

  if (klant.telefoon && !isValidPhone(klant.telefoon)) {
    errors.telefoon = 'Invalid phone number';
  }

  if (klant.btwNummer && !isValidBTW(klant.btwNummer)) {
    errors.btwNummer = 'Invalid BTW number';
  }

  return errors;
};

/**
 * Validate line item (onderdeel) for invoices/quotes
 * @param {Object} onderdeel - Line item with fields: omschrijving, eenheidsprijs, aantal, eenheid, btwPerc
 * @returns {Object} Object with error messages (empty if valid)
 */
export const validateOnderdeel = (onderdeel) => {
  const errors = {};

  if (!isRequired(onderdeel.omschrijving)) {
    errors.omschrijving = 'Description is required';
  }

  if (!isRequired(onderdeel.eenheidsprijs)) {
    errors.eenheidsprijs = 'Unit price is required';
  } else if (!isPositiveNumber(onderdeel.eenheidsprijs)) {
    errors.eenheidsprijs = 'Unit price must be a positive number';
  }

  if (onderdeel.eenheid !== 'forfait' && !isRequired(onderdeel.aantal)) {
    errors.aantal = 'Quantity is required';
  } else if (onderdeel.eenheid !== 'forfait' && !isPositiveNumber(onderdeel.aantal)) {
    errors.aantal = 'Quantity must be a positive number';
  }

  return errors;
};
