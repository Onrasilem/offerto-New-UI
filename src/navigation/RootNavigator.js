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
import KlantFormScreen from '../screens/Core/KlantFormScreen';
import IBANScreen from '../screens/Settings/IBANScreen';
import NummeringScreen from '../screens/Settings/NummeringScreen';
import BetalingstermijnScreen from '../screens/Settings/BetalingstermijnScreen';
import BTWScreen from '../screens/Settings/BTWScreen';
import HerinneringenScreen from '../screens/Settings/HerinneringenScreen';
import WachtwoordScreen from '../screens/Settings/WachtwoordScreen';
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
            <Stack.Screen name="EmailTemplates" component={EmailTemplatesScreen}
              options={{ headerShown: true, title: 'E-mail templates', headerBackTitleVisible: false, headerTintColor: DS.colors.accent, headerTitleStyle: { fontWeight: '700', color: DS.colors.textPrimary }, headerShadowVisible: false, contentStyle: { backgroundColor: DS.colors.bg } }} />
            <Stack.Screen name="Producten" component={ProductenScreen}
              options={{ headerShown: true, title: 'Producten & diensten', headerBackTitleVisible: false, headerTintColor: DS.colors.accent, headerTitleStyle: { fontWeight: '700', color: DS.colors.textPrimary }, headerShadowVisible: false, contentStyle: { backgroundColor: DS.colors.bg } }} />
            <Stack.Screen name="ProductDetail" component={ProductDetailScreen}
              options={({ route }) => ({ headerShown: true, title: route.params?.mode === 'edit' ? 'Product bewerken' : 'Nieuw product', headerBackTitleVisible: false, headerTintColor: DS.colors.accent, headerTitleStyle: { fontWeight: '700', color: DS.colors.textPrimary }, headerShadowVisible: false, contentStyle: { backgroundColor: DS.colors.bg } })} />
            <Stack.Screen name="Betalingen" component={BetalingenScreen} />
            <Stack.Screen name="ProfielWizard" component={ProfielWizard} />
            <Stack.Screen name="KlantForm" component={KlantFormScreen}
              options={({ route }) => ({
                headerShown: true,
                title: route.params?.customer ? 'Klant bewerken' : 'Nieuwe klant',
                headerBackTitleVisible: false,
                headerTintColor: DS.colors.accent,
                headerTitleStyle: { fontWeight: '700', color: DS.colors.textPrimary },
                headerShadowVisible: false,
                contentStyle: { backgroundColor: DS.colors.bg },
              })} />

            {/* Settings sub-screens */}
            <Stack.Screen name="IBAN" component={IBANScreen}
              options={{ headerShown: true, title: 'IBAN & betaling', headerBackTitleVisible: false, headerTintColor: DS.colors.accent, headerTitleStyle: { fontWeight: '700', color: DS.colors.textPrimary }, headerShadowVisible: false, contentStyle: { backgroundColor: DS.colors.bg } }} />
            <Stack.Screen name="Nummering" component={NummeringScreen}
              options={{ headerShown: true, title: 'Nummering', headerBackTitleVisible: false, headerTintColor: DS.colors.accent, headerTitleStyle: { fontWeight: '700', color: DS.colors.textPrimary }, headerShadowVisible: false, contentStyle: { backgroundColor: DS.colors.bg } }} />
            <Stack.Screen name="Betalingstermijn" component={BetalingstermijnScreen}
              options={{ headerShown: true, title: 'Betalingstermijn', headerBackTitleVisible: false, headerTintColor: DS.colors.accent, headerTitleStyle: { fontWeight: '700', color: DS.colors.textPrimary }, headerShadowVisible: false, contentStyle: { backgroundColor: DS.colors.bg } }} />
            <Stack.Screen name="BTW" component={BTWScreen}
              options={{ headerShown: true, title: 'BTW-tarieven', headerBackTitleVisible: false, headerTintColor: DS.colors.accent, headerTitleStyle: { fontWeight: '700', color: DS.colors.textPrimary }, headerShadowVisible: false, contentStyle: { backgroundColor: DS.colors.bg } }} />
            <Stack.Screen name="Herinneringen" component={HerinneringenScreen}
              options={{ headerShown: true, title: 'Herinneringen', headerBackTitleVisible: false, headerTintColor: DS.colors.accent, headerTitleStyle: { fontWeight: '700', color: DS.colors.textPrimary }, headerShadowVisible: false, contentStyle: { backgroundColor: DS.colors.bg } }} />
            <Stack.Screen name="Wachtwoord" component={WachtwoordScreen}
              options={{ headerShown: true, title: 'Wachtwoord wijzigen', headerBackTitleVisible: false, headerTintColor: DS.colors.accent, headerTitleStyle: { fontWeight: '700', color: DS.colors.textPrimary }, headerShadowVisible: false, contentStyle: { backgroundColor: DS.colors.bg } }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
