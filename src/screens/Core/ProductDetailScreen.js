import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Switch, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../lib/api';
import { DS } from '../../theme';
import { currency } from '../../lib/utils';

const UNITS = [
  { value: 'stuk',    label: 'Stuk' },
  { value: 'uur',     label: 'Uur' },
  { value: 'dag',     label: 'Dag' },
  { value: 'm2',      label: 'm²' },
  { value: 'm3',      label: 'm³' },
  { value: 'm',       label: 'Meter' },
  { value: 'forfait', label: 'Forfait' },
];

const VATS = [0, 6, 9, 21];

const parseNum = (v, fallback = 0) => {
  const n = parseFloat(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : fallback;
};

export default function ProductDetailScreen({ route, navigation }) {
  const { product, mode } = route.params || {};
  const isEdit = mode === 'edit';

  const [categories, setCategories] = useState([]);
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    sku: product?.sku || '',
    category_id: product?.category_id || null,
    price: product?.price != null ? String(product.price) : '',
    cost_price: product?.cost_price != null ? String(product.cost_price) : '',
    tax_rate: product?.tax_rate != null ? product.tax_rate : 21,
    unit: product?.unit || 'stuk',
    stock_quantity: product?.stock_quantity != null ? String(product.stock_quantity) : '0',
    track_stock: product?.track_stock === 1,
    active: product?.active !== 0,
  });

  const change = (patch) => setForm(prev => ({ ...prev, ...patch }));

  useEffect(() => {
    api.getProductCategories()
      .then(d => setCategories(d.categories || []))
      .catch(() => {});
  }, []);

  const selectedCat = categories.find(c => c.id === form.category_id);

  const priceNum = parseNum(form.price);
  const costNum = parseNum(form.cost_price);
  const margin = priceNum > 0 && costNum > 0 ? priceNum - costNum : null;
  const marginPct = margin != null && priceNum > 0 ? (margin / priceNum * 100).toFixed(1) : null;

  const handleSave = async () => {
    if (!form.name.trim()) return Alert.alert('Fout', 'Productnaam is verplicht');
    if (!form.price || parseNum(form.price) < 0) return Alert.alert('Fout', 'Vul een geldige prijs in');

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        sku: form.sku.trim() || null,
        category_id: form.category_id || null,
        price: parseNum(form.price),
        cost_price: parseNum(form.cost_price),
        tax_rate: form.tax_rate,
        unit: form.unit,
        stock_quantity: parseInt(form.stock_quantity) || 0,
        track_stock: form.track_stock,
        active: form.active,
      };

      if (isEdit) {
        await api.updateProduct(product.id, payload);
      } else {
        await api.createProduct(payload);
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Fout', e.message || 'Kon product niet opslaan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Basisgegevens */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Basisgegevens</Text>

          <View style={s.field}>
            <Text style={s.label}>Naam *</Text>
            <TextInput style={s.input} value={form.name} onChangeText={v => change({ name: v })}
              placeholder="Bijv. Uur consultancy" placeholderTextColor={DS.colors.textTertiary} />
          </View>

          <View style={s.field}>
            <Text style={s.label}>Beschrijving</Text>
            <TextInput style={[s.input, s.textarea]} value={form.description} onChangeText={v => change({ description: v })}
              placeholder="Korte omschrijving (optioneel)" placeholderTextColor={DS.colors.textTertiary}
              multiline textAlignVertical="top" numberOfLines={3} />
          </View>

          <View style={s.row}>
            <View style={s.half}>
              <Text style={s.label}>SKU / Artikelnr.</Text>
              <TextInput style={s.input} value={form.sku} onChangeText={v => change({ sku: v })}
                placeholder="Optioneel" placeholderTextColor={DS.colors.textTertiary} autoCapitalize="characters" />
            </View>
            <View style={s.half}>
              <Text style={s.label}>Categorie</Text>
              <TouchableOpacity style={s.selectBtn} onPress={() => setShowCatPicker(true)}>
                <Text style={[s.selectBtnText, !selectedCat && s.selectBtnPlaceholder]} numberOfLines={1}>
                  {selectedCat ? selectedCat.name : 'Kies categorie'}
                </Text>
                <Ionicons name="chevron-down" size={14} color={DS.colors.textTertiary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Prijzen */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Prijs</Text>

          <View style={s.row}>
            <View style={s.half}>
              <Text style={s.label}>Verkoopprijs (€) *</Text>
              <TextInput style={s.input} value={form.price} onChangeText={v => change({ price: v })}
                placeholder="0,00" placeholderTextColor={DS.colors.textTertiary} keyboardType="decimal-pad" />
            </View>
            <View style={s.half}>
              <Text style={s.label}>Kostprijs (€)</Text>
              <TextInput style={s.input} value={form.cost_price} onChangeText={v => change({ cost_price: v })}
                placeholder="0,00" placeholderTextColor={DS.colors.textTertiary} keyboardType="decimal-pad" />
            </View>
          </View>

          {margin != null && (
            <View style={s.marginCard}>
              <Ionicons name="trending-up-outline" size={16} color={DS.colors.success} />
              <Text style={s.marginText}>Winstmarge: <Text style={s.marginBold}>{currency(margin)} ({marginPct}%)</Text></Text>
            </View>
          )}

          <View style={[s.field, { marginBottom: 4 }]}>
            <Text style={s.label}>BTW</Text>
            <View style={s.chips}>
              {VATS.map(v => (
                <TouchableOpacity key={v} style={[s.chip, form.tax_rate === v && s.chipActive]} onPress={() => change({ tax_rate: v })}>
                  {form.tax_rate === v && <Ionicons name="checkmark" size={12} color="#fff" />}
                  <Text style={[s.chipText, form.tax_rate === v && s.chipTextActive]}>{v}%</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={s.field}>
            <Text style={s.label}>Eenheid</Text>
            <View style={s.chips}>
              {UNITS.map(u => (
                <TouchableOpacity key={u.value} style={[s.chip, form.unit === u.value && s.chipActive]} onPress={() => change({ unit: u.value })}>
                  <Text style={[s.chipText, form.unit === u.value && s.chipTextActive]}>{u.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Voorraad */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Voorraad & zichtbaarheid</Text>

          <View style={s.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.switchLabel}>Voorraad bijhouden</Text>
              <Text style={s.switchSub}>Tel mee af bij elke offerte</Text>
            </View>
            <Switch value={form.track_stock} onValueChange={v => change({ track_stock: v })}
              trackColor={{ false: DS.colors.border, true: DS.colors.accent }} thumbColor="#fff" />
          </View>

          {form.track_stock && (
            <View style={[s.field, { marginTop: 12 }]}>
              <Text style={s.label}>Huidig aantal op voorraad</Text>
              <TextInput style={s.input} value={form.stock_quantity} onChangeText={v => change({ stock_quantity: v })}
                placeholder="0" placeholderTextColor={DS.colors.textTertiary} keyboardType="number-pad" />
            </View>
          )}

          <View style={[s.switchRow, { marginTop: form.track_stock ? 0 : 12, borderTopWidth: form.track_stock ? 1 : 0, borderTopColor: DS.colors.borderLight, paddingTop: form.track_stock ? 12 : 0 }]}>
            <View style={{ flex: 1 }}>
              <Text style={s.switchLabel}>Actief</Text>
              <Text style={s.switchSub}>Inactieve producten worden niet getoond in de wizard</Text>
            </View>
            <Switch value={form.active} onValueChange={v => change({ active: v })}
              trackColor={{ false: DS.colors.border, true: DS.colors.accent }} thumbColor="#fff" />
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity style={[s.saveBtn, saving && s.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
          <Ionicons name="checkmark" size={18} color="#fff" />
          <Text style={s.saveBtnText}>{saving ? 'Opslaan...' : isEdit ? 'Wijzigingen opslaan' : 'Product toevoegen'}</Text>
        </TouchableOpacity>
      </View>

      {/* Category picker modal */}
      <Modal visible={showCatPicker} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={s.modalSafe} edges={['top', 'bottom']}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Categorie kiezen</Text>
            <TouchableOpacity onPress={() => setShowCatPicker(false)}>
              <Ionicons name="close" size={24} color={DS.colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={[{ id: null, name: 'Geen categorie' }, ...categories]}
            keyExtractor={item => String(item.id)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[s.modalRow, form.category_id === item.id && s.modalRowActive]}
                onPress={() => { change({ category_id: item.id }); setShowCatPicker(false); }}
              >
                <Text style={[s.modalRowText, form.category_id === item.id && s.modalRowTextActive]}>{item.name}</Text>
                {form.category_id === item.id && <Ionicons name="checkmark" size={18} color={DS.colors.accent} />}
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DS.colors.bg },
  section: {
    backgroundColor: DS.colors.surface,
    marginHorizontal: 16, marginTop: 16,
    borderRadius: DS.radius.md, borderWidth: 1, borderColor: DS.colors.border,
    padding: 16,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: DS.colors.textPrimary, marginBottom: 14 },
  field: { marginBottom: 14 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  half: { flex: 1 },
  label: { fontSize: 12, fontWeight: '600', color: DS.colors.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: DS.colors.bg, borderWidth: 1.5, borderColor: DS.colors.border,
    borderRadius: DS.radius.sm, paddingVertical: 11, paddingHorizontal: 14,
    fontSize: 15, color: DS.colors.textPrimary,
  },
  textarea: { minHeight: 80 },
  selectBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: DS.colors.bg, borderWidth: 1.5, borderColor: DS.colors.border,
    borderRadius: DS.radius.sm, paddingVertical: 11, paddingHorizontal: 14,
  },
  selectBtnText: { fontSize: 15, color: DS.colors.textPrimary, flex: 1 },
  selectBtnPlaceholder: { color: DS.colors.textTertiary },
  marginCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: DS.colors.successSoft, borderRadius: DS.radius.sm,
    padding: 12, marginBottom: 14,
  },
  marginText: { fontSize: 13, color: DS.colors.successText },
  marginBold: { fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: DS.radius.full, borderWidth: 1.5, borderColor: DS.colors.border,
    backgroundColor: DS.colors.bg,
  },
  chipActive: { backgroundColor: DS.colors.accent, borderColor: DS.colors.accent },
  chipText: { fontSize: 13, fontWeight: '600', color: DS.colors.textSecondary },
  chipTextActive: { color: '#fff' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  switchLabel: { fontSize: 15, fontWeight: '600', color: DS.colors.textPrimary },
  switchSub: { fontSize: 12, color: DS.colors.textSecondary, marginTop: 2 },
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
  modalSafe: { flex: 1, backgroundColor: '#fff' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: DS.colors.borderLight,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: DS.colors.textPrimary },
  modalRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: DS.colors.borderLight,
  },
  modalRowActive: { backgroundColor: DS.colors.accentSoft },
  modalRowText: { fontSize: 16, color: DS.colors.textPrimary },
  modalRowTextActive: { color: DS.colors.accent, fontWeight: '600' },
});
