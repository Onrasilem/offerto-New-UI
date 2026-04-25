import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useOfferto } from '../../context/OffertoContext';
import { DS } from '../../theme';
import { Badge } from '../../components/DesignSystem';
import { currency, getMonthlyRevenue, getBtwSummary, getAgingReport } from '../../lib/utils';

const DAY_NAMES = ['zondag','maandag','dinsdag','woensdag','donderdag','vrijdag','zaterdag'];
const MONTH_NAMES = ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'];

const getDocTotal = (d) => {
  if (typeof d?.total === 'number' && !Number.isNaN(d.total)) return d.total;
  const t = d?.totals;
  return (t && typeof t.incTotal === 'number') ? t.incTotal : 0;
};

export default function DashboardScreen({ navigation }) {
  const { archive = [], company } = useOfferto();
  const docs = Array.isArray(archive) ? archive : [];
  const [btwExpanded, setBtwExpanded] = useState(false);

  const now = new Date();
  const dateStr = `${DAY_NAMES[now.getDay()].charAt(0).toUpperCase() + DAY_NAMES[now.getDay()].slice(1)} ${now.getDate()} ${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;
  const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const stats = useMemo(() => {
    const invoices = docs.filter(d => d.type === 'FACTUUR');
    const offers = docs.filter(d => d.type === 'OFFERTE');

    const revenueMonth = invoices
      .filter(d => typeof d.date === 'string' && d.date.startsWith(ym))
      .reduce((s, d) => s + getDocTotal(d), 0);

    const revenueYear = invoices
      .filter(d => typeof d.date === 'string' && d.date.startsWith(String(now.getFullYear())))
      .reduce((s, d) => s + getDocTotal(d), 0);

    const unpaidAmount = invoices
      .filter(d => d.status === 'Verzonden')
      .reduce((s, d) => s + getDocTotal(d), 0);

    const openOffers = offers.filter(d => d.status === 'Verzonden').length;

    const recentDocs = [...docs]
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      .slice(0, 6);

    const actionItems = [
      ...offers.filter(d => d.status === 'Verzonden').slice(0, 2).map(d => ({
        icon: 'time-outline', color: DS.colors.warning, bg: DS.colors.warningSoft,
        title: `Offerte ${d.number || ''} wacht op akkoord`,
        client: d.customer?.name || d.klant?.bedrijfsnaam || '',
        doc: d,
      })),
      ...invoices.filter(d => d.status === 'Verzonden').slice(0, 2).map(d => ({
        icon: 'alert-circle-outline', color: DS.colors.danger, bg: DS.colors.dangerSoft,
        title: `Factuur ${d.number || ''} is openstaand`,
        client: d.customer?.name || d.klant?.bedrijfsnaam || '',
        doc: d,
      })),
    ];

    return { revenueMonth, revenueYear, unpaidAmount, openOffers, recentDocs, actionItems };
  }, [docs]);

  const monthlyData = useMemo(() => getMonthlyRevenue(docs, 6), [docs]);
  const maxMonthly = Math.max(...monthlyData.map(m => m.total), 1);

  const btwData = useMemo(() => getBtwSummary(docs, now.getFullYear(), currentQuarter), [docs]);
  const agingData = useMemo(() => getAgingReport(docs), [docs]);
  const hasAging = agingData.overdue30.docs.length + agingData.overdue60.docs.length + agingData.overdue90.docs.length > 0;

  const kpis = [
    { label: 'Omzet maand', value: currency(stats.revenueMonth), color: DS.colors.accent, icon: 'trending-up-outline' },
    { label: 'Omzet jaar', value: currency(stats.revenueYear), color: DS.colors.success, icon: 'bar-chart-outline' },
    { label: 'Openstaand', value: currency(stats.unpaidAmount), color: stats.unpaidAmount > 0 ? DS.colors.warning : DS.colors.success, icon: 'hourglass-outline' },
    { label: 'Offertes open', value: `${stats.openOffers}`, color: DS.colors.info, icon: 'document-outline' },
  ];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.appTitle}>Offerto</Text>
          <Text style={s.dateText}>{dateStr}</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate('Wizard')}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* KPI grid */}
        <View style={s.kpiGrid}>
          {kpis.map((k, i) => (
            <View key={k.label} style={s.kpiCard}>
              <View style={[s.kpiIconWrap, { backgroundColor: k.color + '18' }]}>
                <Ionicons name={k.icon} size={18} color={k.color} />
              </View>
              <Text style={[s.kpiValue, { color: k.color }]}>{k.value}</Text>
              <Text style={s.kpiLabel}>{k.label}</Text>
            </View>
          ))}
        </View>

        {/* Omzetgrafiek */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.cardTitle}>Omzet per maand</Text>
            <Text style={s.cardSub}>{now.getFullYear()}</Text>
          </View>
          <View style={s.chart}>
            {monthlyData.map((bar) => (
              <View key={bar.key} style={s.barWrap}>
                <Text style={s.barAmount}>
                  {bar.total > 0 ? (bar.total >= 1000 ? `${(bar.total / 1000).toFixed(1)}k` : Math.round(bar.total)) : ''}
                </Text>
                <View style={s.barTrack}>
                  <View style={[
                    s.bar,
                    {
                      height: Math.max(4, Math.round((bar.total / maxMonthly) * 80)),
                      backgroundColor: bar.isCurrent ? DS.colors.accent : DS.colors.accentSoft,
                    },
                  ]} />
                </View>
                <Text style={[s.barLabel, bar.isCurrent && s.barLabelActive]}>{bar.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* BTW-samenvatting */}
        <TouchableOpacity style={s.card} onPress={() => setBtwExpanded(v => !v)} activeOpacity={0.8}>
          <View style={s.cardHeader}>
            <View>
              <Text style={s.cardTitle}>BTW-samenvatting</Text>
              <Text style={s.cardSub}>Q{currentQuarter} {now.getFullYear()} · {btwData.docCount} factuur{btwData.docCount !== 1 ? 'en' : ''}</Text>
            </View>
            <Ionicons name={btwExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={DS.colors.textTertiary} />
          </View>

          {btwExpanded ? (
            <View style={s.btwTable}>
              <View style={s.btwRow}>
                <Text style={s.btwLabel}>Omzet excl. BTW</Text>
                <Text style={s.btwValue}>{currency(btwData.exTotal)}</Text>
              </View>
              <View style={s.btwRow}>
                <Text style={s.btwLabel}>BTW te innen</Text>
                <Text style={[s.btwValue, { color: DS.colors.warning }]}>{currency(btwData.btwTotal)}</Text>
              </View>
              <View style={[s.btwRow, s.btwRowTotal]}>
                <Text style={s.btwLabelBold}>Totaal incl. BTW</Text>
                <Text style={[s.btwValue, s.btwValueBold]}>{currency(btwData.incTotal)}</Text>
              </View>
            </View>
          ) : (
            <View style={s.btwCollapsed}>
              <View style={s.btwPill}>
                <Text style={s.btwPillLabel}>Excl.</Text>
                <Text style={s.btwPillValue}>{currency(btwData.exTotal)}</Text>
              </View>
              <View style={s.btwPillDivider} />
              <View style={s.btwPill}>
                <Text style={s.btwPillLabel}>BTW</Text>
                <Text style={[s.btwPillValue, { color: DS.colors.warning }]}>{currency(btwData.btwTotal)}</Text>
              </View>
              <View style={s.btwPillDivider} />
              <View style={s.btwPill}>
                <Text style={s.btwPillLabel}>Incl.</Text>
                <Text style={[s.btwPillValue, { color: DS.colors.accent }]}>{currency(btwData.incTotal)}</Text>
              </View>
            </View>
          )}
        </TouchableOpacity>

        {/* Aging report */}
        {(agingData.current.docs.length > 0 || hasAging) && (
          <View style={s.card}>
            <View style={s.cardHeader}>
              <Text style={s.cardTitle}>Openstaande facturen</Text>
              <Text style={s.cardSub}>{currency(agingData.current.total + agingData.overdue30.total + agingData.overdue60.total + agingData.overdue90.total)}</Text>
            </View>
            {[
              { key: 'current',   label: 'Nog niet vervallen', color: DS.colors.success, data: agingData.current },
              { key: 'overdue30', label: '1–30 dagen vervallen', color: DS.colors.warning, data: agingData.overdue30 },
              { key: 'overdue60', label: '31–60 dagen vervallen', color: DS.colors.danger, data: agingData.overdue60 },
              { key: 'overdue90', label: '60+ dagen vervallen', color: DS.colors.dangerText || '#7f1d1d', data: agingData.overdue90 },
            ].filter(b => b.data.docs.length > 0).map(bucket => (
              <View key={bucket.key} style={s.agingRow}>
                <View style={[s.agingDot, { backgroundColor: bucket.color }]} />
                <Text style={s.agingLabel}>{bucket.label}</Text>
                <View style={s.agingRight}>
                  <Text style={[s.agingAmount, { color: bucket.color }]}>{currency(bucket.data.total)}</Text>
                  <Text style={s.agingCount}>{bucket.data.docs.length} factuur{bucket.data.docs.length !== 1 ? 'en' : ''}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Actiepunten */}
        {stats.actionItems.length > 0 && (
          <View style={s.card}>
            <View style={s.cardHeader}>
              <Text style={s.cardTitle}>Actiepunten</Text>
            </View>
            {stats.actionItems.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={[s.actionRow, i > 0 && s.actionRowBorder]}
                onPress={() => item.doc && navigation.navigate('DocumentDetail', { doc: item.doc })}
              >
                <View style={[s.actionIcon, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon} size={16} color={item.color} />
                </View>
                <View style={s.actionBody}>
                  <Text style={s.actionTitle}>{item.title}</Text>
                  {!!item.client && <Text style={s.actionClient}>{item.client}</Text>}
                </View>
                <Ionicons name="chevron-forward" size={14} color={DS.colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Recente documenten */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.cardTitle}>Recente documenten</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Archief')}>
              <Text style={s.cardLink}>Alle →</Text>
            </TouchableOpacity>
          </View>

          {stats.recentDocs.length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyText}>Nog geen documenten</Text>
              <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('Wizard')}>
                <Text style={s.emptyBtnText}>Maak je eerste offerte</Text>
              </TouchableOpacity>
            </View>
          ) : stats.recentDocs.map((doc, i) => (
            <TouchableOpacity
              key={doc.id || i}
              style={[s.docRow, i > 0 && s.docRowBorder]}
              onPress={() => navigation.navigate('DocumentDetail', { doc })}
            >
              <View style={s.docBody}>
                <Text style={s.docClient} numberOfLines={1}>
                  {doc.customer?.name || doc.klant?.bedrijfsnaam || 'Onbekend'}
                </Text>
                <Text style={s.docMeta}>{doc.number || doc.id} · {doc.date?.slice(0, 7) || ''}</Text>
              </View>
              <View style={s.docRight}>
                <Text style={s.docAmount}>{currency(getDocTotal(doc))}</Text>
                <View style={{ marginTop: 4 }}>
                  <Badge status={doc.status || 'concept'} />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DS.colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12,
    backgroundColor: '#fff',
  },
  appTitle: { fontSize: 22, fontWeight: '800', color: DS.colors.textPrimary, letterSpacing: -0.5 },
  dateText: { fontSize: 12, color: DS.colors.textSecondary, marginTop: 1 },
  addBtn: {
    width: 36, height: 36, borderRadius: DS.radius.sm,
    backgroundColor: DS.colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  // KPI grid
  kpiGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 12, paddingTop: 16, gap: 10,
  },
  kpiCard: {
    width: '47%', backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.md, borderWidth: 1, borderColor: DS.colors.border,
    padding: 14,
  },
  kpiIconWrap: {
    width: 32, height: 32, borderRadius: DS.radius.xs,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  kpiValue: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5, marginBottom: 2 },
  kpiLabel: { fontSize: 11, color: DS.colors.textSecondary, fontWeight: '500' },
  // Card
  card: {
    backgroundColor: DS.colors.surface,
    marginHorizontal: 16, marginTop: 14,
    borderRadius: DS.radius.md, borderWidth: 1, borderColor: DS.colors.border,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: DS.colors.textPrimary },
  cardSub: { fontSize: 12, color: DS.colors.textTertiary },
  cardLink: { fontSize: 13, color: DS.colors.accent, fontWeight: '600' },
  // Bar chart
  chart: { flexDirection: 'row', gap: 6, alignItems: 'flex-end', height: 110 },
  barWrap: { flex: 1, alignItems: 'center' },
  barAmount: { fontSize: 9, color: DS.colors.textTertiary, marginBottom: 3, height: 12 },
  barTrack: { flex: 1, justifyContent: 'flex-end', width: '100%' },
  bar: { width: '100%', borderRadius: 4 },
  barLabel: { fontSize: 10, color: DS.colors.textTertiary, marginTop: 5, fontWeight: '500' },
  barLabelActive: { color: DS.colors.accent, fontWeight: '700' },
  // BTW
  btwCollapsed: { flexDirection: 'row', alignItems: 'center' },
  btwPill: { flex: 1, alignItems: 'center' },
  btwPillLabel: { fontSize: 10, fontWeight: '600', color: DS.colors.textTertiary, letterSpacing: 0.5, marginBottom: 3 },
  btwPillValue: { fontSize: 14, fontWeight: '700', color: DS.colors.textPrimary },
  btwPillDivider: { width: 1, height: 32, backgroundColor: DS.colors.borderLight },
  btwTable: { gap: 8 },
  btwRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  btwRowTotal: { paddingTop: 10, marginTop: 4, borderTopWidth: 1, borderTopColor: DS.colors.border },
  btwLabel: { fontSize: 14, color: DS.colors.textSecondary },
  btwLabelBold: { fontSize: 15, fontWeight: '700', color: DS.colors.textPrimary },
  btwValue: { fontSize: 14, fontWeight: '600', color: DS.colors.textPrimary },
  btwValueBold: { fontSize: 16, fontWeight: '800', color: DS.colors.accent },
  // Aging
  agingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderTopWidth: 1, borderTopColor: DS.colors.borderLight,
  },
  agingDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  agingLabel: { flex: 1, fontSize: 13, color: DS.colors.textSecondary },
  agingRight: { alignItems: 'flex-end' },
  agingAmount: { fontSize: 14, fontWeight: '700' },
  agingCount: { fontSize: 11, color: DS.colors.textTertiary, marginTop: 1 },
  // Action items
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  actionRowBorder: { borderTopWidth: 1, borderTopColor: DS.colors.borderLight },
  actionIcon: {
    width: 32, height: 32, borderRadius: DS.radius.xs,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  actionBody: { flex: 1 },
  actionTitle: { fontSize: 14, fontWeight: '600', color: DS.colors.textPrimary },
  actionClient: { fontSize: 12, color: DS.colors.textSecondary, marginTop: 2 },
  // Recent docs
  docRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  docRowBorder: { borderTopWidth: 1, borderTopColor: DS.colors.borderLight },
  docBody: { flex: 1 },
  docClient: { fontSize: 14, fontWeight: '600', color: DS.colors.textPrimary },
  docMeta: { fontSize: 12, color: DS.colors.textSecondary, marginTop: 2 },
  docRight: { alignItems: 'flex-end' },
  docAmount: { fontSize: 14, fontWeight: '700', color: DS.colors.textPrimary },
  empty: { paddingVertical: 20, alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 14, color: DS.colors.textSecondary },
  emptyBtn: {
    backgroundColor: DS.colors.accent, borderRadius: DS.radius.sm,
    paddingVertical: 10, paddingHorizontal: 18,
  },
  emptyBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
