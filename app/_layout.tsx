import { GluestackUIProvider } from '@/components/ui';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import 'react-native-reanimated';
import '../global.css';

import { ActionDrawerProvider } from '@/components/action-drawer';
import { PopUpConfirmProvider } from '@/components/pop-up-confirm';
import { SyncConfirmationModal } from '@/components/sync-confirmation-modal';
import { useSyncManager } from '@/hooks/use-sync-manager';
import { checkAndResetDbOnUpdate, initializeDb } from '@/lib/db';
import { authStorageAdapter, initializeStorage } from '@/lib/storage';
import { SyncFloatingButton } from '@/components/sync-floating-button';
import { useNetworkMonitoring } from '@/stores/network';
import * as NavigationBar from 'expo-navigation-bar';

export const unstable_settings = {
  anchor: '(main)',
};

export default function RootLayout() {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Hide navigation bar on Android
    NavigationBar.setVisibilityAsync('hidden');
    NavigationBar.setBehaviorAsync('overlay-swipe');
  }, []);

  // Initialize network monitoring
  useNetworkMonitoring();

  // Initialize sync manager
  const { showSyncModal, handleCloseSyncModal } = useSyncManager();

  const [isMounted, setIsMounted] = React.useState(false);
  const [isStorageReady, setIsStorageReady] = React.useState(false);

  useEffect(() => {
    const init = async () => {
      await initializeStorage();

      // Check for version update and potentially reset DB
      const wasReset = await checkAndResetDbOnUpdate();
      if (!wasReset) {
        // Only initialize if we didn't just reset (resetDb re-initializes internally)
        await initializeDb();
      }

      // Rehydrate auth store after storage is ready
      const { useAuthStore } = await import('@/stores/auth');
      useAuthStore.getState().rehydrate();

      setIsStorageReady(true);
      setIsMounted(true);
    };
    init();
  }, []);

  // Handle auth redirection
  useEffect(() => {
    if (!isMounted || !isStorageReady) return;

    const token = authStorageAdapter.getToken();
    const inAuthGroup = segments[0] === 'login';

    if (!token && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/login');
    } else if (token && inAuthGroup) {
      // Redirect to home if already authenticated and trying to access login
      router.replace('/');
    }
  }, [segments, router, isMounted, isStorageReady]);

  if (!isMounted || !isStorageReady) {
    return null;
  }

  return (
    <GluestackUIProvider>
      <ThemeProvider value={DefaultTheme}>
        <ActionDrawerProvider>
          <PopUpConfirmProvider>
            <Stack>
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="(main)" options={{ headerShown: false }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            </Stack>
            <StatusBar style="dark" hidden />
            <SyncConfirmationModal isOpen={showSyncModal} onClose={handleCloseSyncModal} />
            <SyncFloatingButton />
          </PopUpConfirmProvider>
        </ActionDrawerProvider>
      </ThemeProvider>
    </GluestackUIProvider>
  );
}
