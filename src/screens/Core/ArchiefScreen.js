import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOfferto } from '../../context/OffertoContext';
import { DS } from '../../theme';
import { Badge } from '../../components/DesignSystem';
import { currency } from '../../lib/utils';

const FILTERS = ['Alle', 'Offertes', 'Facturen', 'Open'];

export default function ArchiefScreen({ navigation }) {
  const { archive = [] } = useOfferto();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('Alle');

  const docs = Array.isArray(archive) ? archive : [];

  const filtered = useMemo(() => {
    let list = [...docs].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    if (filter === 'Offertes') list = list.filter(d => d.type === 'OFFERTE');
    else if (filter === 'Facturen') list = list.filter(d => d.type === 'FACTUUR');
    else if (filter === 'Open') list = list.filter(d => d.status === 'Verzonden');
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(d =>
        (d.customer?.name || d.klant?.bedrijfsnaam || '').toLowerCase().includes(q) ||
        (d.number || d.id || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [docs, filter, query]);

  const getTotal = (d) => {
    if (typeof d?.total === 'number') return d.total;
    return d?.totals?.incTotal || 0;
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Documenten</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate('Wizard')}>
          <Text style={s.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Zoek document of klant..."
          placeholderTextColor={DS.colors.textTertiary}
          style={s.searchInput}
        />
      </View>

      {/* Filter pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.pillsScroll} contentContainerStyle={s.pills}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[s.pill, filter === f && s.pillActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[s.pillText, filter === f && s.pillTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyText}>
              {query || filter !== 'Alle' ? 'Geen resultaten' : 'Nog geen documenten'}
            </Text>
            {!query && filter === 'Alle' && (
              <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('Wizard')}>
                <Text style={s.emptyBtnText}>Maak je eerste offerte</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : filtered.map((doc, i) => (
          <TouchableOpacity
            key={doc.id || i}
            style={s.docRow}
            onPress={() => navigation.navigate('DocumentDetail', { doc })}
          >
            <View style={[s.docIcon, { backgroundColor: doc.type === 'FACTUUR' ? DS.colors.infoSoft : DS.colors.accentSoft }]}>
              <Text style={{ fontSize: 16 }}>{doc.type === 'FACTUUR' ? '🧾' : '📄'}</Text>
            </View>
            <View style={s.docBody}>
              <Text style={s.docClient} numberOfLines={1}>
                {doc.customer?.name || doc.klant?.bedrijfsnaam || 'Onbekend'}
              </Text>
              <Text style={s.docMeta}>{doc.number || doc.id} · {doc.date?.slice(0, 10) || ''}</Text>
            </View>
            <View style={s.docRight}>
              <Text style={s.docAmount}>{currency(getTotal(doc))}</Text>
              <View style={{ marginTop: 4 }}>
                <Badge status={doc.status || 'concept'} />
              </View>
            </View>
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4,
  },
  title: { fontSize: 22, fontWeight: '800', color: DS.colors.textPrimary, letterSpacing: -0.5 },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: DS.colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 22, lineHeight: 26, fontWeight: '300' },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginVertical: 10,
    backgroundColor: DS.colors.bg, borderRadius: DS.radius.sm,
    borderWidth: 1, borderColor: DS.colors.border,
    paddingHorizontal: 14, paddingVertical: 11, gap: 10,
  },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, fontSize: 15, color: DS.colors.textPrimary },
  pillsScroll: { maxHeight: 48 },
  pills: { paddingHorizontal: 16, gap: 8, paddingBottom: 8 },
  pill: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: DS.radius.full,
    backgroundColor: DS.colors.surface, borderWidth: 1, borderColor: DS.colors.border,
  },
  pillActive: { backgroundColor: DS.colors.accent, borderColor: DS.colors.accent },
  pillText: { fontSize: 13, fontWeight: '600', color: DS.colors.textSecondary },
  pillTextActive: { color: '#fff' },
  docRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: DS.colors.borderLight,
  },
  docIcon: {
    width: 40, height: 40, borderRadius: DS.radius.sm,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  docBody: { flex: 1 },
  docClient: { fontSize: 14, fontWeight: '600', color: DS.colors.textPrimary },
  docMeta: { fontSize: 12, color: DS.colors.textSecondary, marginTop: 2 },
  docRight: { alignItems: 'flex-end' },
  docAmount: { fontSize: 14, fontWeight: '700', color: DS.colors.textPrimary },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 14, color: DS.colors.textSecondary, marginBottom: 16 },
  emptyBtn: {
    backgroundColor: DS.colors.accent, borderRadius: DS.radius.sm,
    paddingVertical: 12, paddingHorizontal: 20,
  },
  emptyBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
