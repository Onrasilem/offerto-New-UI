import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PeppolSendModal } from '../../components/PeppolSendModal';
import SignaturePad from '../../components/SignaturePad';
import { useOfferto } from '../../context/OffertoContext';
import { currency, addDaysISO } from '../../lib/utils';
import { buildPdf, sharePdf, previewPdf } from '../../lib/pdf';
import { DS } from '../../theme';

export default function OverzichtScreen({ navigation }) {
  const {
    company, klant, totals, docType, setDocType,
    docNummer, docDatum, saveToArchive, signRequested, setSignRequested,
    regenerateNumberFor, updateStatusByNumber, isInArchive,
    signatureData, setSignatureData,
  } = useOfferto();

  const { lines, exTotal, btwTotal, incTotal } = totals;
  const [peppolVisible, setPeppolVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    if (!docNummer) regenerateNumberFor(docType);
  }, []);

  const switchType = async (t) => { setDocType(t); await regenerateNumberFor(t); };

  const payload = () => ({
    type: docType, number: docNummer, date: docDatum,
    totals: { exTotal, btwTotal, incTotal },
    klant, lines, signRequested,
    signatureData: signatureData || null,
  });

  const ensureSaved = async () => {
    if (!isInArchive(docNummer)) await saveToArchive(payload());
  };

  const goHome = () => {
    const parent = navigation.getParent?.();
    (parent || navigation).navigate('Main');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveToArchive(payload());
      Alert.alert('Opgeslagen', 'Document staat in je archief.', [{ text: 'OK', onPress: goHome }]);
    } finally { setSaving(false); }
  };

  const pdfParams = () => ({ company, klant, lines, exTotal, btwTotal, incTotal, docType, nummer: docNummer || 'DOC-0000', docDatum, signatureData });

  const handlePreview = async () => {
    setPdfLoading(true);
    try {
      await previewPdf(pdfParams());
    } catch (e) {
      Alert.alert('Fout', e.message || 'Kon PDF niet openen.');
    } finally {
      setPdfLoading(false);
    }
  };

  const handlePdf = async () => {
    setPdfLoading(true);
    try {
      const target = await buildPdf(pdfParams());
      await sharePdf(target);
      try { await ensureSaved(); } catch {}
    } catch (e) {
      Alert.alert('Fout', e.message || 'Kon PDF niet genereren.');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleSign = async () => {
    if (!signatureData) return Alert.alert('Handtekening', 'Voeg eerst een handtekening toe.');
    await ensureSaved();
    await updateStatusByNumber(docNummer, 'Getekend/Goedgekeurd');
    Alert.alert('Bevestigd', 'Status: Getekend/Goedgekeurd', [{ text: 'OK', onPress: goHome }]);
  };

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Doc type switcher */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Documenttype</Text>
          <View style={s.typeRow}>
            {['OFFERTE', 'FACTUUR'].map(t => (
              <TouchableOpacity key={t} style={[s.typeBtn, docType === t && s.typeBtnActive]} onPress={() => switchType(t)}>
                {docType === t && <Ionicons name="checkmark" size={14} color="#fff" />}
                <Text style={[s.typeBtnText, docType === t && s.typeBtnTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={s.metaGrid}>
            <View style={s.metaItem}>
              <Text style={s.metaLabel}>NUMMER</Text>
              <Text style={s.metaValue}>{docNummer || '—'}</Text>
            </View>
            <View style={s.metaItem}>
              <Text style={s.metaLabel}>DATUM</Text>
              <Text style={s.metaValue}>{docDatum}</Text>
            </View>
            {docType === 'OFFERTE' && (
              <View style={s.metaItem}>
                <Text style={s.metaLabel}>GELDIG TOT</Text>
                <Text style={s.metaValue}>{addDaysISO(docDatum, company.offerteGeldigheidDagen || 30)}</Text>
              </View>
            )}
            <View style={s.metaItem}>
              <Text style={s.metaLabel}>KLANT</Text>
              <Text style={s.metaValue} numberOfLines={1}>{klant.bedrijfsnaam || klant.contactpersoon || '—'}</Text>
            </View>
          </View>
        </View>

        {/* Onderdelen */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Onderdelen ({lines.length})</Text>
          {lines.map((r, i) => (
            <View key={r.id || i} style={[s.lineRow, i === 0 && { borderTopWidth: 0 }]}>
              <View style={{ flex: 1 }}>
                <Text style={s.lineName}>{r.omschrijving}</Text>
                <Text style={s.lineMeta}>{r.aantal} × {currency(r.eenheidsprijs)} · BTW {r.btwPerc}%</Text>
              </View>
              <Text style={s.lineTotal}>{currency(r.inc ?? (r.ex + r.btwA))}</Text>
            </View>
          ))}
          {/* Totalen */}
          <View style={s.totalsBox}>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Excl. BTW</Text>
              <Text style={s.totalValue}>{currency(exTotal)}</Text>
            </View>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>BTW</Text>
              <Text style={s.totalValue}>{currency(btwTotal)}</Text>
            </View>
            <View style={[s.totalRow, s.grandRow]}>
              <Text style={s.grandLabel}>Totaal</Text>
              <Text style={s.grandValue}>{currency(incTotal)}</Text>
            </View>
          </View>
        </View>

        {/* Handtekening */}
        <View style={s.section}>
          <View style={s.signHeader}>
            <Text style={s.sectionTitle}>Handtekening</Text>
            <TouchableOpacity onPress={() => setSignRequested(!signRequested)} style={s.optionalToggle}>
              <Ionicons name={signRequested ? 'checkbox' : 'square-outline'} size={18} color={DS.colors.accent} />
              <Text style={s.optionalText}>Vereist</Text>
            </TouchableOpacity>
          </View>
          <SignaturePad
            value={signatureData}
            onChange={sig => setSignatureData(sig)}
            onClear={() => setSignatureData(null)}
          />
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Action footer */}
      <View style={s.footer}>
        <View style={s.footerRow}>
          <TouchableOpacity style={s.secondaryBtn} onPress={handlePreview} disabled={pdfLoading}>
            <Ionicons name="eye-outline" size={18} color={DS.colors.accent} />
            <Text style={s.secondaryBtnText}>Bekijk</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.secondaryBtn} onPress={handlePdf} disabled={pdfLoading}>
            <Ionicons name="share-outline" size={18} color={DS.colors.accent} />
            <Text style={s.secondaryBtnText}>Deel</Text>
          </TouchableOpacity>

          {docType === 'FACTUUR' && (
            <TouchableOpacity style={s.secondaryBtn} onPress={async () => { await ensureSaved(); setPeppolVisible(true); }}>
              <Ionicons name="send-outline" size={18} color={DS.colors.accent} />
              <Text style={s.secondaryBtnText}>Peppol</Text>
            </TouchableOpacity>
          )}

          {signatureData ? (
            <TouchableOpacity style={[s.primaryBtn, { flex: 2 }]} onPress={handleSign}>
              <Ionicons name="checkmark-circle" size={18} color="#fff" />
              <Text style={s.primaryBtnText}>Tekenen & opslaan</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[s.primaryBtn, { flex: 2 }, saving && s.btnDisabled]} onPress={handleSave} disabled={saving}>
              <Ionicons name="save-outline" size={18} color="#fff" />
              <Text style={s.primaryBtnText}>{saving ? 'Opslaan...' : 'Opslaan'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <PeppolSendModal
        visible={peppolVisible}
        onClose={() => setPeppolVisible(false)}
        document={{ id: docNummer, number: docNummer, type: docType }}
        customer={klant}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DS.colors.bg },
  section: {
    backgroundColor: DS.colors.surface,
    marginHorizontal: 16, marginTop: 16,
    borderRadius: DS.radius.md,
    borderWidth: 1, borderColor: DS.colors.border,
    padding: 16,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: DS.colors.textPrimary, marginBottom: 12 },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  typeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 11, borderRadius: DS.radius.sm,
    borderWidth: 1.5, borderColor: DS.colors.border,
  },
  typeBtnActive: { backgroundColor: DS.colors.accent, borderColor: DS.colors.accent },
  typeBtnText: { fontSize: 14, fontWeight: '700', color: DS.colors.textSecondary },
  typeBtnTextActive: { color: '#fff' },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metaItem: { minWidth: '45%' },
  metaLabel: { fontSize: 10, fontWeight: '700', color: DS.colors.textTertiary, letterSpacing: 0.6, marginBottom: 2 },
  metaValue: { fontSize: 14, fontWeight: '600', color: DS.colors.textPrimary },
  lineRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingVertical: 10, borderTopWidth: 1, borderTopColor: DS.colors.borderLight,
  },
  lineName: { fontSize: 14, fontWeight: '600', color: DS.colors.textPrimary },
  lineMeta: { fontSize: 12, color: DS.colors.textSecondary, marginTop: 2 },
  lineTotal: { fontSize: 14, fontWeight: '700', color: DS.colors.textPrimary, paddingLeft: 12 },
  totalsBox: {
    marginTop: 12, paddingTop: 12,
    borderTopWidth: 1.5, borderTopColor: DS.colors.border,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  totalLabel: { fontSize: 13, color: DS.colors.textSecondary },
  totalValue: { fontSize: 13, color: DS.colors.textPrimary },
  grandRow: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: DS.colors.border },
  grandLabel: { fontSize: 16, fontWeight: '800', color: DS.colors.textPrimary },
  grandValue: { fontSize: 18, fontWeight: '800', color: DS.colors.accent },
  signHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  optionalToggle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  optionalText: { fontSize: 13, color: DS.colors.accent, fontWeight: '600' },
  footer: {
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: DS.colors.borderLight,
    backgroundColor: DS.colors.surface,
  },
  footerRow: { flexDirection: 'row', gap: 10 },
  primaryBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: DS.colors.accent, borderRadius: DS.radius.sm, paddingVertical: 13,
  },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  btnDisabled: { opacity: 0.6 },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 13,
    borderRadius: DS.radius.sm, borderWidth: 1.5, borderColor: DS.colors.accent,
  },
  secondaryBtnText: { color: DS.colors.accent, fontSize: 14, fontWeight: '600' },
});
