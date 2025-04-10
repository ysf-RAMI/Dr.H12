import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import FilieresList from '../screens/Filiers/FilieresList';
import ModulesList from '../screens/Filiers/ModulesList';
import ResourcesList from '../screens/Filiers/ResourcesList';

const Stack = createStackNavigator();

export default function FiliersNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false
      }}
    >
      <Stack.Screen name="FilieresList" component={FilieresList} />
      <Stack.Screen name="ModulesList" component={ModulesList} />
      <Stack.Screen name="ResourcesList" component={ResourcesList} />
    </Stack.Navigator>
  );
}