// app/(main)/purchasing/_layout.tsx
import { Stack } from 'expo-router';

export default function TransactionLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="success"
        options={{
          animation: 'simple_push',
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="receipt"
        options={{
          animation: 'simple_push',
          presentation: 'card',
        }}
      />
    </Stack>
  );
}
