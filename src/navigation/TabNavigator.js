import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DashboardScreen from '../screens/Core/DashboardScreen';
import KlantenScreen from '../screens/Core/KlantenScreen';
import ArchiefScreen from '../screens/Core/ArchiefScreen';
import InstellingenScreen from '../screens/Core/InstellingenScreen';
import { DS } from '../theme';

const TABS = [
  { key: 'Dashboard', label: 'Overzicht', icon: '🏠' },
  { key: 'Klanten',   label: 'Klanten',   icon: '👥' },
  { key: 'Archief',   label: 'Documenten', icon: '📄' },
  { key: 'Instellingen', label: 'Instellingen', icon: '⚙️' },
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

  // Build a fake navigation object that supports push/navigate
  // For navigating to stack screens, delegate to parent navigation
  const tabNavigation = {
    navigate: (screen, params) => {
      // If screen is a tab, switch tab
      if (SCREENS[screen]) {
        setActiveTab(screen);
      } else {
        // Push to parent stack navigator
        navigation.navigate(screen, params);
      }
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
      {/* Active screen */}
      <View style={ts.screenContainer}>
        <ActiveScreen navigation={tabNavigation} />
      </View>

      {/* Tab bar */}
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
              <Text style={[ts.tabIcon, active && ts.tabIconActive]}>{tab.icon}</Text>
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
    borderTopWidth: 1,
    borderTopColor: DS.colors.borderLight,
    paddingTop: 10,
  },
  tabItem: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3,
  },
  tabIcon: { fontSize: 22, opacity: 0.35 },
  tabIconActive: { opacity: 1 },
  tabLabel: {
    fontSize: 10, fontWeight: '400', color: DS.colors.textTertiary,
  },
  tabLabelActive: { color: DS.colors.accent, fontWeight: '600' },
});
