import Header from '@/components/header';
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
  HStack,
  Input,
  InputField,
  Pressable,
  Spinner,
  Text,
  useToast,
  VStack,
} from '@/components/ui';
import SelectModal from '@/components/ui/select/select-modal';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { useUserStore } from '@/stores/user';
import { useRoles } from '@/hooks/use-role';
import {
  CreateUserDTO,
  UpdateUserDTO,
  useCreateUser,
  useUpdateUser,
  useUser,
  useUsers,
} from '@/hooks/use-user';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { ScrollView } from 'react-native';
import { z } from 'zod';

export default function UserForm() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isAdd = !id;
  const userId = id as string;

  const userSchema = z.object({
    name: z.string().min(1, 'Nama wajib diisi.'),
    username: z.string().min(1, 'Username wajib diisi.'),
    password: userId ? z.string() : z.string().min(1, 'Password wajib diisi.'),
    roleId: z.string().min(1, 'Role wajib diisi.'),
  });

  type UserFormValues = z.infer<typeof userSchema>;

  const initialValues: UserFormValues = {
    name: '',
    username: '',
    password: '',
    roleId: '',
  };

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: initialValues,
  });

  const { refetch: refetchUsers } = useUsers();
  const { data: user, refetch: refetchUser } = useUser(userId || '');
  const { data: roles = [] } = useRoles();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const toast = useToast();

  useEffect(() => {
    if (userId && user) {
      form.reset({
        name: user.name || user.firstName || '',
        username: user.username,
        password: '',
        roleId: user.roles?.[0]?.id || '',
      });
    } else {
      form.reset(initialValues);
    }
  }, [form, user, userId, roles.length]);

  const onRefetch = () => {
    refetchUsers();

    if (userId) {
      refetchUser();
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const onSubmit: SubmitHandler<UserFormValues> = (data: UserFormValues) => {
    if (userId && user) {
      const updateData: UpdateUserDTO = {
        ...data,
        id: user.id,
        password: user.password || undefined,
      };

      updateMutation.mutate(updateData, {
        onSuccess: () => {
          onRefetch();
          useUserStore.getState().incrementVersion();
          handleCancel();

          showSuccessToast(toast, 'Karyawan berhasil diubah');
        },
        onError: (error) => {
          showErrorToast(toast, error);
        },
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          onRefetch();
          useUserStore.getState().incrementVersion();
          handleCancel();

          showSuccessToast(toast, 'Karyawan berhasil diubah');
        },
        onError: (error) => {
          showErrorToast(toast, error);
        },
      });
    }
  };

  return (
    <VStack className="flex-1 bg-white">
      <Header header={isAdd ? 'TAMBAH KARYAWAN' : 'EDIT KARYAWAN'} isGoBack />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <VStack space="lg" className="p-4">
          <Controller
            name="name"
            control={form.control}
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <FormControl isRequired isInvalid={!!error}>
                <FormControlLabel>
                  <FormControlLabelText>Nama</FormControlLabelText>
                </FormControlLabel>
                <Input>
                  <InputField
                    value={value}
                    autoComplete="name"
                    placeholder="Masukkan nama"
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                </Input>
                {error && (
                  <FormControlError>
                    <FormControlErrorText>{error.message}</FormControlErrorText>
                  </FormControlError>
                )}
              </FormControl>
            )}
          />
          <Controller
            name="username"
            control={form.control}
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <FormControl isRequired isInvalid={!!error}>
                <FormControlLabel>
                  <FormControlLabelText>Username</FormControlLabelText>
                </FormControlLabel>
                <Input>
                  <InputField
                    value={value}
                    autoComplete="off"
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Masukkan username"
                  />
                </Input>
                {error && (
                  <FormControlError>
                    <FormControlErrorText className="text-red-500">
                      {error.message}
                    </FormControlErrorText>
                  </FormControlError>
                )}
              </FormControl>
            )}
          />
          <Controller
            name="password"
            control={form.control}
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <FormControl isRequired={isAdd} isInvalid={!!error}>
                <FormControlLabel>
                  <FormControlLabelText>Password</FormControlLabelText>
                </FormControlLabel>
                <Input>
                  <InputField
                    value={value}
                    type="password"
                    autoComplete="new-password"
                    placeholder="Masukkan password"
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                </Input>
                {error && (
                  <FormControlError>
                    <FormControlErrorText>{error.message}</FormControlErrorText>
                  </FormControlError>
                )}
              </FormControl>
            )}
          />
          <Controller
            control={form.control}
            name="roleId"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <FormControl isRequired isInvalid={!!error}>
                <FormControlLabel>
                  <FormControlLabelText>Role</FormControlLabelText>
                </FormControlLabel>
                <SelectModal
                  value={value}
                  placeholder="Pilih Role"
                  searchPlaceholder="Cari nama role"
                  options={roles.map((role) => ({
                    label: role.name,
                    value: role.id,
                  }))}
                  className="flex-1"
                  onChange={onChange}
                />
                {error && (
                  <FormControlError>
                    <FormControlErrorText>{error.message}</FormControlErrorText>
                  </FormControlError>
                )}
              </FormControl>
            )}
          />


        </VStack>
      </ScrollView>
      <HStack className="w-full p-4 border-t border-slate-200 justify-end gap-4">
        <Pressable
          className="w-full rounded-sm h-10 flex justify-center items-center bg-primary-500 border border-primary-500"
          disabled={isLoading}
          onPress={form.handleSubmit(onSubmit)}
        >
          {isLoading ? (
            <Spinner size="small" color="#FFFFFF" />
          ) : (
            <Text size="sm" className="text-typography-0 font-bold">
              SIMPAN
            </Text>
          )}
        </Pressable>
      </HStack>
    </VStack>
  );
}
