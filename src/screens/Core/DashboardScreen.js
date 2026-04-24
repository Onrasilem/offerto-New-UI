import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOfferto } from '../../context/OffertoContext';
import { DS } from '../../theme';
import { Badge, SectionHeader } from '../../components/DesignSystem';
import { currency } from '../../lib/utils';

export default function DashboardScreen({ navigation }) {
  const ctx = useOfferto();
  const archive = ctx.archive || [];
  const docs = Array.isArray(archive) ? archive : [];

  const stats = useMemo(() => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const getTotal = (d) => {
      if (typeof d?.total === 'number') return d.total;
      const t = d?.totals;
      return (t && typeof t.incTotal === 'number') ? t.incTotal : 0;
    };
    const invoices = docs.filter(d => d.type === 'FACTUUR');
    const offers   = docs.filter(d => d.type === 'OFFERTE');
    const revenueMonth = invoices
      .filter(d => typeof d.date === 'string' && d.date.startsWith(ym))
      .reduce((s, d) => s + getTotal(d), 0);
    const openOffers = offers.filter(d => d.status === 'Verzonden').length;
    const unpaidAmount = invoices.filter(d => d.status === 'Verzonden').reduce((s, d) => s + getTotal(d), 0);
    const recentDocs = [...docs].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 5);
    const actionItems = [];
    offers.filter(d => d.status === 'Verzonden').slice(0, 2).forEach(d => actionItems.push({
      title: `Offerte ${d.number || ''} wacht op handtekening`,
      client: d.customer?.name || d.klant?.bedrijfsnaam || '',
      color: DS.colors.warning, dot: '⏳', doc: d,
    }));
    invoices.filter(d => d.status === 'Verzonden').slice(0, 1).forEach(d => actionItems.push({
      title: `Factuur ${d.number || ''} is openstaand`,
      client: d.customer?.name || d.klant?.bedrijfsnaam || '',
      color: DS.colors.danger, dot: '!', doc: d,
    }));
    return { revenueMonth, openOffers, unpaidAmount, recentDocs, actionItems };
  }, [docs]);

  const now = new Date();
  const dayNames = ['zondag','maandag','dinsdag','woensdag','donderdag','vrijdag','zaterdag'];
  const monthNames = ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'];
  const dateStr = `${dayNames[now.getDay()].charAt(0).toUpperCase() + dayNames[now.getDay()].slice(1)} ${now.getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;

  const metrics = [
    { label: 'Omzet', value: currency(stats.revenueMonth), color: DS.colors.accent },
    { label: 'Open', value: `${stats.openOffers}`, color: DS.colors.info },
    { label: 'Openstaand', value: currency(stats.unpaidAmount), color: DS.colors.warning },
  ];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <View>
          <Text style={s.appTitle}>Offerto</Text>
          <Text style={s.dateText}>{dateStr}</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate('Wizard')}>
          <Text style={s.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={s.metricStrip}>
        {metrics.map((m, i) => (
          <View key={m.label} style={[s.metricItem, i < 2 && s.metricBorder]}>
            <Text style={[s.metricValue, { color: m.color }]}>{m.value}</Text>
            <Text style={s.metricLabel}>{m.label}</Text>
          </View>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {stats.actionItems.length > 0 && (
          <>
            <SectionHeader title="Actiepunten" />
            {stats.actionItems.map((item, i) => (
              <TouchableOpacity key={i} style={s.actionRow}
                onPress={() => item.doc && navigation.navigate('DocumentDetail', { doc: item.doc })}>
                <View style={[s.dotBox, { backgroundColor: item.color + '22' }]}>
                  <Text style={[s.dotText, { color: item.color }]}>{item.dot}</Text>
                </View>
                <View style={s.actionBody}>
                  <Text style={s.actionTitle}>{item.title}</Text>
                  {!!item.client && <Text style={s.actionClient}>{item.client}</Text>}
                </View>
                <Text style={s.chevron}>›</Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        <SectionHeader title="Recente documenten" action="Alles" onAction={() => navigation.navigate('Archief')} />

        {stats.recentDocs.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyText}>Nog geen documenten</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('Wizard')}>
              <Text style={s.emptyBtnText}>Maak je eerste offerte</Text>
            </TouchableOpacity>
          </View>
        ) : stats.recentDocs.map((doc, i) => (
          <TouchableOpacity key={doc.id || i} style={s.docRow}
            onPress={() => navigation.navigate('DocumentDetail', { doc })}>
            <View style={s.docBody}>
              <Text style={s.docClient} numberOfLines={1}>
                {doc.customer?.name || doc.klant?.bedrijfsnaam || 'Onbekend'}
              </Text>
              <Text style={s.docMeta}>{doc.number || doc.id} · {doc.date?.slice(0, 7) || ''}</Text>
            </View>
            <View style={s.docRight}>
              <Text style={s.docAmount}>{currency(doc.total || doc.totals?.incTotal || 0)}</Text>
              <View style={{ marginTop: 4 }}><Badge status={doc.status || 'concept'} /></View>
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12,
  },
  appTitle: { fontSize: 22, fontWeight: '800', color: DS.colors.textPrimary, letterSpacing: -0.5 },
  dateText: { fontSize: 12, color: DS.colors.textSecondary, marginTop: 1 },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: DS.colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 22, lineHeight: 26, fontWeight: '300' },
  metricStrip: {
    flexDirection: 'row',
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: DS.colors.borderLight,
  },
  metricItem: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  metricBorder: { borderRightWidth: 1, borderRightColor: DS.colors.borderLight },
  metricValue: { fontSize: 17, fontWeight: '800', letterSpacing: -0.5, marginBottom: 2 },
  metricLabel: { fontSize: 11, color: DS.colors.textSecondary },
  actionRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: DS.colors.borderLight,
  },
  dotBox: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginRight: 14, flexShrink: 0,
  },
  dotText: { fontSize: 13, fontWeight: '700' },
  actionBody: { flex: 1 },
  actionTitle: { fontSize: 14, fontWeight: '600', color: DS.colors.textPrimary, lineHeight: 20 },
  actionClient: { fontSize: 12, color: DS.colors.textSecondary, marginTop: 2 },
  chevron: { fontSize: 20, color: DS.colors.textTertiary, alignSelf: 'center' },
  docRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: DS.colors.borderLight,
  },
  docBody: { flex: 1 },
  docClient: { fontSize: 14, fontWeight: '600', color: DS.colors.textPrimary },
  docMeta: { fontSize: 12, color: DS.colors.textSecondary, marginTop: 2 },
  docRight: { alignItems: 'flex-end' },
  docAmount: { fontSize: 14, fontWeight: '700', color: DS.colors.textPrimary },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 14, color: DS.colors.textSecondary, marginBottom: 16 },
  emptyBtn: {
    backgroundColor: DS.colors.accent, borderRadius: DS.radius.sm,
    paddingVertical: 12, paddingHorizontal: 20,
  },
  emptyBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
