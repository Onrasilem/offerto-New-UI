import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOfferto } from '../../context/OffertoContext';
import { DS } from '../../theme';
import { Avatar } from '../../components/DesignSystem';
import { currency } from '../../lib/utils';

export default function KlantenScreen({ navigation }) {
  const { archive = [] } = useOfferto();
  const [query, setQuery] = useState('');

  const docs = Array.isArray(archive) ? archive : [];

  const klanten = useMemo(() => {
    const getTotal = (d) => {
      if (typeof d?.total === 'number') return d.total;
      return d?.totals?.incTotal || 0;
    };

    // Build client list from docs if no dedicated clients array
    const rawClients = (() => {
      const map = new Map();
      docs.forEach(d => {
        const name = d.customer?.name || d.klant?.bedrijfsnaam;
        if (!name) return;
        if (!map.has(name)) {
          map.set(name, {
            id: name,
            name,
            contact: d.customer?.contactPerson || d.klant?.contactpersoon || '',
            email: d.customer?.email || d.klant?.email || '',
            docs: [],
          });
        }
        map.get(name).docs.push(d);
      });
      return Array.from(map.values());
    })();

    return rawClients
      .map(c => {
        const clientDocs = docs.filter(d =>
          (d.customer?.name || d.klant?.bedrijfsnaam) === (c.name || c.bedrijfsnaam)
        );
        const revenue = clientDocs.filter(d => d.type === 'FACTUUR').reduce((s, d) => s + getTotal(d), 0);
        const open = clientDocs.filter(d => d.type === 'FACTUUR' && d.status === 'Verzonden').reduce((s, d) => s + getTotal(d), 0);
        const lastDoc = clientDocs.sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0];
        return {
          id: c.id || c.name || c.bedrijfsnaam,
          name: c.name || c.bedrijfsnaam || '',
          contact: c.contact || c.contactpersoon || '',
          email: c.email || '',
          revenue,
          open,
          lastDoc,
        };
      })
      .filter(c => {
        if (!query) return true;
        const q = query.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.contact.toLowerCase().includes(q);
      });
  }, [archive, query]);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Search bar */}
      <View style={s.searchRow}>
        <View style={s.searchBar}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Zoek klant..."
            placeholderTextColor={DS.colors.textTertiary}
            style={s.searchInput}
          />
        </View>
        <TouchableOpacity
          style={s.addBtn}
          onPress={() => navigation.navigate('Wizard')}
        >
          <Text style={s.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Count */}
      <View style={s.countRow}>
        <Text style={s.countText}>{klanten.length} klant{klanten.length !== 1 ? 'en' : ''}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {klanten.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyText}>
              {query ? 'Geen resultaten gevonden' : 'Nog geen klanten'}
            </Text>
          </View>
        ) : klanten.map((c, i) => (
          <TouchableOpacity
            key={c.id || i}
            style={s.row}
            onPress={() => navigation.navigate('KlantDetail', { client: c })}
          >
            <Avatar name={c.name} size={42} />
            <View style={s.rowBody}>
              <Text style={s.rowName} numberOfLines={1}>{c.name}</Text>
              <Text style={s.rowSub} numberOfLines={1}>{c.contact || c.email}</Text>
            </View>
            <View style={s.rowRight}>
              <Text style={s.revenueText}>{currency(c.revenue)}</Text>
              {c.open > 0 && (
                <Text style={s.openText}>{currency(c.open)} open</Text>
              )}
            </View>
            <Text style={s.chevron}>›</Text>
          </TouchableOpacity>
        ))}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: DS.colors.bg, borderRadius: DS.radius.sm,
    borderWidth: 1, borderColor: DS.colors.border,
    paddingHorizontal: 14, paddingVertical: 11, gap: 10,
  },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, fontSize: 15, color: DS.colors.textPrimary },
  addBtn: {
    width: 42, height: 42, borderRadius: DS.radius.sm,
    backgroundColor: DS.colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 22, lineHeight: 26, fontWeight: '300' },
  countRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 8,
  },
  countText: { fontSize: 12, fontWeight: '700', color: DS.colors.textTertiary, letterSpacing: 0.8 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: DS.colors.borderLight,
  },
  rowBody: { flex: 1, minWidth: 0 },
  rowName: { fontSize: 15, fontWeight: '600', color: DS.colors.textPrimary },
  rowSub: { fontSize: 12, color: DS.colors.textSecondary, marginTop: 1 },
  rowRight: { alignItems: 'flex-end', flexShrink: 0 },
  revenueText: { fontSize: 14, fontWeight: '700', color: DS.colors.textPrimary },
  openText: { fontSize: 11, fontWeight: '600', color: DS.colors.warning, marginTop: 2 },
  chevron: { fontSize: 20, color: DS.colors.textTertiary },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 14, color: DS.colors.textSecondary },
});
