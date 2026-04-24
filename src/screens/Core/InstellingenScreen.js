import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOfferto } from '../../context/OffertoContext';
import { DS } from '../../theme';
import { Avatar } from '../../components/DesignSystem';

const SECTIONS = [
  {
    key: 'FACTURATIE',
    rows: [
      { icon: '💶', label: 'IBAN & betaling', nav: 'Instellingen' },
      { icon: '🔢', label: 'Nummering', nav: 'Instellingen' },
      { icon: '📅', label: 'Betalingstermijn', nav: 'Instellingen' },
      { icon: '🧮', label: 'BTW-tarieven', nav: 'Instellingen' },
    ],
  },
  {
    key: 'E-MAIL',
    rows: [
      { icon: '✉️', label: 'Offerte template', nav: 'EmailTemplates' },
      { icon: '✉️', label: 'Factuur template', nav: 'EmailTemplates' },
      { icon: '🔔', label: 'Herinneringen', right: 'Aan', green: true, nav: 'Instellingen' },
    ],
  },
  {
    key: 'INTEGRATIES',
    rows: [
      { icon: '💳', label: 'Mollie betalingen', right: 'Verbonden', green: true, nav: 'Instellingen' },
      { icon: '📧', label: 'E-mailadres koppelen', nav: 'Instellingen' },
    ],
  },
  {
    key: 'APP',
    rows: [
      { icon: '🔔', label: 'Notificaties', right: 'Aan', nav: 'Instellingen' },
      { icon: '🌐', label: 'Standaard taal', right: 'Nederlands', nav: 'Instellingen' },
      { icon: 'ℹ️', label: 'Over Offerto', right: 'v2.1.0', nav: 'Instellingen' },
    ],
  },
];

export default function InstellingenScreen({ navigation }) {
  const { user, company, signOutAll: signOut } = useOfferto();

  const companyName = company?.bedrijfsnaam || user?.name || 'Mijn bedrijf';
  const companyEmail = user?.email || '';
  const btwNr = company?.btwNummer || '';

  function handleSignOut() {
    Alert.alert('Uitloggen', 'Ben je zeker dat je wilt uitloggen?', [
      { text: 'Annuleren', style: 'cancel' },
      { text: 'Uitloggen', style: 'destructive', onPress: signOut },
    ]);
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
            <TouchableOpacity onPress={() => navigation.navigate('ProfielWizard')}>
              <Text style={s.editText}>Bewerk</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Setting rows */}
        {SECTIONS.map(section => (
          <View key={section.key}>
            <View style={s.sectionLabel}>
              <Text style={s.sectionLabelText}>{section.key}</Text>
            </View>
            {section.rows.map((row, i) => (
              <TouchableOpacity
                key={row.label}
                style={s.settingRow}
                onPress={() => row.nav && navigation.navigate(row.nav)}
              >
                <Text style={s.rowIcon}>{row.icon}</Text>
                <Text style={s.rowLabel}>{row.label}</Text>
                {row.right ? (
                  <Text style={[s.rowRight, row.green && s.rowRightGreen]}>{row.right}</Text>
                ) : null}
                <Text style={s.chevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Sign out */}
        <TouchableOpacity style={s.signOutRow} onPress={handleSignOut}>
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
  editText: { fontSize: 13, color: DS.colors.accent, fontWeight: '600' },
  sectionLabel: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 6 },
  sectionLabelText: {
    fontSize: 11, fontWeight: '700', color: DS.colors.textTertiary, letterSpacing: 0.8,
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: DS.colors.borderLight,
  },
  rowIcon: { fontSize: 20, width: 24, textAlign: 'center' },
  rowLabel: { flex: 1, fontSize: 15, color: DS.colors.textPrimary },
  rowRight: { fontSize: 14, color: DS.colors.textTertiary },
  rowRightGreen: { color: DS.colors.success, fontWeight: '600' },
  chevron: { fontSize: 20, color: DS.colors.textTertiary },
  signOutRow: {
    alignItems: 'center', paddingVertical: 20, marginHorizontal: 20, marginTop: 16,
    borderRadius: DS.radius.md, borderWidth: 1, borderColor: DS.colors.dangerSoft,
  },
  signOutText: { fontSize: 15, color: DS.colors.danger, fontWeight: '600' },
});
