import {
  Heading,
  HStack,
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Pressable,
  Text,
} from '@/components/ui';
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
} from '@/components/ui/form-control';
import { Input, InputField, InputSlot } from '@/components/ui/input';
import SelectModal from '@/components/ui/select/select-modal';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { VStack } from '@/components/ui/vstack';
import { PriceType } from '@/constants';
import { refetchCustomerById, useCreateCustomer, useUpdateCustomer } from '@/hooks/use-customer';
import { useCustomerStore } from '@/stores/customer';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import z from 'zod';

export default function CustomerModalForm() {
  const { open, setOpen, data: dataCustomer } = useCustomerStore();
  const toast = useToast();

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

  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();

  const categories = [
    { label: 'Retail', value: 'RETAIL' },
    { label: 'Grosir', value: 'WHOLESALE' },
  ];

  useEffect(() => {
    if (dataCustomer) {
      refetchCustomerById(dataCustomer.id).then((freshData) => {
        if (freshData) {
          form.reset({
            name: freshData.name,
            code: freshData.code || '',
            category: freshData.category,
            phone: freshData.phone || '',
            address: freshData.address || '',
          });
        }
      });
    } else {
      form.reset(initialValues);
    }
  }, [dataCustomer, form]);

  const onSubmit: SubmitHandler<CustomerFormValues> = (data: CustomerFormValues) => {
    if (dataCustomer) {
      updateMutation.mutate(
        {
          ...data,
          id: dataCustomer.id,
          code: `${isRetail ? 'B' : 'M'}${data.code}`,
        },
        {
          onSuccess: () => {
            showSuccessToast(toast, 'Pelanggan berhasil diperbarui');
            useCustomerStore.getState().incrementVersion();
            form.reset(initialValues);
            setOpen(false);
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
          onSuccess: (newCustomer) => {
            showSuccessToast(toast, 'Pelanggan berhasil ditambahkan');
            useCustomerStore.getState().incrementVersion();
            if (useCustomerStore.getState().onSuccess) {
              useCustomerStore.getState().onSuccess?.(newCustomer);
            }
            form.reset(initialValues);
            setOpen(false);
          },
          onError: (error) => showErrorToast(toast, error),
        },
      );
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={open}
      onClose={() => {
        setOpen(false);
        form.reset(initialValues);
      }}
      size="md"
    >
      <ModalBackdrop />
      <ModalContent className="p-0 max-h-[90%]">
        <ModalHeader className="p-4 border-b border-background-300">
          <Heading size="md" className="text-center flex-1">
            {dataCustomer ? 'EDIT PELANGGAN' : 'TAMBAH PELANGGAN'}
          </Heading>
        </ModalHeader>
        <ModalBody className="m-0" showsVerticalScrollIndicator={false}>
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
        </ModalBody>
        <ModalFooter className="p-4 pt-0">
          <HStack space="md">
            <Pressable
              className="w-full flex px-4 h-10 items-center justify-center rounded-lg bg-primary-500 active:bg-primary-500/90"
              onPress={form.handleSubmit(onSubmit)}
              disabled={isLoading}
            >
              {isLoading ? (
                <Spinner size="small" color="#FFFFFF" />
              ) : (
                <Text size="sm" className="text-typography-0 font-bold">
                  {!dataCustomer ? 'SIMPAN' : 'PERBARUI'}
                </Text>
              )}
            </Pressable>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
