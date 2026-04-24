import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { LoadingButton } from '../../components/LoadingButton';
import { useOfferto } from '../../context/OffertoContext';
import { showErrorToast } from '../../lib/toast';
import { isValidEmail } from '../../lib/validators';
import { DS } from '../../theme';

export default function SignUpScreen({ navigation }) {
  const { signUp, company, isLoading } = useOfferto();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localLoading, setLocalLoading] = useState(false);

  const submit = async () => {
    if (!name.trim()) return showErrorToast('Vul uw naam in.');
    if (!email.trim()) return showErrorToast('Vul uw e-mail in.');
    if (!isValidEmail(email)) return showErrorToast('Ongeldig e-mailadres.');
    if (!password.trim()) return showErrorToast('Vul uw wachtwoord in.');
    if (password.length < 6) return showErrorToast('Wachtwoord moet minstens 6 karakters zijn.');
    setLocalLoading(true);
    try {
      await signUp(email, password, name);
      if (!company?.bedrijfsnaam) {
        navigation.replace('ProfielWizard');
      } else {
        navigation.replace('Main');
      }
    } catch (error) {
      showErrorToast(error.message || 'Account aanmaken mislukt');
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <View style={s.root}>
      <View style={s.circle1} />
      <View style={s.circle2} />

      <View style={s.logoArea}>
        <View style={s.logoBox}>
          <Text style={s.logoIcon}>📄</Text>
        </View>
        <Text style={s.appName}>Offerto</Text>
        <Text style={s.tagline}>Van offerte tot betaling — alles in één app</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'position' : 'height'}>
        <View style={s.sheet}>
          <Text style={s.sheetTitle}>Account aanmaken</Text>
          <Text style={s.sheetSubtitle}>Gratis starten</Text>

          {[
            { label: 'Naam', value: name, onChange: setName, placeholder: 'Thomas De Smet', secure: false, keyboard: 'default' },
            { label: 'E-mailadres', value: email, onChange: setEmail, placeholder: 'thomas@studio.be', secure: false, keyboard: 'email-address' },
            { label: 'Wachtwoord', value: password, onChange: setPassword, placeholder: '••••••••••', secure: true, keyboard: 'default' },
          ].map(f => (
            <View key={f.label} style={s.field}>
              <Text style={s.label}>{f.label}</Text>
              <TextInput
                style={s.input}
                value={f.value}
                onChangeText={f.onChange}
                placeholder={f.placeholder}
                placeholderTextColor={DS.colors.textTertiary}
                secureTextEntry={f.secure}
                keyboardType={f.keyboard}
                autoCapitalize="none"
              />
            </View>
          ))}

          <LoadingButton
            loading={localLoading || isLoading}
            onPress={submit}
            title="Account aanmaken"
            style={s.loginBtn}
          />

          <View style={s.signupRow}>
            <Text style={s.signupText}>Al een account? </Text>
            <TouchableOpacity onPress={() => navigation.replace('Login')}>
              <Text style={s.signupLink}>Inloggen</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: DS.colors.accent, justifyContent: 'flex-end' },
  circle1: {
    position: 'absolute', top: -60, right: -60,
    width: 300, height: 300, borderRadius: 150,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  circle2: {
    position: 'absolute', top: 80, left: -80,
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  logoArea: {
    position: 'absolute', top: 0, left: 0, right: 0,
    alignItems: 'center', paddingTop: 80,
  },
  logoBox: {
    width: 64, height: 64, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  logoIcon: { fontSize: 28 },
  appName: { fontSize: 30, fontWeight: '800', color: '#fff', letterSpacing: -1, marginBottom: 6 },
  tagline: {
    fontSize: 15, color: 'rgba(255,255,255,0.7)',
    textAlign: 'center', maxWidth: 240, lineHeight: 22,
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 44,
  },
  sheetTitle: { fontSize: 22, fontWeight: '800', color: DS.colors.textPrimary, marginBottom: 4 },
  sheetSubtitle: { fontSize: 14, color: DS.colors.textSecondary, marginBottom: 20 },
  field: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: DS.colors.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: DS.colors.bg, borderWidth: 1.5, borderColor: DS.colors.border,
    borderRadius: DS.radius.sm, paddingVertical: 13, paddingHorizontal: 16,
    fontSize: 15, color: DS.colors.textPrimary,
  },
  loginBtn: {
    backgroundColor: DS.colors.accent, borderRadius: DS.radius.sm,
    paddingVertical: 15, alignItems: 'center', marginTop: 8, marginBottom: 18,
  },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  signupRow: { flexDirection: 'row', justifyContent: 'center' },
  signupText: { fontSize: 14, color: DS.colors.textSecondary },
  signupLink: { fontSize: 14, color: DS.colors.accent, fontWeight: '600' },
});
