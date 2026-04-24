import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import api from '../../lib/api';
import { theme } from '../../components/UI';

export default function ProductDetailScreen({ route, navigation }) {
  const { product, mode } = route.params;
  const isEdit = mode === 'edit';

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  
  // Form state
  const [name, setName] = useState(product?.name || '');
  const [description, setDescription] = useState(product?.description || '');
  const [sku, setSku] = useState(product?.sku || '');
  const [categoryId, setCategoryId] = useState(product?.category_id || '');
  const [price, setPrice] = useState(product?.price?.toString() || '0');
  const [costPrice, setCostPrice] = useState(product?.cost_price?.toString() || '0');
  const [taxRate, setTaxRate] = useState(product?.tax_rate?.toString() || '21');
  const [unit, setUnit] = useState(product?.unit || 'stuk');
  const [stockQuantity, setStockQuantity] = useState(product?.stock_quantity?.toString() || '0');
  const [trackStock, setTrackStock] = useState(product?.track_stock === 1);
  const [active, setActive] = useState(product?.active !== 0);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await api.getProductCategories();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Fout', 'Productnaam is verplicht');
      return;
    }

    if (!price || parseFloat(price) < 0) {
      Alert.alert('Fout', 'Vul een geldige prijs in');
      return;
    }

    try {
      setLoading(true);
      
      const data = {
        name: name.trim(),
        description: description.trim() || null,
        sku: sku.trim() || null,
        category_id: categoryId || null,
        price: parseFloat(price),
        cost_price: parseFloat(costPrice) || 0,
        tax_rate: parseFloat(taxRate) || 21,
        unit: unit || 'stuk',
        stock_quantity: parseInt(stockQuantity) || 0,
        track_stock: trackStock,
        active,
      };

      if (isEdit) {
        await api.updateProduct(product.id, data);
        Alert.alert('Gelukt', 'Product bijgewerkt');
      } else {
        await api.createProduct(data);
        Alert.alert('Gelukt', 'Product aangemaakt');
      }

      navigation.goBack();
    } catch (error) {
      console.error('Failed to save product:', error);
      Alert.alert('Fout', 'Kon product niet opslaan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{isEdit ? 'Product Bewerken' : 'Nieuw Product'}</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basisgegevens</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Productnaam *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Bijv. Consult (per uur)"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Beschrijving</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Korte beschrijving"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>SKU / Artikelnummer</Text>
            <TextInput
              style={styles.input}
              value={sku}
              onChangeText={setSku}
              placeholder="Optioneel"
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Categorie</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={categoryId}
                onValueChange={setCategoryId}
                style={styles.picker}
              >
                <Picker.Item label="Geen categorie" value="" />
                {categories.map(cat => (
                  <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        {/* Pricing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prijzen</Text>

          <View style={styles.row}>
            <View style={[styles.formGroup, styles.rowItem]}>
              <Text style={styles.label}>Verkoopprijs * (€)</Text>
              <TextInput
                style={styles.input}
                value={price}
                onChangeText={setPrice}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={[styles.formGroup, styles.rowItem]}>
              <Text style={styles.label}>Kostprijs (€)</Text>
              <TextInput
                style={styles.input}
                value={costPrice}
                onChangeText={setCostPrice}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.formGroup, styles.rowItem]}>
              <Text style={styles.label}>BTW (%)</Text>
              <TextInput
                style={styles.input}
                value={taxRate}
                onChangeText={setTaxRate}
                placeholder="21"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={[styles.formGroup, styles.rowItem]}>
              <Text style={styles.label}>Eenheid</Text>
              <TextInput
                style={styles.input}
                value={unit}
                onChangeText={setUnit}
                placeholder="stuk"
              />
            </View>
          </View>

          {price && costPrice && parseFloat(price) > 0 && parseFloat(costPrice) > 0 && (
            <View style={styles.marginCard}>
              <Text style={styles.marginLabel}>Winstmarge</Text>
              <Text style={styles.marginValue}>
                € {(parseFloat(price) - parseFloat(costPrice)).toFixed(2)} (
                {((parseFloat(price) - parseFloat(costPrice)) / parseFloat(price) * 100).toFixed(1)}%)
              </Text>
            </View>
          )}
        </View>

        {/* Stock */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Voorraad</Text>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Voorraad bijhouden</Text>
            <Switch value={trackStock} onValueChange={setTrackStock} />
          </View>

          {trackStock && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Voorraad aantal</Text>
              <TextInput
                style={styles.input}
                value={stockQuantity}
                onChangeText={setStockQuantity}
                placeholder="0"
                keyboardType="number-pad"
              />
            </View>
          )}
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instellingen</Text>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Actief</Text>
            <Switch value={active} onValueChange={setActive} />
          </View>
          <Text style={styles.hint}>
            Inactieve producten worden niet getoond bij het maken van offertes
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Annuleren</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.saveButtonText}>
                {isEdit ? 'Opslaan' : 'Aanmaken'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1e293b',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
  },
  picker: {
    height: 50,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowItem: {
    flex: 1,
  },
  marginCard: {
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  marginLabel: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '600',
  },
  marginValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16a34a',
    marginTop: 4,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  switchLabel: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: theme.primary,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
