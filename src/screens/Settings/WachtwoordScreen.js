import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../lib/api';
import { DS } from '../../theme';

export default function WachtwoordScreen({ navigation }) {
  const [current, setCurrent] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!current) return Alert.alert('Fout', 'Vul je huidig wachtwoord in.');
    if (newPw.length < 8) return Alert.alert('Fout', 'Nieuw wachtwoord moet minimaal 8 tekens zijn.');
    if (newPw !== confirm) return Alert.alert('Fout', 'Wachtwoorden komen niet overeen.');

    setSaving(true);
    try {
      await api.changePassword(current, newPw);
      Alert.alert('Gewijzigd', 'Je wachtwoord is succesvol gewijzigd.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Fout', e.message || 'Kon wachtwoord niet wijzigen.');
    } finally {
      setSaving(false);
    }
  };

  const strength = newPw.length === 0 ? null : newPw.length < 8 ? 'weak' : newPw.length < 12 ? 'medium' : 'strong';
  const strengthColor = { weak: DS.colors.danger, medium: DS.colors.warning, strong: DS.colors.success }[strength];
  const strengthLabel = { weak: 'Te kort', medium: 'Redelijk', strong: 'Sterk' }[strength];

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <View style={s.section}>
          <View style={s.field}>
            <Text style={s.label}>Huidig wachtwoord</Text>
            <View style={s.inputRow}>
              <TextInput
                style={s.inputFlex}
                value={current}
                onChangeText={setCurrent}
                secureTextEntry={!showCurrent}
                placeholder="••••••••"
                placeholderTextColor={DS.colors.textTertiary}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowCurrent(v => !v)} style={s.eyeBtn}>
                <Ionicons name={showCurrent ? 'eye-off-outline' : 'eye-outline'} size={20} color={DS.colors.textTertiary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={s.field}>
            <Text style={s.label}>Nieuw wachtwoord</Text>
            <View style={s.inputRow}>
              <TextInput
                style={s.inputFlex}
                value={newPw}
                onChangeText={setNewPw}
                secureTextEntry={!showNew}
                placeholder="Minimaal 8 tekens"
                placeholderTextColor={DS.colors.textTertiary}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowNew(v => !v)} style={s.eyeBtn}>
                <Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={20} color={DS.colors.textTertiary} />
              </TouchableOpacity>
            </View>
            {strength && (
              <View style={s.strengthRow}>
                <View style={[s.strengthBar, { backgroundColor: strengthColor, width: strength === 'weak' ? '30%' : strength === 'medium' ? '60%' : '100%' }]} />
                <Text style={[s.strengthLabel, { color: strengthColor }]}>{strengthLabel}</Text>
              </View>
            )}
          </View>

          <View style={[s.field, { marginBottom: 0 }]}>
            <Text style={s.label}>Bevestig nieuw wachtwoord</Text>
            <View style={s.inputRow}>
              <TextInput
                style={[s.inputFlex, confirm && newPw && confirm !== newPw && s.inputError]}
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry={!showNew}
                placeholder="••••••••"
                placeholderTextColor={DS.colors.textTertiary}
                autoCapitalize="none"
              />
              {confirm.length > 0 && (
                <View style={s.eyeBtn}>
                  <Ionicons
                    name={confirm === newPw ? 'checkmark-circle' : 'close-circle'}
                    size={20}
                    color={confirm === newPw ? DS.colors.success : DS.colors.danger}
                  />
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity style={[s.saveBtn, saving && s.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
          <Ionicons name="lock-closed-outline" size={18} color="#fff" />
          <Text style={s.saveBtnText}>{saving ? 'Opslaan...' : 'Wachtwoord wijzigen'}</Text>
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
  field: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', color: DS.colors.textSecondary, marginBottom: 6 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: DS.colors.bg,
    borderWidth: 1.5, borderColor: DS.colors.border,
    borderRadius: DS.radius.sm,
  },
  inputFlex: {
    flex: 1, paddingVertical: 11, paddingHorizontal: 14,
    fontSize: 15, color: DS.colors.textPrimary,
  },
  inputError: { borderColor: DS.colors.danger },
  eyeBtn: { paddingHorizontal: 12 },
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  strengthBar: { height: 4, borderRadius: 2, flex: 0 },
  strengthLabel: { fontSize: 12, fontWeight: '600' },
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
