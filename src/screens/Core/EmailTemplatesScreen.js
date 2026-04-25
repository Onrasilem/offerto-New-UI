import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { DS } from '../../theme';

const STORAGE_KEY = 'offerto.emailTemplates';

const DEFAULT_TEMPLATES = {
  offerte_verzonden: {
    label: 'Offerte verzonden',
    icon: 'document-outline',
    subject: 'Offerte {{documentNumber}} van {{companyName}}',
    body: `Beste {{customerName}},

Hierbij ontvangt u onze offerte {{documentNumber}}.

Totaalbedrag: € {{totalAmount}}
Geldig tot: {{dueDate}}

U vindt de offerte als bijlage bij dit bericht.

Heeft u vragen? Neem gerust contact met ons op.

Met vriendelijke groet,
{{companyName}}`,
  },
  factuur_verzonden: {
    label: 'Factuur verzonden',
    icon: 'receipt-outline',
    subject: 'Factuur {{documentNumber}} van {{companyName}}',
    body: `Beste {{customerName}},

Hierbij ontvangt u factuur {{documentNumber}}.

Totaalbedrag: € {{totalAmount}}
Vervaldatum: {{dueDate}}
Mededeling: {{structuredReference}}

U vindt de factuur als bijlage bij dit bericht.

Met vriendelijke groet,
{{companyName}}`,
  },
  betaling_herinnering: {
    label: 'Betalingsherinnering',
    icon: 'alarm-outline',
    subject: 'Herinnering: factuur {{documentNumber}} staat open',
    body: `Beste {{customerName}},

Dit is een vriendelijke herinnering voor factuur {{documentNumber}}.

Openstaand bedrag: € {{openAmount}}
Vervaldatum: {{dueDate}}
Mededeling: {{structuredReference}}

Heeft u dit bedrag al overgemaakt? Dan kunt u deze e-mail negeren.

Met vriendelijke groet,
{{companyName}}`,
  },
  betaling_ontvangen: {
    label: 'Betaling ontvangen',
    icon: 'checkmark-circle-outline',
    subject: 'Betaling ontvangen — factuur {{documentNumber}}',
    body: `Beste {{customerName}},

We hebben uw betaling van € {{amount}} voor factuur {{documentNumber}} in goede orde ontvangen.

Hartelijk dank!

Met vriendelijke groet,
{{companyName}}`,
  },
};

const VARIABLES = [
  '{{customerName}}', '{{companyName}}', '{{documentNumber}}',
  '{{totalAmount}}', '{{openAmount}}', '{{amount}}',
  '{{dueDate}}', '{{structuredReference}}',
];

