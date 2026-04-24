import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { theme } from '../../components/UI';

const DEFAULT_TEMPLATES = {
  document_sent: {
    subject: '📄 Document verzonden: {{documentType}} {{documentNumber}}',
    body: `Beste {{customerName}},

Hierbij sturen we je {{documentType}} {{documentNumber}}.

{{#if dueDate}}
Vervaldatum: {{dueDate}}
{{/if}}

{{#if structuredReference}}
Gestructureerde mededeling: {{structuredReference}}
{{/if}}

Totaalbedrag: € {{totalAmount}}

Het document is toegevoegd als bijlage.

Met vriendelijke groet,
{{companyName}}`,
  },
  follow_up: {
    subject: '🔔 Herinnering: {{documentType}} {{documentNumber}}',
    body: `Beste {{customerName}},

Dit is een vriendelijke herinnering voor {{documentType}} {{documentNumber}}.

{{#if dueDate}}
Vervaldatum: {{dueDate}}
{{/if}}

Totaalbedrag: € {{totalAmount}}

Als je dit document al hebt behandeld, kun je deze email negeren.

Mochten er vragen zijn, neem dan gerust contact met ons op.

Met vriendelijke groet,
{{companyName}}`,
  },
  payment_reminder: {
    subject: '⚠️ Betalingsherinnering: Factuur {{documentNumber}}',
    body: `Beste {{customerName}},

We hebben nog geen betaling ontvangen voor factuur {{documentNumber}}.

{{#if dueDate}}
Vervaldatum was: {{dueDate}}
{{/if}}

{{#if structuredReference}}
Gestructureerde mededeling: {{structuredReference}}
{{/if}}

Openstaand bedrag: € {{openAmount}}

Gelieve dit bedrag zo spoedig mogelijk over te maken.

Bij vragen over deze factuur kun je contact met ons opnemen.

Met vriendelijke groet,
{{companyName}}`,
  },
  payment_received: {
    subject: '✅ Betaling ontvangen voor Factuur {{documentNumber}}',
    body: `Beste {{customerName}},

We hebben je betaling in goede orde ontvangen!

Factuur: {{documentNumber}}
Bedrag: € {{amount}}
Datum: {{paymentDate}}

Hartelijk dank voor je betaling.

Met vriendelijke groet,
{{companyName}}`,
  },
};

