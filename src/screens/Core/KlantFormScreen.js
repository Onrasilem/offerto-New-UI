import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useOfferto } from '../../context/OffertoContext';
import { showErrorToast } from '../../lib/toast';
import { DS } from '../../theme';

// Map backend customer → form fields
const toForm = (c) => ({
  bedrijfsnaam: c?.name || '',
  contactpersoon: c?.contact_person || '',
  email: c?.email || '',
  telefoon: c?.phone || '',
  adres: c?.address_json?.adres || c?.address_json?.street || '',
  btwNummer: c?.vat || '',
});

// Map form fields → backend customer payload
const toPayload = (f) => ({
  name: f.bedrijfsnaam.trim(),
  email: f.email.trim(),
  phone: f.telefoon.trim(),
  vat: f.btwNummer.trim(),
  contact_person: f.contactpersoon.trim(),
  address_json: { adres: f.adres.trim() },
});

export default function KlantFormScreen({ navigation, route }) {
  const { customer } = route.params || {};
  const isEdit = !!customer;

  const { addCustomer, editCustomer } = useOfferto();

  const [form, setForm] = useState(toForm(customer));
  const [saving, setSaving] = useState(false);

  const change = (patch) => setForm(prev => ({ ...prev, ...patch }));

  const handleSave = async () => {
    const naam = form.bedrijfsnaam.trim() || form.contactpersoon.trim();
    if (!naam) return showErrorToast('Bedrijfsnaam of contactpersoon is verplicht');
    if (!form.email.trim() && !form.telefoon.trim()) return showErrorToast('E-mail of telefoon is verplicht');

    setSaving(true);
    try {
      if (isEdit) {
        await editCustomer(customer.id, toPayload(form));
      } else {
        await addCustomer(toPayload(form));
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Fout', e.message || 'Kon klant niet opslaan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={s.section}>
          <View style={s.field}>
            <Text style={s.label}>Bedrijfsnaam</Text>
            <TextInput
              style={s.input}
              value={form.bedrijfsnaam}
              onChangeText={v => change({ bedrijfsnaam: v })}
              placeholder="Bijv. Brasserie De Hoek"
              placeholderTextColor={DS.colors.textTertiary}
            />
          </View>

          <View style={s.field}>
            <Text style={s.label}>Contactpersoon</Text>
            <TextInput
              style={s.input}
              value={form.contactpersoon}
              onChangeText={v => change({ contactpersoon: v })}
              placeholder="Naam contactpersoon"
              placeholderTextColor={DS.colors.textTertiary}
            />
          </View>

          <View style={s.row}>
            <View style={s.half}>
              <Text style={s.label}>E-mail</Text>
              <TextInput
                style={s.input}
                value={form.email}
                onChangeText={v => change({ email: v })}
                placeholder="klant@bedrijf.be"
                placeholderTextColor={DS.colors.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View style={s.half}>
              <Text style={s.label}>Telefoon</Text>
              <TextInput
                style={s.input}
                value={form.telefoon}
                onChangeText={v => change({ telefoon: v })}
                placeholder="0470 12 34 56"
                placeholderTextColor={DS.colors.textTertiary}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={s.field}>
            <Text style={s.label}>Adres</Text>
            <TextInput
              style={s.input}
              value={form.adres}
              onChangeText={v => change({ adres: v })}
              placeholder="Straat + nr, postcode, gemeente"
              placeholderTextColor={DS.colors.textTertiary}
            />
          </View>

          <View style={[s.field, { marginBottom: 0 }]}>
            <Text style={s.label}>BTW-nummer</Text>
            <TextInput
              style={s.input}
              value={form.btwNummer}
              onChangeText={v => change({ btwNummer: v })}
              placeholder="BE0123456789"
              placeholderTextColor={DS.colors.textTertiary}
              autoCapitalize="characters"
            />
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity
          style={[s.saveBtn, saving && s.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Ionicons name="checkmark" size={18} color="#fff" />
          <Text style={s.saveBtnText}>{saving ? 'Opslaan...' : isEdit ? 'Wijzigingen opslaan' : 'Klant toevoegen'}</Text>
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
  row: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  half: { flex: 1 },
  label: { fontSize: 12, fontWeight: '600', color: DS.colors.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: DS.colors.bg,
    borderWidth: 1.5, borderColor: DS.colors.border,
    borderRadius: DS.radius.sm,
    paddingVertical: 11, paddingHorizontal: 14,
    fontSize: 15, color: DS.colors.textPrimary,
  },
  footer: {
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: DS.colors.borderLight,
    backgroundColor: DS.colors.surface,
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: DS.colors.accent, borderRadius: DS.radius.sm, paddingVertical: 14,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
