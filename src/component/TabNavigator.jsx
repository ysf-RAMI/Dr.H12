import React, { useState, useEffect } from 'react';
import { StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import screens
import Home from '../screens/Home';
import Announcements from '../screens/Announcements';
import Login from '../screens/Login';
import Dashboard from '../screens/Dashboard';
import FiliersNavigator from '../navigation/FiliersNavigator';
import Hamout from '../screens/Hamout';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Create stack navigators for each tab to handle nested navigation
const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeScreen" component={Home} />
    <Stack.Screen name="Hamout" component={Hamout} />
  </Stack.Navigator>
);

export default function TabNavigator() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const auth = await AsyncStorage.getItem('auth');
        setIsAuthenticated(!!auth);
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [isFocused]);

  if (loading) {
    return null;
  }

  return (
    <>
      <StatusBar
        backgroundColor="#01162e"
        barStyle="light-content"
        translucent={false}
      />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === 'HomeTab') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'AnnouncementsTab') {
              iconName = focused ? 'notifications' : 'notifications-outline';
            } else if (route.name === 'LoginTab') {
              iconName = focused ? 'log-in' : 'log-in-outline';
            } else if (route.name === 'DashboardTab') {
              iconName = focused ? 'grid' : 'grid-outline';
            } else if (route.name === 'FilièresTab') {
              iconName = focused ? 'school' : 'school-outline';
            }
            return <Icon name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#70ade0',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: {
            backgroundColor: '#01162e',
            paddingBottom: 5,
            height: 60,
          },
        })}
      >
        <Tab.Screen 
          name="HomeTab" 
          component={HomeStack} 
          options={{ tabBarLabel: 'Home', }}
        />
        <Tab.Screen 
          name="AnnouncementsTab" 
          component={Announcements} 
          options={{ tabBarLabel: 'Announcements',animation: 'shift' }}
        />
        <Tab.Screen 
          name="FilièresTab" 
          component={FiliersNavigator} 
          options={{ tabBarLabel: 'Filières',animation: 'shift' }}
          />
          {!isAuthenticated ? (
            <Tab.Screen 
              name="LoginTab" 
              component={Login} 
              options={{ tabBarLabel: 'Login',animation: 'shift',sceneStyle: { backgroundColor: '#01162e' } }}
            />
          ) : (
            <Tab.Screen 
              name="DashboardTab" 
              component={Dashboard} 
              options={{ tabBarLabel: 'Dashboard' ,animation: 'shift'}}
              
            />
          )}
      </Tab.Navigator>
    </>
  );
}
