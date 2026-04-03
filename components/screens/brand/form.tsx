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
import { useBrand, useBrands, useCreateBrand, useUpdateBrand } from '@/hooks/use-brand';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { useBrandStore } from '@/stores/brand';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import z from 'zod';

export default function BrandForm() {
  const { open, setOpen, data: dataBrand } = useBrandStore();
  const toast = useToast();

  const brandSchema = z.object({
    name: z.string().min(1, 'Nama Brand wajib diisi.'),
  });

  type BrandFormValues = z.infer<typeof brandSchema>;

  const initialValues: BrandFormValues = {
    name: '',
  };

  const form = useForm<BrandFormValues>({
    resolver: zodResolver(brandSchema),
    defaultValues: initialValues,
  });

  const { refetch: refetchBrands } = useBrands();
  const { refetch: refetchBrand } = useBrand(dataBrand?.id || '');

  const createMutation = useCreateBrand();
  const updateMutation = useUpdateBrand();

  const onRefetch = () => {
    refetchBrands();
    if (dataBrand) refetchBrand();
  };

  useEffect(() => {
    if (dataBrand) {
      form.setValue('name', dataBrand.name);
    } else {
      form.reset(initialValues);
    }
  }, [dataBrand, form]);

  const onSubmit: SubmitHandler<BrandFormValues> = (data: BrandFormValues) => {
    if (dataBrand) {
      updateMutation.mutate(
        { id: dataBrand.id, ...data },
        {
          onSuccess: () => {
            showSuccessToast(toast, 'Brand berhasil diperbarui');
            onRefetch();
            form.reset(initialValues);
            setOpen(false);
          },
          onError: (error) => showErrorToast(toast, error),
        },
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: (newBrand) => {
          showSuccessToast(toast, 'Brand berhasil ditambahkan');
          onRefetch();
          if (useBrandStore.getState().onSuccess) {
            useBrandStore.getState().onSuccess?.(newBrand);
          }
          form.reset(initialValues);
          setOpen(false);
        },
        onError: (error) => showErrorToast(toast, error),
      });
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
            {dataBrand ? 'EDIT BRAND' : 'TAMBAH BRAND'}
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
                    <FormControlLabelText>Nama Brand</FormControlLabelText>
                  </FormControlLabel>
                  <Input>
                    <InputField
                      value={value}
                      autoComplete="name"
                      placeholder="Masukkan nama brand"
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
                  {!dataBrand ? 'SIMPAN' : 'PERBARUI'}
                </Text>
              )}
            </Pressable>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
