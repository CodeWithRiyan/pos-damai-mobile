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
  fetchCategories,
  refetchCategoryById,
  useCategories,
  useCreateCategory,
  useUpdateCategory,
} from '@/hooks/use-category';
import { useCategoryStore } from '@/stores/category';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useCallback, useEffect } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import z from 'zod';

export default function CategoryForm() {
  const { open, setOpen, data: dataCategory } = useCategoryStore();
  const toast = useToast();

  const categorySchema = z.object({
    name: z.string().min(1, 'Nama Kategoriwajib diisi.'),
    retailPoint: z.number().min(0, 'Poin harus >= 0'),
    wholesalePoint: z.number().min(0, 'Poin harus >= 0'),
  });

  type CategoryFormValues = z.infer<typeof categorySchema>;

  const initialValues: CategoryFormValues = {
    name: '',
    retailPoint: 0,
    wholesalePoint: 0,
  };

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: initialValues,
  });

  const { refetch: refetchCategories } = useCategories();

  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();

  const onRefetch = useCallback(async () => {
    await fetchCategories();
    refetchCategories();
    if (dataCategory?.id) {
      const freshData = await refetchCategoryById(dataCategory.id);
      if (freshData) {
        form.reset({
          name: freshData.name,
          retailPoint: freshData.retailPoint || 0,
          wholesalePoint: freshData.wholesalePoint || 0,
        });
      }
    }
  }, [refetchCategories, dataCategory, form]);

  useEffect(() => {
    if (dataCategory) {
      refetchCategoryById(dataCategory.id).then((freshData) => {
        if (freshData) {
          form.reset({
            name: freshData.name,
            retailPoint: freshData.retailPoint || 0,
            wholesalePoint: freshData.wholesalePoint || 0,
          });
        }
      });
    } else {
      form.reset(initialValues);
    }
  }, [dataCategory, form]);

  useEffect(() => {
    const store = useCategoryStore.getState();
    const currentVersion = store.version;

    const unsubscribe = useCategoryStore.subscribe((state) => {
      if (state.version !== currentVersion && open && state.data) {
        refetchCategoryById(state.data.id).then((freshData) => {
          if (freshData) {
            form.reset({
              name: freshData.name,
              retailPoint: freshData.retailPoint || 0,
              wholesalePoint: freshData.wholesalePoint || 0,
            });
          }
        });
      }
    });
    return unsubscribe;
  }, [open]);

  const onSubmit: SubmitHandler<CategoryFormValues> = (data: CategoryFormValues) => {
    if (dataCategory) {
      updateMutation.mutate(
        { id: dataCategory.id, ...data },
        {
          onSuccess: () => {
            showSuccessToast(toast, 'Kategori berhasil diperbarui');
            onRefetch();
            useCategoryStore.getState().incrementVersion();
            form.reset(initialValues);
            setOpen(false);
          },
          onError: (error) => showErrorToast(toast, error),
        },
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: (newCat) => {
          showSuccessToast(toast, 'Kategori berhasil ditambahkan');
          onRefetch();
          useCategoryStore.getState().incrementVersion();
          if (useCategoryStore.getState().onSuccess) {
            useCategoryStore.getState().onSuccess?.(newCat);
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
            {dataCategory ? 'EDIT KATEGORI' : 'TAMBAH KATEGORI'}
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
                    <FormControlLabelText>Nama Kategori</FormControlLabelText>
                  </FormControlLabel>
                  <Input>
                    <InputField
                      value={value}
                      autoComplete="name"
                      placeholder="Masukkan nama kategori"
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
            <HStack space="md">
              <Controller
                name="retailPoint"
                control={form.control}
                render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                  <FormControl isRequired isInvalid={!!error} className="flex-1">
                    <FormControlLabel>
                      <FormControlLabelText>Poin Retail</FormControlLabelText>
                    </FormControlLabel>
                    <Input>
                      <InputField
                        value={value.toString()}
                        keyboardType="numeric"
                        placeholder="Masukkan poin retail"
                        onChangeText={(text) => {
                          const num = parseFloat(text) || 0;
                          onChange(num);
                        }}
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
                name="wholesalePoint"
                control={form.control}
                render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                  <FormControl isRequired isInvalid={!!error} className="flex-1">
                    <FormControlLabel>
                      <FormControlLabelText>Poin Grosir</FormControlLabelText>
                    </FormControlLabel>
                    <Input>
                      <InputField
                        value={value.toString()}
                        keyboardType="numeric"
                        placeholder="Masukkan poin grosir"
                        onChangeText={(text) => {
                          const num = parseFloat(text) || 0;
                          onChange(num);
                        }}
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
            </HStack>
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
                  {!dataCategory ? 'SIMPAN' : 'PERBARUI'}
                </Text>
              )}
            </Pressable>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
