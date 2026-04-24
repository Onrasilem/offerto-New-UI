import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import api from '../../lib/api';
import { theme } from '../../components/UI';

export default function ProductenScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showActive, setShowActive] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [search, selectedCategory, showActive]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsData, categoriesData, statsData] = await Promise.all([
        api.getProducts({ active: true }),
        api.getProductCategories(),
        api.getProductStats(),
      ]);
      
      setProducts(productsData.products || []);
      setCategories(categoriesData.categories || []);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load products:', error);
      Alert.alert('Fout', 'Kon producten niet laden');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (selectedCategory) params.category_id = selectedCategory;
      if (showActive !== null) params.active = showActive;

      const data = await api.getProducts(params);
      setProducts(data.products || []);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const handleAddProduct = () => {
    navigation.navigate('ProductDetail', { mode: 'create' });
  };

  const handleEditProduct = (product) => {
    navigation.navigate('ProductDetail', { product, mode: 'edit' });
  };

  const handleDeleteProduct = (product) => {
    Alert.alert(
      'Product verwijderen',
      `Weet je zeker dat je "${product.name}" wilt verwijderen?`,
      [
        { text: 'Annuleren', style: 'cancel' },
        {
          text: 'Verwijder',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteProduct(product.id);
              loadProducts();
              Alert.alert('Gelukt', 'Product verwijderd');
            } catch (error) {
              Alert.alert('Fout', 'Kon product niet verwijderen');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📦 Producten</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddProduct}>
          <Text style={styles.addButtonText}>+ Nieuw</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Stats Cards */}
        {stats && (
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: '#eff6ff' }]}>
              <Text style={styles.statLabel}>Totaal</Text>
              <Text style={styles.statValue}>{stats.total_products}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#f0fdf4' }]}>
              <Text style={styles.statLabel}>Actief</Text>
              <Text style={styles.statValue}>{stats.active_products}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#fef2f2' }]}>
              <Text style={styles.statLabel}>Geen voorraad</Text>
              <Text style={styles.statValue}>{stats.out_of_stock}</Text>
            </View>
          </View>
        )}

        {/* Search */}
        <View style={styles.section}>
          <TextInput
            style={styles.searchInput}
            placeholder="Zoek producten..."
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Category Filter */}
        <View style={styles.section}>
          <Text style={styles.filterLabel}>Categorie:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text style={[styles.categoryChipText, !selectedCategory && styles.categoryChipTextActive]}>
                Alle
              </Text>
            </TouchableOpacity>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  selectedCategory === cat.id && styles.categoryChipActive,
                  { borderColor: cat.color },
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategory === cat.id && styles.categoryChipTextActive,
                  ]}
                >
                  {cat.name} ({cat.product_count})
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Products List */}
        <View style={styles.section}>
          {products.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyText}>Geen producten gevonden</Text>
              <TouchableOpacity style={styles.emptyButton} onPress={handleAddProduct}>
                <Text style={styles.emptyButtonText}>+ Eerste product toevoegen</Text>
              </TouchableOpacity>
            </View>
          ) : (
            products.map(product => (
              <TouchableOpacity
                key={product.id}
                style={styles.productCard}
                onPress={() => handleEditProduct(product)}
              >
                <View style={styles.productHeader}>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{product.name}</Text>
                    {product.category_name && (
                      <View
                        style={[
                          styles.categoryBadge,
                          { backgroundColor: product.category_color + '20' },
                        ]}
                      >
                        <Text style={[styles.categoryBadgeText, { color: product.category_color }]}>
                          {product.category_name}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.productPricing}>
                    <Text style={styles.productPrice}>€ {parseFloat(product.price).toFixed(2)}</Text>
                    <Text style={styles.productUnit}>per {product.unit}</Text>
                  </View>
                </View>

                {product.description && (
                  <Text style={styles.productDescription} numberOfLines={2}>
                    {product.description}
                  </Text>
                )}

                <View style={styles.productFooter}>
                  {product.sku && (
                    <Text style={styles.productSku}>SKU: {product.sku}</Text>
                  )}
                  {product.track_stock === 1 && (
                    <Text
                      style={[
                        styles.productStock,
                        product.stock_quantity <= 0 && styles.productStockLow,
                        product.stock_quantity > 0 && product.stock_quantity <= 5 && styles.productStockWarning,
                      ]}
                    >
                      Voorraad: {product.stock_quantity}
                    </Text>
                  )}
                  {product.active === 0 && (
                    <Text style={styles.productInactive}>Inactief</Text>
                  )}
                </View>

                <View style={styles.productActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEditProduct(product)}
                  >
                    <Text style={styles.actionButtonText}>✏️ Bewerk</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteProduct(product)}
                  >
                    <Text style={[styles.actionButtonText, styles.deleteButtonText]}>🗑️ Verwijder</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: theme.primary,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  addButton: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: theme.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  section: {
    padding: 16,
  },
  searchInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    marginRight: 8,
    backgroundColor: 'white',
  },
  categoryChipActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  categoryChipText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: 'white',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  productInfo: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 4,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  productPricing: {
    alignItems: 'flex-end',
  },
  productPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.primary,
  },
  productUnit: {
    fontSize: 12,
    color: '#64748b',
  },
  productDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
  },
  productFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  productSku: {
    fontSize: 12,
    color: '#94a3b8',
  },
  productStock: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
  },
  productStockLow: {
    color: '#dc2626',
  },
  productStockWarning: {
    color: '#f59e0b',
  },
  productInactive: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  productActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  deleteButton: {
    borderColor: '#fee2e2',
    backgroundColor: '#fef2f2',
  },
  deleteButtonText: {
    color: '#dc2626',
  },
});
