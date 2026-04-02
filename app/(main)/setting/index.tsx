import { usePopUpConfirm } from '@/components/pop-up-confirm';
import { Box } from '@/components/ui/box';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { VStack } from '@/components/ui/vstack';
import { resetDb, initializeDb } from '@/lib/db';
import { showErrorToast } from '@/lib/utils/toast';
import { useRouter } from 'expo-router';
import React from 'react';
import { useAuthStore } from '@/stores/auth';
import { Pressable, ScrollView } from 'react-native';
import { authStorageAdapter, storageAdapter } from '@/lib/storage';

export default function SettingScreen() {
  const router = useRouter();
  const { showPopUpConfirm, hidePopUpConfirm } = usePopUpConfirm();
  const toast = useToast();

  const handleReset = () => {
    showPopUpConfirm({
      title: 'Reset Database',
      icon: 'warning' as const,
      description: (
        <Text className="text-slate-500">
          Are you sure you want to delete all local data? This action cannot be undone and will
          require you to login again.
        </Text>
      ),
      showClose: true,
      okText: 'DELETE EVERYTHING',
      closeText: 'CANCEL',
      okVariant: 'destructive' as const,
      onOk: async () => {
        try {
          await resetDb();
          await initializeDb();

          // Clear Zustand auth profile from memory
          useAuthStore.getState().setProfile(null);
          authStorageAdapter.clearAll();
          storageAdapter.removeItem('lastSyncAt');
          hidePopUpConfirm();
          router.replace('/login');
        } catch (error) {
          hidePopUpConfirm();
          showErrorToast(toast, error);
          console.error(error);
        }
      },
    });
  };

  return (
    <Box className="flex-1 bg-gray-50 p-4">
      <VStack space="md" className="flex-1 max-w-2xl mx-auto w-full">
        <HStack className="items-center mb-4" space="md">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-full active:bg-gray-200"
          >
            <IconSymbol name="chevron.left" size={24} className="text-gray-700" />
          </Pressable>
          <Heading size="xl">Settings</Heading>
        </HStack>

        <ScrollView showsVerticalScrollIndicator={false}>
          <VStack space="lg">
            {/* General Section (Placeholder) */}
            <VStack space="sm">
              <Text className="text-gray-500 font-medium ml-1">General</Text>
              <Box className="bg-white rounded-xl overflow-hidden border border-gray-100">
                <HStack className="p-4 items-center justify-between">
                  <HStack space="md" className="items-center">
                    <Box className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center">
                      <IconSymbol name="info.circle" size={18} className="text-blue-500" />
                    </Box>
                    <Text>App Version</Text>
                  </HStack>
                  <Text className="text-gray-500">1.0.0</Text>
                </HStack>
              </Box>
            </VStack>

            {/* Data Management Section */}
            <VStack space="sm">
              <Text className="text-gray-500 font-medium ml-1">Data & Synchronization</Text>
              <Box className="bg-white rounded-xl overflow-hidden border border-gray-100">
                <Pressable
                  className="p-4 flex-row items-center justify-between active:bg-gray-50"
                  onPress={() => router.push('/sync')}
                >
                  <HStack space="md" className="items-center">
                    <Box className="w-8 h-8 rounded-full bg-orange-50 items-center justify-center">
                      <IconSymbol
                        name="arrow.triangle.2.circlepath"
                        size={18}
                        className="text-orange-500"
                      />
                    </Box>
                    <VStack>
                      <Text className="font-medium">Sinkronisasi Data</Text>
                      <Text className="text-gray-500 text-sm">
                        Kelola sinkronisasi data dengan server
                      </Text>
                    </VStack>
                  </HStack>
                  <IconSymbol name="chevron.right" size={16} className="text-gray-400" />
                </Pressable>
              </Box>
            </VStack>

            {/* Danger Zone */}
            <VStack space="sm">
              <Text className="text-red-500 font-medium ml-1">Danger Zone</Text>
              <Box className="bg-white rounded-xl overflow-hidden border border-red-100">
                <Pressable
                  className="p-4 flex-row items-center justify-between active:bg-red-50"
                  onPress={handleReset}
                >
                  <HStack space="md" className="items-center">
                    <Box className="w-8 h-8 rounded-full bg-red-50 items-center justify-center">
                      <IconSymbol name="trash" size={18} className="text-red-500" />
                    </Box>
                    <VStack>
                      <Text className="text-red-500 font-medium">Reset Database</Text>
                      <Text className="text-gray-500 text-sm">Clear all local data and logout</Text>
                    </VStack>
                  </HStack>
                  <IconSymbol name="chevron.right" size={16} className="text-gray-400" />
                </Pressable>
              </Box>
            </VStack>
          </VStack>
        </ScrollView>
      </VStack>
    </Box>
  );
}
