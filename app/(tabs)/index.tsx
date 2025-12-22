import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';

import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { Center } from '@/components/ui/center';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';

export default function HomeScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <VStack space="xl" className="p-6">
        <Box className="flex-row items-center gap-2">
          <Heading size="3xl">Welcome!</Heading>
          <HelloWave />
        </Box>
        
        <Box className="bg-slate-100 dark:bg-slate-800 p-6 rounded-2xl">
          <Heading size="md" className="mb-2">Gluestack UI v3 Ready</Heading>
          <Text size="md" className="text-typography-700 dark:text-typography-300">
            You are now using the latest Gluestack UI with NativeWind. 
            Enjoy seamless styling and state-of-the-art accessibility.
          </Text>
        </Box>

        <VStack space="md" className="bg-primary-50 dark:bg-primary-900/20 p-6 rounded-2xl border border-primary-200 dark:border-primary-800">
          <Heading size="sm">Quick Start</Heading>
          <Text size="sm">
            1. Edit <Text className="font-bold">app/(tabs)/index.tsx</Text>
            {"\n"}2. Add components with <Text className="italic">npx gluestack-ui add</Text>
            {"\n"}3. Style with Tailwind classes!
          </Text>
        </VStack>

        <Center className="mt-4">
          <Button size="lg" className="rounded-full shadow-lg" onPress={() => alert('Gluestack is Awesome!')}>
            <ButtonText className="font-bold">Explore Components</ButtonText>
          </Button>
        </Center>
      </VStack>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
