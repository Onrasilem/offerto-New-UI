import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useOfferto } from '../../context/OffertoContext';
import { DS } from '../../theme';
import { Avatar, Badge } from '../../components/DesignSystem';
import { currency } from '../../lib/utils';

const getTotal = (d) => {
  if (typeof d?.total === 'number') return d.total;
  return d?.totals?.incTotal || 0;
};

export default function KlantDetailScreen({ route, navigation }) {
  const { client } = route.params || {};
  const { archive = [], removeCustomer, startNewDocumentForKlant } = useOfferto();
  const docs = Array.isArray(archive) ? archive : [];

  const clientName = client?.name || client?.bedrijfsnaam || '';

  const clientDocs = useMemo(() => {
    return docs
      .filter(d =>
        (d.klant?.bedrijfsnaam || d.customer?.name) === clientName ||
        (client?.id && (d.customer_id === client.id))
      )
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [docs, clientName, client?.id]);

  const revenue = clientDocs.filter(d => d.type === 'FACTUUR').reduce((s, d) => s + getTotal(d), 0);
  const open = clientDocs.filter(d => d.type === 'FACTUUR' && d.status === 'Verzonden').reduce((s, d) => s + getTotal(d), 0);

  // Bar chart — last 6 months
  const months = ['J','F','M','A','M','J','J','A','S','O','N','D'];
  const now = new Date();
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthRevenue = clientDocs
      .filter(doc => doc.type === 'FACTUUR' && typeof doc.date === 'string' && doc.date.startsWith(ym))
      .reduce((s, doc) => s + getTotal(doc), 0);
    return { label: months[d.getMonth()], value: monthRevenue };
  });
  const maxVal = Math.max(...chartData.map(d => d.value), 1);

  const handleNewDocument = (type) => {
    const klantData = {
      bedrijfsnaam: client.name || '',
      contactpersoon: client.contact || client.contact_person || '',
      email: client.email || '',
      telefoon: client.telefoon || client.phone || '',
      adres: client.adres || client.address_json?.adres || '',
      btwNummer: client.btwNummer || client.vat || '',
    };
    startNewDocumentForKlant(klantData);
    navigation.navigate('Wizard');
  };

  const handleDelete = () => {
    if (!client?.id) return;
    Alert.alert(
      'Klant verwijderen',
      `Weet je zeker dat je ${clientName} wilt verwijderen? Documenten blijven bewaard.`,
      [
        { text: 'Annuleren', style: 'cancel' },
        {
          text: 'Verwijderen', style: 'destructive',
          onPress: async () => {
            try {
              await removeCustomer(client.id);
              navigation.goBack();
            } catch (e) {
              Alert.alert('Fout', 'Kon klant niet verwijderen.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Nav bar */}
      <View style={s.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={22} color={DS.colors.accent} />
          <Text style={s.backText}>Klanten</Text>
        </TouchableOpacity>
        <View style={s.navActions}>
          {client?.id && (
            <TouchableOpacity
              style={s.iconBtn}
              onPress={() => navigation.navigate('KlantForm', { customer: client._raw || client })}
            >
              <Ionicons name="pencil-outline" size={18} color={DS.colors.accent} />
            </TouchableOpacity>
          )}
          {client?.id && (
            <TouchableOpacity style={[s.iconBtn, s.iconBtnDanger]} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={18} color={DS.colors.danger} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={s.hero}>
          <View style={s.heroTop}>
            <Avatar name={clientName} size={52} />
            <View style={{ flex: 1 }}>
              <Text style={s.heroName}>{clientName}</Text>
              {!!client?.contact && <Text style={s.heroContact}>{client.contact}</Text>}
              {!!client?.email && <Text style={s.heroEmail}>{client.email}</Text>}
              {!!client?.telefoon && <Text style={s.heroPhone}>{client.telefoon}</Text>}
              {!!(client?.btwNummer || client?.vat) && (
                <Text style={s.heroBtw}>{client.btwNummer || client.vat}</Text>
              )}
            </View>
          </View>

          {/* KPIs */}
          <View style={s.kpiRow}>
            {[
              { label: 'Totale omzet', value: currency(revenue), color: DS.colors.accent },
              { label: 'Openstaand', value: currency(open), color: open > 0 ? DS.colors.warning : DS.colors.success },
              { label: 'Documenten', value: `${clientDocs.length}`, color: DS.colors.info },
            ].map((k, i) => (
              <View key={k.label} style={[s.kpiItem, i < 2 && s.kpiBorder]}>
                <Text style={[s.kpiValue, { color: k.color }]}>{k.value}</Text>
                <Text style={s.kpiLabel}>{k.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Bar chart */}
        <View style={s.chartSection}>
          <View style={s.chartHeader}>
            <Text style={s.chartTitle}>Omzet per maand</Text>
            <Text style={s.chartTotal}>{currency(revenue)} totaal</Text>
          </View>
          <View style={s.chart}>
            {chartData.map((bar, i) => (
              <View key={i} style={s.barWrap}>
                <View style={s.barTrack}>
                  <View style={[
                    s.bar,
                    {
                      height: Math.max(4, Math.round((bar.value / maxVal) * 48)),
                      backgroundColor: i === chartData.length - 1 ? DS.colors.accent : DS.colors.accentSoft,
                    }
                  ]} />
                </View>
                <Text style={s.barLabel}>{bar.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Open invoices */}
        {open > 0 && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>OPENSTAAND</Text>
            {clientDocs.filter(d => d.type === 'FACTUUR' && d.status === 'Verzonden').map((doc, i) => (
              <TouchableOpacity
                key={doc.id || i}
                style={s.openCard}
                onPress={() => navigation.navigate('DocumentDetail', { doc })}
              >
                <View>
                  <Text style={s.docNumber}>{doc.number || doc.id}</Text>
                  <Text style={s.docDate}>{doc.date?.slice(0, 10) || ''}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={s.openAmount}>{currency(getTotal(doc))}</Text>
                  <Badge status="openstaand" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Document history */}
        {clientDocs.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>HISTORIEK</Text>
            {clientDocs.slice(0, 10).map((doc, i) => (
              <TouchableOpacity
                key={doc.id || i}
                style={s.histRow}
                onPress={() => navigation.navigate('DocumentDetail', { doc })}
              >
                <View style={[s.histDot, {
                  backgroundColor:
                    doc.status === 'Betaald' ? DS.colors.success :
                    doc.status === 'Verzonden' ? DS.colors.warning :
                    DS.colors.info,
                }]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.histId}>{doc.number || doc.id}</Text>
                  <Text style={s.histDate}>{doc.type} · {doc.date?.slice(0, 10) || ''}</Text>
                </View>
                <Text style={s.histAmount}>{currency(getTotal(doc))}</Text>
                <Ionicons name="chevron-forward" size={14} color={DS.colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={s.actions}>
          <TouchableOpacity style={s.secondaryBtn} onPress={() => handleNewDocument('OFFERTE')}>
            <Ionicons name="document-outline" size={16} color={DS.colors.accent} />
            <Text style={s.secondaryBtnText}>Nieuwe offerte</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.primaryBtn} onPress={() => handleNewDocument('FACTUUR')}>
            <Ionicons name="receipt-outline" size={16} color="#fff" />
            <Text style={s.primaryBtnText}>Nieuwe factuur</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  navBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: DS.colors.borderLight,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, padding: 4 },
  backText: { fontSize: 16, color: DS.colors.accent, fontWeight: '600' },
  navActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 34, height: 34, borderRadius: DS.radius.xs,
    backgroundColor: DS.colors.accentSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  iconBtnDanger: { backgroundColor: DS.colors.dangerSoft },
  hero: {
    backgroundColor: '#fff',
    paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: DS.colors.borderLight,
  },
  heroTop: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    padding: 20, paddingBottom: 16,
  },
  heroName: { fontSize: 18, fontWeight: '800', color: DS.colors.textPrimary },
  heroContact: { fontSize: 13, color: DS.colors.textSecondary, marginTop: 2 },
  heroEmail: { fontSize: 13, color: DS.colors.accent, marginTop: 2 },
  heroPhone: { fontSize: 13, color: DS.colors.textSecondary, marginTop: 2 },
  heroBtw: { fontSize: 12, color: DS.colors.textTertiary, marginTop: 2 },
  kpiRow: { flexDirection: 'row', paddingHorizontal: 20 },
  kpiItem: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  kpiBorder: { borderRightWidth: 1, borderRightColor: DS.colors.borderLight },
  kpiValue: { fontSize: 17, fontWeight: '800', letterSpacing: -0.5, marginBottom: 2 },
  kpiLabel: { fontSize: 11, color: DS.colors.textSecondary },
  chartSection: {
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: DS.colors.borderLight,
  },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  chartTitle: { fontSize: 13, fontWeight: '700', color: DS.colors.textSecondary },
  chartTotal: { fontSize: 13, color: DS.colors.accent, fontWeight: '600' },
  chart: { flexDirection: 'row', gap: 8, alignItems: 'flex-end', height: 64 },
  barWrap: { flex: 1, alignItems: 'center' },
  barTrack: { flex: 1, justifyContent: 'flex-end', width: '100%' },
  bar: { width: '100%', borderRadius: 3 },
  barLabel: { fontSize: 10, color: DS.colors.textTertiary, marginTop: 4 },
  section: { paddingHorizontal: 16, paddingTop: 16 },
  sectionLabel: {
    fontSize: 12, fontWeight: '700', color: DS.colors.textTertiary,
    letterSpacing: 0.8, marginBottom: 10,
  },
  openCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: DS.colors.warningSoft,
    borderRadius: DS.radius.sm, borderWidth: 1, borderColor: DS.colors.warning + '40',
    padding: 14, marginBottom: 8,
  },
  docNumber: { fontSize: 14, fontWeight: '700', color: DS.colors.textPrimary },
  docDate: { fontSize: 12, color: DS.colors.textSecondary, marginTop: 2 },
  openAmount: { fontSize: 16, fontWeight: '800', color: DS.colors.warning, marginBottom: 4 },
  histRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: DS.colors.borderLight,
  },
  histDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  histId: { fontSize: 14, fontWeight: '600', color: DS.colors.textPrimary },
  histDate: { fontSize: 12, color: DS.colors.textSecondary },
  histAmount: { fontSize: 14, fontWeight: '700', color: DS.colors.textPrimary },
  actions: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 20 },
  primaryBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: DS.colors.accent, borderRadius: DS.radius.sm, paddingVertical: 12,
  },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  secondaryBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: DS.radius.sm, paddingVertical: 12,
    borderWidth: 1.5, borderColor: DS.colors.accent,
  },
  secondaryBtnText: { color: DS.colors.accent, fontSize: 14, fontWeight: '600' },
});
