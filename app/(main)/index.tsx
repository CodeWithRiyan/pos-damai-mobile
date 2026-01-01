import { HelloWave } from '@/components/hello-wave';
import { Box } from '@/components/ui/box';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import React from 'react';
import { ScrollView } from 'react-native';

export default function HomeScreen() {
  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 24 }}>
      <VStack space="xl">
        <Box className="flex-row items-center gap-2">
          <Heading size="3xl">Welcome Back!</Heading>
          <HelloWave />
        </Box>
        
        <Box className="bg-slate-100 p-6 rounded-2xl">
          <Heading size="md" className="mb-2">Managed Services</Heading>
          <Text size="md" className="text-typography-700">
            Use the sidebar to navigate through management of roles and users within your organization.
          </Text>
        </Box>

        <VStack space="md" className="bg-brand-secondary/10 p-6 rounded-2xl border border-brand-secondary/20">
          <Heading size="sm">System Status</Heading>
          <Text size="sm">
            Current system is operational. All local data is synced with the server.
          </Text>
        </VStack>
      </VStack>
    </ScrollView>
  );
}
