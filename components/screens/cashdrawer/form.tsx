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
import { Input, InputField } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { VStack } from '@/components/ui/vstack';
import {
  useCashDrawer,
  useCashDrawers,
  useCreateCashDrawer,
  useUpdateCashDrawer,
} from '@/lib/api/cashdrawers';
import { showErrorToast, showSuccessToast } from '@/lib/utils/toast';
import { useCashDrawerStore } from '@/stores/cashdrawer';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import z from 'zod';

export default function CashDrawerForm() {
  const { open, setOpen, data: dataCashDrawer } = useCashDrawerStore();
  const toast = useToast();

  const cashDrawerSchema = z.object({
    name: z.string().min(1, 'Nama Cashdrawer wajib diisi.'),
  });

  type CashDrawerFormValues = z.infer<typeof cashDrawerSchema>;

  const initialValues: CashDrawerFormValues = {
    name: '',
  };

  const form = useForm<CashDrawerFormValues>({
    resolver: zodResolver(cashDrawerSchema),
    defaultValues: initialValues,
  });

  const { refetch: refetchCashDrawers } = useCashDrawers();
  const { refetch: refetchCashDrawer } = useCashDrawer(dataCashDrawer?.id || '');

  const createMutation = useCreateCashDrawer();
  const updateMutation = useUpdateCashDrawer();

  const onRefetch = () => {
    refetchCashDrawers();
    if (dataCashDrawer) refetchCashDrawer();
  };

  useEffect(() => {
    if (dataCashDrawer) {
      form.setValue('name', dataCashDrawer.name);
    } else {
      form.reset(initialValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataCashDrawer, form]);

  const onSubmit: SubmitHandler<CashDrawerFormValues> = (data: CashDrawerFormValues) => {
    if (dataCashDrawer) {
      updateMutation.mutate(
        { id: dataCashDrawer.id, ...data },
        {
          onSuccess: () => {
            showSuccessToast(toast, 'Cashdrawer berhasil diperbarui');
            onRefetch();
            form.reset(initialValues);
            setOpen(false);
          },
          onError: (error) => showErrorToast(toast, error),
        },
      );
    } else {
      createMutation.mutate(
        { ...data, isActive: true },
        {
          onSuccess: (newCashDrawer) => {
            showSuccessToast(toast, 'Cashdrawer berhasil ditambahkan');
            onRefetch();
            if (useCashDrawerStore.getState().onSuccess) {
              useCashDrawerStore.getState().onSuccess?.(newCashDrawer);
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
            {dataCashDrawer ? 'EDIT CASHDRAWER' : 'TAMBAH CASHDRAWER'}
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
                    <FormControlLabelText>Nama Cashdrawer</FormControlLabelText>
                  </FormControlLabel>
                  <Input>
                    <InputField
                      value={value}
                      autoComplete="name"
                      placeholder="Masukkan nama cashdrawer"
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
              className="w-full flex px-4 h-10 items-center justify-center rounded-sm bg-primary-500 active:bg-primary-500/90"
              onPress={form.handleSubmit(onSubmit)}
              disabled={isLoading}
            >
              {isLoading ? (
                <Spinner size="small" color="#FFFFFF" />
              ) : (
                <Text size="sm" className="text-typography-0 font-bold">
                  {!dataCashDrawer ? 'SIMPAN' : 'PERBARUI'}
                </Text>
              )}
            </Pressable>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
