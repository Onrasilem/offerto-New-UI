import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useOfferto } from '../../context/OffertoContext';
import { DS } from '../../theme';

const TERMIJN_OPTIONS = [7, 14, 21, 30, 45, 60];
const GELDIGHEID_OPTIONS = [14, 21, 30, 45, 60, 90];

// company.betalingsTermijn is stored as '14 dagen' string — extract the number
const parseDays = (v) => {
  if (!v) return 30;
  const n = parseInt(String(v));
  return Number.isFinite(n) ? n : 30;
};

export default function BetalingstermijnScreen({ navigation }) {
  const { company, saveCompany } = useOfferto();

  const [betaalDagen, setBetaalDagen] = useState(parseDays(company.betalingsTermijn));
  const [geldigheidDagen, setGeldigheidDagen] = useState(company.offerteGeldigheidDagen || 30);

  const handleSave = async () => {
    try {
      await saveCompany({
        betalingsTermijn: `${betaalDagen} dagen`,
        offerteGeldigheidDagen: geldigheidDagen,
      });
      Alert.alert('Opgeslagen', 'Betalingstermijnen bijgewerkt.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch {
      Alert.alert('Fout', 'Kon niet opslaan.');
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Betaaltermijn facturen</Text>
          <Text style={s.sectionSub}>Hoeveel dagen heeft de klant om te betalen?</Text>
          <View style={s.grid}>
            {TERMIJN_OPTIONS.map(d => (
              <TouchableOpacity
                key={d}
                style={[s.optionBtn, betaalDagen === d && s.optionBtnActive]}
                onPress={() => setBetaalDagen(d)}
              >
                {betaalDagen === d && <Ionicons name="checkmark" size={14} color="#fff" />}
                <Text style={[s.optionText, betaalDagen === d && s.optionTextActive]}>{d} d</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={s.summaryRow}>
            <Ionicons name="calendar-outline" size={16} color={DS.colors.accent} />
            <Text style={s.summaryText}>Vervaldag = factuurdatum + <Text style={s.summaryBold}>{betaalDagen} dagen</Text></Text>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Geldigheid offertes</Text>
          <Text style={s.sectionSub}>Hoelang blijft een offerte geldig?</Text>
          <View style={s.grid}>
            {GELDIGHEID_OPTIONS.map(d => (
              <TouchableOpacity
                key={d}
                style={[s.optionBtn, geldigheidDagen === d && s.optionBtnActive]}
                onPress={() => setGeldigheidDagen(d)}
              >
                {geldigheidDagen === d && <Ionicons name="checkmark" size={14} color="#fff" />}
                <Text style={[s.optionText, geldigheidDagen === d && s.optionTextActive]}>{d} d</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={s.summaryRow}>
            <Ionicons name="time-outline" size={16} color={DS.colors.accent} />
            <Text style={s.summaryText}>Geldig tot = offertedatum + <Text style={s.summaryBold}>{geldigheidDagen} dagen</Text></Text>
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity style={s.saveBtn} onPress={handleSave}>
          <Ionicons name="checkmark" size={18} color="#fff" />
          <Text style={s.saveBtnText}>Opslaan</Text>
        </TouchableOpacity>
      </View>
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
  sectionTitle: { fontSize: 15, fontWeight: '700', color: DS.colors.textPrimary, marginBottom: 4 },
  sectionSub: { fontSize: 13, color: DS.colors.textSecondary, marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  optionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: DS.radius.sm,
    borderWidth: 1.5, borderColor: DS.colors.border,
    backgroundColor: DS.colors.bg,
  },
  optionBtnActive: { backgroundColor: DS.colors.accent, borderColor: DS.colors.accent },
  optionText: { fontSize: 14, fontWeight: '600', color: DS.colors.textSecondary },
  optionTextActive: { color: '#fff' },
  summaryRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingTop: 12, borderTopWidth: 1, borderTopColor: DS.colors.borderLight,
  },
  summaryText: { fontSize: 13, color: DS.colors.textSecondary },
  summaryBold: { fontWeight: '700', color: DS.colors.accent },
  footer: {
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: DS.colors.borderLight,
    backgroundColor: DS.colors.surface,
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: DS.colors.accent, borderRadius: DS.radius.sm, paddingVertical: 14,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
