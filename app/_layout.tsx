import { GluestackUIProvider } from '@/components/ui';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import 'react-native-reanimated';
import '../global.css';

import { SyncConfirmationModal } from '@/components/sync-confirmation-modal';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSyncManager } from '@/hooks/use-sync-manager';
import { authStorageAdapter } from '@/lib/storage';
import { QueryProvider } from '@/providers/query-provider';
import { useNetworkMonitoring } from '@/stores/network-store';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const router = useRouter();
  
  // Initialize network monitoring
  useNetworkMonitoring();
  
  // Initialize sync manager
  const { showSyncModal, handleCloseSyncModal } = useSyncManager();

  const [isMounted, setIsMounted] = React.useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle auth redirection
  useEffect(() => {
    if (!isMounted) return;

    const token = authStorageAdapter.getToken();
    const inAuthGroup = segments[0] === 'login';

    if (!token && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/login');
    } else if (token && inAuthGroup) {
      // Redirect to home if already authenticated and trying to access login
      router.replace('/(tabs)');
    }
  }, [segments, router, isMounted]);

  return (
    <QueryProvider>
      <GluestackUIProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
        
        {/* Sync confirmation modal */}
        <SyncConfirmationModal
          isOpen={showSyncModal}
          onClose={handleCloseSyncModal}
        />
      </GluestackUIProvider>
    </QueryProvider>
  );
}
