import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../lib/api';
import { DS } from '../../theme';
import { currency } from '../../lib/utils';

const UNIT_LABELS = { stuk: 'stuk', uur: 'uur', m2: 'm²', m3: 'm³', m: 'meter', dag: 'dag', forfait: 'forfait' };

export default function ProductenScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [pd, cd] = await Promise.all([
        api.getProducts({ active: true }),
        api.getProductCategories(),
      ]);
      setProducts(pd.products || []);
      setCategories(cd.categories || []);
    } catch (e) {
      Alert.alert('Fout', 'Kon producten niet laden.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Re-load when coming back from ProductDetail
  useEffect(() => {
    const unsub = navigation.addListener?.('focus', load);
    return unsub?.remove ?? unsub;
  }, [navigation, load]);

  const handleDelete = (product) => {
    Alert.alert(
      'Product verwijderen',
      `"${product.name}" verwijderen?`,
      [
        { text: 'Annuleren', style: 'cancel' },
        {
          text: 'Verwijderen', style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteProduct(product.id);
              setProducts(prev => prev.filter(p => p.id !== product.id));
            } catch {
              Alert.alert('Fout', 'Kon product niet verwijderen.');
            }
          },
        },
      ]
    );
  };

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !search || p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q);
    const matchCat = !selectedCategory || p.category_id === selectedCategory;
    return matchSearch && matchCat;
  });

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Producten & diensten</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate('ProductDetail', { mode: 'create' })}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <View style={s.searchBar}>
          <Ionicons name="search-outline" size={16} color={DS.colors.textTertiary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Zoek product of dienst..."
            placeholderTextColor={DS.colors.textTertiary}
            style={s.searchInput}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={DS.colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category filter */}
      {categories.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.catBar} contentContainerStyle={s.catContent}>
          <TouchableOpacity
            style={[s.catChip, !selectedCategory && s.catChipActive]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[s.catChipText, !selectedCategory && s.catChipTextActive]}>Alle</Text>
          </TouchableOpacity>
          {categories.map(c => (
            <TouchableOpacity
              key={c.id}
              style={[s.catChip, selectedCategory === c.id && s.catChipActive]}
              onPress={() => setSelectedCategory(selectedCategory === c.id ? null : c.id)}
            >
              <Text style={[s.catChipText, selectedCategory === c.id && s.catChipTextActive]}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Count */}
      <View style={s.countRow}>
        <Text style={s.countText}>{filtered.length} product{filtered.length !== 1 ? 'en' : ''}</Text>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={DS.colors.accent} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {filtered.length === 0 ? (
            <View style={s.empty}>
              <Ionicons name="cube-outline" size={40} color={DS.colors.textTertiary} />
              <Text style={s.emptyTitle}>{search ? 'Geen resultaten' : 'Nog geen producten'}</Text>
              {!search && (
                <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('ProductDetail', { mode: 'create' })}>
                  <Text style={s.emptyBtnText}>Eerste product toevoegen</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : filtered.map(p => (
            <TouchableOpacity
              key={p.id}
              style={s.row}
              onPress={() => navigation.navigate('ProductDetail', { product: p, mode: 'edit' })}
              activeOpacity={0.7}
            >
              <View style={s.rowIcon}>
                <Ionicons name="cube-outline" size={20} color={DS.colors.accent} />
              </View>
              <View style={s.rowBody}>
                <Text style={s.rowName} numberOfLines={1}>{p.name}</Text>
                <View style={s.rowMeta}>
                  {p.category_name && (
                    <View style={[s.catBadge, { backgroundColor: (p.category_color || DS.colors.accent) + '22' }]}>
                      <Text style={[s.catBadgeText, { color: p.category_color || DS.colors.accent }]}>{p.category_name}</Text>
                    </View>
                  )}
                  <Text style={s.rowUnit}>{UNIT_LABELS[p.unit] || p.unit || 'stuk'}</Text>
                  {p.track_stock === 1 && (
                    <Text style={[s.stockBadge, p.stock_quantity <= 0 && s.stockLow]}>
                      {p.stock_quantity} op voorraad
                    </Text>
                  )}
                </View>
              </View>
              <View style={s.rowRight}>
                <Text style={s.rowPrice}>{currency(p.price)}</Text>
                <Text style={s.rowVat}>BTW {p.tax_rate || 21}%</Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="trash-outline" size={18} color={DS.colors.danger} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12,
  },
  title: { fontSize: 22, fontWeight: '800', color: DS.colors.textPrimary, letterSpacing: -0.5 },
  addBtn: {
    width: 36, height: 36, borderRadius: DS.radius.sm,
    backgroundColor: DS.colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  searchWrap: { paddingHorizontal: 16, paddingBottom: 10 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: DS.colors.bg, borderRadius: DS.radius.sm,
    borderWidth: 1, borderColor: DS.colors.border,
    paddingHorizontal: 14, paddingVertical: 11,
  },
  searchInput: { flex: 1, fontSize: 15, color: DS.colors.textPrimary },
  catBar: { maxHeight: 46, borderBottomWidth: 1, borderBottomColor: DS.colors.borderLight },
  catContent: { paddingHorizontal: 16, paddingVertical: 8, gap: 8, alignItems: 'center' },
  catChip: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: DS.radius.full, borderWidth: 1.5, borderColor: DS.colors.border,
    backgroundColor: DS.colors.bg,
  },
  catChipActive: { backgroundColor: DS.colors.accent, borderColor: DS.colors.accent },
  catChipText: { fontSize: 13, fontWeight: '600', color: DS.colors.textSecondary },
  catChipTextActive: { color: '#fff' },
  countRow: { paddingHorizontal: 16, paddingVertical: 8 },
  countText: { fontSize: 12, fontWeight: '700', color: DS.colors.textTertiary, letterSpacing: 0.8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  empty: { paddingTop: 64, alignItems: 'center', gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: DS.colors.textSecondary },
  emptyBtn: {
    marginTop: 8, paddingHorizontal: 20, paddingVertical: 11,
    backgroundColor: DS.colors.accent, borderRadius: DS.radius.sm,
  },
  emptyBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: DS.colors.borderLight,
  },
  rowIcon: {
    width: 36, height: 36, borderRadius: DS.radius.xs,
    backgroundColor: DS.colors.accentSoft,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  rowBody: { flex: 1, minWidth: 0 },
  rowName: { fontSize: 15, fontWeight: '600', color: DS.colors.textPrimary },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' },
  catBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  catBadgeText: { fontSize: 11, fontWeight: '600' },
  rowUnit: { fontSize: 12, color: DS.colors.textTertiary },
  stockBadge: { fontSize: 11, fontWeight: '600', color: DS.colors.success },
  stockLow: { color: DS.colors.danger },
  rowRight: { alignItems: 'flex-end', flexShrink: 0, marginRight: 8 },
  rowPrice: { fontSize: 15, fontWeight: '700', color: DS.colors.accent },
  rowVat: { fontSize: 11, color: DS.colors.textTertiary, marginTop: 1 },
});
