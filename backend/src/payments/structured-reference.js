/**
 * Belgische gestructureerde mededeling generator
 * Formaat: +++123/4567/89012+++ (mod97 check)
 * 
 * Gebruikt voor automatische betalingsreconciliatie via bankfeeds
 */

/**
 * Converteer UUID of string naar numeriek ID
 * @param {string|number} id - UUID of numeriek ID
 * @returns {number} Numeriek ID
 */
function hashIdToNumber(id) {
  if (typeof id === 'number') return id;
  
  // Voor UUIDs: neem de laatste 8 hex characters en converteer naar decimaal
  const str = String(id).replace(/-/g, '');
  const last8 = str.slice(-8);
  return parseInt(last8, 16) % 100000000; // Beperk tot 8 cijfers
}

/**
 * Genereert een Belgische gestructureerde mededeling
 * @param {number|string} documentId - Het document/factuur ID (number of UUID)
 * @param {number|string} userId - Optioneel: user ID voor extra uniciteit
 * @returns {string} Geformatteerde gestructureerde mededeling (+++123/4567/89012+++)
 */
function generateStructuredReference(documentId, userId = 0) {
  // Converteer IDs naar numerieke waarden
  const numericDocId = hashIdToNumber(documentId);
  const numericUserId = hashIdToNumber(userId);
  
  // Maak een 10-cijferig nummer (max 9999999999)
  // Formaat: [userId (2 cijfers)][documentId (8 cijfers)]
  const userPart = String(numericUserId % 100).padStart(2, '0');
  const docPart = String(numericDocId).padStart(8, '0');
  const baseNumber = userPart + docPart;

  // Bereken mod97 check digits (97 - (nummer mod 97))
  const checksum = 97 - (parseInt(baseNumber) % 97);
  const checksumStr = String(checksum).padStart(2, '0');

  // Combineer: 10 cijfers + 2 check digits
  const fullNumber = baseNumber + checksumStr;

  // Formatteer als +++XXX/XXXX/XXXXX+++
  const formatted = `+++${fullNumber.slice(0, 3)}/${fullNumber.slice(3, 7)}/${fullNumber.slice(7)}+++`;

  return formatted;
}

/**
 * Valideert een gestructureerde mededeling
 * @param {string} reference - De te valideren referentie
 * @returns {boolean} True als geldig
 */
function validateStructuredReference(reference) {
  // Verwijder alle non-numerieke characters
  const cleaned = reference.replace(/\D/g, '');

  // Moet exact 12 cijfers zijn
  if (cleaned.length !== 12) {
    return false;
  }

  // Check mod97
  const baseNumber = cleaned.slice(0, 10);
  const checksum = parseInt(cleaned.slice(10, 12));
  const expectedChecksum = 97 - (parseInt(baseNumber) % 97);

  return checksum === expectedChecksum;
}

/**
 * Extraheert numeriek hash uit gestructureerde mededeling
 * @param {string} reference - De gestructureerde mededeling
 * @returns {number|null} Numeriek hash van document ID of null als invalid
 * @note Dit is een hash - om het originele document ID te vinden moet je in de database zoeken
 */
function extractDocumentId(reference) {
  if (!validateStructuredReference(reference)) {
    return null;
  }

  const cleaned = reference.replace(/\D/g, '');
  // Numerieke hash zit in cijfers 3-10 (na de 2-cijferige user part)
  return parseInt(cleaned.slice(2, 10));
}

/**
 * Normaliseert een gestructureerde mededeling naar standaard formaat
 * @param {string} reference - Ruwe input (kan spaties, +++ bevatten)
 * @returns {string|null} Geformatteerde referentie of null als invalid
 */
function normalizeStructuredReference(reference) {
  if (!validateStructuredReference(reference)) {
    return null;
  }

  const cleaned = reference.replace(/\D/g, '');
  return `+++${cleaned.slice(0, 3)}/${cleaned.slice(3, 7)}/${cleaned.slice(7)}+++`;
}

export {
  generateStructuredReference,
  validateStructuredReference,
  extractDocumentId,
  normalizeStructuredReference,
};
