import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useOfferto } from '../../context/OffertoContext';
import { theme } from '../../components/UI';

export default function KlantStatistiekenScreen({ route, navigation }) {
  const { customer } = route.params;
  const { documents } = useOfferto();
  
  const [period, setPeriod] = useState('all'); // all | year | month

  // Filter documents for this customer
  const customerDocs = documents.filter(d => d.customerId === customer.id);
  const invoices = customerDocs.filter(d => d.type === 'FACTUUR');
  const quotes = customerDocs.filter(d => d.type === 'OFFERTE');

  // Calculate statistics
  const paidInvoices = invoices.filter(inv => inv.paymentStatus === 'paid');
  const unpaidInvoices = invoices.filter(inv => inv.paymentStatus !== 'paid');
  
  const totalRevenue = paidInvoices.reduce((sum, inv) => sum + (inv.totals?.inc || 0), 0);
  const openAmount = unpaidInvoices.reduce((sum, inv) => sum + (inv.totals?.inc || 0), 0);
  const avgInvoiceValue = paidInvoices.length > 0 ? totalRevenue / paidInvoices.length : 0;

  // Conversion rate
  const acceptedQuotes = quotes.filter(q => 
    invoices.some(inv => inv.customerId === q.customerId && inv.date >= q.date)
  );
  const conversionRate = quotes.length > 0 
    ? (acceptedQuotes.length / quotes.length) * 100 
    : 0;

  // Group by month
  const monthlyData = {};
  paidInvoices.forEach(inv => {
    if (inv.date) {
      const month = inv.date.substring(0, 7); // YYYY-MM
      monthlyData[month] = (monthlyData[month] || 0) + (inv.totals?.inc || 0);
    }
  });

  const months = Object.keys(monthlyData).sort().reverse().slice(0, 12);
  const maxMonthly = Math.max(...Object.values(monthlyData), 1);

  const getDocumentIcon = (doc) => {
    if (doc.type === 'FACTUUR') {
      if (doc.paymentStatus === 'paid') return '✅';
      if (doc.paymentStatus === 'overdue') return '🔴';
      return '📄';
    }
    return '📋';
  };

  const getStatusColor = (doc) => {
    if (doc.type === 'FACTUUR') {
      if (doc.paymentStatus === 'paid') return '#10b981';
      if (doc.paymentStatus === 'overdue') return '#ef4444';
      if (doc.paymentStatus === 'partial') return '#f59e0b';
      return '#94a3b8';
    }
    if (doc.status === 'accepted') return '#10b981';
    return '#94a3b8';
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📊 Statistieken</Text>
        <Text style={styles.subtitle}>{customer.name}</Text>
      </View>

      {/* KPIs */}
      <View style={styles.kpiRow}>
        <View style={[styles.kpiCard, { backgroundColor: '#10b98115' }]}>
          <Text style={styles.kpiLabel}>Totale Omzet</Text>
          <Text style={[styles.kpiValue, { color: '#10b981' }]}>
            € {totalRevenue.toFixed(2)}
          </Text>
          <Text style={styles.kpiSub}>{paidInvoices.length} betaald</Text>
        </View>
        
        <View style={[styles.kpiCard, { backgroundColor: '#f59e0b15' }]}>
          <Text style={styles.kpiLabel}>Openstaand</Text>
          <Text style={[styles.kpiValue, { color: '#f59e0b' }]}>
            € {openAmount.toFixed(2)}
          </Text>
          <Text style={styles.kpiSub}>{unpaidInvoices.length} open</Text>
        </View>
      </View>

      <View style={styles.kpiRow}>
        <View style={[styles.kpiCard, { backgroundColor: '#3b82f615' }]}>
          <Text style={styles.kpiLabel}>Gem. Factuur</Text>
          <Text style={[styles.kpiValue, { color: '#3b82f6' }]}>
            € {avgInvoiceValue.toFixed(2)}
          </Text>
        </View>
        
        <View style={[styles.kpiCard, { backgroundColor: '#8b5cf615' }]}>
          <Text style={styles.kpiLabel}>Conversie</Text>
          <Text style={[styles.kpiValue, { color: '#8b5cf6' }]}>
            {conversionRate.toFixed(0)}%
          </Text>
          <Text style={styles.kpiSub}>{acceptedQuotes.length}/{quotes.length} offertes</Text>
        </View>
      </View>

      {/* Monthly Trend */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📈 Maandelijkse Omzet</Text>
        
        {months.length > 0 ? (
          <View style={styles.chartContainer}>
            {months.map((month, idx) => {
              const amount = monthlyData[month];
              const height = (amount / maxMonthly) * 100;
              const [year, monthNum] = month.split('-');
              const monthName = new Date(year, monthNum - 1).toLocaleDateString('nl-NL', { month: 'short' });

              return (
                <View key={idx} style={styles.barContainer}>
                  <View style={styles.barWrapper}>
                    <View style={[styles.bar, { height: `${height}%` }]} />
                  </View>
                  <Text style={styles.barLabel}>{monthName}</Text>
                  <Text style={styles.barValue}>€{amount.toFixed(0)}</Text>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={styles.emptyText}>Nog geen omzet</Text>
        )}
      </View>

      {/* Document Timeline */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📄 Documenten ({customerDocs.length})</Text>
        
        {customerDocs.length > 0 ? (
          customerDocs
            .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
            .map((doc, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.docCard}
                onPress={() => navigation.navigate('DocumentDetail', { document: doc })}
              >
                <View style={styles.docHeader}>
                  <View style={styles.docTitleRow}>
                    <Text style={styles.docIcon}>{getDocumentIcon(doc)}</Text>
                    <View>
                      <Text style={styles.docNumber}>{doc.number || `${doc.type}-${doc.id.slice(0, 8)}`}</Text>
                      <Text style={styles.docDate}>{doc.date}</Text>
                    </View>
                  </View>
                  <View style={styles.docRight}>
                    <Text style={styles.docAmount}>€ {doc.totals?.inc?.toFixed(2) || '0.00'}</Text>
                    <View style={[styles.docStatusDot, { backgroundColor: getStatusColor(doc) }]} />
                  </View>
                </View>
                
                {doc.type === 'FACTUUR' && doc.paymentStatus && (
                  <View style={[styles.docStatus, { backgroundColor: `${getStatusColor(doc)}15` }]}>
                    <Text style={[styles.docStatusText, { color: getStatusColor(doc) }]}>
                      {doc.paymentStatus === 'paid' && '✅ Betaald'}
                      {doc.paymentStatus === 'unpaid' && '⏳ Openstaand'}
                      {doc.paymentStatus === 'overdue' && '🔴 Vervallen'}
                      {doc.paymentStatus === 'partial' && '⚠️ Gedeeltelijk'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
        ) : (
          <Text style={styles.emptyText}>Nog geen documenten</Text>
        )}
      </View>

      {/* Payment History */}
      {paidInvoices.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💳 Betaalgedrag</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Totaal betaald:</Text>
            <Text style={styles.infoValue}>{paidInvoices.length} facturen</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Gemiddelde betaaltijd:</Text>
            <Text style={styles.infoValue}>~ 14 dagen</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Laatst betaald:</Text>
            <Text style={styles.infoValue}>
              {paidInvoices[0]?.date || '-'}
            </Text>
          </View>
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
  header: {
    backgroundColor: theme.primary,
    padding: 16,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  kpiRow: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 8,
    gap: 12,
  },
  kpiCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  kpiLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  kpiSub: {
    fontSize: 11,
    color: '#94a3b8',
  },
  section: {
    margin: 16,
    marginTop: 8,
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
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 150,
    gap: 4,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  barWrapper: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    paddingBottom: 20,
  },
  bar: {
    width: '100%',
    backgroundColor: theme.primary,
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 4,
  },
  barValue: {
    fontSize: 9,
    color: '#94a3b8',
  },
  docCard: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  docHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  docTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  docIcon: {
    fontSize: 20,
  },
  docNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  docDate: {
    fontSize: 11,
    color: '#64748b',
  },
  docRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  docAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  docStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  docStatus: {
    marginTop: 8,
    padding: 6,
    borderRadius: 4,
    alignItems: 'center',
  },
  docStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  infoValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
});
