import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useOfferto } from '../../context/OffertoContext';
import { DS } from '../../theme';
import { Avatar } from '../../components/DesignSystem';
import { currency } from '../../lib/utils';

const getTotal = (d) => {
  if (typeof d?.total === 'number') return d.total;
  return d?.totals?.incTotal || 0;
};

export default function KlantenScreen({ navigation }) {
  const { customers, archive = [] } = useOfferto();
  const [query, setQuery] = useState('');

  const docs = Array.isArray(archive) ? archive : [];

  // Merge backend customers + derive revenue/open from documents
  const enriched = useMemo(() => {
    const base = customers.length > 0
      ? customers.map(c => ({
          id: c.id,
          name: c.name || '',
          contact: c.contact_person || '',
          email: c.email || '',
          telefoon: c.phone || '',
          adres: c.address_json?.adres || '',
          btwNummer: c.vat || '',
          _raw: c,
        }))
      : (() => {
          // Fallback: derive from documents if no backend customers yet
          const map = new Map();
          docs.forEach(d => {
            const name = d.klant?.bedrijfsnaam || d.customer?.name;
            if (!name) return;
            if (!map.has(name)) {
              map.set(name, {
                id: name,
                name,
                contact: d.klant?.contactpersoon || d.customer?.contactPerson || '',
                email: d.klant?.email || d.customer?.email || '',
                telefoon: d.klant?.telefoon || '',
                adres: d.klant?.adres || '',
                btwNummer: d.klant?.btwNummer || '',
              });
            }
          });
          return Array.from(map.values());
        })();

    return base
      .map(c => {
        const clientDocs = docs.filter(d =>
          (d.klant?.bedrijfsnaam || d.customer?.name) === c.name ||
          (c.id && (d.customer_id === c.id || d.customer?.id === c.id))
        );
        const revenue = clientDocs.filter(d => d.type === 'FACTUUR').reduce((s, d) => s + getTotal(d), 0);
        const open = clientDocs.filter(d => d.type === 'FACTUUR' && d.status === 'Verzonden').reduce((s, d) => s + getTotal(d), 0);
        const lastDoc = [...clientDocs].sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0];
        return { ...c, revenue, open, lastDoc, docCount: clientDocs.length };
      })
      .filter(c => {
        if (!query) return true;
        const q = query.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.contact.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
      })
      .sort((a, b) => b.revenue - a.revenue);
  }, [customers, archive, query]);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Klanten</Text>
        <TouchableOpacity
          style={s.addBtn}
          onPress={() => navigation.navigate('KlantForm')}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <View style={s.searchBar}>
          <Ionicons name="search-outline" size={16} color={DS.colors.textTertiary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Zoek op naam, contactpersoon, e-mail..."
            placeholderTextColor={DS.colors.textTertiary}
            style={s.searchInput}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={16} color={DS.colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Count */}
      <View style={s.countRow}>
        <Text style={s.countText}>{enriched.length} klant{enriched.length !== 1 ? 'en' : ''}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {enriched.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="people-outline" size={40} color={DS.colors.textTertiary} />
            <Text style={s.emptyTitle}>{query ? 'Geen resultaten' : 'Nog geen klanten'}</Text>
            {!query && (
              <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('KlantForm')}>
                <Text style={s.emptyBtnText}>Eerste klant toevoegen</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : enriched.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={s.row}
            onPress={() => navigation.navigate('KlantDetail', { client: c })}
            activeOpacity={0.7}
          >
            <Avatar name={c.name} size={42} />
            <View style={s.rowBody}>
              <Text style={s.rowName} numberOfLines={1}>{c.name}</Text>
              <Text style={s.rowSub} numberOfLines={1}>
                {c.contact ? c.contact : c.email || 'Geen contactgegevens'}
              </Text>
            </View>
            <View style={s.rowRight}>
              {c.revenue > 0 && <Text style={s.revenueText}>{currency(c.revenue)}</Text>}
              {c.open > 0
                ? <Text style={s.openText}>{currency(c.open)} open</Text>
                : c.docCount > 0
                  ? <Text style={s.docCountText}>{c.docCount} doc{c.docCount !== 1 ? 's' : ''}</Text>
                  : null
              }
            </View>
            <Ionicons name="chevron-forward" size={16} color={DS.colors.textTertiary} />
          </TouchableOpacity>
        ))}
        <View style={{ height: 24 }} />
      </ScrollView>
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
  countRow: { paddingHorizontal: 16, paddingBottom: 8 },
  countText: { fontSize: 12, fontWeight: '700', color: DS.colors.textTertiary, letterSpacing: 0.8 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: DS.colors.borderLight,
  },
  rowBody: { flex: 1, minWidth: 0 },
  rowName: { fontSize: 15, fontWeight: '600', color: DS.colors.textPrimary },
  rowSub: { fontSize: 12, color: DS.colors.textSecondary, marginTop: 1 },
  rowRight: { alignItems: 'flex-end', flexShrink: 0, marginRight: 4 },
  revenueText: { fontSize: 14, fontWeight: '700', color: DS.colors.textPrimary },
  openText: { fontSize: 11, fontWeight: '600', color: DS.colors.warning, marginTop: 2 },
  docCountText: { fontSize: 11, color: DS.colors.textTertiary, marginTop: 2 },
  empty: { paddingTop: 64, alignItems: 'center', gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: DS.colors.textSecondary },
  emptyBtn: {
    marginTop: 8, paddingHorizontal: 20, paddingVertical: 11,
    backgroundColor: DS.colors.accent, borderRadius: DS.radius.sm,
  },
  emptyBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
