// App.js — volledige vervanging

// Belangrijk: gesture-handler MOET als eerste worden geïmporteerd
import 'react-native-gesture-handler';

import React from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';

import { OffertoProvider } from './src/context/OffertoContext';
import RootNavigator from './src/navigation/RootNavigator';

// Optimaliseer navigatie-performance (ook veilig op web)
enableScreens(true);

export default function App() {
  return (
    <SafeAreaProvider>
      {/* StatusBar: licht thema, automatisch verborgen op web */}
      <StatusBar style={Platform.OS === 'web' ? 'auto' : 'dark'} />

      {/* App state & data */}
      <OffertoProvider>
        {/* Navigatieboom van de app */}
        <RootNavigator />
      </OffertoProvider>

      {/* Toast notifications */}
      <Toast />
    </SafeAreaProvider>
  );
}
