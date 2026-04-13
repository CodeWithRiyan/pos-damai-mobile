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
import { SyncFloatingButton } from '@/components/sync-floating-button';
import { checkAndResetDbOnUpdate, initializeDb } from '@/db';
import { useSyncManager } from '@/hooks/use-sync-manager';
import { useNetworkMonitoring } from '@/stores/system/network';
import { authStorageAdapter, initializeStorage } from '@/utils/storage';
import * as NavigationBar from 'expo-navigation-bar';
import { AppState, AppStateStatus } from 'react-native';

export const unstable_settings = {
  anchor: '(main)',
};

export default function RootLayout() {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const handleSystemUI = async () => {
      await NavigationBar.setVisibilityAsync('hidden');
      await NavigationBar.setBehaviorAsync('overlay-swipe');
    };

    handleSystemUI();

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        handleSystemUI();
      }
    });

    return () => {
      subscription.remove();
    };
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
      const { useAuthStore } = await import('@/stores/system/auth');
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
