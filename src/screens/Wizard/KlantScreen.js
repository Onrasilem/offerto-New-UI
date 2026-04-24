import React, { useEffect } from 'react';
import { View, Text, Alert, ActivityIndicator } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { ScreenWrapper, Card, Field, TextBox, Button, theme } from '../../components/UI';
import { ValidatedInput } from '../../components/ValidatedInput';
import { useOfferto } from '../../context/OffertoContext';
import { useFormValidation } from '../../lib/useFormValidation';
import { showErrorToast } from '../../lib/toast';

export default function KlantScreen({ navigation }) {
  const headerHeight = useHeaderHeight();
  const { klant, setKlant } = useOfferto();

  const form = useFormValidation(
    {
      bedrijfsnaam: klant.bedrijfsnaam || '',
      contactpersoon: klant.contactpersoon || '',
      email: klant.email || '',
      telefoon: klant.telefoon || '',
      adres: klant.adres || '',
      btwNummer: klant.btwNummer || '',
      peppolId: klant.peppolId || '',
    },
    async (values) => {
      const bedrijfsnaam = (values.bedrijfsnaam || '').trim();
      const contactpersoon = (values.contactpersoon || '').trim();
      const email = (values.email || '').trim();
      const telefoon = (values.telefoon || '').trim();

      const heeftNaam = bedrijfsnaam.length > 0 || contactpersoon.length > 0;
      const heeftContact = email.length > 0 || telefoon.length > 0;

      if (!heeftNaam) {
        showErrorToast('Bedrijfsnaam of contactpersoon is verplicht');
        return;
      }
      if (!heeftContact) {
        showErrorToast('E-mail of telefoon is verplicht');
        return;
      }

      setKlant(values);
      navigation.navigate('Onderdelen');
    }
  );

  useEffect(() => {
    form.setValues({
      bedrijfsnaam: klant.bedrijfsnaam || '',
      contactpersoon: klant.contactpersoon || '',
      email: klant.email || '',
      peppolId: klant.peppolId || '',
      telefoon: klant.telefoon || '',
      adres: klant.adres || '',
      btwNummer: klant.btwNummer || '',
    });
  }, [klant]);

  return (
    <ScreenWrapper headerOffset={headerHeight}>
      <View style={{ marginBottom: theme.space.md }}>
        <Text style={{ fontSize: theme.text.h2, color: theme.color.primary }}>👤 Klantgegevens</Text>
        <Text style={{ fontSize: theme.text.small, color: theme.color.textMuted, marginTop: theme.space.xs }}>
          Voeg de klantinformatie in
        </Text>
      </View>

      <Card style={{ marginBottom: theme.space.lg }}>
        <ValidatedInput
          label="Bedrijfsnaam"
          placeholder="Bijv. Brasserie De Hoek"
          value={form.values.bedrijfsnaam}
          onChangeText={(v) => form.handleChange('bedrijfsnaam', v)}
          onBlur={() => form.handleBlur('bedrijfsnaam')}
          error={form.errors.bedrijfsnaam}
          touched={form.touched.bedrijfsnaam}
        />

        <ValidatedInput
          label="Contactpersoon"
          placeholder="Naam van de contactpersoon"
          value={form.values.contactpersoon}
          onChangeText={(v) => form.handleChange('contactpersoon', v)}
          onBlur={() => form.handleBlur('contactpersoon')}
          error={form.errors.contactpersoon}
          touched={form.touched.contactpersoon}
        />

        <View style={{flexDirection:'row', gap: theme.space.md}}>
          <View style={{flex:1}}>
            <ValidatedInput
              label="E-mail"
              placeholder="klant@bedrijf.be"
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
              label="Telefoon"
              placeholder="0470 12 34 56"
              keyboardType="phone-pad"
              value={form.values.telefoon}
              onChangeText={(v) => form.handleChange('telefoon', v)}
              onBlur={() => form.handleBlur('telefoon')}
              error={form.errors.telefoon}
              touched={form.touched.telefoon}
            />
          </View>
        </View>

        <Field label="Adres">
          <TextBox
            value={form.values.adres}
            onChangeText={(v) => form.handleChange('adres', v)}
            placeholder="Straat + nr, postcode, gemeente"
          />
        </Field>

        <ValidatedInput
          label="BTW-nummer"
          placeholder="BE0123456789"
          value={form.values.btwNummer}
          onChangeText={(v) => form.handleChange('btwNummer', v)}
          onBlur={() => form.handleBlur('btwNummer')}
          error={form.errors.btwNummer}
          touched={form.touched.btwNummer}
        />
      </Card>

      <Card style={{ marginBottom: theme.space.lg }}>
        <Text style={{ fontSize: theme.text.h3, color: theme.color.primary, marginBottom: theme.space.md }}>
          📨 Peppol E-facturatie (Optioneel)
        </Text>
        
        <Field label="Peppol ID">
          <TextBox
            value={form.values.peppolId || ''}
            onChangeText={(v) => form.handleChange('peppolId', v)}
            placeholder="BE0123456789"
          />
        </Field>

        <Text style={{ fontSize: theme.text.xsmall, color: theme.color.textMuted, marginTop: theme.space.sm }}>
          💡 Het Peppol ID is meestal het BTW-nummer van de klant. Wordt gebruikt voor e-facturatie.
        </Text>
      </Card>

      <Card style={{ marginBottom: theme.space.lg }}>
        <Text style={{ fontSize: theme.text.xsmall, color: theme.color.textMuted, marginBottom: theme.space.md }}>
          ℹ️ Minstens bedrijfsnaam of contactpersoon, én minstens e-mail of telefoon zijn verplicht.
        </Text>

        <Button
          title="Volgende: Onderdelen"
          onPress={form.handleSubmit}
        />
      </Card>
    </ScreenWrapper>
  );
}
