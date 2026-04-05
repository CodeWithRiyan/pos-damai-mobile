import {
  AlertCircleIcon,
  Box,
  Button,
  ButtonText,
  Center,
  EyeIcon,
  EyeOffIcon,
  FormControl,
  FormControlError,
  FormControlErrorIcon,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
  HStack,
  Input,
  InputField,
  InputIcon,
  InputSlot,
  Spinner,
  Text,
  useToast,
  VStack,
} from '@/components/ui';
import { useLogin } from '@/hooks/use-auth';
import { getErrorMessage } from '@/db/client';
import { SyncEngine } from '@/db/sync-engine';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image } from 'expo-image';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { showToast } from '@/utils/toast';

export default function LoginScreen() {
  const router = useRouter();
  const loginMutation = useLogin();
  const toast = useToast();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async () => {
    if (!username || !password) {
      showToast(toast, {
        action: 'error',
        message: 'Please enter both username and password.',
        placement: 'top',
      });
      return;
    }

    loginMutation.mutate(
      { username: username.trimEnd(), password },
      {
        onSuccess: async () => {
          try {
            setIsSyncing(true);
            setSyncStatus('Synchronizing data...');

            // Perform initial full sync
            await SyncEngine.sync();

            router.replace('/');
          } catch (syncError: any) {
            // Even if sync fails, we might want to let them in if offline is allowed
            // but for first login, it's better to ensure they have data.
            showToast(toast, {
              action: 'error',
              message:
                syncError.message ||
                'Login successful, but initial data synchronization failed. Please try again.',
              placement: 'top',
            });
            router.replace('/');
          } finally {
            setIsSyncing(false);
          }
        },
        onError: (error: any) => {
          const errorMessage =
            error.response?.data?.message || 'Login failed. Please check your credentials.';
          showToast(toast, {
            action: 'error',
            message: errorMessage,
            placement: 'top',
          });
        },
      },
    );
  };

  return (
    <Box className="flex-1 bg-white">
      <Center className="flex-1 p-6">
        <VStack space="xl" className="w-full max-w-[400px]">
          <VStack space="xs" className="mb-6">
            <Box className="items-center mb-2">
              <Image
                source={require('../assets/images/logo.png')}
                style={{ width: 200, height: 66 }}
                contentFit="contain"
              />
            </Box>
            {/* <Heading size="3xl" className="text-brand-primary text-center">
              POS Damai
            </Heading>
            <Text size="md" className="text-typography-500 text-center">
              Please sign in to continue
            </Text> */}
          </VStack>

          <VStack space="md">
            <FormControl isInvalid={loginMutation.isError}>
              <FormControlLabel>
                <FormControlLabelText>Username</FormControlLabelText>
              </FormControlLabel>
              <Input>
                <InputField
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </Input>
            </FormControl>

            <FormControl isInvalid={loginMutation.isError}>
              <FormControlLabel>
                <FormControlLabelText>Password</FormControlLabelText>
              </FormControlLabel>
              <Input>
                <InputField
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                />
                <InputSlot className="pr-3" onPress={togglePasswordVisibility}>
                  <InputIcon
                    as={showPassword ? EyeIcon : EyeOffIcon}
                    className="text-typography-400"
                  />
                </InputSlot>
              </Input>
              {loginMutation.isError && (
                <Animated.View entering={FadeInUp} exiting={FadeOutUp}>
                  <FormControlError>
                    <FormControlErrorIcon as={AlertCircleIcon} className="text-red-500" />
                    <FormControlErrorText className="text-red-500 font-medium">
                      {getErrorMessage(loginMutation.error)}
                    </FormControlErrorText>
                  </FormControlError>
                </Animated.View>
              )}
            </FormControl>

            <Button
              size="lg"
              className="mt-4 rounded-xl bg-brand-primary active:bg-brand-primary/90"
              onPress={handleLogin}
              disabled={loginMutation.isPending || isSyncing}
            >
              {loginMutation.isPending || isSyncing ? (
                <HStack space="sm" className="items-center">
                  <Spinner color="white" />
                  <ButtonText className="font-bold text-white">
                    {isSyncing ? syncStatus : 'Signing In...'}
                  </ButtonText>
                </HStack>
              ) : (
                <ButtonText className="font-bold text-white">Sign In</ButtonText>
              )}
            </Button>
          </VStack>

          <Center className="mt-6">
            <Text size="sm" className="text-typography-500">
              Don&apos;t have an account? Contact your administrator.
            </Text>
          </Center>
        </VStack>
      </Center>
    </Box>
  );
}
