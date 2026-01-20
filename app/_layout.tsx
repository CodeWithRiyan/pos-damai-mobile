import { GluestackUIProvider } from '@/components/ui';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import 'react-native-reanimated';
import '../global.css';

import { PopUpConfirmProvider } from '@/components/pop-up-confirm';
import { SyncConfirmationModal } from '@/components/sync-confirmation-modal';
import { useSyncManager } from '@/hooks/use-sync-manager';
import { authStorageAdapter, initializeStorage } from '@/lib/storage';
import { initializeDb } from '@/lib/db';
import { QueryProvider } from '@/providers/query-provider';
import { useNetworkMonitoring } from '@/stores/network-store';
import * as NavigationBar from "expo-navigation-bar";

export const unstable_settings = {
  anchor: '(main)',
};

export default function RootLayout() {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Hide navigation bar on Android
    NavigationBar.setVisibilityAsync("hidden");
    NavigationBar.setBehaviorAsync("overlay-swipe");
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
      // Rehydrate auth store after storage is ready
      const { useAuthStore } = await import('@/stores/auth');
      useAuthStore.getState().rehydrate();
      await initializeDb(); // Initialize SQLite tables
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
    <QueryProvider>
      <GluestackUIProvider>
        <ThemeProvider value={DefaultTheme}>
          <PopUpConfirmProvider>
            <Stack>
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="(main)" options={{ headerShown: false }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            </Stack>
            <StatusBar style="dark" hidden />
          </PopUpConfirmProvider>
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
