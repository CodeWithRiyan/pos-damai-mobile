import Header from "@/components/header";
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
  Switch,
  Text,
  Toast,
  ToastTitle,
  useToast,
  VStack,
} from "@/components/ui";
import { getErrorMessage } from "@/lib/api/client";
import {
  Permission,
  useCreateRole,
  usePermissions,
  useRole,
  useRoles,
  useUpdateRole,
} from "@/lib/api/roles";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { ScrollView } from "react-native";
import z from "zod";

const roleSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi."),
  description: z.string(),
  permissionIds: z.array(z.string()),
});

type RoleFormValues = z.infer<typeof roleSchema>;

const initialValues: RoleFormValues = {
  name: "",
  description: "",
  permissionIds: [],
};

export default function RoleForm() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isAdd = !id;
  const roleId = id as string;

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: initialValues,
  });

  const { data: role, refetch: refetchRole } = useRole(roleId || "");
  const { refetch: refetchRoles } = useRoles();
  const { data: permissions = [], isLoading: isLoadingPermissions } =
    usePermissions();

  const createMutation = useCreateRole();
  const updateMutation = useUpdateRole();

  const isLoading = createMutation.isPending || updateMutation.isPending;

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
    if (roleId && role) {
      form.reset({
        name: role.name,
        description: role.description,
        permissionIds: role.permissions?.map((p) => p.id) || [],
      });
    } else if (!roleId) {
      form.reset(initialValues);
    }
  }, [roleId, role, form]);

  const onRefetch = () => {
    refetchRoles();

    if (roleId) {
      refetchRole();
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const onSubmit: SubmitHandler<RoleFormValues> = (data: RoleFormValues) => {
    if (role && roleId) {
      updateMutation.mutate(
        { id: roleId, ...data },
        {
          onSuccess: () => {
            onRefetch();
            handleCancel();

            toast.show({
              placement: "top",
              render: ({ id }) => (
                <Toast
                  nativeID={`toast-${id}`}
                  action="success"
                  variant="solid"
                >
                  <ToastTitle>Role berhasil diubah</ToastTitle>
                </Toast>
              ),
            });
          },
          onError: (error) => {
            showErrorToast(error);
          },
        },
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          onRefetch();
          handleCancel();

          toast.show({
            placement: "top",
            render: ({ id }) => (
              <Toast nativeID={`toast-${id}`} action="success" variant="solid">
                <ToastTitle>Role berhasil dibuat</ToastTitle>
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

  const groupedPermissions = permissions.reduce(
    (acc: Record<string, Permission[]>, permission: Permission) => {
      const module = permission.module;
      if (!acc[module]) {
        acc[module] = [];
      }
      acc[module].push(permission);
      return acc;
    },
    {},
  );

  return (
    <VStack className="flex-1 bg-white">
      <Header header={isAdd ? "TAMBAH ROLE" : "EDIT ROLE"} isGoBack />

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
            name="description"
            control={form.control}
            render={({
              field: { onChange, onBlur, value },
              fieldState: { error },
            }) => (
              <FormControl isInvalid={!!error}>
                <FormControlLabel>
                  <FormControlLabelText>Deskripsi</FormControlLabelText>
                </FormControlLabel>
                <Input>
                  <InputField
                    value={value}
                    autoComplete="off"
                    placeholder="Masukkan deskripsi"
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
            name="permissionIds"
            control={form.control}
            render={({ field: { value, onChange }, fieldState: { error } }) => (
              <FormControl isInvalid={!!error}>
                <FormControlLabel>
                  <FormControlLabelText className="font-bold text-typography-900">
                    Izin Akses
                  </FormControlLabelText>
                </FormControlLabel>

                {isLoadingPermissions ? (
                  <Text>Loading izin akses...</Text>
                ) : permissions.length === 0 ? (
                  <Text size="sm" className="text-slate-400 italic">
                    No permissions found.
                  </Text>
                ) : (
                  <>
                    {Object.entries(groupedPermissions).map(
                      ([module, modulePermissions]) => (
                        <VStack
                          key={module}
                          space="md"
                          className="mb-2 border border-background-300 rounded-md p-4"
                        >
                          <Text className="font-bold text-slate-500 uppercase text-sm">
                            {module}
                          </Text>
                          <VStack>
                            {modulePermissions.map((permission) => {
                              const isChecked = value.includes(permission.id);

                              return (
                                <HStack
                                  key={permission.id}
                                  className="items-center justify-between h-12"
                                >
                                  <Text className="flex-1 text-base">
                                    {permission.description}
                                  </Text>
                                  <Switch
                                    size="md"
                                    value={isChecked}
                                    onToggle={() => {
                                      const newValue = isChecked
                                        ? value.filter(
                                            (id) => id !== permission.id,
                                          )
                                        : [...value, permission.id];
                                      onChange(newValue);
                                    }}
                                  />
                                </HStack>
                              );
                            })}
                          </VStack>
                        </VStack>
                      ),
                    )}
                  </>
                )}

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
