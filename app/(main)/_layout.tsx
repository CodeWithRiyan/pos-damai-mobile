import { Sidebar } from '@/components/sidebar';
import { Stack } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

export default function MainLayout() {
  return (
    <View className="flex-1 flex-row bg-white">
      <Sidebar />
      <View className="flex-1">
        <Stack
          screenOptions={{
            headerShown: true,
            headerShadowVisible: false,
            headerStyle: {
              backgroundColor: 'transparent',
            },
          }}
        >
          <Stack.Screen name="index" options={{ title: 'Dashboard' }} />
          <Stack.Screen name="roles/index" options={{ title: 'Role Management' }} />
          <Stack.Screen name="users/index" options={{ title: 'User Management' }} />
        </Stack>
      </View>
    </View>
  );
}
