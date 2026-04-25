import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useOfferto } from '../../context/OffertoContext';
import { DS } from '../../theme';
import { Badge } from '../../components/DesignSystem';
import { currency } from '../../lib/utils';
import { previewPdf, buildPdf, sharePdf } from '../../lib/pdf';

export default function DocumentDetailScreen({ route, navigation }) {
  const { doc } = route.params || {};
  const { updateStatus, company } = useOfferto();
  const [localStatus, setLocalStatus] = useState(doc?.status || 'Concept');
  const [pdfLoading, setPdfLoading] = useState(false);

  if (!doc) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}><Text style={s.errorText}>Document niet gevonden</Text></View>
      </SafeAreaView>
    );
  }

  const isFactuur = doc.type === 'FACTUUR';
  const isPaid = localStatus === 'Betaald';

  const getTotal = () => {
    if (typeof doc?.total === 'number') return doc.total;
    return doc?.totals?.incTotal || 0;
  };

  const clientName = doc.customer?.name || doc.klant?.bedrijfsnaam || 'Onbekend';

  const lines = doc.lines || doc.lijnen || [];

  async function markPaid() {
    Alert.alert('Markeer als betaald', 'Wil je deze factuur als betaald markeren?', [
      { text: 'Annuleren', style: 'cancel' },
      {
        text: 'Betaald', onPress: async () => {
          try {
            await updateStatus?.(doc.id, 'Betaald');
            setLocalStatus('Betaald');
          } catch (e) {}
        }
      },
    ]);
  }

  async function convertToInvoice() {
    navigation.navigate('Wizard', { fromDoc: doc, type: 'FACTUUR' });
  }

  function getPdfParams() {
    const klant = doc.klant || { bedrijfsnaam: clientName };
    const docLines = lines.map(l => ({
      omschrijving: l.omschrijving || l.description || '',
      aantal: l.aantal ?? l.qty ?? 1,
      eenheidsprijs: l.eenheidsprijs ?? l.unit_price ?? 0,
      btwPerc: l.btwPerc ?? l.vat_perc ?? 21,
      ex: l.ex ?? 0,
      btwA: l.btwA ?? l.vat ?? 0,
      inc: l.inc ?? 0,
    }));
    const totals = doc.totals || {};
    return {
      company: company || {},
      klant,
      lines: docLines,
      exTotal: totals.exTotal ?? 0,
      btwTotal: totals.btwTotal ?? 0,
      incTotal: totals.incTotal ?? getTotal(),
      docType: doc.type,
      nummer: doc.number || String(doc.id),
      docDatum: doc.date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      signatureData: doc.signature_data || null,
    };
  }

  async function handlePreview() {
    setPdfLoading(true);
    try {
      await previewPdf(getPdfParams());
    } catch (e) {
      Alert.alert('Fout', e.message || 'Kon PDF niet openen.');
    } finally {
      setPdfLoading(false);
    }
  }

  async function handleSharePdf() {
    setPdfLoading(true);
    try {
      const target = await buildPdf(getPdfParams());
      await sharePdf(target);
    } catch (e) {
      Alert.alert('Fout', e.message || 'Kon PDF niet genereren.');
    } finally {
      setPdfLoading(false);
    }
  }

  const timeline = isFactuur ? [
    { label: 'Aangemaakt', done: true },
    { label: 'Verzonden', done: ['Verzonden','Betaald'].includes(localStatus) },
    { label: 'Betaald', done: localStatus === 'Betaald' },
  ] : [
    { label: 'Aangemaakt', done: true },
    { label: 'Verzonden', done: ['Verzonden','Getekend'].includes(localStatus) },
    { label: 'Bekeken', done: ['Verzonden','Getekend'].includes(localStatus) },
    { label: 'Ondertekend', done: localStatus === 'Getekend' },
  ];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Nav bar */}
      <View style={s.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>‹ Terug</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={shareDoc} style={s.shareBtn}>
          <Text style={s.shareIcon}>↑</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Document card */}
        <View style={s.docCardWrap}>
          <View style={s.docCard}>
            {/* Doc header */}
            <View style={s.docHeader}>
              <View>
                <Text style={s.docType}>{isFactuur ? 'FACTUUR' : 'OFFERTE'}</Text>
                <Text style={s.docNumber}>{doc.number || doc.id}</Text>
              </View>
              <Badge status={localStatus} />
            </View>

            {/* Meta */}
            <View style={s.docMeta}>
              <View>
                <Text style={s.metaLabel}>KLANT</Text>
                <Text style={s.metaValue}>{clientName}</Text>
              </View>
              {doc.date && (
                <View>
                  <Text style={s.metaLabel}>DATUM</Text>
                  <Text style={s.metaValue}>{doc.date.slice(0, 10)}</Text>
                </View>
              )}
              {doc.expiryDate && (
                <View>
                  <Text style={s.metaLabel}>{isFactuur ? 'VERVALT' : 'GELDIG TOT'}</Text>
                  <Text style={s.metaValue}>{doc.expiryDate.slice(0, 10)}</Text>
                </View>
              )}
            </View>

            {/* Line items */}
            {lines.map((item, i) => {
              const qty = item.aantal ?? item.qty ?? 1;
              const price = item.eenheidsprijs ?? item.price ?? 0;
              const total = item.inc ?? item.total ?? (qty * price);
              const desc = item.omschrijving ?? item.description ?? item.desc ?? '';
              return (
                <View key={i} style={s.lineItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.lineDesc}>{desc}</Text>
                    <Text style={s.lineSub}>{qty}× {currency(price)}</Text>
                  </View>
                  <Text style={s.lineTotal}>{currency(total)}</Text>
                </View>
              );
            })}

            {/* Totals */}
            <View style={s.totals}>
              {doc.totals?.exTotal != null && (
                <View style={s.totalRow}>
                  <Text style={s.totalLabel}>Subtotaal excl. BTW</Text>
                  <Text style={s.totalValue}>{currency(doc.totals.exTotal)}</Text>
                </View>
              )}
              {doc.totals?.vatTotal != null && (
                <View style={s.totalRow}>
                  <Text style={s.totalLabel}>BTW</Text>
                  <Text style={s.totalValue}>{currency(doc.totals.vatTotal)}</Text>
                </View>
              )}
              <View style={[s.totalRow, s.grandTotalRow]}>
                <Text style={s.grandLabel}>Totaal</Text>
                <Text style={s.grandValue}>{currency(getTotal())}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Timeline */}
        <View style={s.timelineSection}>
          <Text style={s.sectionTitle}>Status opvolging</Text>
          {timeline.map((step, i) => (
            <View key={step.label} style={s.timelineRow}>
              <View style={s.timelineLeft}>
                <View style={[s.timelineDot, step.done && s.timelineDotDone]}>
                  {step.done && <Text style={s.checkmark}>✓</Text>}
                </View>
                {i < timeline.length - 1 && (
                  <View style={[s.timelineLine, step.done && s.timelineLineDone]} />
                )}
              </View>
              <Text style={[s.timelineLabel, !step.done && s.timelineLabelPending]}>{step.label}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={s.actionsSection}>
          {/* PDF knoppen — altijd zichtbaar */}
          <View style={s.pdfRow}>
            <TouchableOpacity style={s.pdfBtn} onPress={handlePreview} disabled={pdfLoading}>
              <Ionicons name="eye-outline" size={18} color={DS.colors.accent} />
              <Text style={s.pdfBtnText}>Bekijk PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.pdfBtn} onPress={handleSharePdf} disabled={pdfLoading}>
              <Ionicons name="share-outline" size={18} color={DS.colors.accent} />
              <Text style={s.pdfBtnText}>Deel PDF</Text>
            </TouchableOpacity>
          </View>

          {isFactuur ? (
            <>
              {!isPaid && (
                <TouchableOpacity style={s.markPaidBtn} onPress={markPaid}>
                  <Ionicons name="checkmark-circle-outline" size={22} color={DS.colors.success} />
                  <View>
                    <Text style={s.markPaidTitle}>Markeer als betaald</Text>
                    <Text style={s.markPaidSub}>Betaling handmatig registreren</Text>
                  </View>
                </TouchableOpacity>
              )}
              {isPaid && (
                <View style={s.paidConfirm}>
                  <Ionicons name="checkmark-circle" size={22} color={DS.colors.success} />
                  <Text style={s.paidText}>Betaald</Text>
                </View>
              )}
            </>
          ) : (
            <TouchableOpacity style={s.primaryBtn} onPress={convertToInvoice}>
              <Text style={s.primaryBtnText}>Omzetten naar factuur</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: DS.colors.textSecondary },
  navBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: { padding: 4 },
  backText: { fontSize: 16, color: DS.colors.accent, fontWeight: '600' },
  shareBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: DS.colors.borderLight, alignItems: 'center', justifyContent: 'center',
  },
  shareIcon: { fontSize: 16, color: DS.colors.textSecondary, fontWeight: '600' },
  docCardWrap: { paddingHorizontal: 16, paddingBottom: 16 },
  docCard: {
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.lg, borderWidth: 1, borderColor: DS.colors.border,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  docHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    backgroundColor: DS.colors.bg, padding: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: DS.colors.borderLight,
  },
  docType: {
    fontSize: 11, color: DS.colors.textTertiary, fontWeight: '700', letterSpacing: 1, marginBottom: 4,
  },
  docNumber: { fontSize: 22, fontWeight: '800', color: DS.colors.textPrimary, letterSpacing: -0.5 },
  docMeta: {
    flexDirection: 'row', gap: 24, padding: 20, paddingTop: 16,
    borderBottomWidth: 1, borderBottomColor: DS.colors.borderLight,
  },
  metaLabel: { fontSize: 11, color: DS.colors.textTertiary, marginBottom: 2, fontWeight: '700' },
  metaValue: { fontSize: 14, fontWeight: '600', color: DS.colors.textPrimary },
  lineItem: {
    flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: DS.colors.borderLight,
  },
  lineDesc: { fontSize: 14, fontWeight: '600', color: DS.colors.textPrimary },
  lineSub: { fontSize: 12, color: DS.colors.textSecondary, marginTop: 2 },
  lineTotal: { fontSize: 14, fontWeight: '700', color: DS.colors.textPrimary },
  totals: { padding: 20 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  totalLabel: { fontSize: 13, color: DS.colors.textSecondary },
  totalValue: { fontSize: 13, color: DS.colors.textPrimary },
  grandTotalRow: {
    borderTopWidth: 2, borderTopColor: DS.colors.textPrimary,
    paddingTop: 12, marginTop: 6, marginBottom: 0,
  },
  grandLabel: { fontSize: 16, fontWeight: '800', color: DS.colors.textPrimary },
  grandValue: { fontSize: 18, fontWeight: '800', color: DS.colors.accent },
  timelineSection: { paddingHorizontal: 16, paddingBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: DS.colors.textPrimary, marginBottom: 14 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  timelineLeft: { alignItems: 'center', marginRight: 12, width: 22 },
  timelineDot: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: DS.colors.borderLight, alignItems: 'center', justifyContent: 'center',
  },
  timelineDotDone: { backgroundColor: DS.colors.success },
  checkmark: { color: '#fff', fontSize: 11, fontWeight: '700' },
  timelineLine: { width: 2, height: 22, backgroundColor: DS.colors.borderLight, marginTop: 2 },
  timelineLineDone: { backgroundColor: DS.colors.successSoft },
  timelineLabel: {
    fontSize: 14, fontWeight: '600', color: DS.colors.textPrimary, paddingTop: 2, paddingBottom: 22,
  },
  timelineLabelPending: { color: DS.colors.textTertiary, fontWeight: '400' },
  actionsSection: { paddingHorizontal: 16, paddingBottom: 16, gap: 10 },
  pdfRow: { flexDirection: 'row', gap: 10 },
  pdfBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    paddingVertical: 12, borderRadius: DS.radius.sm,
    borderWidth: 1.5, borderColor: DS.colors.accent,
    backgroundColor: DS.colors.accentSoft,
  },
  pdfBtnText: { fontSize: 14, fontWeight: '600', color: DS.colors.accent },
  primaryBtn: {
    flex: 1, backgroundColor: DS.colors.accent, borderRadius: DS.radius.sm,
    paddingVertical: 12, alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  secondaryBtn: {
    flex: 1, borderRadius: DS.radius.sm, paddingVertical: 12,
    borderWidth: 1.5, borderColor: DS.colors.accent, alignItems: 'center',
  },
  secondaryBtnText: { color: DS.colors.accent, fontSize: 14, fontWeight: '600' },
  markPaidBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: DS.radius.md,
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: DS.colors.border,
  },
  markPaidIcon: { fontSize: 22, color: DS.colors.success },
  markPaidTitle: { fontSize: 14, fontWeight: '600', color: DS.colors.textPrimary },
  markPaidSub: { fontSize: 12, color: DS.colors.textSecondary, marginTop: 2 },
  paidConfirm: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: DS.radius.md,
    backgroundColor: DS.colors.successSoft,
    borderWidth: 1, borderColor: DS.colors.success + '40',
  },
  paidIcon: { fontSize: 22, color: DS.colors.success },
  paidText: { fontSize: 16, fontWeight: '700', color: DS.colors.success },
});
