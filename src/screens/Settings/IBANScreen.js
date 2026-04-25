import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useOfferto } from '../../context/OffertoContext';
import { DS } from '../../theme';

export default function IBANScreen({ navigation }) {
  const { company, saveCompany } = useOfferto();

  const [form, setForm] = useState({
    iban: company.iban || '',
    bic: company.bic || '',
    bank: company.bank || '',
  });

  const change = (patch) => setForm(prev => ({ ...prev, ...patch }));

  const handleSave = async () => {
    try {
      await saveCompany(form);
      Alert.alert('Opgeslagen', 'Betaalgegevens zijn bijgewerkt.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch {
      Alert.alert('Fout', 'Kon niet opslaan. Probeer opnieuw.');
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={s.section}>
          <View style={s.field}>
            <Text style={s.label}>IBAN</Text>
            <TextInput
              style={s.input}
              value={form.iban}
              onChangeText={v => change({ iban: v })}
              placeholder="BE68 5390 0754 7034"
              placeholderTextColor={DS.colors.textTertiary}
              autoCapitalize="characters"
            />
          </View>

          <View style={s.field}>
            <Text style={s.label}>BIC / SWIFT</Text>
            <TextInput
              style={s.input}
              value={form.bic}
              onChangeText={v => change({ bic: v })}
              placeholder="BNAGBEbb"
              placeholderTextColor={DS.colors.textTertiary}
              autoCapitalize="characters"
            />
          </View>

          <View style={[s.field, { marginBottom: 0 }]}>
            <Text style={s.label}>Banknaam</Text>
            <TextInput
              style={s.input}
              value={form.bank}
              onChangeText={v => change({ bank: v })}
              placeholder="BNP Paribas Fortis"
              placeholderTextColor={DS.colors.textTertiary}
            />
          </View>
        </View>

        <View style={s.note}>
          <Ionicons name="information-circle-outline" size={16} color={DS.colors.textTertiary} />
          <Text style={s.noteText}>Deze gegevens worden vermeld op je facturen zodat klanten je kunnen betalen.</Text>
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
  field: { marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '600', color: DS.colors.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: DS.colors.bg,
    borderWidth: 1.5, borderColor: DS.colors.border,
    borderRadius: DS.radius.sm,
    paddingVertical: 11, paddingHorizontal: 14,
    fontSize: 15, color: DS.colors.textPrimary,
  },
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
