import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import KlantScreen from '../screens/Wizard/KlantScreen';
import OnderdelenScreen from '../screens/Wizard/OnderdelenScreen';
import OverzichtScreen from '../screens/Wizard/OverzichtScreen';

const Stack = createNativeStackNavigator();
export default function WizardNavigator(){
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#fff' },
        headerTintColor: '#2563EB',
        headerTitleStyle: { fontWeight: '700', color: '#0C0F1A' },
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen name="Klant" component={KlantScreen} options={{ title: 'Klant' }} />
      <Stack.Screen name="Onderdelen" component={OnderdelenScreen} options={{ title: 'Producten & diensten' }} />
      <Stack.Screen name="Overzicht" component={OverzichtScreen} options={{ title: 'Overzicht & verzenden' }} />
    </Stack.Navigator>
  );
}
