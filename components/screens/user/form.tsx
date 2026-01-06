import Header from "@/components/header";
import {
  Button,
  ButtonText,
  ChevronDownIcon,
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
  HStack,
  Input,
  InputField,
  Select,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicator,
  SelectDragIndicatorWrapper,
  SelectIcon,
  SelectInput,
  SelectItem,
  SelectPortal,
  SelectTrigger,
  Switch,
  Toast,
  ToastTitle,
  useToast,
  VStack,
} from "@/components/ui";
import { getErrorMessage } from "@/lib/api/client";
import { useRoles } from "@/lib/api/roles";
import {
  CreateUserDTO,
  UpdateUserDTO,
  useCreateUser,
  useUpdateUser,
  useUser,
  useUsers,
} from "@/lib/api/users";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { ScrollView } from "react-native";
import { z } from "zod";

export default function UserForm() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isAdd = !id;
  const userId = id as string;

  const userSchema = z.object({
    name: z.string().min(1, "Nama wajib diisi."),
    username: z.string().min(1, "Username wajib diisi."),
    password: userId ? z.string() : z.string().min(1, "Password wajib diisi."),
    roleId: z.string().min(1, "Role wajib diisi."),
    isActive: z.boolean(),
  });

  type UserFormValues = z.infer<typeof userSchema>;

  const initialValues: UserFormValues = {
    name: "",
    username: "",
    password: "",
    roleId: "",
    isActive: true,
  };

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: initialValues,
  });

  const { refetch: refetchUsers } = useUsers();
  const { data: user, refetch: refetchUser } = useUser(userId || "");
  const { data: roles = [] } = useRoles();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const toast = useToast();

  const showErrorToast = (error: unknown) => {
    toast.show({
      placement: "top",
      render: ({ id }) => {
        const toastId = "toast-" + id;
        return (
          <Toast nativeID={toastId} action="error" variant="solid">
            <ToastTitle>{getErrorMessage(error)}</ToastTitle>
          </Toast>
        );
      },
    });
  };

  useEffect(() => {
    if (userId && user) {
      form.reset({
        name: user.firstName || "",
        username: user.username,
        password: "",
        roleId: user.roles[0].roleId || "",
        isActive: user.isActive,
      });
    } else {
      form.reset(initialValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, user, userId]);

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
      };

      updateMutation.mutate(updateData, {
        onSuccess: () => {
          onRefetch();
          handleCancel();

          toast.show({
            placement: "top",
            render: ({ id }) => (
              <Toast nativeID={`toast-${id}`} action="success" variant="solid">
                <ToastTitle>Karyawan berhasil diubah</ToastTitle>
              </Toast>
            ),
          });
        },
        onError: (error) => {
          showErrorToast(error);
        },
      });
    } else {
      const { isActive, ...restData } = data
      const createData: CreateUserDTO = restData;

      createMutation.mutate(createData, {
        onSuccess: () => {
          onRefetch();
          handleCancel();

          toast.show({
            placement: "top",
            render: ({ id }) => (
              <Toast nativeID={`toast-${id}`} action="success" variant="solid">
                <ToastTitle>Karyawan berhasil diubah</ToastTitle>
              </Toast>
            ),
          });
        },
        onError: (error) => {
          showErrorToast(error);
        },
      });
    }
  };

  return (
    <VStack className="flex-1 bg-white">
      <Header header={isAdd ? "TAMBAH KARYAWAN" : "EDIT KARYAWAN"} isGoBack />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <VStack space="lg" className="p-4">
          <Controller
            name="name"
            control={form.control}
            render={({
              field: { onChange, onBlur, value },
              fieldState: { error },
            }) => (
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
            render={({
              field: { onChange, onBlur, value },
              fieldState: { error },
            }) => (
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
          {isAdd && (
            <Controller
              name="password"
              control={form.control}
              render={({
                field: { onChange, onBlur, value },
                fieldState: { error },
              }) => (
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
                      <FormControlErrorText>
                        {error.message}
                      </FormControlErrorText>
                    </FormControlError>
                  )}
                </FormControl>
              )}
            />
          )}
          <Controller
            control={form.control}
            name="roleId"
            render={({
              field: { onChange, onBlur, value },
              fieldState: { error },
            }) => (
              <FormControl isRequired isInvalid={!!error}>
                <FormControlLabel>
                  <FormControlLabelText>Role</FormControlLabelText>
                </FormControlLabel>
                <Select onValueChange={onChange} onBlur={onBlur}>
                  <SelectTrigger>
                    <SelectInput
                      value={roles.find((role) => role.id === value)?.name}
                      placeholder="Pilih Role"
                      className="flex-1 capitalize"
                    />
                    <SelectIcon className="mr-3" as={ChevronDownIcon} />
                  </SelectTrigger>
                  <SelectPortal>
                    <SelectBackdrop />
                    <SelectContent className="px-0">
                      <SelectDragIndicatorWrapper>
                        <SelectDragIndicator />
                      </SelectDragIndicatorWrapper>
                      {roles.map((role) => (
                        <SelectItem
                          key={role.id}
                          label={role.name}
                          value={role.id}
                          textStyle={{ className: "capitalize flex-1" }}
                          className="px-4 py-4"
                        />
                      ))}
                    </SelectContent>
                  </SelectPortal>
                </Select>
                {error && (
                  <FormControlError>
                    <FormControlErrorText>{error.message}</FormControlErrorText>
                  </FormControlError>
                )}
              </FormControl>
            )}
          />

          {userId && (
            <Controller
              control={form.control}
              name="isActive"
              render={({
                field: { onChange, onBlur, value },
                fieldState: { error },
              }) => (
                <FormControl
                  isInvalid={!!error}
                  className="flex-row gap-4 items-center border border-background-300 px-4 rounded-md flex-1"
                >
                  <FormControlLabel className="mb-0 flex-1">
                    <FormControlLabelText>Akun Aktif</FormControlLabelText>
                  </FormControlLabel>
                  <Switch
                    size="md"
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    className="border-none"
                  />
                </FormControl>
              )}
            />
          )}
        </VStack>
      </ScrollView>
      <HStack className="w-full p-4 border-t border-slate-200 justify-end gap-4">
        <Button
          action="primary"
          onPress={form.handleSubmit(onSubmit)}
          disabled={createMutation.isPending || updateMutation.isPending}
          className="bg-brand-primary flex-1"
        >
          <ButtonText className="text-white">
            {createMutation.isPending || updateMutation.isPending
              ? "MENYIMPAN..."
              : "SIMPAN"}
          </ButtonText>
        </Button>
      </HStack>
    </VStack>
  );
}
