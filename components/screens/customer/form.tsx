import Header from '@/components/header';
import { Pressable, Text } from '@/components/ui';
import { Box } from '@/components/ui/box';
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
} from '@/components/ui/form-control';
import { HStack } from '@/components/ui/hstack';
import { Input, InputField, InputSlot } from '@/components/ui/input';
import SelectModal from '@/components/ui/select/select-modal';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { VStack } from '@/components/ui/vstack';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { useCreateCustomer, useCustomer, useUpdateCustomer } from '@/hooks/use-customer';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { ScrollView } from 'react-native';
import { PriceType } from '@/constants';
import z from 'zod';

export default function CustomerForm() {
  const router = useRouter();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const customerId = id;
  const isAdd = !id;

  const customerSchema = z.object({
    name: z.string().min(1, 'Nama wajib diisi.'),
    code: z.string().min(1, 'Kode wajib diisi.'),
    category: z.enum(['RETAIL', 'WHOLESALE']),
    phone: z.string(),
    address: z.string(),
  });

  type CustomerFormValues = z.infer<typeof customerSchema>;

  const initialValues: CustomerFormValues = {
    name: '',
    code: '',
    category: PriceType.RETAIL,
    phone: '',
    address: '',
  };

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: initialValues,
  });
  const isRetail = form.watch('category') === PriceType.RETAIL;

  const { data: customer, loading: loadingCustomer } = useCustomer(id || '');
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();

  const categories = [
    { label: 'Retail', value: 'RETAIL' },
    { label: 'Grosir', value: 'WHOLESALE' },
  ];

  useEffect(() => {
    if (customerId && customer) {
      form.reset({
        name: customer.name,
        code: customer.code || '',
        category: customer.category,
        phone: customer.phone || '',
        address: customer.address || '',
      });
    } else {
      form.reset(initialValues);
    }
  }, [customer, customerId, form]);

  const onSubmit: SubmitHandler<CustomerFormValues> = (data: CustomerFormValues) => {
    if (customerId && customer) {
      updateMutation.mutate(
        {
          ...data,
          id: customerId,
          code: `${isRetail ? 'B' : 'M'}${data.code}`,
        },
        {
          onSuccess: () => {
            showSuccessToast(toast, 'Pelanggan berhasil diperbarui');
            router.back();
          },
          onError: (error) => showErrorToast(toast, error),
        },
      );
    } else {
      createMutation.mutate(
        {
          ...data,
          code: `${isRetail ? 'B' : 'M'}${data.code}`,
        },
        {
          onSuccess: () => {
            showSuccessToast(toast, 'Pelanggan berhasil ditambahkan');
            form.reset(initialValues);
            router.back();
          },
          onError: (error) => showErrorToast(toast, error),
        },
      );
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  if (!isAdd && loadingCustomer) {
    return (
      <Box className="flex-1 justify-center items-center">
        <Spinner size="large" />
      </Box>
    );
  }

  return (
    <Box className="flex-1 bg-white">
      <Header header={isAdd ? 'TAMBAH PELANGGAN' : 'EDIT PELANGGAN'} isGoBack />
      <ScrollView className="flex-1">
        <VStack space="lg" className="p-4">
          <Controller
            name="name"
            control={form.control}
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <FormControl isRequired isInvalid={!!error}>
                <FormControlLabel>
                  <FormControlLabelText>Nama Pelanggan</FormControlLabelText>
                </FormControlLabel>
                <Input>
                  <InputField
                    value={value}
                    autoComplete="name"
                    placeholder="Masukkan nama pelanggan"
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
            name="category"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <FormControl isRequired isInvalid={!!error}>
                <FormControlLabel>
                  <FormControlLabelText>Kategori</FormControlLabelText>
                </FormControlLabel>
                <SelectModal
                  value={value || ''}
                  placeholder="Pilih Kategori"
                  options={categories}
                  className="flex-1"
                  showSearch={false}
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

          <Controller
            name="code"
            control={form.control}
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <FormControl isRequired isInvalid={!!error}>
                <FormControlLabel>
                  <FormControlLabelText>Kode</FormControlLabelText>
                </FormControlLabel>
                <Input>
                  <InputSlot>
                    <Text className="text-gray-500 font-bold pl-4">{isRetail ? 'B' : 'M'}</Text>
                  </InputSlot>
                  <InputField
                    value={value}
                    autoComplete="off"
                    placeholder="Masukkan kode"
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
          <Text size="sm" className="text-typography-0 font-bold">
            {isLoading ? 'MENYIMPAN...' : 'SIMPAN'}
          </Text>
        </Pressable>
      </HStack>
    </Box>
  );
}
