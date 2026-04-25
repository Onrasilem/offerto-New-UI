import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useOfferto } from '../../context/OffertoContext';
import { DS } from '../../theme';

const DAY_OPTIONS = [3, 5, 7, 10, 14, 21];

export default function HerinneringenScreen({ navigation }) {
  const { reminderPrefs, saveReminderPrefs } = useOfferto();

  const [enabled, setEnabled] = useState(reminderPrefs.enabled !== false);
  const [days, setDays] = useState(reminderPrefs.daysUntilReminder || 7);

  const handleSave = async () => {
    try {
      await saveReminderPrefs({ enabled, daysUntilReminder: days });
      Alert.alert('Opgeslagen', 'Herinneringsinstellingen bijgewerkt.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch {
      Alert.alert('Fout', 'Kon niet opslaan.');
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Toggle */}
        <View style={s.section}>
          <View style={s.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.toggleLabel}>Automatische herinneringen</Text>
              <Text style={s.toggleSub}>Stuur automatisch een herinnering bij openstaande facturen</Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={setEnabled}
              trackColor={{ false: DS.colors.border, true: DS.colors.accent }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Timing */}
        {enabled && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Na hoeveel dagen sturen?</Text>
            <Text style={s.sectionSub}>Aantal dagen na de vervaldatum van de factuur</Text>
            <View style={s.grid}>
              {DAY_OPTIONS.map(d => (
                <TouchableOpacity
                  key={d}
                  style={[s.optionBtn, days === d && s.optionBtnActive]}
                  onPress={() => setDays(d)}
                >
                  {days === d && <Ionicons name="checkmark" size={14} color="#fff" />}
                  <Text style={[s.optionText, days === d && s.optionTextActive]}>+{d}d</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.summaryRow}>
              <Ionicons name="mail-outline" size={16} color={DS.colors.accent} />
              <Text style={s.summaryText}>
                Herinnering verstuurd <Text style={s.summaryBold}>{days} dag{days !== 1 ? 'en' : ''}</Text> na vervaldatum
              </Text>
            </View>
          </View>
        )}

        {/* Info block */}
        <View style={s.infoCard}>
          <Ionicons name="bulb-outline" size={18} color={DS.colors.warning} />
          <View style={{ flex: 1 }}>
            <Text style={s.infoTitle}>Hoe werkt het?</Text>
            <Text style={s.infoText}>
              Elke dag controleert het systeem alle openstaande facturen. Facturen die de vervaldatum overschreden hebben met {days} dag{days !== 1 ? 'en' : ''} krijgen automatisch een herinnering.{'\n\n'}
              Om echte e-mails te versturen, moet je nog een e-mailprovider instellen onder Integraties.
            </Text>
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
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  toggleLabel: { fontSize: 15, fontWeight: '600', color: DS.colors.textPrimary },
  toggleSub: { fontSize: 12, color: DS.colors.textSecondary, marginTop: 2 },
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
  infoCard: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    backgroundColor: DS.colors.warningSoft,
    marginHorizontal: 16, marginTop: 16,
    borderRadius: DS.radius.md, borderWidth: 1, borderColor: '#FDE68A',
    padding: 14,
  },
  infoTitle: { fontSize: 13, fontWeight: '700', color: DS.colors.warningText, marginBottom: 4 },
  infoText: { fontSize: 12, color: DS.colors.warningText, lineHeight: 18 },
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
