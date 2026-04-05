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
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { useSupplierStore } from '@/stores/supplier';
import {
  CreateSupplierDTO,
  UpdateSupplierDTO,
  useCreateSupplier,
  useSuppliers,
  useUpdateSupplier,
  refetchSupplierById,
  Supplier,
} from '@/hooks/use-supplier';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { ScrollView } from 'react-native';
import { z } from 'zod';

export default function SupplierForm() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isAdd = !id;
  const supplierId = id as string;

  const [supplier, setSupplier] = useState<Supplier | null>(null);

  const supplierSchema = z.object({
    name: z.string().min(1, 'Nama wajib diisi.'),
    phone: z.string(),
    address: z.string(),
  });

  type SupplierFormValues = z.infer<typeof supplierSchema>;

  const initialValues: SupplierFormValues = {
    name: '',
    phone: '',
    address: '',
  };

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: initialValues,
  });

  const { refetch: refetchSuppliers } = useSuppliers();

  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const toast = useToast();

  useEffect(() => {
    if (supplierId) {
      refetchSupplierById(supplierId).then((data) => {
        setSupplier(data);
      });
    }
  }, [supplierId]);

  useEffect(() => {
    if (supplier) {
      form.reset({
        name: supplier.name,
        phone: supplier.phone || '',
        address: supplier.address || '',
      });
    } else if (!supplierId) {
      form.reset(initialValues);
    }
  }, [form, supplier, supplierId]);

  const onRefetch = () => {
    refetchSuppliers();
  };

  const handleCancel = () => {
    router.back();
  };

  const onSubmit: SubmitHandler<SupplierFormValues> = (data: SupplierFormValues) => {
    if (supplierId && supplier) {
      const updateData: UpdateSupplierDTO = {
        ...data,
        id: supplier.id,
      };
      updateMutation.mutate(updateData, {
        onSuccess: () => {
          onRefetch();
          useSupplierStore.getState().incrementVersion();
          handleCancel();
          showSuccessToast(toast, 'Supplier berhasil diubah');
        },
        onError: (error) => {
          showErrorToast(toast, error);
        },
      });
    } else {
      const createData = data as CreateSupplierDTO;
      createMutation.mutate(createData, {
        onSuccess: () => {
          onRefetch();
          useSupplierStore.getState().incrementVersion();
          form.reset(initialValues);
          handleCancel();
          showSuccessToast(toast, 'Supplier berhasil ditambahkan');
        },
        onError: (error) => {
          showErrorToast(toast, error);
        },
      });
    }
  };

  return (
    <VStack className="flex-1 bg-white">
      <Header header={isAdd ? 'TAMBAH SUPPLIER' : 'EDIT SUPPLIER'} isGoBack />

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
            name="phone"
            control={form.control}
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
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
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
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
