import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoadingButton } from '../../components/LoadingButton';
import { useOfferto } from '../../context/OffertoContext';
import { showErrorToast } from '../../lib/toast';
import { isValidEmail } from '../../lib/validators';
import { DS } from '../../theme';

export default function LoginScreen({ navigation }) {
  const { signIn } = useOfferto();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!isValidEmail(email)) return showErrorToast('Ongeldig e-mailadres');
    if (!password) return showErrorToast('Vul je wachtwoord in');
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (e) {
      showErrorToast(e?.message || 'Inloggen mislukt');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.root}>
      {/* Decorative circles */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      {/* Logo area */}
      <View style={styles.logoArea}>
        <View style={styles.logoBox}>
          <Text style={styles.logoIcon}>📄</Text>
        </View>
        <Text style={styles.appName}>Offerto</Text>
        <Text style={styles.tagline}>Van offerte tot betaling — alles in één app</Text>
      </View>

      {/* Bottom sheet */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'position' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Welkom terug</Text>
          <Text style={styles.sheetSubtitle}>Log in op je account</Text>

          <View style={styles.field}>
            <Text style={styles.label}>E-mailadres</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="thomas@studio.be"
              placeholderTextColor={DS.colors.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Wachtwoord</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••••"
              placeholderTextColor={DS.colors.textTertiary}
              autoComplete="password"
            />
          </View>

          <TouchableOpacity style={styles.forgotRow}>
            <Text style={styles.forgotText}>Wachtwoord vergeten?</Text>
          </TouchableOpacity>

          <LoadingButton
            loading={loading}
            onPress={handleLogin}
            title="Inloggen"
            style={styles.loginBtn}
          />

          <View style={styles.signupRow}>
            <Text style={styles.signupText}>Nog geen account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.signupLink}>Registreer gratis</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: DS.colors.accent,
    justifyContent: 'flex-end',
  },
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
    alignItems: 'center', paddingTop: 110,
  },
  logoBox: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  logoIcon: { fontSize: 32 },
  appName: {
    fontSize: 34, fontWeight: '800', color: '#fff',
    letterSpacing: -1, marginBottom: 8,
  },
  tagline: {
    fontSize: 16, color: 'rgba(255,255,255,0.7)',
    textAlign: 'center', maxWidth: 240, lineHeight: 24,
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 44,
  },
  sheetTitle: {
    fontSize: 22, fontWeight: '800', color: DS.colors.textPrimary, marginBottom: 6,
  },
  sheetSubtitle: {
    fontSize: 14, color: DS.colors.textSecondary, marginBottom: 24,
  },
  field: { marginBottom: 14 },
  label: {
    fontSize: 13, fontWeight: '600', color: DS.colors.textSecondary, marginBottom: 6,
  },
  input: {
    backgroundColor: DS.colors.bg,
    borderWidth: 1.5, borderColor: DS.colors.border,
    borderRadius: DS.radius.sm,
    paddingVertical: 14, paddingHorizontal: 16,
    fontSize: 15, color: DS.colors.textPrimary,
  },
  forgotRow: { alignItems: 'flex-end', marginBottom: 20 },
  forgotText: { fontSize: 13, color: DS.colors.accent, fontWeight: '600' },
  loginBtn: {
    backgroundColor: DS.colors.accent,
    borderRadius: DS.radius.sm,
    paddingVertical: 15,
    alignItems: 'center', marginBottom: 20,
  },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  signupRow: { flexDirection: 'row', justifyContent: 'center' },
  signupText: { fontSize: 14, color: DS.colors.textSecondary },
  signupLink: { fontSize: 14, color: DS.colors.accent, fontWeight: '600' },
});