export default function EmailTemplatesScreen({ navigation, route }) {
  const initialKey = route?.params?.type === 'factuur' ? 'factuur_verzonden' : 'offerte_verzonden';
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
  const [selected, setSelected] = useState(initialKey);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setTemplates(prev => ({ ...prev, ...JSON.parse(raw) }));
      } catch {}
    })();
  }, []);

  const current = templates[selected];

  const update = (field, value) => {
    setTemplates(prev => ({
      ...prev,
      [selected]: { ...prev[selected], [field]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
      setEditing(false);
      Alert.alert('Opgeslagen', 'Template is bijgewerkt.');
    } catch {
      Alert.alert('Fout', 'Kon niet opslaan.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reload from storage to discard changes
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      const saved = raw ? JSON.parse(raw) : {};
      setTemplates({ ...DEFAULT_TEMPLATES, ...saved });
      setEditing(false);
    });
  };

  const handleReset = () => {
    Alert.alert('Template herstellen?', 'Dit verwijdert je aanpassingen voor deze template.', [
      { text: 'Annuleren', style: 'cancel' },
      {
        text: 'Herstellen', style: 'destructive',
        onPress: async () => {
          const reset = { ...templates, [selected]: DEFAULT_TEMPLATES[selected] };
          setTemplates(reset);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(reset));
        },
      },
    ]);
  };

  const previewText = (text) =>
    text
      .replace(/{{customerName}}/g, 'Jan Janssen')
      .replace(/{{companyName}}/g, 'Jouw Bedrijf')
      .replace(/{{documentNumber}}/g, selected.startsWith('offerte') ? 'Q-2025-0001' : 'INV-2025-0001')
      .replace(/{{totalAmount}}/g, '1.250,00')
      .replace(/{{openAmount}}/g, '1.250,00')
      .replace(/{{amount}}/g, '1.250,00')
      .replace(/{{dueDate}}/g, '31-05-2025')
      .replace(/{{structuredReference}}/g, '+++123/4567/89012+++');

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>

      {/* Template tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabBar} contentContainerStyle={s.tabContent}>
        {Object.entries(DEFAULT_TEMPLATES).map(([key, tpl]) => (
          <TouchableOpacity
            key={key}
            style={[s.tab, selected === key && s.tabActive]}
            onPress={() => { setSelected(key); setEditing(false); }}
          >
            <Ionicons name={tpl.icon} size={16} color={selected === key ? DS.colors.accent : DS.colors.textTertiary} />
            <Text style={[s.tabText, selected === key && s.tabTextActive]}>{tpl.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Subject */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Onderwerp</Text>
          <TextInput
            style={[s.input, !editing && s.inputReadonly]}
            value={current.subject}
            onChangeText={v => update('subject', v)}
            editable={editing}
            placeholder="E-mail onderwerp..."
            placeholderTextColor={DS.colors.textTertiary}
          />
        </View>

        {/* Body */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Bericht</Text>
          <TextInput
            style={[s.textarea, !editing && s.inputReadonly]}
            value={current.body}
            onChangeText={v => update('body', v)}
            editable={editing}
            multiline
            textAlignVertical="top"
            placeholder="E-mail bericht..."
            placeholderTextColor={DS.colors.textTertiary}
          />
        </View>

        {/* Variables */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Beschikbare variabelen</Text>
          <Text style={s.hint}>Tik op een variabele om te kopiëren</Text>
          <View style={s.chips}>
            {VARIABLES.map(v => (
              <View key={v} style={s.chip}>
                <Text style={s.chipText}>{v}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Preview */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Voorbeeld</Text>
          <View style={s.preview}>
            <Text style={s.previewLabel}>ONDERWERP</Text>
            <Text style={s.previewSubject}>{previewText(current.subject)}</Text>
            <View style={s.divider} />
            <Text style={s.previewLabel}>BERICHT</Text>
            <Text style={s.previewBody}>{previewText(current.body)}</Text>
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Footer actions */}
      <View style={s.footer}>
        {editing ? (
          <View style={s.footerRow}>
            <TouchableOpacity style={s.cancelBtn} onPress={handleCancel}>
              <Text style={s.cancelBtnText}>Annuleren</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.saveBtn, saving && s.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
              <Ionicons name="checkmark" size={18} color="#fff" />
              <Text style={s.saveBtnText}>{saving ? 'Opslaan...' : 'Opslaan'}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.footerRow}>
            <TouchableOpacity style={s.resetBtn} onPress={handleReset}>
              <Ionicons name="refresh-outline" size={16} color={DS.colors.textSecondary} />
              <Text style={s.resetBtnText}>Herstellen</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.editBtn} onPress={() => setEditing(true)}>
              <Ionicons name="pencil-outline" size={16} color="#fff" />
              <Text style={s.editBtnText}>Bewerken</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DS.colors.bg },
  tabBar: {
    backgroundColor: DS.colors.surface,
    borderBottomWidth: 1, borderBottomColor: DS.colors.borderLight,
    maxHeight: 56,
  },
  tabContent: { paddingHorizontal: 12, alignItems: 'center', gap: 4 },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 16,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: DS.colors.accent },
  tabText: { fontSize: 13, fontWeight: '600', color: DS.colors.textTertiary },
  tabTextActive: { color: DS.colors.accent },
  section: {
    backgroundColor: DS.colors.surface,
    marginHorizontal: 16, marginTop: 16,
    borderRadius: DS.radius.md,
    borderWidth: 1, borderColor: DS.colors.border,
    padding: 16,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: DS.colors.textPrimary, marginBottom: 10 },
  hint: { fontSize: 12, color: DS.colors.textTertiary, marginBottom: 10, marginTop: -6 },
  input: {
    backgroundColor: DS.colors.bg,
    borderWidth: 1.5, borderColor: DS.colors.border,
    borderRadius: DS.radius.sm,
    paddingVertical: 11, paddingHorizontal: 14,
    fontSize: 14, color: DS.colors.textPrimary,
  },
  textarea: {
    backgroundColor: DS.colors.bg,
    borderWidth: 1.5, borderColor: DS.colors.border,
    borderRadius: DS.radius.sm,
    paddingVertical: 11, paddingHorizontal: 14,
    fontSize: 14, color: DS.colors.textPrimary,
    minHeight: 220,
  },
  inputReadonly: { backgroundColor: DS.colors.borderLight, color: DS.colors.textSecondary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: DS.colors.accentSoft,
    borderRadius: DS.radius.full,
    borderWidth: 1, borderColor: DS.colors.accent + '33',
  },
  chipText: { fontSize: 11, fontWeight: '600', color: DS.colors.accent },
  preview: {
    backgroundColor: DS.colors.bg,
    borderRadius: DS.radius.sm, padding: 14,
    borderWidth: 1, borderColor: DS.colors.borderLight,
  },
  previewLabel: {
    fontSize: 10, fontWeight: '700', color: DS.colors.textTertiary,
    letterSpacing: 0.6, marginBottom: 4,
  },
  previewSubject: { fontSize: 14, fontWeight: '700', color: DS.colors.textPrimary, marginBottom: 4 },
  divider: { height: 1, backgroundColor: DS.colors.borderLight, marginVertical: 12 },
  previewBody: { fontSize: 13, color: DS.colors.textSecondary, lineHeight: 20 },
  footer: {
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: DS.colors.borderLight,
    backgroundColor: DS.colors.surface,
  },
  footerRow: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 13, borderRadius: DS.radius.sm,
    borderWidth: 1.5, borderColor: DS.colors.border,
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: DS.colors.textSecondary },
  saveBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 13, borderRadius: DS.radius.sm,
    backgroundColor: DS.colors.accent,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  resetBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 13, borderRadius: DS.radius.sm,
    borderWidth: 1.5, borderColor: DS.colors.border,
  },
  resetBtnText: { fontSize: 15, fontWeight: '600', color: DS.colors.textSecondary },
  editBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 13, borderRadius: DS.radius.sm,
    backgroundColor: DS.colors.accent,
  },
  editBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
