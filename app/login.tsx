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
    Heading,
    Input,
    InputField,
    InputIcon,
    InputSlot,
    Spinner,
    Text,
    Toast,
    ToastDescription,
    ToastTitle,
    useToast,
    VStack,
} from '@/components/ui';
import { useLogin } from '@/lib/api/auth';
import { useRouter } from 'expo-router';
import { useState } from 'react';

export default function LoginScreen() {
  const router = useRouter();
  const loginMutation = useLogin();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async () => {
    console.log('handleLogin triggered', { email, password });
    if (!email || !password) {
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
      { email, password },
      {
        onSuccess: () => {
          console.log('Login success');
          router.replace('/(tabs)');
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
    <Box className="flex-1 bg-white dark:bg-slate-900">
      <Center className="flex-1 p-6">
        <VStack space="xl" className="w-full max-w-[400px]">
          <VStack space="xs" className="mb-6">
            <Heading size="3xl" className="text-primary-600 dark:text-primary-400">
              POS Damai
            </Heading>
            <Text size="md" className="text-typography-500 dark:text-typography-400">
              Please sign in to continue
            </Text>
          </VStack>

          <VStack space="md">
            <FormControl isInvalid={loginMutation.isError}>
              <FormControlLabel>
                <FormControlLabelText>Email</FormControlLabelText>
              </FormControlLabel>
              <Input>
                <InputField
                  type="text"
                  placeholder="name@example.com"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
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
                <FormControlError>
                  <FormControlErrorIcon as={AlertCircleIcon} />
                  <FormControlErrorText>
                    Invalid email or password
                  </FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>

            <Button
              size="lg"
              className="mt-4 rounded-xl"
              onPress={handleLogin}
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <Spinner color="white" />
              ) : (
                <ButtonText className="font-bold">Sign In</ButtonText>
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
