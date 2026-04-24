// src/screens/Wizard/OnderdelenScreen.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ScreenWrapper, Card, Field, TextBox, Button, Chip, theme } from '../../components/UI';
import { ValidatedInput } from '../../components/ValidatedInput';
import { useOfferto } from '../../context/OffertoContext';
import { validateOnderdeel } from '../../lib/validators';
import { showErrorToast, showSuccessToast } from '../../lib/toast';

const UNITS = [
  { label: 'stuk',  value: 'st'  },
  { label: 'uur',   value: 'uur' },
  { label: 'm²',    value: 'm2'  },
  { label: 'm³',    value: 'm3'  },
  { label: 'meter', value: 'm'   },
];

const VATS = [0, 6, 9, 21];

const parseNum = (v) => {
  const n = parseFloat(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

export default function OnderdelenScreen({ navigation }) {
  const { onderdelen, addOnderdeel, removeOnderdeel, products } = useOfferto();

  const [showProductPicker, setShowProductPicker] = useState(false);
  const [form, setForm] = useState({
    omschrijving: '',
    aantal: '1',
    eenheid: 'st',
    eenheidsprijs: '',
    btwPerc: 21,
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = (patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
    // Validate as user types if field was touched
    if (Object.keys(touched).length > 0) {
      const newForm = { ...form, ...patch };
      const validationErrors = validateOnderdeel(newForm);
      setErrors(validationErrors);
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const validationErrors = validateOnderdeel(form);
    setErrors(validationErrors);
  };

  const selectProduct = (product) => {
    setForm({
      omschrijving: product.name,
      aantal: '1',
      eenheid: product.unit || 'st',
      eenheidsprijs: product.price.toString(),
      btwPerc: product.tax_rate || 21,
    });
    setShowProductPicker(false);
    showSuccessToast('Product geselecteerd');
  };

  const add = () => {
    const validationErrors = validateOnderdeel(form);
    
    if (Object.keys(validationErrors).length > 0) {
      Object.values(validationErrors).forEach(error => showErrorToast(error));
      setErrors(validationErrors);
      setTouched({
        omschrijving: true,
        aantal: true,
        eenheidsprijs: true,
      });
      return;
    }

    const parseNum = (v) => {
      const n = parseFloat(String(v ?? '').replace(',', '.'));
      return Number.isFinite(n) ? n : 0;
    };

    const qty = parseNum(form.aantal) || 1;
    const price = parseNum(form.eenheidsprijs);
    const vat = parseNum(form.btwPerc);

    addOnderdeel({
      omschrijving: form.omschrijving,
      aantal: qty,
      eenheid: form.eenheid,
      eenheidsprijs: price,
      btwPerc: vat,
      ex: qty * price,
      btwA: qty * price * (vat / 100),
    });

    setForm({
      omschrijving: '',
      aantal: '1',
      eenheid: 'st',
      eenheidsprijs: '',
      btwPerc: 21,
    });
    setErrors({});
    setTouched({});
    showSuccessToast('Onderdeel toegevoegd');
  };

  const canGoNext = onderdelen.length > 0;

  const goNext = () => {
    if (!canGoNext) {
      alert('Voeg minstens één onderdeel toe voordat je naar het overzicht gaat.');
      return;
    }
    navigation.navigate('Overzicht');
  };

  return (
    <ScreenWrapper>
      <View style={{ marginBottom: theme.space.md }}>
        <Text style={{ ...theme.text.h2, color: theme.color.primary }}>📦 Onderdelen</Text>
        <Text style={{ ...theme.text.small, color: theme.color.muted, marginTop: theme.space.xs }}>
          Voeg de offerteposts in
        </Text>
      </View>

      {/* Product Picker */}
      {products && products.length > 0 && (
        <Card style={{ marginBottom: theme.space.md }}>
          <TouchableOpacity
            style={styles.productPickerButton}
            onPress={() => setShowProductPicker(!showProductPicker)}
          >
            <Text style={styles.productPickerButtonText}>
              📦 {showProductPicker ? 'Verberg' : 'Kies uit producten'}
            </Text>
          </TouchableOpacity>

          {showProductPicker && (
            <View style={styles.productList}>
              {products.slice(0, 10).map((product) => (
                <TouchableOpacity
                  key={product.id}
                  style={styles.productItem}
                  onPress={() => selectProduct(product)}
                >
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{product.name}</Text>
                    {product.description && (
                      <Text style={styles.productDescription} numberOfLines={1}>
                        {product.description}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.productPrice}>€{parseFloat(product.price).toFixed(2)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Card>
      )}

      {/* Nieuw onderdeel */}
      <Card style={{ marginBottom: theme.space.lg }}>
        <Text style={{ ...theme.text.h3, color: theme.color.primary, marginBottom: theme.space.md }}>
          Nieuw onderdeel
        </Text>
        
        <ValidatedInput
          label="Omschrijving"
          placeholder="Bijv. Indienststelling airco / Uur werk / Materiaal"
          value={form.omschrijving}
          onChangeText={(v) => handleChange({ omschrijving: v })}
          onBlur={() => handleBlur('omschrijving')}
          error={errors.omschrijving}
          touched={touched.omschrijving}
        />

        <View style={{ flexDirection: 'row', gap: theme.space.md }}>
          <View style={{ flex: 1 }}>
            <ValidatedInput
              label="Aantal"
              placeholder="1"
              keyboardType="numeric"
              value={form.aantal}
              onChangeText={(v) => handleChange({ aantal: v })}
              onBlur={() => handleBlur('aantal')}
              error={errors.aantal}
              touched={touched.aantal}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Eenheid">
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.xs }}>
                {UNITS.map((u) => (
                  <Chip
                    key={u.value}
                    label={u.label}
                    active={form.eenheid === u.value}
                    onPress={() => handleChange({ eenheid: u.value })}
                  />
                ))}
              </View>
            </Field>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: theme.space.md }}>
          <View style={{ flex: 1 }}>
            <ValidatedInput
              label="Prijs per eenheid (€)"
              placeholder="Bijv. 60"
              keyboardType="numeric"
              value={form.eenheidsprijs}
              onChangeText={(v) => handleChange({ eenheidsprijs: v })}
              onBlur={() => handleBlur('eenheidsprijs')}
              error={errors.eenheidsprijs}
              touched={touched.eenheidsprijs}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="BTW">
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.xs }}>
                {VATS.map((v) => (
                  <Chip
                    key={v}
                    label={`${v}%`}
                    active={form.btwPerc === v}
                    onPress={() => handleChange({ btwPerc: v })}
                  />
                ))}
              </View>
            </Field>
          </View>
        </View>

        <Button title="Toevoegen" onPress={add} />
      </Card>

      {/* Lijst onderdelen */}
      <Card style={{ marginBottom: theme.space.lg }}>
        <Text style={{ ...theme.text.h3, color: theme.color.primary, marginBottom: theme.space.md }}>
          Toegevoegde onderdelen ({onderdelen.length})
        </Text>
        {onderdelen.length === 0 ? (
          <Text style={{ ...theme.text.body, color: theme.color.muted }}>
            Nog geen onderdelen toegevoegd.
          </Text>
        ) : (
          onderdelen.map((item, idx) => (
            <View
              key={item.id}
              style={{
                borderTopWidth: 1,
                borderTopColor: theme.color.border,
                paddingVertical: theme.space.md,
              }}
            >
              <Text style={{ ...theme.text.body, fontWeight: '600', color: theme.color.primary, marginBottom: theme.space.xs }}>
                {idx + 1}. {item.omschrijving}
              </Text>
              <Text style={{ ...theme.text.small, color: theme.color.muted, marginBottom: theme.space.md }}>
                {item.aantal} {item.eenheid} × €{Number(item.eenheidsprijs).toFixed(2)} • BTW {item.btwPerc}% • Totaal: €{Number(item.ex + item.btwA).toFixed(2)}
              </Text>
              <Button
                title="Verwijderen"
                variant="secondary"
                size="sm"
                onPress={() => removeOnderdeel(item.id)}
              />
            </View>
          ))
        )}
      </Card>

      {/* Navigatie */}
      <Button
        title={onderdelen.length > 0 ? "Volgende: Overzicht" : "Voeg onderdeel toe"}
        onPress={() => {
          if (onderdelen.length === 0) {
            showErrorToast('Voeg minstens één onderdeel toe.');
            return;
          }
          navigation.navigate('Overzicht');
        }}
        disabled={onderdelen.length === 0}
        style={{ marginBottom: theme.space.lg }}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  productPickerButton: {
    backgroundColor: theme.color.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: theme.space.md,
  },
  productPickerButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  productList: {
    gap: 8,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  productInfo: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  productDescription: {
    fontSize: 13,
    color: '#64748b',
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.color.primary,
  },
});
