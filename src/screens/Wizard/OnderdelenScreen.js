import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOfferto } from '../../context/OffertoContext';
import { showErrorToast, showSuccessToast } from '../../lib/toast';
import { DS } from '../../theme';
import { currency } from '../../lib/utils';
import { Ionicons } from '@expo/vector-icons';

const UNITS = [
  { label: 'stuk', value: 'st' },
  { label: 'uur',  value: 'uur' },
  { label: 'm²',   value: 'm2' },
  { label: 'm³',   value: 'm3' },
  { label: 'meter',value: 'm' },
];

const VATS = [0, 6, 9, 21];

const parseNum = (v) => {
  const n = parseFloat(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

export default function OnderdelenScreen({ navigation }) {
  const { onderdelen, addOnderdeel, removeOnderdeel, products } = useOfferto();

  const [form, setForm] = useState({
    omschrijving: '',
    aantal: '1',
    eenheid: 'st',
    eenheidsprijs: '',
    btwPerc: 21,
  });

  const change = (patch) => setForm(prev => ({ ...prev, ...patch }));

  const add = () => {
    if (!form.omschrijving.trim()) return showErrorToast('Vul een omschrijving in');
    if (!form.eenheidsprijs) return showErrorToast('Vul een prijs in');

    const qty = parseNum(form.aantal) || 1;
    const price = parseNum(form.eenheidsprijs);
    const vat = parseNum(form.btwPerc);
    const ex = qty * price;
    const btwA = ex * (vat / 100);

    addOnderdeel({ omschrijving: form.omschrijving.trim(), aantal: qty, eenheid: form.eenheid, eenheidsprijs: price, btwPerc: vat, ex, btwA });
    setForm({ omschrijving: '', aantal: '1', eenheid: 'st', eenheidsprijs: '', btwPerc: 21 });
    showSuccessToast('Onderdeel toegevoegd');
  };

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={s.section}>
          <Text style={s.sectionTitle}>Nieuw onderdeel</Text>

          {/* Omschrijving */}
          <View style={s.field}>
            <Text style={s.label}>Omschrijving</Text>
            <TextInput
              style={s.input}
              value={form.omschrijving}
              onChangeText={v => change({ omschrijving: v })}
              placeholder="Bijv. Uur werk, Materiaal..."
              placeholderTextColor={DS.colors.textTertiary}
            />
          </View>

          {/* Aantal + Prijs */}
          <View style={s.row}>
            <View style={s.halfField}>
              <Text style={s.label}>Aantal</Text>
              <TextInput
                style={s.input}
                value={form.aantal}
                onChangeText={v => change({ aantal: v })}
                keyboardType="numeric"
                placeholderTextColor={DS.colors.textTertiary}
              />
            </View>
            <View style={s.halfField}>
              <Text style={s.label}>Prijs (€)</Text>
              <TextInput
                style={s.input}
                value={form.eenheidsprijs}
                onChangeText={v => change({ eenheidsprijs: v })}
                keyboardType="numeric"
                placeholder="0,00"
                placeholderTextColor={DS.colors.textTertiary}
              />
            </View>
          </View>

          {/* Eenheid */}
          <View style={s.field}>
            <Text style={s.label}>Eenheid</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
              {UNITS.map(u => (
                <TouchableOpacity
                  key={u.value}
                  style={[s.chip, form.eenheid === u.value && s.chipActive]}
                  onPress={() => change({ eenheid: u.value })}
                >
                  <Text style={[s.chipText, form.eenheid === u.value && s.chipTextActive]}>{u.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* BTW */}
          <View style={s.field}>
            <Text style={s.label}>BTW</Text>
            <View style={s.chips}>
              {VATS.map(v => (
                <TouchableOpacity
                  key={v}
                  style={[s.chip, form.btwPerc === v && s.chipActive]}
                  onPress={() => change({ btwPerc: v })}
                >
                  <Text style={[s.chipText, form.btwPerc === v && s.chipTextActive]}>{v}%</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={s.addBtn} onPress={add}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={s.addBtnText}>Toevoegen</Text>
          </TouchableOpacity>
        </View>

        {/* Toegevoegde onderdelen */}
        {onderdelen.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Toegevoegd ({onderdelen.length})</Text>
            {onderdelen.map((item, idx) => (
              <View key={item.id} style={s.lineRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.lineName} numberOfLines={2}>{item.omschrijving}</Text>
                  <Text style={s.lineMeta}>
                    {item.aantal} {item.eenheid} × {currency(item.eenheidsprijs)} · BTW {item.btwPerc}%
                  </Text>
                </View>
                <View style={s.lineRight}>
                  <Text style={s.lineTotal}>{currency(item.ex + item.btwA)}</Text>
                  <TouchableOpacity onPress={() => removeOnderdeel(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="trash-outline" size={18} color={DS.colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Sticky bottom button */}
      <View style={s.footer}>
        <TouchableOpacity
          style={[s.nextBtn, onderdelen.length === 0 && s.nextBtnDisabled]}
          onPress={() => {
            if (onderdelen.length === 0) return showErrorToast('Voeg minstens één onderdeel toe');
            navigation.navigate('Overzicht');
          }}
        >
          <Text style={s.nextBtnText}>Volgende: Overzicht</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DS.colors.bg },
  section: {
    backgroundColor: DS.colors.surface,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: DS.radius.md,
    borderWidth: 1,
    borderColor: DS.colors.border,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 15, fontWeight: '700', color: DS.colors.textPrimary, marginBottom: 14,
  },
  field: { marginBottom: 14 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  halfField: { flex: 1 },
  label: { fontSize: 12, fontWeight: '600', color: DS.colors.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: DS.colors.bg,
    borderWidth: 1.5, borderColor: DS.colors.border,
    borderRadius: DS.radius.sm,
    paddingVertical: 11, paddingHorizontal: 14,
    fontSize: 15, color: DS.colors.textPrimary,
  },
  chips: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: DS.radius.full,
    borderWidth: 1.5, borderColor: DS.colors.border,
    backgroundColor: DS.colors.surface,
  },
  chipActive: { backgroundColor: DS.colors.accent, borderColor: DS.colors.accent },
  chipText: { fontSize: 13, fontWeight: '600', color: DS.colors.textSecondary },
  chipTextActive: { color: '#fff' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: DS.colors.accent,
    borderRadius: DS.radius.sm, paddingVertical: 13, marginTop: 4,
  },
  addBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  lineRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingVertical: 12, borderTopWidth: 1, borderTopColor: DS.colors.borderLight,
  },
  lineName: { fontSize: 14, fontWeight: '600', color: DS.colors.textPrimary },
  lineMeta: { fontSize: 12, color: DS.colors.textSecondary, marginTop: 2 },
  lineRight: { alignItems: 'flex-end', gap: 6, paddingLeft: 12 },
  lineTotal: { fontSize: 14, fontWeight: '700', color: DS.colors.textPrimary },
  footer: {
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: DS.colors.borderLight,
    backgroundColor: DS.colors.surface,
  },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: DS.colors.accent, borderRadius: DS.radius.sm, paddingVertical: 14,
  },
  nextBtnDisabled: { backgroundColor: DS.colors.textTertiary },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
