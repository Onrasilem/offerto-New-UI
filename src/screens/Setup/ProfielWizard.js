import React, { useState, useEffect } from 'react';
import { Alert, View, Text, TextInput, ActivityIndicator } from 'react-native';
import { ScreenWrapper, Card, Field, TextBox, Button, theme } from '../../components/UI';
import { ValidatedInput } from '../../components/ValidatedInput';
import { useOfferto } from '../../context/OffertoContext';
import { useFormValidation } from '../../lib/useFormValidation';
import { showSuccessToast, showErrorToast } from '../../lib/toast';

export default function ProfielWizard({navigation}){
  const { company, setCompany, isLoading } = useOfferto();
  const [isSaving, setIsSaving] = useState(false);

  // Define validation rules
  const validationRules = {
    bedrijfsnaam: { rule: 'required' },
    adres: { rule: 'required' },
    btwNummer: { rule: 'btw' },
    email: { rule: 'email' },
    telefoon: { rule: 'phone' },
    iban: company.iban ? { rule: 'iban' } : null,
    bic: company.bic ? { rule: 'bic' } : null,
    postcode: company.postcode ? { rule: 'postcode' } : null,
  };

  const form = useFormValidation(
    Object.keys(validationRules).reduce((acc, key) => ({
      ...acc,
      [key]: company[key] || '',
    }), {}),
    async (values) => {
      setIsSaving(true);
      try {
        setCompany({ ...company, ...values });
        showSuccessToast('Profile saved successfully');
        navigation.replace('Main');
      } catch (error) {
        showErrorToast(error.message || 'Failed to save profile');
      } finally {
        setIsSaving(false);
      }
    }
  );

  useEffect(() => {
    form.setValues(Object.keys(validationRules).reduce((acc, key) => ({
      ...acc,
      [key]: company[key] || '',
    }), {}));
  }, [company]);

  const handleSubmit = async () => {
    await form.handleSubmit();
  };

  return (
    <ScreenWrapper>
      <View style={{ marginBottom: theme.space.md }}>
        <Text style={{ ...theme.text.h2, color: theme.color.primary }}>🏢 Bedrijfsprofiel</Text>
        <Text style={{ ...theme.text.small, color: theme.color.muted, marginTop: theme.space.xs }}>
          Vul uw bedrijfsgegevens in
        </Text>
      </View>

      <Card style={{ marginBottom: theme.space.lg }}>
        <Text style={{ ...theme.text.h3, color: theme.color.primary, marginBottom: theme.space.md }}>
          Basisgegevens
        </Text>
        
        <ValidatedInput
          label="Bedrijfsnaam *"
          placeholder="Uw bedrijfsnaam"
          value={form.values.bedrijfsnaam}
          onChangeText={(v) => form.handleChange('bedrijfsnaam', v)}
          onBlur={() => form.handleBlur('bedrijfsnaam')}
          error={form.errors.bedrijfsnaam}
          touched={form.touched.bedrijfsnaam}
        />

        <ValidatedInput
          label="Adres *"
          placeholder="Straat en huisnummer"
          value={form.values.adres}
          onChangeText={(v) => form.handleChange('adres', v)}
          onBlur={() => form.handleBlur('adres')}
          error={form.errors.adres}
          touched={form.touched.adres}
        />

        <View style={{flexDirection:'row', gap: theme.space.md}}>
          <View style={{flex:1}}>
            <ValidatedInput
              label="Postcode"
              placeholder="1234 AB"
              value={form.values.postcode}
              onChangeText={(v) => form.handleChange('postcode', v)}
              onBlur={() => form.handleBlur('postcode')}
              error={form.errors.postcode}
              touched={form.touched.postcode}
            />
          </View>
          <View style={{flex:2}}>
            <Field label="Stad">
              <TextBox value={company.stad} onChangeText={v=>setCompany({...company, stad: v})} placeholder="Stad"/>
            </Field>
          </View>
        </View>

        <Field label="Land">
          <TextBox value={company.land} onChangeText={v=>setCompany({...company, land: v})} placeholder="Land"/>
        </Field>
      </Card>

      <Card style={{ marginBottom: theme.space.lg }}>
        <Text style={{ ...theme.text.h3, color: theme.color.primary, marginBottom: theme.space.md }}>
          Fiscale gegevens
        </Text>

        <ValidatedInput
          label="BTW-nummer *"
          placeholder="BE0123456789"
          value={form.values.btwNummer}
          onChangeText={(v) => form.handleChange('btwNummer', v)}
          onBlur={() => form.handleBlur('btwNummer')}
          error={form.errors.btwNummer}
          touched={form.touched.btwNummer}
        />

        <View style={{flexDirection:'row', gap: theme.space.md}}>
          <View style={{flex:1}}>
            <ValidatedInput
              label="E-mail *"
              placeholder="info@bedrijf.be"
              keyboardType="email-address"
              value={form.values.email}
              onChangeText={(v) => form.handleChange('email', v)}
              onBlur={() => form.handleBlur('email')}
              error={form.errors.email}
              touched={form.touched.email}
            />
          </View>
          <View style={{flex:1}}>
            <ValidatedInput
              label="Telefoon *"
              placeholder="+32 123 45 67"
              keyboardType="phone-pad"
              value={form.values.telefoon}
              onChangeText={(v) => form.handleChange('telefoon', v)}
              onBlur={() => form.handleBlur('telefoon')}
              error={form.errors.telefoon}
              touched={form.touched.telefoon}
            />
          </View>
        </View>
      </Card>

      <Card style={{ marginBottom: theme.space.lg }}>
        <Text style={{ ...theme.text.h3, color: theme.color.primary, marginBottom: theme.space.md }}>
          Bankgegevens
        </Text>

        <Field label="Bank">
          <TextBox value={company.bank} onChangeText={v=>setCompany({...company, bank: v})} placeholder="Banknaam"/>
        </Field>

        <View style={{flexDirection:'row', gap: theme.space.md}}>
          <View style={{flex:1}}>
            <ValidatedInput
              label="IBAN"
              placeholder="BE00 0000 0000 0000"
              value={form.values.iban}
              onChangeText={(v) => form.handleChange('iban', v)}
              onBlur={() => form.handleBlur('iban')}
              error={form.errors.iban}
              touched={form.touched.iban}
            />
          </View>
          <View style={{flex:1}}>
            <ValidatedInput
              label="BIC"
              placeholder="GEBABEBB"
              value={form.values.bic}
              onChangeText={(v) => form.handleChange('bic', v)}
              onBlur={() => form.handleBlur('bic')}
              error={form.errors.bic}
              touched={form.touched.bic}
            />
          </View>
        </View>
      </Card>

      <Card style={{ marginBottom: theme.space.lg }}>
        <Text style={{ ...theme.text.h3, color: theme.color.primary, marginBottom: theme.space.md }}>
          Offerte-instellingen
        </Text>

        <Field label="Betalingstermijn">
          <TextBox value={company.betalingsTermijn} onChangeText={v=>setCompany({...company, betalingsTermijn: v})} placeholder="Bijv. 30 dagen"/>
        </Field>

        <Field label="Offerte geldigheid (dagen)">
          <TextBox value={String(company.offerteGeldigheidDagen)} onChangeText={v=>setCompany({...company, offerteGeldigheidDagen: v})} keyboardType="numeric" placeholder="Bijv. 30"/>
        </Field>

        <Field label="Logo URL (optioneel)">
          <TextBox value={company.logoUrl} onChangeText={v=>setCompany({...company, logoUrl: v})} placeholder="https://..."/>
        </Field>

        <Field label="Opmerkingen / Voorwaarden">
          <TextInput 
            multiline 
            value={company.voorwaarden} 
            onChangeText={v=>setCompany({...company, voorwaarden:v})} 
            placeholder="Algemene voorwaarden of opmerkingen" 
            style={{
              borderWidth: 1.5,
              borderColor: theme.color.border,
              borderRadius: theme.border.md,
              padding: theme.space.md,
              minHeight: 90,
              textAlignVertical: 'top',
              backgroundColor: theme.color.surface,
              ...theme.text.body,
              color: theme.color.text
            }}
          />
        </Field>
      </Card>

      <Button 
        title={isSaving ? "Opslaan..." : "Opslaan en verder"} 
        onPress={handleSubmit}
        disabled={isSaving || isLoading}
        style={{ marginBottom: theme.space.lg }}
      />
      {(isSaving || isLoading) && <ActivityIndicator size="large" color={theme.color.primary} style={{marginBottom: theme.space.lg}} />}
    </ScreenWrapper>
  );
}
