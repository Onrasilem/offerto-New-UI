import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOfferto } from '../context/OffertoContext';

import TabNavigator from './TabNavigator';
import WizardNavigator from './WizardNavigator';

import LoginScreen from '../screens/Auth/LoginScreen';
import SignUpScreen from '../screens/Auth/SignUpScreen';
import ProfielWizard from '../screens/Setup/ProfielWizard';

import DocumentDetailScreen from '../screens/Core/DocumentDetailScreen';
import KlantDetailScreen from '../screens/Core/KlantDetailScreen';
import BetalingDetailScreen from '../screens/Core/BetalingDetailScreen';
import EmailTemplatesScreen from '../screens/Core/EmailTemplatesScreen';
import ProductenScreen from '../screens/Core/ProductenScreen';
import ProductDetailScreen from '../screens/Core/ProductDetailScreen';
import BetalingenScreen from '../screens/Core/BetalingenScreen';
import { DS } from '../theme';

const Stack = createNativeStackNavigator();

const SCREEN_OPTIONS = {
  headerShown: false,
};

export default function RootNavigator() {
  const { booting, user } = useOfferto();

  if (booting) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: DS.colors.bg }}>
        <ActivityIndicator color={DS.colors.accent} />
        <Text style={{ marginTop: 12, color: DS.colors.textSecondary, fontSize: 14 }}>Laden…</Text>
      </SafeAreaView>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={SCREEN_OPTIONS}>
        {!user ? (
          <>
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="ProfielWizard" component={ProfielWizard} />
          </>
        ) : (
          <>
            {/* Main tab navigator */}
            <Stack.Screen name="Main" component={TabNavigator} />

            {/* Detail screens (pushed over tabs) */}
            <Stack.Screen name="Wizard" component={WizardNavigator} />
            <Stack.Screen name="DocumentDetail" component={DocumentDetailScreen} />
            <Stack.Screen name="KlantDetail" component={KlantDetailScreen} />
            <Stack.Screen name="BetalingDetail" component={BetalingDetailScreen} />
            <Stack.Screen name="EmailTemplates" component={EmailTemplatesScreen} />
            <Stack.Screen name="Producten" component={ProductenScreen} />
            <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
            <Stack.Screen name="Betalingen" component={BetalingenScreen} />
            <Stack.Screen name="ProfielWizard" component={ProfielWizard} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
