import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { theme } from '../../components/UI';

export default function BetalingDetailScreen({ route, navigation }) {
  const { payment, document, customer } = route.params;

  const getMethodLabel = (method) => {
    switch (method) {
      case 'bank_transfer': return '🏦 Overschrijving';
      case 'cash': return '💵 Cash';
      case 'mollie': return '💳 Online betaling';
      case 'stripe': return '💳 Stripe';
      default: return method;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'failed': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  const getReconciliationLabel = (status) => {
    switch (status) {
      case 'matched': return '✅ Automatisch gematcht';
      case 'manual': return '✋ Handmatig gekoppeld';
      case 'pending': return '⏳ In behandeling';
      case 'unmatched': return '❓ Niet gematcht';
      default: return status;
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>💳 Betaling</Text>
        <Text style={styles.amount}>€ {parseFloat(payment.amount || 0).toFixed(2)}</Text>
      </View>

      {/* Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status</Text>
        
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(payment.status)}15` }]}>
          <Text style={[styles.statusText, { color: getStatusColor(payment.status) }]}>
            {payment.status === 'paid' ? '✅ Betaald' : payment.status}
          </Text>
        </View>

        {payment.reconciliation_status && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Reconciliatie:</Text>
            <Text style={styles.infoValue}>
              {getReconciliationLabel(payment.reconciliation_status)}
            </Text>
          </View>
        )}
      </View>

      {/* Payment Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Betaalgegevens</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Datum:</Text>
          <Text style={styles.infoValue}>
            {payment.paid_at 
              ? new Date(payment.paid_at).toLocaleDateString('nl-NL', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : '-'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Methode:</Text>
          <Text style={styles.infoValue}>{getMethodLabel(payment.payment_method)}</Text>
        </View>

        {payment.bank_account && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Bankrekening:</Text>
            <Text style={[styles.infoValue, styles.mono]}>{payment.bank_account}</Text>
          </View>
        )}

        {payment.provider_ref && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Provider Ref:</Text>
            <Text style={[styles.infoValue, styles.mono]}>{payment.provider_ref}</Text>
          </View>
        )}

        {payment.bank_statement_ref && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Statement Ref:</Text>
            <Text style={[styles.infoValue, styles.mono]}>{payment.bank_statement_ref}</Text>
          </View>
        )}
      </View>

      {/* Bank Statement Info */}
      {payment.bank_statement_date && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Bankafschrift</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Datum afschrift:</Text>
            <Text style={styles.infoValue}>
              {new Date(payment.bank_statement_date).toLocaleDateString('nl-NL')}
            </Text>
          </View>

          {payment.bank_statement_ref && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Referentie:</Text>
              <Text style={[styles.infoValue, styles.mono]}>{payment.bank_statement_ref}</Text>
            </View>
          )}
        </View>
      )}

      {/* Match Details */}
      {payment.match_type && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Match Informatie</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Match type:</Text>
            <Text style={styles.infoValue}>{payment.match_type}</Text>
          </View>

          {payment.match_confidence && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Confidence:</Text>
              <View style={styles.confidenceBar}>
                <View 
                  style={[
                    styles.confidenceFill, 
                    { 
                      width: `${payment.match_confidence * 100}%`,
                      backgroundColor: payment.match_confidence >= 0.9 ? '#10b981' :
                                      payment.match_confidence >= 0.7 ? '#f59e0b' : '#94a3b8'
                    }
                  ]} 
                />
                <Text style={styles.confidenceText}>
                  {Math.round(payment.match_confidence * 100)}%
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Document Link */}
      {document && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📄 Gekoppeld Document</Text>
          
          <TouchableOpacity
            style={styles.docCard}
            onPress={() => navigation.navigate('DocumentDetail', { document })}
          >
            <View style={styles.docHeader}>
              <Text style={styles.docType}>{document.type}</Text>
              <Text style={styles.docNumber}>{document.number}</Text>
            </View>
            {customer && (
              <Text style={styles.docCustomer}>👤 {customer.name}</Text>
            )}
            <Text style={styles.docAmount}>€ {document.totals?.inc?.toFixed(2) || '0.00'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Reconciliation Info */}
      {payment.reconciled_at && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔗 Reconciliatie</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Verwerkt op:</Text>
            <Text style={styles.infoValue}>
              {new Date(payment.reconciled_at).toLocaleDateString('nl-NL', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>

          {payment.reconciled_by && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Door:</Text>
              <Text style={styles.infoValue}>User #{payment.reconciled_by}</Text>
            </View>
          )}
        </View>
      )}

      {/* Notes */}
      {payment.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Notities</Text>
          <Text style={styles.notesText}>{payment.notes}</Text>
        </View>
      )}

      {/* Metadata */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ℹ️ Metadata</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Payment ID:</Text>
          <Text style={[styles.infoValue, styles.mono, styles.small]}>
            {payment.id}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Aangemaakt:</Text>
          <Text style={styles.infoValue}>
            {new Date(payment.created_at).toLocaleDateString('nl-NL')}
          </Text>
        </View>

        {payment.currency && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Valuta:</Text>
            <Text style={styles.infoValue}>{payment.currency}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
  amount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 4,
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
  statusBadge: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748b',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  mono: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
  small: {
    fontSize: 10,
  },
  confidenceBar: {
    flex: 1,
    height: 24,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confidenceFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e293b',
    zIndex: 1,
  },
  docCard: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: theme.primary,
  },
  docHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  docType: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  docNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  docCustomer: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 6,
  },
  docAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.primary,
  },
  notesText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
});
