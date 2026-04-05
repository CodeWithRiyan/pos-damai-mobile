import ShiftTabs from '@/components/screens/shift/tab';
import { VStack } from '@/components/ui';
import { Stack } from 'expo-router';
import { View } from 'react-native';

export default function ShiftLayout() {
  return (
    <VStack className="flex-1">
      <ShiftTabs />
      <View className="flex-1">
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            presentation: 'card',
          }}
        />
      </View>
    </VStack>
  );
}
