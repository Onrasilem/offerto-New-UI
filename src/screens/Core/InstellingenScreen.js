import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useOfferto } from '../../context/OffertoContext';
import { DS } from '../../theme';
import { Avatar } from '../../components/DesignSystem';

const SECTIONS = [
  {
    key: 'FACTURATIE',
    rows: [
      { icon: 'card-outline',        label: 'IBAN & betaling',    nav: 'IBAN' },
      { icon: 'document-text-outline', label: 'Nummering',         nav: 'Nummering' },
      { icon: 'calendar-outline',    label: 'Betalingstermijn',   nav: 'Betalingstermijn' },
      { icon: 'calculator-outline',  label: 'BTW-tarieven',       nav: 'BTW' },
      { icon: 'cube-outline',        label: 'Producten & diensten', nav: 'Producten' },
    ],
  },
  {
    key: 'E-MAIL & MELDINGEN',
    rows: [
      { icon: 'mail-outline',        label: 'Offerte template',   nav: 'EmailTemplates', params: { type: 'offerte' } },
      { icon: 'mail-outline',        label: 'Factuur template',   nav: 'EmailTemplates', params: { type: 'factuur' } },
      { icon: 'alarm-outline',       label: 'Herinneringen',      nav: 'Herinneringen' },
    ],
  },
  {
    key: 'INTEGRATIES',
    rows: [
      { icon: 'wallet-outline',      label: 'Mollie betalingen',  nav: 'MollieInstelling', badge: 'Binnenkort' },
      { icon: 'send-outline',        label: 'Peppol / e-invoicing', nav: 'PeppolInstelling', badge: 'Binnenkort' },
    ],
  },
  {
    key: 'ACCOUNT',
    rows: [
      { icon: 'lock-closed-outline', label: 'Wachtwoord wijzigen', nav: 'Wachtwoord' },
      { icon: 'information-circle-outline', label: 'Over Offerto', nav: 'OverOfferto' },
    ],
  },
];

