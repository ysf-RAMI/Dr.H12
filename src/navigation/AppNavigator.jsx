import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'react-native';
import Welcome from '../screens/Welcome';
import TabNavigator from '../component/TabNavigator';
import ModulesList from '../screens/Filiers/ModulesList';
import ResourcesList from '../screens/Filiers/ResourcesList';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <>
      <StatusBar />
      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#01162e',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerShown: false
        }}
      >
        <Stack.Screen 
          name="Welcome" 
          component={Welcome}
        />
        
        {/* Main TabNavigator that will be the container for most screens */}
        <Stack.Screen
          name="Main"
          component={TabNavigator}
        />
        
        {/* These screens will appear on top of the TabNavigator */}
        <Stack.Screen 
          name="ModulesList" 
          component={ModulesList}
        />
        <Stack.Screen 
          name="ResourcesList" 
          component={ResourcesList}
        />
     
      </Stack.Navigator>
    </>
  );
}