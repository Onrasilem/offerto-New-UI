// src/screens/Core/StartScreen.js
import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { theme } from '../../components';
import { useOfferto } from '../../context/OffertoContext';

export default function StartScreen({ navigation }) {
  const { user, archive = [] } = useOfferto();
  
  // Quick stats
  const recentDocs = archive.slice(0, 3);
  const conceptCount = archive.filter(d => d.status === 'Concept').length;
  const sentCount = archive.filter(d => d.status === 'Verzonden').length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Welkom terug</Text>
          <Text style={styles.username}>{user?.name || 'Gebruiker'}</Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Card variant="filled" padding="md" style={styles.statCard}>
            <Text style={styles.statValue}>{archive.length}</Text>
            <Text style={styles.statLabel}>Documenten</Text>
          </Card>
          <Card variant="filled" padding="md" style={styles.statCard}>
            <Text style={styles.statValue}>{conceptCount}</Text>
            <Text style={styles.statLabel}>Concepten</Text>
          </Card>
          <Card variant="filled" padding="md" style={styles.statCard}>
            <Text style={styles.statValue}>{sentCount}</Text>
            <Text style={styles.statLabel}>Verzonden</Text>
          </Card>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Snelle acties</Text>
          
          <Button
            title="Nieuwe offerte/factuur"
            variant="primary"
            size="lg"
            fullWidth
            onPress={() => navigation.navigate('Wizard')}
            style={styles.primaryAction}
          />
          
          <Button
            title="Dashboard"
            variant="secondary"
            fullWidth
            onPress={() => navigation.navigate('Dashboard')}
            style={styles.actionButton}
          />
        </View>

        {/* Navigation Menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Menu</Text>
          
          <Card variant="outlined" padding="sm">
            <MenuItem
              title="Archief"
              subtitle="Alle documenten"
              onPress={() => navigation.navigate('Archief')}
            />
            <Divider />
            <MenuItem
              title="Betalingen"
              subtitle="Overzicht en status"
              onPress={() => navigation.navigate('Betalingen')}
            />
            <Divider />
            <MenuItem
              title="Producten"
              subtitle="Catalogus beheren"
              onPress={() => navigation.navigate('Producten')}
            />
            <Divider />
            <MenuItem
              title="Instellingen"
              subtitle="Profiel en voorkeuren"
              onPress={() => navigation.navigate('Instellingen')}
            />
          </Card>
        </View>

        {/* Spacing at bottom */}
        <View style={{ height: theme.spacing['4xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Menu Item Component
const MenuItem = ({ title, subtitle, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={styles.menuItem}
  >
    <View style={styles.menuItemContent}>
      <View style={styles.menuItemText}>
        <Text style={styles.menuItemTitle}>{title}</Text>
        <Text style={styles.menuItemSubtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.menuItemArrow}>›</Text>
    </View>
  </TouchableOpacity>
);

const Divider = () => <View style={styles.divider} />;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  username: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2563EB',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  primaryAction: {
    marginBottom: 12,
  },
  actionButton: {
    marginBottom: 8,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  menuItemText: {
    flex: 1,
    alignItems: 'flex-start',
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  menuItemArrow: {
    fontSize: 24,
    color: '#D1D5DB',
    marginLeft: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
});
