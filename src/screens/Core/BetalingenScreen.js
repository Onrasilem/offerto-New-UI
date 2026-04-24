import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useOfferto } from '../../context/OffertoContext';
import api from '../../lib/api';
import { theme } from '../../components/UI';

/**
 * Betalingen Screen - Overzicht + Manuele registratie
 */
export default function BetalingenScreen({ navigation }) {
  const { documents, refreshDocuments } = useOfferto();
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);

  // Payment form state
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [structuredRef, setStructuredRef] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [notes, setNotes] = useState('');
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    try {
      setLoading(true);
      const data = await api.getPaymentOverview();
      setOverview(data);
    } catch (error) {
      console.error('Failed to load payment overview:', error);
      Alert.alert('Fout', 'Kon betalingen niet laden');
    } finally {
      setLoading(false);
    }
  };

  const findMatches = async () => {
    if (!amount) {
      Alert.alert('Fout', 'Vul eerst een bedrag in');
      return;
    }

    try {
      setLoading(true);
      const data = await api.findPaymentMatches({
        amount: parseFloat(amount),
        structuredReference: structuredRef || null,
      });
      setMatches(data.matches || []);
      
      if (data.matches && data.matches.length > 0) {
        Alert.alert(
          'Matches gevonden',
          `${data.matches.length} mogelijke match(es) gevonden`
        );
      } else {
        Alert.alert('Geen matches', 'Geen facturen gevonden die matchen');
      }
    } catch (error) {
      console.error('Failed to find matches:', error);
      Alert.alert('Fout', 'Kon matches niet vinden');
    } finally {
      setLoading(false);
    }
  };

  const registerPayment = async (documentId) => {
    if (!amount) {
      Alert.alert('Fout', 'Bedrag is verplicht');
      return;
    }

    try {
      setLoading(true);
      const result = await api.registerPayment({
        documentId,
        amount: parseFloat(amount),
        paymentMethod,
        structuredReference: structuredRef || null,
        bankStatementDate: paymentDate || new Date().toISOString().split('T')[0],
        notes,
      });

      Alert.alert('Succes', 'Betaling geregistreerd', [
        {
          text: 'OK',
          onPress: () => {
            setAmount('');
            setStructuredRef('');
            setNotes('');
            setMatches([]);
            setSelectedDoc(null);
            loadOverview();
            refreshDocuments();
          },
        },
      ]);
    } catch (error) {
      console.error('Failed to register payment:', error);
      Alert.alert('Fout', error.message || 'Kon betaling niet registreren');
    } finally {
      setLoading(false);
    }
  };

  const openInvoice = (documentId) => {
    const doc = documents.find(d => d.id === documentId);
    if (doc) {
      navigation.navigate('FactuurDetail', { document: doc });
    }
  };

  if (loading && !overview) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>💳 Betalingen</Text>
        <Text style={styles.subtitle}>Credit Management</Text>
      </View>

      {/* Overview Cards */}
      {overview && (
        <View style={styles.overviewSection}>
          <View style={[styles.card, styles.unpaidCard]}>
            <Text style={styles.cardLabel}>Openstaand</Text>
            <Text style={styles.cardAmount}>
              € {parseFloat(overview.totals.outstanding_amount || 0).toFixed(2)}
            </Text>
            <Text style={styles.cardSub}>
              {overview.totals.unpaid_count} onbetaald
              {overview.totals.overdue_count > 0 && (
                <Text style={styles.overdueText}> · {overview.totals.overdue_count} vervallen</Text>
              )}
            </Text>
          </View>

          <View style={[styles.card, styles.paidCard]}>
            <Text style={styles.cardLabel}>Betaald</Text>
            <Text style={styles.cardAmount}>
              € {parseFloat(overview.totals.paid_amount || 0).toFixed(2)}
            </Text>
          </View>
        </View>
      )}

      {/* Manual Payment Registration */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 Betaling Registreren</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Bedrag (€)</Text>
          <TextInput
            style={styles.input}
            placeholder="125.50"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Gestructureerde Mededeling (optioneel)</Text>
          <TextInput
            style={styles.input}
            placeholder="+++123/4567/89012+++"
            value={structuredRef}
            onChangeText={setStructuredRef}
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity 
          style={styles.findButton} 
          onPress={findMatches}
          disabled={loading || !amount}
        >
          <Text style={styles.findButtonText}>
            {loading ? '...' : '🔍 Zoek Matches'}
          </Text>
        </TouchableOpacity>

        {/* Matches List */}
        {matches.length > 0 && (
          <View style={styles.matchesSection}>
            <Text style={styles.matchesTitle}>
              {matches.length} match{matches.length !== 1 && 'es'} gevonden:
            </Text>
            {matches.map((match, idx) => (
              <View key={idx} style={styles.matchCard}>
                <View style={styles.matchHeader}>
                  <Text style={styles.matchNumber}>Factuur #{match.documentNumber}</Text>
                  <View style={[styles.confidenceBadge, {
                    backgroundColor: match.confidence >= 0.9 ? '#4ade80' : 
                                    match.confidence >= 0.7 ? '#fbbf24' : '#94a3b8'
                  }]}>
                    <Text style={styles.confidenceText}>
                      {Math.round(match.confidence * 100)}%
                    </Text>
                  </View>
                </View>
                <Text style={styles.matchCustomer}>{match.customerName}</Text>
                <Text style={styles.matchAmount}>€ {match.amount.toFixed(2)}</Text>
                <Text style={styles.matchType}>Match type: {match.matchType}</Text>
                
                <TouchableOpacity
                  style={styles.registerButton}
                  onPress={() => registerPayment(match.documentId)}
                  disabled={loading}
                >
                  <Text style={styles.registerButtonText}>✓ Registreer Betaling</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Additional Fields */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Betaalmethode</Text>
          <View style={styles.methodButtons}>
            {[
              { value: 'bank_transfer', label: '🏦 Overschrijving' },
              { value: 'cash', label: '💵 Cash' },
              { value: 'mollie', label: '💳 Online' },
            ].map(method => (
              <TouchableOpacity
                key={method.value}
                style={[
                  styles.methodButton,
                  paymentMethod === method.value && styles.methodButtonActive
                ]}
                onPress={() => setPaymentMethod(method.value)}
              >
                <Text style={[
                  styles.methodButtonText,
                  paymentMethod === method.value && styles.methodButtonTextActive
                ]}>
                  {method.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Notities (optioneel)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Bijv. betaling ontvangen op 15/12/2025"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>
      </View>

      {/* Overdue Invoices */}
      {overview && overview.overdueInvoices && overview.overdueInvoices.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ Vervallen Facturen</Text>
          {overview.overdueInvoices.map(invoice => (
            <TouchableOpacity
              key={invoice.id}
              style={styles.overdueCard}
              onPress={() => openInvoice(invoice.id)}
            >
              <View style={styles.overdueHeader}>
                <Text style={styles.overdueNumber}>#{invoice.number}</Text>
                <Text style={styles.overdueAmount}>
                  € {parseFloat(invoice.total_incl_vat || 0).toFixed(2)}
                </Text>
              </View>
              <Text style={styles.overdueCustomer}>{invoice.customer_name}</Text>
              <Text style={styles.overdueDays}>
                {Math.floor(invoice.days_overdue)} dagen vervallen
              </Text>
              <Text style={styles.overdueRef}>{invoice.structured_reference}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Recent Payments */}
      {overview && overview.recentPayments && overview.recentPayments.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Recente Betalingen</Text>
          {overview.recentPayments.slice(0, 10).map(payment => (
            <View key={payment.id} style={styles.paymentCard}>
              <View style={styles.paymentHeader}>
                <Text style={styles.paymentDoc}>#{payment.document_number}</Text>
                <Text style={styles.paymentAmount}>
                  € {parseFloat(payment.amount || 0).toFixed(2)}
                </Text>
              </View>
              <Text style={styles.paymentCustomer}>{payment.customer_name}</Text>
              <Text style={styles.paymentMethod}>
                {payment.payment_method === 'bank_transfer' && '🏦 Overschrijving'}
                {payment.payment_method === 'cash' && '💵 Cash'}
                {payment.payment_method === 'mollie' && '💳 Online'}
              </Text>
              <Text style={styles.paymentDate}>
                {new Date(payment.paid_at).toLocaleDateString('nl-NL')}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: theme.primary,
    padding: 16,
    paddingTop: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  overviewSection: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  card: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  unpaidCard: {
    backgroundColor: '#fef2f2',
  },
  paidCard: {
    backgroundColor: '#f0fdf4',
  },
  cardLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  cardAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 8,
  },
  cardSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  overdueText: {
    color: '#dc2626',
    fontWeight: '600',
  },
  section: {
    margin: 16,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8fafc',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  findButton: {
    backgroundColor: theme.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  findButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  matchesSection: {
    marginTop: 16,
  },
  matchesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 12,
  },
  matchCard: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: theme.primary,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  matchNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  matchCustomer: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  matchAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.primary,
    marginBottom: 4,
  },
  matchType: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 12,
  },
  registerButton: {
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  registerButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  methodButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  methodButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  methodButtonActive: {
    borderColor: theme.primary,
    backgroundColor: `${theme.primary}10`,
  },
  methodButtonText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  methodButtonTextActive: {
    color: theme.primary,
  },
  overdueCard: {
    backgroundColor: '#fef2f2',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
  },
  overdueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  overdueNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  overdueAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  overdueCustomer: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  overdueDays: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '600',
    marginBottom: 4,
  },
  overdueRef: {
    fontSize: 11,
    color: '#94a3b8',
    fontFamily: 'monospace',
  },
  paymentCard: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  paymentDoc: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  paymentAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10b981',
  },
  paymentCustomer: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  paymentMethod: {
    fontSize: 11,
    color: '#94a3b8',
  },
  paymentDate: {
    fontSize: 11,
    color: '#94a3b8',
  },
});
