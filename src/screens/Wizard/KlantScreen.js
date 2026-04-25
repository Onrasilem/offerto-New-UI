import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useOfferto } from '../../context/OffertoContext';
import { showErrorToast } from '../../lib/toast';
import { DS } from '../../theme';
import { Avatar } from '../../components/DesignSystem';

export default function KlantScreen({ navigation }) {
  const { klant, setKlant, customers } = useOfferto();
  const [showPicker, setShowPicker] = useState(false);
  const [pickerQuery, setPickerQuery] = useState('');

  const [form, setForm] = useState({
    bedrijfsnaam: klant.bedrijfsnaam || '',
    contactpersoon: klant.contactpersoon || '',
    email: klant.email || '',
    telefoon: klant.telefoon || '',
    adres: klant.adres || '',
    btwNummer: klant.btwNummer || '',
  });

  useEffect(() => {
    setForm({
      bedrijfsnaam: klant.bedrijfsnaam || '',
      contactpersoon: klant.contactpersoon || '',
      email: klant.email || '',
      telefoon: klant.telefoon || '',
      adres: klant.adres || '',
      btwNummer: klant.btwNummer || '',
    });
  }, [klant]);

  const change = (patch) => setForm(prev => ({ ...prev, ...patch }));

  const selectCustomer = (c) => {
    const filled = {
      bedrijfsnaam: c.name || '',
      contactpersoon: c.contact_person || '',
      email: c.email || '',
      telefoon: c.phone || '',
      adres: c.address_json?.adres || '',
      btwNummer: c.vat || '',
    };
    setForm(filled);
    setShowPicker(false);
    setPickerQuery('');
  };

  const submit = () => {
    const naam = form.bedrijfsnaam.trim() || form.contactpersoon.trim();
    const contact = form.email.trim() || form.telefoon.trim();
    if (!naam) return showErrorToast('Bedrijfsnaam of contactpersoon is verplicht');
    if (!contact) return showErrorToast('E-mail of telefoon is verplicht');
    setKlant(form);
    navigation.navigate('Onderdelen');
  };

  const filteredCustomers = customers.filter(c => {
    if (!pickerQuery) return true;
    const q = pickerQuery.toLowerCase();
    return (c.name || '').toLowerCase().includes(q) ||
      (c.contact_person || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q);
  });

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Bestaande klant selecteren */}
        {customers.length > 0 && (
          <TouchableOpacity style={s.pickerTrigger} onPress={() => setShowPicker(true)}>
            <View style={s.pickerTriggerLeft}>
              <Ionicons name="people-outline" size={18} color={DS.colors.accent} />
              <Text style={s.pickerTriggerText}>Selecteer bestaande klant</Text>
            </View>
            <Ionicons name="chevron-down" size={16} color={DS.colors.accent} />
          </TouchableOpacity>
        )}

        <View style={s.section}>
          <Text style={s.sectionTitle}>Klantgegevens</Text>

          <View style={s.field}>
            <Text style={s.label}>Bedrijfsnaam</Text>
            <TextInput style={s.input} value={form.bedrijfsnaam} onChangeText={v => change({ bedrijfsnaam: v })}
              placeholder="Bijv. Brasserie De Hoek" placeholderTextColor={DS.colors.textTertiary} />
          </View>

          <View style={s.field}>
            <Text style={s.label}>Contactpersoon</Text>
            <TextInput style={s.input} value={form.contactpersoon} onChangeText={v => change({ contactpersoon: v })}
              placeholder="Naam contactpersoon" placeholderTextColor={DS.colors.textTertiary} />
          </View>

          <View style={s.row}>
            <View style={s.half}>
              <Text style={s.label}>E-mail</Text>
              <TextInput style={s.input} value={form.email} onChangeText={v => change({ email: v })}
                placeholder="klant@bedrijf.be" placeholderTextColor={DS.colors.textTertiary}
                keyboardType="email-address" autoCapitalize="none" />
            </View>
            <View style={s.half}>
              <Text style={s.label}>Telefoon</Text>
              <TextInput style={s.input} value={form.telefoon} onChangeText={v => change({ telefoon: v })}
                placeholder="0470 12 34 56" placeholderTextColor={DS.colors.textTertiary}
                keyboardType="phone-pad" />
            </View>
          </View>

          <View style={s.field}>
            <Text style={s.label}>Adres</Text>
            <TextInput style={s.input} value={form.adres} onChangeText={v => change({ adres: v })}
              placeholder="Straat + nr, postcode, gemeente" placeholderTextColor={DS.colors.textTertiary} />
          </View>

          <View style={[s.field, { marginBottom: 0 }]}>
            <Text style={s.label}>BTW-nummer</Text>
            <TextInput style={s.input} value={form.btwNummer} onChangeText={v => change({ btwNummer: v })}
              placeholder="BE0123456789" placeholderTextColor={DS.colors.textTertiary}
              autoCapitalize="characters" />
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity style={s.nextBtn} onPress={submit}>
          <Text style={s.nextBtnText}>Volgende: Onderdelen</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Customer picker modal */}
      <Modal visible={showPicker} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={s.modalSafe} edges={['top', 'bottom']}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Klant selecteren</Text>
            <TouchableOpacity onPress={() => { setShowPicker(false); setPickerQuery(''); }}>
              <Ionicons name="close" size={24} color={DS.colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={s.modalSearch}>
            <Ionicons name="search-outline" size={16} color={DS.colors.textTertiary} />
            <TextInput
              style={s.modalSearchInput}
              value={pickerQuery}
              onChangeText={setPickerQuery}
              placeholder="Zoek klant..."
              placeholderTextColor={DS.colors.textTertiary}
              autoFocus
            />
          </View>

          <FlatList
            data={filteredCustomers}
            keyExtractor={item => String(item.id)}
            renderItem={({ item }) => (
              <TouchableOpacity style={s.modalRow} onPress={() => selectCustomer(item)}>
                <Avatar name={item.name} size={38} />
                <View style={{ flex: 1 }}>
                  <Text style={s.modalRowName}>{item.name}</Text>
                  {!!(item.contact_person || item.email) && (
                    <Text style={s.modalRowSub}>{item.contact_person || item.email}</Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={16} color={DS.colors.textTertiary} />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={s.modalEmpty}>
                <Text style={s.modalEmptyText}>Geen klanten gevonden</Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DS.colors.bg },
  pickerTrigger: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 16, marginTop: 16,
    backgroundColor: DS.colors.accentSoft,
    borderRadius: DS.radius.sm, borderWidth: 1.5, borderColor: DS.colors.accent + '40',
    paddingHorizontal: 16, paddingVertical: 13,
  },
  pickerTriggerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pickerTriggerText: { fontSize: 15, fontWeight: '600', color: DS.colors.accent },
  section: {
    backgroundColor: DS.colors.surface,
    marginHorizontal: 16, marginTop: 12,
    borderRadius: DS.radius.md,
    borderWidth: 1, borderColor: DS.colors.border,
    padding: 16,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: DS.colors.textPrimary, marginBottom: 14 },
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
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: DS.colors.accent, borderRadius: DS.radius.sm, paddingVertical: 14,
  },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  // Modal
  modalSafe: { flex: 1, backgroundColor: '#fff' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: DS.colors.borderLight,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: DS.colors.textPrimary },
  modalSearch: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginVertical: 12,
    backgroundColor: DS.colors.bg, borderRadius: DS.radius.sm,
    borderWidth: 1, borderColor: DS.colors.border,
    paddingHorizontal: 14, paddingVertical: 11,
  },
  modalSearchInput: { flex: 1, fontSize: 15, color: DS.colors.textPrimary },
  modalRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: DS.colors.borderLight,
  },
  modalRowName: { fontSize: 15, fontWeight: '600', color: DS.colors.textPrimary },
  modalRowSub: { fontSize: 12, color: DS.colors.textSecondary, marginTop: 1 },
  modalEmpty: { padding: 32, alignItems: 'center' },
  modalEmptyText: { fontSize: 14, color: DS.colors.textSecondary },
});
