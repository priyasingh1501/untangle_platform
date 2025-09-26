import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppNavigator } from '@/navigation/AppNavigator';
import { AuthProvider } from '@/storage/AuthContext';
import Constants from 'expo-constants';
import { useEffect } from 'react';
import { setApiBaseUrl } from '@/api/client';
import { StyleSheet, View } from 'react-native';

const queryClient = new QueryClient();

export default function App() {
  useEffect(() => {
    const apiBaseUrl = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
    if (apiBaseUrl) setApiBaseUrl(apiBaseUrl);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NavigationContainer>
          <AppNavigator />
          <StatusBar style="auto" />
        </NavigationContainer>
      </AuthProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
});