export default function InstellingenScreen({ navigation }) {
  const { user, company, saveCompany, signOutAll: signOut } = useOfferto();
  const [logoLoading, setLogoLoading] = useState(false);

  const companyName = company?.bedrijfsnaam || user?.name || 'Mijn bedrijf';
  const companyEmail = user?.email || '';
  const btwNr = company?.btwNummer || '';

  async function handleLogoUpload() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Geen toegang', 'Geef toegang tot je fotobibliotheek om een logo te kiezen.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [4, 1],
      quality: 0.4,
      base64: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    setLogoLoading(true);
    try {
      const asset = result.assets[0];
      const logoUrl = `data:image/jpeg;base64,${asset.base64}`;
      await saveCompany({ logoUrl });
    } finally {
      setLogoLoading(false);
    }
  }

  async function handleLogoRemove() {
    Alert.alert('Logo verwijderen', 'Wil je het logo verwijderen?', [
      { text: 'Annuleren', style: 'cancel' },
      { text: 'Verwijderen', style: 'destructive', onPress: () => saveCompany({ logoUrl: '' }) },
    ]);
  }

  function handleSignOut() {
    Alert.alert('Uitloggen', 'Ben je zeker dat je wilt uitloggen?', [
      { text: 'Annuleren', style: 'cancel' },
      { text: 'Uitloggen', style: 'destructive', onPress: signOut },
    ]);
  }

  function handleNav(nav, params) {
    if (!nav) return;
    if (nav === 'MollieInstelling' || nav === 'PeppolInstelling' || nav === 'OverOfferto') {
      Alert.alert('Binnenkort beschikbaar', 'Deze functie is nog in ontwikkeling.');
      return;
    }
    navigation.navigate(nav, params);
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title}>Instellingen</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <View style={s.profileSection}>
          <View style={s.profileCard}>
            <Avatar name={companyName} size={56} />
            <View style={{ flex: 1 }}>
              <Text style={s.profileName}>{companyName}</Text>
              {!!companyEmail && <Text style={s.profileEmail}>{companyEmail}</Text>}
              {!!btwNr && <Text style={s.profileBtw}>{btwNr}</Text>}
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('ProfielWizard')} style={s.editBtn}>
              <Ionicons name="pencil-outline" size={14} color={DS.colors.accent} />
              <Text style={s.editText}>Bewerk</Text>
            </TouchableOpacity>
          </View>

          {/* Logo section */}
          <View style={s.logoSection}>
            <Text style={s.logoLabel}>BEDRIJFSLOGO</Text>
            <View style={s.logoRow}>
              {company?.logoUrl ? (
                <View style={s.logoPreviewWrap}>
                  <Image source={{ uri: company.logoUrl }} style={s.logoPreview} resizeMode="contain" />
                </View>
              ) : (
                <View style={s.logoEmpty}>
                  <Ionicons name="image-outline" size={22} color={DS.colors.textTertiary} />
                  <Text style={s.logoEmptyText}>Geen logo</Text>
                </View>
              )}
              <View style={s.logoBtns}>
                <TouchableOpacity style={s.logoUploadBtn} onPress={handleLogoUpload} disabled={logoLoading}>
                  {logoLoading
                    ? <ActivityIndicator size="small" color={DS.colors.accent} />
                    : <>
                        <Ionicons name="cloud-upload-outline" size={15} color={DS.colors.accent} />
                        <Text style={s.logoUploadText}>{company?.logoUrl ? 'Wijzig' : 'Upload logo'}</Text>
                      </>
                  }
                </TouchableOpacity>
                {!!company?.logoUrl && (
                  <TouchableOpacity style={s.logoRemoveBtn} onPress={handleLogoRemove}>
                    <Ionicons name="trash-outline" size={15} color={DS.colors.danger} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Setting rows */}
        {SECTIONS.map(section => (
          <View key={section.key}>
            <View style={s.sectionLabel}>
              <Text style={s.sectionLabelText}>{section.key}</Text>
            </View>
            {section.rows.map(row => (
              <TouchableOpacity
                key={row.label}
                style={s.settingRow}
                onPress={() => handleNav(row.nav, row.params)}
                activeOpacity={0.7}
              >
                <View style={s.rowIconWrap}>
                  <Ionicons name={row.icon} size={19} color={DS.colors.accent} />
                </View>
                <Text style={s.rowLabel}>{row.label}</Text>
                {row.badge ? (
                  <View style={s.badge}>
                    <Text style={s.badgeText}>{row.badge}</Text>
                  </View>
                ) : null}
                <Ionicons name="chevron-forward" size={16} color={DS.colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Sign out */}
        <TouchableOpacity style={s.signOutRow} onPress={handleSignOut} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={18} color={DS.colors.danger} />
          <Text style={s.signOutText}>Uitloggen</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: DS.colors.textPrimary, letterSpacing: -0.5 },
  profileSection: {
    paddingHorizontal: 16, paddingBottom: 20,
    borderBottomWidth: 1, borderBottomColor: DS.colors.borderLight,
  },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.md, borderWidth: 1, borderColor: DS.colors.border,
    padding: 16,
  },
  profileName: { fontSize: 16, fontWeight: '800', color: DS.colors.textPrimary },
  profileEmail: { fontSize: 13, color: DS.colors.textSecondary, marginTop: 2 },
  profileBtw: { fontSize: 12, color: DS.colors.textTertiary, marginTop: 2 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editText: { fontSize: 13, color: DS.colors.accent, fontWeight: '600' },
  logoSection: {
    marginTop: 14, paddingTop: 14,
    borderTopWidth: 1, borderTopColor: DS.colors.borderLight,
  },
  logoLabel: { fontSize: 11, fontWeight: '700', color: DS.colors.textTertiary, letterSpacing: 0.8, marginBottom: 10 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  logoPreviewWrap: {
    width: 120, height: 40, borderRadius: DS.radius.xs,
    borderWidth: 1, borderColor: DS.colors.border,
    backgroundColor: DS.colors.bg,
    overflow: 'hidden',
  },
  logoPreview: { width: '100%', height: '100%' },
  logoEmpty: {
    width: 120, height: 40, borderRadius: DS.radius.xs,
    borderWidth: 1, borderStyle: 'dashed', borderColor: DS.colors.border,
    backgroundColor: DS.colors.bg,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6,
  },
  logoEmptyText: { fontSize: 12, color: DS.colors.textTertiary },
  logoBtns: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoUploadBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: DS.radius.sm, borderWidth: 1.5, borderColor: DS.colors.accent,
    minWidth: 110, justifyContent: 'center',
  },
  logoUploadText: { fontSize: 13, fontWeight: '600', color: DS.colors.accent },
  logoRemoveBtn: {
    width: 34, height: 34, borderRadius: DS.radius.sm,
    borderWidth: 1, borderColor: DS.colors.dangerSoft,
    backgroundColor: DS.colors.dangerSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionLabel: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 6 },
  sectionLabelText: {
    fontSize: 11, fontWeight: '700', color: DS.colors.textTertiary, letterSpacing: 0.8,
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: DS.colors.borderLight,
    backgroundColor: '#fff',
  },
  rowIconWrap: {
    width: 32, height: 32, borderRadius: DS.radius.xs,
    backgroundColor: DS.colors.accentSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  rowLabel: { flex: 1, fontSize: 15, color: DS.colors.textPrimary },
  badge: {
    paddingHorizontal: 8, paddingVertical: 3,
    backgroundColor: DS.colors.warningSoft,
    borderRadius: DS.radius.full,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: DS.colors.warningText },
  signOutRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 16, marginHorizontal: 20, marginTop: 20,
    borderRadius: DS.radius.md, borderWidth: 1, borderColor: DS.colors.dangerSoft,
    backgroundColor: DS.colors.dangerSoft,
  },
  signOutText: { fontSize: 15, color: DS.colors.danger, fontWeight: '600' },
});
