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
} from "@/components/ui";
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { Input, InputField } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Toast, ToastTitle, useToast } from "@/components/ui/toast";
import { VStack } from "@/components/ui/vstack";
import {
  useCategories,
  useCategory,
  useCreateCategory,
  useUpdateCategory,
} from "@/lib/api/categories";
import { getErrorMessage } from "@/lib/api/client";
import { useCategoryStore } from "@/stores/category";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import z from "zod";

export default function CategoryForm() {
  const { open, setOpen, data: dataCategory } = useCategoryStore();
  const toast = useToast();

  const categorySchema = z.object({
    name: z.string().min(1, "Nama Category wajib diisi."),
    retailPoint: z.number().min(0, "Poin harus >= 0"),
    wholesalePoint: z.number().min(0, "Poin harus >= 0"),
  });

  type CategoryFormValues = z.infer<typeof categorySchema>;

  const initialValues: CategoryFormValues = {
    name: "",
    retailPoint: 0,
    wholesalePoint: 0,
  };

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: initialValues,
  });

  const { refetch: refetchCategorys } = useCategories();
  const { refetch: refetchCategory } = useCategory(dataCategory?.id || "");

  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();

  const onRefetch = () => {
    refetchCategorys();
    if (dataCategory) refetchCategory();
  };

  useEffect(() => {
    if (dataCategory) {
      form.reset({
        name: dataCategory.name,
        retailPoint: dataCategory.retailPoint || 0,
        wholesalePoint: dataCategory.wholesalePoint || 0,
      });
    } else {
      form.reset(initialValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataCategory, form]);

  const showSuccessToast = (message: string) => {
    toast.show({
      placement: "top",
      render: ({ id }) => (
        <Toast nativeID={`toast-${id}`} action="success" variant="solid">
          <ToastTitle>{message}</ToastTitle>
        </Toast>
      ),
    });
  };

  const showErrorToast = (error: unknown) => {
    toast.show({
      placement: "top",
      render: ({ id }) => (
        <Toast nativeID={`toast-${id}`} action="error" variant="solid">
          <ToastTitle>{getErrorMessage(error)}</ToastTitle>
        </Toast>
      ),
    });
  };

  const onSubmit: SubmitHandler<CategoryFormValues> = (
    data: CategoryFormValues,
  ) => {
    if (dataCategory) {
      updateMutation.mutate(
        { id: dataCategory.id, ...data },
        {
          onSuccess: () => {
            showSuccessToast("Kategori berhasil diperbarui");
            onRefetch();
            form.reset(initialValues);
            setOpen(false);
          },
          onError: showErrorToast,
        },
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: (newCat) => {
          showSuccessToast("Kategori berhasil ditambahkan");
          onRefetch();
          if (useCategoryStore.getState().onSuccess) {
            useCategoryStore.getState().onSuccess?.(newCat);
          }
          form.reset(initialValues);
          setOpen(false);
        },
        onError: showErrorToast,
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
            {dataCategory ? "EDIT KATEGORI" : "TAMBAH KATEGORI"}
          </Heading>
        </ModalHeader>
        <ModalBody className="m-0" showsVerticalScrollIndicator={false}>
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
                      <FormControlErrorText>
                        {error.message}
                      </FormControlErrorText>
                    </FormControlError>
                  )}
                </FormControl>
              )}
            />
            <HStack space="md">
              <Controller
                name="retailPoint"
                control={form.control}
                render={({
                  field: { onChange, onBlur, value },
                  fieldState: { error },
                }) => (
                  <FormControl
                    isRequired
                    isInvalid={!!error}
                    className="flex-1"
                  >
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
                        <FormControlErrorText>
                          {error.message}
                        </FormControlErrorText>
                      </FormControlError>
                    )}
                  </FormControl>
                )}
              />
              <Controller
                name="wholesalePoint"
                control={form.control}
                render={({
                  field: { onChange, onBlur, value },
                  fieldState: { error },
                }) => (
                  <FormControl
                    isRequired
                    isInvalid={!!error}
                    className="flex-1"
                  >
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
                        <FormControlErrorText>
                          {error.message}
                        </FormControlErrorText>
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
              className="w-full flex px-4 h-9 items-center justify-center rounded-sm bg-primary-500 active:bg-primary-500/90"
              onPress={form.handleSubmit(onSubmit)}
              disabled={isLoading}
            >
              {isLoading ? (
                <Spinner size="small" color="#FFFFFF" />
              ) : (
                <Text size="sm" className="text-typography-0 font-bold">
                  {!dataCategory ? "SIMPAN" : "PERBARUI"}
                </Text>
              )}
            </Pressable>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
