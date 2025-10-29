import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { registerForPushNotificationsAsync } from './src/services/notifications';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useDayStore } from './src/stores/dayStore';

export default function App() {
  const { initializeNotifications } = useDayStore();

  useEffect(() => {
    // 通知の初期化
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        console.log('Push notification token:', token);
      }
    });
    initializeNotifications();
  }, []);

  return (
    <SafeAreaProvider>
      <PaperProvider>
        <NavigationContainer>
          <AppNavigator />
          <StatusBar style="auto" />
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
