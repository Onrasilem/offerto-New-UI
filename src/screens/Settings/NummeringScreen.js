import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useOfferto } from '../../context/OffertoContext';
import { STORAGE } from '../../context/OffertoContext';
import { DS } from '../../theme';

const yearNow = () => String(new Date().getFullYear());

export default function NummeringScreen({ navigation }) {
  const { company, saveCompany } = useOfferto();

  const [offertePrefix, setOffertePrefix] = useState(company.offertePrefix || 'Q');
  const [factuurPrefix, setFactuurPrefix] = useState(company.factuurPrefix || 'INV');
  const [currentCounts, setCurrentCounts] = useState({ Q: 0, INV: 0 });

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE.counters);
        const counters = raw ? JSON.parse(raw) : {};
        const y = yearNow();
        setCurrentCounts({
          Q: counters[y]?.Q || 0,
          INV: counters[y]?.INV || 0,
        });
      } catch {}
    })();
  }, []);

  const handleReset = (type) => {
    Alert.alert(
      'Teller resetten',
      `Weet je zeker dat je de ${type === 'Q' ? 'offerte' : 'factuur'}teller wilt resetten naar 0?`,
      [
        { text: 'Annuleren', style: 'cancel' },
        {
          text: 'Resetten', style: 'destructive',
          onPress: async () => {
            try {
              const raw = await AsyncStorage.getItem(STORAGE.counters);
              const counters = raw ? JSON.parse(raw) : {};
              const y = yearNow();
              if (!counters[y]) counters[y] = {};
              counters[y][type] = 0;
              await AsyncStorage.setItem(STORAGE.counters, JSON.stringify(counters));
              setCurrentCounts(prev => ({ ...prev, [type]: 0 }));
            } catch {}
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    const trimQ = offertePrefix.trim().toUpperCase() || 'Q';
    const trimINV = factuurPrefix.trim().toUpperCase() || 'INV';
    try {
      await saveCompany({ offertePrefix: trimQ, factuurPrefix: trimINV });
      Alert.alert('Opgeslagen', 'Nummeringsreeksen bijgewerkt.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch {
      Alert.alert('Fout', 'Kon niet opslaan.');
    }
  };

  const y = yearNow();
  const previewQ = `${offertePrefix || 'Q'}-${y}-${String(currentCounts.Q + 1).padStart(4, '0')}`;
  const previewINV = `${factuurPrefix || 'INV'}-${y}-${String(currentCounts.INV + 1).padStart(4, '0')}`;

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Offertes */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Offertes</Text>

          <View style={s.field}>
            <Text style={s.label}>Prefix</Text>
            <TextInput
              style={s.input}
              value={offertePrefix}
              onChangeText={setOffertePrefix}
              placeholder="Q"
              placeholderTextColor={DS.colors.textTertiary}
              autoCapitalize="characters"
              maxLength={6}
            />
          </View>

          <View style={s.previewRow}>
            <Text style={s.previewLabel}>Voorbeeld volgend nummer</Text>
            <Text style={s.previewValue}>{previewQ}</Text>
          </View>

          <View style={s.counterRow}>
            <View>
              <Text style={s.label}>Teller {y}</Text>
              <Text style={s.counterValue}>{currentCounts.Q} aangemaakt</Text>
            </View>
            <TouchableOpacity style={s.resetBtn} onPress={() => handleReset('Q')}>
              <Ionicons name="refresh-outline" size={14} color={DS.colors.danger} />
              <Text style={s.resetBtnText}>Resetten</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Facturen */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Facturen</Text>

          <View style={s.field}>
            <Text style={s.label}>Prefix</Text>
            <TextInput
              style={s.input}
              value={factuurPrefix}
              onChangeText={setFactuurPrefix}
              placeholder="INV"
              placeholderTextColor={DS.colors.textTertiary}
              autoCapitalize="characters"
              maxLength={6}
            />
          </View>

          <View style={s.previewRow}>
            <Text style={s.previewLabel}>Voorbeeld volgend nummer</Text>
            <Text style={s.previewValue}>{previewINV}</Text>
          </View>

          <View style={s.counterRow}>
            <View>
              <Text style={s.label}>Teller {y}</Text>
              <Text style={s.counterValue}>{currentCounts.INV} aangemaakt</Text>
            </View>
            <TouchableOpacity style={s.resetBtn} onPress={() => handleReset('INV')}>
              <Ionicons name="refresh-outline" size={14} color={DS.colors.danger} />
              <Text style={s.resetBtnText}>Resetten</Text>
            </TouchableOpacity>
          </View>
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
  sectionTitle: { fontSize: 15, fontWeight: '700', color: DS.colors.textPrimary, marginBottom: 14 },
  field: { marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '600', color: DS.colors.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: DS.colors.bg,
    borderWidth: 1.5, borderColor: DS.colors.border,
    borderRadius: DS.radius.sm,
    paddingVertical: 11, paddingHorizontal: 14,
    fontSize: 15, color: DS.colors.textPrimary,
  },
  previewRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderTopWidth: 1, borderTopColor: DS.colors.borderLight,
  },
  previewLabel: { fontSize: 13, color: DS.colors.textSecondary },
  previewValue: { fontSize: 14, fontWeight: '700', color: DS.colors.accent },
  counterRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 10, borderTopWidth: 1, borderTopColor: DS.colors.borderLight,
  },
  counterValue: { fontSize: 14, fontWeight: '600', color: DS.colors.textPrimary, marginTop: 2 },
  resetBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: DS.radius.sm, borderWidth: 1, borderColor: DS.colors.dangerSoft,
  },
  resetBtnText: { fontSize: 13, color: DS.colors.danger, fontWeight: '600' },
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
