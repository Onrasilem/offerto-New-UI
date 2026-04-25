import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOfferto } from '../../context/OffertoContext';
import { showErrorToast, showSuccessToast } from '../../lib/toast';
import { DS } from '../../theme';
import { currency } from '../../lib/utils';
import { Ionicons } from '@expo/vector-icons';

const UNITS = [
  { label: 'stuk',   value: 'st' },
  { label: 'uur',    value: 'uur' },
  { label: 'm²',     value: 'm2' },
  { label: 'm³',     value: 'm3' },
  { label: 'meter',  value: 'm' },
  { label: 'forfait',value: 'forfait' },
];

const VATS = [0, 6, 9, 21];

const parseNum = (v) => {
  const n = parseFloat(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

export default function OnderdelenScreen({ navigation }) {
  const { onderdelen, addOnderdeel, removeOnderdeel, products } = useOfferto();

  const [form, setForm] = useState({
    omschrijving: '', aantal: '1', eenheid: 'st', eenheidsprijs: '', btwPerc: 21,
  });
  const [showCatalog, setShowCatalog] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');

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

  const addFromCatalog = (product) => {
    const qty = 1;
    const price = parseFloat(product.price) || 0;
    const vat = parseFloat(product.tax_rate) || 21;
    const ex = qty * price;
    const btwA = ex * (vat / 100);
    const unitMap = { stuk: 'st', uur: 'uur', m2: 'm2', m3: 'm3', m: 'm', forfait: 'forfait', dag: 'st' };
    addOnderdeel({
      omschrijving: product.name,
      aantal: qty,
      eenheid: unitMap[product.unit] || 'st',
      eenheidsprijs: price,
      btwPerc: vat,
      ex, btwA,
    });
    showSuccessToast(`${product.name} toegevoegd`);
  };

  const catalogFiltered = products.filter(p =>
    !catalogSearch || p.name.toLowerCase().includes(catalogSearch.toLowerCase())
  );

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Catalog shortcut */}
        {products.length > 0 && (
          <TouchableOpacity style={s.catalogBtn} onPress={() => setShowCatalog(true)}>
            <Ionicons name="cube-outline" size={18} color={DS.colors.accent} />
            <Text style={s.catalogBtnText}>Uit catalogus kiezen</Text>
            <View style={s.catalogCount}>
              <Text style={s.catalogCountText}>{products.length}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={DS.colors.accent} />
          </TouchableOpacity>
        )}

        {/* Nieuw onderdeel */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Nieuw onderdeel</Text>

          <View style={s.field}>
            <Text style={s.label}>Omschrijving</Text>
            <TextInput
              style={s.input} value={form.omschrijving} onChangeText={v => change({ omschrijving: v })}
              placeholder="Bijv. Uur werk, Materiaal..." placeholderTextColor={DS.colors.textTertiary}
            />
          </View>

          <View style={s.row}>
            <View style={s.halfField}>
              <Text style={s.label}>Aantal</Text>
              <TextInput style={s.input} value={form.aantal} onChangeText={v => change({ aantal: v })}
                keyboardType="numeric" placeholderTextColor={DS.colors.textTertiary} />
            </View>
            <View style={s.halfField}>
              <Text style={s.label}>Prijs (€)</Text>
              <TextInput style={s.input} value={form.eenheidsprijs} onChangeText={v => change({ eenheidsprijs: v })}
                keyboardType="numeric" placeholder="0,00" placeholderTextColor={DS.colors.textTertiary} />
            </View>
          </View>

          <View style={s.field}>
            <Text style={s.label}>Eenheid</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
              {UNITS.map(u => (
                <TouchableOpacity key={u.value} style={[s.chip, form.eenheid === u.value && s.chipActive]}
                  onPress={() => change({ eenheid: u.value })}>
                  <Text style={[s.chipText, form.eenheid === u.value && s.chipTextActive]}>{u.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={s.field}>
            <Text style={s.label}>BTW</Text>
            <View style={s.chips}>
              {VATS.map(v => (
                <TouchableOpacity key={v} style={[s.chip, form.btwPerc === v && s.chipActive]}
                  onPress={() => change({ btwPerc: v })}>
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
            {onderdelen.map((item) => (
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

      {/* Catalog modal */}
      <Modal visible={showCatalog} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={s.modalSafe} edges={['top', 'bottom']}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Catalogus</Text>
            <TouchableOpacity onPress={() => { setShowCatalog(false); setCatalogSearch(''); }}>
              <Ionicons name="close" size={24} color={DS.colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={s.modalSearch}>
            <Ionicons name="search-outline" size={16} color={DS.colors.textTertiary} />
            <TextInput
              style={s.modalSearchInput} value={catalogSearch} onChangeText={setCatalogSearch}
              placeholder="Zoek product..." placeholderTextColor={DS.colors.textTertiary} autoFocus
            />
          </View>

          <FlatList
            data={catalogFiltered}
            keyExtractor={item => String(item.id)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={s.catalogRow}
                onPress={() => addFromCatalog(item)}
              >
                <View style={s.catalogRowIcon}>
                  <Ionicons name="cube-outline" size={18} color={DS.colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.catalogRowName}>{item.name}</Text>
                  {!!item.description && (
                    <Text style={s.catalogRowDesc} numberOfLines={1}>{item.description}</Text>
                  )}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={s.catalogRowPrice}>{currency(item.price)}</Text>
                  <Text style={s.catalogRowUnit}>{item.unit || 'stuk'} · {item.tax_rate || 21}% BTW</Text>
                </View>
                <View style={s.addCircle}>
                  <Ionicons name="add" size={18} color="#fff" />
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={s.modalEmpty}>
                <Text style={s.modalEmptyText}>Geen producten gevonden</Text>
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
  catalogBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginTop: 16,
    backgroundColor: DS.colors.accentSoft,
    borderRadius: DS.radius.sm, borderWidth: 1.5, borderColor: DS.colors.accent + '40',
    paddingHorizontal: 16, paddingVertical: 13,
  },
  catalogBtnText: { flex: 1, fontSize: 15, fontWeight: '600', color: DS.colors.accent },
  catalogCount: {
    backgroundColor: DS.colors.accent, borderRadius: DS.radius.full,
    minWidth: 22, height: 22, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  catalogCountText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  section: {
    backgroundColor: DS.colors.surface, marginHorizontal: 16, marginTop: 12,
    borderRadius: DS.radius.md, borderWidth: 1, borderColor: DS.colors.border, padding: 16,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: DS.colors.textPrimary, marginBottom: 14 },
  field: { marginBottom: 14 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  halfField: { flex: 1 },
  label: { fontSize: 12, fontWeight: '600', color: DS.colors.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: DS.colors.bg, borderWidth: 1.5, borderColor: DS.colors.border,
    borderRadius: DS.radius.sm, paddingVertical: 11, paddingHorizontal: 14,
    fontSize: 15, color: DS.colors.textPrimary,
  },
  chips: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: DS.radius.full,
    borderWidth: 1.5, borderColor: DS.colors.border, backgroundColor: DS.colors.surface,
  },
  chipActive: { backgroundColor: DS.colors.accent, borderColor: DS.colors.accent },
  chipText: { fontSize: 13, fontWeight: '600', color: DS.colors.textSecondary },
  chipTextActive: { color: '#fff' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: DS.colors.accent, borderRadius: DS.radius.sm, paddingVertical: 13, marginTop: 4,
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
    borderTopWidth: 1, borderTopColor: DS.colors.borderLight, backgroundColor: DS.colors.surface,
  },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: DS.colors.accent, borderRadius: DS.radius.sm, paddingVertical: 14,
  },
  nextBtnDisabled: { backgroundColor: DS.colors.textTertiary },
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
  catalogRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: DS.colors.borderLight,
  },
  catalogRowIcon: {
    width: 36, height: 36, borderRadius: DS.radius.xs,
    backgroundColor: DS.colors.accentSoft, alignItems: 'center', justifyContent: 'center',
  },
  catalogRowName: { fontSize: 15, fontWeight: '600', color: DS.colors.textPrimary },
  catalogRowDesc: { fontSize: 12, color: DS.colors.textSecondary, marginTop: 1 },
  catalogRowPrice: { fontSize: 14, fontWeight: '700', color: DS.colors.accent },
  catalogRowUnit: { fontSize: 11, color: DS.colors.textTertiary, marginTop: 1 },
  addCircle: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: DS.colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  modalEmpty: { padding: 32, alignItems: 'center' },
  modalEmptyText: { fontSize: 14, color: DS.colors.textSecondary },
});
