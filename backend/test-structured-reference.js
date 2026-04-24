/**
 * Test Belgische gestructureerde mededeling generator
 */

import {
  generateStructuredReference,
  validateStructuredReference,
  extractDocumentId,
  normalizeStructuredReference,
} from './src/payments/structured-reference.js';

console.log('🧪 Testing Structured Reference Generator\n');

// Test 1: Genereer referenties
console.log('📝 Test 1: Generate references');
const ref1 = generateStructuredReference(1, 1);
const ref2 = generateStructuredReference(42, 5);
const ref3 = generateStructuredReference(12345, 0);
const ref4 = generateStructuredReference(999999, 99);

console.log(`  Document 1, User 1:      ${ref1}`);
console.log(`  Document 42, User 5:     ${ref2}`);
console.log(`  Document 12345, User 0:  ${ref3}`);
console.log(`  Document 999999, User 99: ${ref4}`);

// Test 2: Valideer correcte referenties
console.log('\n✅ Test 2: Validate correct references');
console.log(`  ${ref1}: ${validateStructuredReference(ref1) ? '✅' : '❌'}`);
console.log(`  ${ref2}: ${validateStructuredReference(ref2) ? '✅' : '❌'}`);

// Test 3: Valideer incorrecte referenties
console.log('\n❌ Test 3: Validate incorrect references');
const invalid1 = '+++123/4567/89013+++'; // Verkeerde checksum
const invalid2 = '+++123/4567/890+++';   // Te kort
const invalid3 = '+++ABC/DEFG/HIJKL+++'; // Letters
console.log(`  ${invalid1}: ${validateStructuredReference(invalid1) ? '❌ FOUT' : '✅ Correct geweigerd'}`);
console.log(`  ${invalid2}: ${validateStructuredReference(invalid2) ? '❌ FOUT' : '✅ Correct geweigerd'}`);
console.log(`  ${invalid3}: ${validateStructuredReference(invalid3) ? '❌ FOUT' : '✅ Correct geweigerd'}`);

// Test 4: Extract document ID
console.log('\n🔍 Test 4: Extract document ID');
console.log(`  ${ref1} → Document ID: ${extractDocumentId(ref1)}`);
console.log(`  ${ref2} → Document ID: ${extractDocumentId(ref2)}`);
console.log(`  ${ref3} → Document ID: ${extractDocumentId(ref3)}`);

// Test 5: Normaliseer verschillende input formaten
console.log('\n🔧 Test 5: Normalize different input formats');
const inputs = [
  '123456789012',              // Alleen cijfers
  '123 456 789 012',           // Met spaties
  '+++123/456/789012+++',      // Correct formaat
  '123/456/789012',            // Zonder +++
];

inputs.forEach(input => {
  const normalized = normalizeStructuredReference(input);
  console.log(`  "${input}" → ${normalized || 'INVALID'}`);
});

// Test 6: Real-world scenario
console.log('\n🌍 Test 6: Real-world scenario');
const invoiceId = 1234;
const customerId = 5;
const reference = generateStructuredReference(invoiceId, customerId);

console.log(`  📄 Factuur #${invoiceId} voor klant #${customerId}`);
console.log(`  📋 Gestructureerde mededeling: ${reference}`);
console.log(`  ✅ Is geldig: ${validateStructuredReference(reference)}`);
console.log(`  🔍 Terug naar factuur ID: ${extractDocumentId(reference)}`);

// Test 7: Klant betaalt met verschillende formaten
console.log('\n💳 Test 7: Customer payment scenarios');
const customerInputs = [
  reference,                           // Perfect
  reference.replace(/\+/g, ''),        // Zonder +++
  reference.replace(/\//g, ''),        // Zonder /
  reference.replace(/\D/g, ''),        // Alleen cijfers
  reference.toLowerCase(),             // Lowercase (should work)
];

console.log(`  Originele referentie: ${reference}\n`);
customerInputs.forEach((input, i) => {
  const isValid = validateStructuredReference(input);
  const docId = extractDocumentId(input);
  console.log(`  Input ${i + 1}: "${input}"`);
  console.log(`    → Geldig: ${isValid ? '✅' : '❌'}, Document ID: ${docId || 'NIET GEVONDEN'}`);
});

console.log('\n🎉 All tests completed!');
