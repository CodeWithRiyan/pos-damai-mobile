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
  Input,
  InputField,
  InputIcon,
  InputSlot,
  HStack,
  Spinner,
  Text,
  Toast,
  ToastDescription,
  ToastTitle,
  useToast,
  VStack
} from '@/components/ui';
import { useLogin } from '@/lib/api/auth';
import { getErrorMessage } from '@/lib/api/client';
import { SyncEngine } from '@/lib/sync/sync-engine';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';

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
    console.log('handleLogin triggered', { username, password });
    if (!username || !password) {
      toast.show({
        placement: 'top',
        render: ({ id }) => {
          const toastId = "toast-" + id;
          return (
            <Toast nativeID={toastId} action="error" variant="outline">
              <VStack space="xs">
                <ToastTitle>Validation Error</ToastTitle>
                <ToastDescription>Please fill in all fields.</ToastDescription>
              </VStack>
            </Toast>
          );
        },
      });
      return;
    }

    console.log('calling loginMutation.mutate');
    loginMutation.mutate(
      { username, password },
      {
        onSuccess: async () => {
          console.log('Login success, starting sync');
          try {
            setIsSyncing(true);
            setSyncStatus('Synchronizing data...');
            
            // Perform initial full sync
            await SyncEngine.sync();
            
            console.log('Sync success');
            router.replace('/');
          } catch (syncError: any) {
            console.error('Initial sync failed:', syncError);
            // Even if sync fails, we might want to let them in if offline is allowed
            // but for first login, it's better to ensure they have data.
            toast.show({
              placement: 'top',
              render: ({ id }) => {
                const toastId = "toast-" + id;
                return (
                  <Toast nativeID={toastId} action="warning" variant="outline">
                    <VStack space="xs">
                      <ToastTitle>Sync Warning</ToastTitle>
                      <ToastDescription>Login successful, but initial data sync failed. Some data may be missing.</ToastDescription>
                    </VStack>
                  </Toast>
                );
              },
            });
            router.replace('/');
          } finally {
            setIsSyncing(false);
          }
        },
        onError: (error: any) => {
          console.log('Login error callback', error);
          const errorMessage = error.response?.data?.message || 'Login failed. Please check your credentials.';
          toast.show({
            placement: 'top',
            render: ({ id }) => {
              const toastId = "toast-" + id;
              return (
                <Toast nativeID={toastId} action="error" variant="outline">
                  <VStack space="xs">
                    <ToastTitle>Login Error</ToastTitle>
                    <ToastDescription>{errorMessage}</ToastDescription>
                  </VStack>
                </Toast>
              );
            },
          });
        },
      }
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
                resizeMode="contain" 
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
