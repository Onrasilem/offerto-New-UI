import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DashboardScreen from '../screens/Core/DashboardScreen';
import KlantenScreen from '../screens/Core/KlantenScreen';
import ArchiefScreen from '../screens/Core/ArchiefScreen';
import InstellingenScreen from '../screens/Core/InstellingenScreen';
import { DS } from '../theme';

const TABS = [
  { key: 'Dashboard',    label: 'Overzicht',    icon: 'home',          iconOutline: 'home-outline' },
  { key: 'Klanten',      label: 'Klanten',      icon: 'people',        iconOutline: 'people-outline' },
  { key: 'Archief',      label: 'Documenten',   icon: 'document-text', iconOutline: 'document-text-outline' },
  { key: 'Instellingen', label: 'Instellingen', icon: 'settings',      iconOutline: 'settings-outline' },
];

const SCREENS = {
  Dashboard: DashboardScreen,
  Klanten: KlantenScreen,
  Archief: ArchiefScreen,
  Instellingen: InstellingenScreen,
};

export default function TabNavigator({ navigation }) {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const insets = useSafeAreaInsets();

  const ActiveScreen = SCREENS[activeTab];

  const tabNavigation = {
    navigate: (screen, params) => {
      if (SCREENS[screen]) setActiveTab(screen);
      else navigation.navigate(screen, params);
    },
    goBack: () => navigation.goBack(),
    push: (screen, params) => navigation.navigate(screen, params),
    replace: (screen, params) => navigation.replace(screen, params),
    addListener: () => ({ remove: () => {} }),
    removeListener: () => {},
    isFocused: () => true,
    canGoBack: () => false,
    getState: () => ({}),
    setOptions: () => {},
  };

  return (
    <View style={ts.root}>
      <View style={ts.screenContainer}>
        <ActiveScreen navigation={tabNavigation} />
      </View>

      <View style={[ts.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        {TABS.map(tab => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={ts.tabItem}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={active ? tab.icon : tab.iconOutline}
                size={24}
                color={active ? DS.colors.accent : DS.colors.textTertiary}
              />
              <Text style={[ts.tabLabel, active && ts.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const ts = StyleSheet.create({
  root: { flex: 1, backgroundColor: DS.colors.bg },
  screenContainer: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: DS.colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: DS.colors.border,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3,
  },
  tabLabel: {
    fontSize: 10, fontWeight: '500', color: DS.colors.textTertiary,
  },
  tabLabelActive: { color: DS.colors.accent, fontWeight: '700' },
});
