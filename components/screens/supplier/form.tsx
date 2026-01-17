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
  Text,
  Toast,
  ToastTitle,
  useToast,
  VStack,
} from "@/components/ui";
import { getErrorMessage } from "@/lib/api/client";
import {
  CreateSupplierDTO,
  UpdateSupplierDTO,
  useCreateSupplier,
  useUpdateSupplier,
  useSupplier,
  useSuppliers,
} from "@/lib/api/suppliers";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { ScrollView } from "react-native";
import { z } from "zod";


export default function SupplierForm() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isAdd = !id;
  const supplierId = id as string;

  const supplierSchema = z.object({
    name: z.string().min(1, "Nama wajib diisi."),
    phone: z.string(),
    address: z.string(),
  });

  type SupplierFormValues = z.infer<typeof supplierSchema>;

  const initialValues: SupplierFormValues = {
    name: "",
    phone: "",
    address: "",
  };

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: initialValues,
  });

  const { refetch: refetchSuppliers } = useSuppliers();
  const { data: supplier, refetch: refetchSupplier } = useSupplier(supplierId || "");

  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();

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
    if (supplierId && supplier) {
      form.reset({
        name: supplier.name,
        phone: supplier.phone || "",
        address: supplier.address || "",
      });
    } else {
      form.reset(initialValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, supplier, supplierId]);

  const onRefetch = () => {
    refetchSuppliers();
    if (supplierId) {
      refetchSupplier();
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const onSubmit: SubmitHandler<SupplierFormValues> = (
    data: SupplierFormValues
  ) => {
    if (supplierId && supplier) {
      const updateData: UpdateSupplierDTO = {
        ...data,
        id: supplier.id,
      };
      updateMutation.mutate(updateData, {
        onSuccess: () => {
          onRefetch();
          handleCancel();
          toast.show({
            placement: "top",
            render: ({ id }) => (
              <Toast nativeID={`toast-${id}`} action="success" variant="solid">
                <ToastTitle>Supplier berhasil diubah</ToastTitle>
              </Toast>
            ),
          });
        },
        onError: (error) => {
          showErrorToast(error);
        },
      });
    } else {
      const createData: CreateSupplierDTO = data;
      createMutation.mutate(createData, {
        onSuccess: () => {
          onRefetch();
          handleCancel();
          toast.show({
            placement: "top",
            render: ({ id }) => (
              <Toast nativeID={`toast-${id}`} action="success" variant="solid">
                <ToastTitle>Supplier berhasil ditambahkan</ToastTitle>
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
      <Header header={isAdd ? "TAMBAH SUPPLIER" : "EDIT SUPPLIER"} isGoBack />

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
            name="phone"
            control={form.control}
            render={({
              field: { onChange, onBlur, value },
              fieldState: { error },
            }) => (
              <FormControl isInvalid={!!error}>
                <FormControlLabel>
                  <FormControlLabelText>No Handphone</FormControlLabelText>
                </FormControlLabel>
                <Input>
                  <InputField
                    value={value}
                    autoComplete="tel"
                    placeholder="Masukkan no handphone"
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
            name="address"
            control={form.control}
            render={({
              field: { onChange, onBlur, value },
              fieldState: { error },
            }) => (
              <FormControl isInvalid={!!error}>
                <FormControlLabel>
                  <FormControlLabelText>Alamat</FormControlLabelText>
                </FormControlLabel>
                <Input>
                  <InputField
                    value={value}
                    autoComplete="address-line1"
                    placeholder="Masukkan alamat"
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
        </VStack>
      </ScrollView>
      <HStack className="w-full p-4 border-t border-slate-200 justify-end gap-4">
        <Pressable
          className="w-full rounded-sm h-9 flex justify-center items-center bg-primary-500 border border-primary-500"
          disabled={isLoading}
          onPress={form.handleSubmit(onSubmit)}
        >
          <Text size="sm" className="text-typography-0 font-bold">
            {isLoading ? "MENYIMPAN..." : "SIMPAN"}
          </Text>
        </Pressable>
      </HStack>
    </VStack>
  );
}
