import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';
import { NotificationProvider } from './context/NotificationContextType';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NotificationProvider>
        <PaperProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </PaperProvider>
      </NotificationProvider>
    </GestureHandlerRootView>
  );
}