export default function EmailTemplatesScreen({ navigation }) {
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
  const [selectedTemplate, setSelectedTemplate] = useState('document_sent');
  const [editing, setEditing] = useState(false);

  const currentTemplate = templates[selectedTemplate];

  const handleSave = () => {
    // In real app: save to backend/context
    Alert.alert('Succes', 'Template opgeslagen');
    setEditing(false);
  };

  const handleReset = () => {
    Alert.alert(
      'Template herstellen?',
      'Weet je zeker dat je deze template wilt herstellen naar de standaard?',
      [
        { text: 'Annuleer', style: 'cancel' },
        {
          text: 'Herstel',
          style: 'destructive',
          onPress: () => {
            setTemplates({
              ...templates,
              [selectedTemplate]: DEFAULT_TEMPLATES[selectedTemplate],
            });
            Alert.alert('Succes', 'Template hersteld naar standaard');
          },
        },
      ]
    );
  };

  const updateTemplate = (field, value) => {
    setTemplates({
      ...templates,
      [selectedTemplate]: {
        ...currentTemplate,
        [field]: value,
      },
    });
  };

  const templateOptions = [
    { key: 'document_sent', label: '📄 Document verzonden', icon: '📄' },
    { key: 'follow_up', label: '🔔 Follow-up', icon: '🔔' },
    { key: 'payment_reminder', label: '⚠️ Betalingsherinnering', icon: '⚠️' },
    { key: 'payment_received', label: '✅ Betaling ontvangen', icon: '✅' },
  ];

  const variables = [
    '{{customerName}}',
    '{{companyName}}',
    '{{documentType}}',
    '{{documentNumber}}',
    '{{totalAmount}}',
    '{{openAmount}}',
    '{{dueDate}}',
    '{{structuredReference}}',
    '{{paymentDate}}',
    '{{amount}}',
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📧 Email Templates</Text>
        <Text style={styles.subtitle}>Personaliseer je email berichten</Text>
      </View>

      {/* Template Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templateSelector}>
        {templateOptions.map(opt => (
          <TouchableOpacity
            key={opt.key}
            style={[
              styles.templateTab,
              selectedTemplate === opt.key && styles.templateTabActive,
            ]}
            onPress={() => {
              setSelectedTemplate(opt.key);
              setEditing(false);
            }}
          >
            <Text style={styles.templateIcon}>{opt.icon}</Text>
            <Text
              style={[
                styles.templateLabel,
                selectedTemplate === opt.key && styles.templateLabelActive,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content}>
        {/* Subject */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Onderwerp</Text>
          <TextInput
            style={[styles.input, !editing && styles.inputDisabled]}
            value={currentTemplate.subject}
            onChangeText={(text) => updateTemplate('subject', text)}
            editable={editing}
            placeholder="Email onderwerp..."
          />
        </View>

        {/* Body */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bericht</Text>
          <TextInput
            style={[styles.textArea, !editing && styles.inputDisabled]}
            value={currentTemplate.body}
            onChangeText={(text) => updateTemplate('body', text)}
            editable={editing}
            multiline
            numberOfLines={15}
            placeholder="Email bericht..."
            textAlignVertical="top"
          />
        </View>

        {/* Variables Help */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Beschikbare variabelen</Text>
          <Text style={styles.helpText}>
            Je kunt deze variabelen gebruiken in je templates. Ze worden automatisch vervangen:
          </Text>
          <View style={styles.variablesGrid}>
            {variables.map((variable, idx) => (
              <View key={idx} style={styles.variableChip}>
                <Text style={styles.variableText}>{variable}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Conditional Logic Help */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔧 Conditionele logica</Text>
          <Text style={styles.helpText}>
            Je kunt conditionele blokken gebruiken:
          </Text>
          <View style={styles.codeBlock}>
            <Text style={styles.codeText}>
              {'{{#if dueDate}}\n'}
              {'  Vervaldatum: {{dueDate}}\n'}
              {'{{/if}}'}
            </Text>
          </View>
        </View>

        {/* Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👁️ Voorbeeld</Text>
          <View style={styles.previewBox}>
            <Text style={styles.previewLabel}>Onderwerp:</Text>
            <Text style={styles.previewSubject}>
              {currentTemplate.subject
                .replace('{{documentType}}', 'Factuur')
                .replace('{{documentNumber}}', 'FAC-2025-001')
                .replace('{{customerName}}', 'Acme Corp')}
            </Text>
            <Text style={styles.previewLabel}>Bericht:</Text>
            <Text style={styles.previewBody}>
              {currentTemplate.body
                .replace(/{{customerName}}/g, 'Acme Corp')
                .replace(/{{companyName}}/g, 'Jouw Bedrijf')
                .replace(/{{documentType}}/g, 'Factuur')
                .replace(/{{documentNumber}}/g, 'FAC-2025-001')
                .replace(/{{totalAmount}}/g, '1.250,00')
                .replace(/{{openAmount}}/g, '1.250,00')
                .replace(/{{dueDate}}/g, '31-12-2025')
                .replace(/{{structuredReference}}/g, '+++123/4567/89012+++')
                .replace(/{{#if.*?}}\n?/g, '')
                .replace(/{{\/if}}/g, '')}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        {!editing ? (
          <>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetButtonText}>🔄 Herstel Standaard</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.editButton} onPress={() => setEditing(true)}>
              <Text style={styles.editButtonText}>✏️ Bewerken</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setTemplates({ ...DEFAULT_TEMPLATES });
                setEditing(false);
              }}
            >
              <Text style={styles.cancelButtonText}>Annuleer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>💾 Opslaan</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: theme.primary,
    padding: 16,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  templateSelector: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  templateTab: {
    padding: 16,
    alignItems: 'center',
    minWidth: 120,
  },
  templateTabActive: {
    borderBottomWidth: 3,
    borderBottomColor: theme.primary,
  },
  templateIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  templateLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  templateLabelActive: {
    color: theme.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    margin: 16,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: 'white',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: 'white',
    minHeight: 250,
    fontFamily: 'monospace',
  },
  inputDisabled: {
    backgroundColor: '#f8fafc',
    color: '#64748b',
  },
  helpText: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 12,
  },
  variablesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  variableChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  variableText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#475569',
  },
  codeBlock: {
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#e2e8f0',
    lineHeight: 18,
  },
  previewBox: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 4,
  },
  previewSubject: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  previewBody: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 12,
  },
  editButton: {
    flex: 1,
    backgroundColor: theme.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#e2e8f0',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#475569',
    fontSize: 16,
    fontWeight: '600',
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#f59e0b',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
