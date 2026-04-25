import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useOfferto } from '../../context/OffertoContext';
import { DS } from '../../theme';

const RATES = [
  { value: 0,  label: '0%',  desc: 'Vrijgesteld / intracommunautair' },
  { value: 6,  label: '6%',  desc: 'Verlaagd tarief (voeding, renovatie)' },
  { value: 9,  label: '9%',  desc: 'Middentarief (horeca, logies)' },
  { value: 21, label: '21%', desc: 'Standaardtarief' },
];

export default function BTWScreen({ navigation }) {
  const { company, saveCompany } = useOfferto();
  const [selected, setSelected] = useState(company.defaultBtw ?? 21);

  const handleSave = async () => {
    try {
      await saveCompany({ defaultBtw: selected });
      Alert.alert('Opgeslagen', 'Standaard BTW-tarief bijgewerkt.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch {
      Alert.alert('Fout', 'Kon niet opslaan.');
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Standaard BTW-tarief</Text>
          <Text style={s.sectionSub}>Dit tarief wordt automatisch ingevuld bij het toevoegen van nieuwe onderdelen.</Text>

          {RATES.map(r => (
            <TouchableOpacity
              key={r.value}
              style={[s.rateRow, selected === r.value && s.rateRowActive]}
              onPress={() => setSelected(r.value)}
            >
              <View style={[s.radio, selected === r.value && s.radioActive]}>
                {selected === r.value && <View style={s.radioDot} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.rateLabel, selected === r.value && s.rateLabelActive]}>{r.label}</Text>
                <Text style={s.rateDesc}>{r.desc}</Text>
              </View>
              {selected === r.value && (
                <Ionicons name="checkmark-circle" size={20} color={DS.colors.accent} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.note}>
          <Ionicons name="information-circle-outline" size={16} color={DS.colors.textTertiary} />
          <Text style={s.noteText}>Je kunt per onderdeel nog een ander tarief kiezen. Dit is alleen de standaardwaarde.</Text>
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
  sectionSub: { fontSize: 13, color: DS.colors.textSecondary, marginBottom: 16 },
  rateRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, paddingHorizontal: 12,
    borderRadius: DS.radius.sm, marginBottom: 8,
    borderWidth: 1.5, borderColor: DS.colors.border,
    backgroundColor: DS.colors.bg,
  },
  rateRowActive: { borderColor: DS.colors.accent, backgroundColor: DS.colors.accentSoft },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: DS.colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: DS.colors.accent },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: DS.colors.accent },
  rateLabel: { fontSize: 15, fontWeight: '700', color: DS.colors.textPrimary },
  rateLabelActive: { color: DS.colors.accent },
  rateDesc: { fontSize: 12, color: DS.colors.textSecondary, marginTop: 2 },
  note: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    marginHorizontal: 16, marginTop: 12,
  },
  noteText: { flex: 1, fontSize: 12, color: DS.colors.textTertiary, lineHeight: 18 },
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
