import {
  Box,
  Checkbox,
  CheckboxIcon,
  CheckboxIndicator,
  CheckboxLabel,
  CheckIcon,
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
  Heading,
  HStack,
  Input,
  InputField,
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalContent,
  ModalHeader,
  Pressable,
  Text,
  Textarea,
  TextareaInput,
  Toast,
  ToastTitle,
  useToast,
  VStack,
} from "@/components/ui";
import { usePurchasingStore } from "@/stores/purchasing";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import z from "zod";

export default function PopupAddProduct() {
  const toast = useToast();
  const { addProduct, cart, setAddProduct, addCartItem, removeCartItem } =
    usePurchasingStore();

  const addProductSchema = z.object({
    purchasePrice: z.number().min(1, "Harga beli harus diisi"),
    quantity: z.number().min(1, "Jumlah harus minimal 1"),
    addNote: z.boolean(),
    note: z.string(),
  });

  type AddProductFormValues = z.infer<typeof addProductSchema>;

  const initialValues: AddProductFormValues = {
    purchasePrice: addProduct?.purchasePrice || 0,
    quantity: 1,
    addNote: false,
    note: "",
  };

  const form = useForm<AddProductFormValues>({
    resolver: zodResolver(addProductSchema),
    defaultValues: initialValues,
  });

  const quantity = form.watch("quantity");
  const isAddNoteChecked = form.watch("addNote");

  const currentProductInCart = cart.find(
    (item) => item.product.id === addProduct?.id,
  );

  useEffect(() => {
    if (form.formState.errors.quantity) {
      toast.show({
        placement: "top",
        render: ({ id }) => {
          const toastId = "toast-" + id;
          return (
            <Toast nativeID={toastId} action="error" variant="solid">
              <ToastTitle>{form.formState.errors.quantity?.message}</ToastTitle>
            </Toast>
          );
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.formState.errors.quantity]);

  useEffect(() => {
    if (addProduct) {
      form.reset({
        purchasePrice: addProduct.purchasePrice || 0,
        quantity: currentProductInCart?.quantity || 0,
        addNote: currentProductInCart?.note ? true : false,
        note: currentProductInCart?.note || "",
      });
    } else {
      form.reset(initialValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, addProduct]);

  const onSubmit: SubmitHandler<AddProductFormValues> = (
    data: AddProductFormValues,
  ) => {
    if (addProduct) {
      addCartItem({
        product: addProduct,
        newPurchasePrice: data.purchasePrice,
        quantity: data.quantity,
        note: data.addNote ? data.note : undefined,
      });
    }
    setAddProduct(null);
  };

  return (
    <Modal isOpen={!!addProduct} onClose={() => setAddProduct(null)} size="md">
      <ModalBackdrop />
      <ModalContent className="p-0 max-h-[90%]">
        <ModalHeader className="p-4 border-b border-background-300">
          <Heading size="md" className="text-center flex-1">
            TAMBAH PRODUK
          </Heading>
        </ModalHeader>
        <ModalBody className="m-0" showsVerticalScrollIndicator={false}>
          <VStack space="md">
            <HStack className="justify-between items-center px-4 py-2 rounded-sm border-b border-gray-300">
              <HStack space="md" className="items-center">
                <Box className="size-16 rounded-lg bg-primary-200 items-center justify-center">
                  <Heading className="text-primary-500 font-bold">P</Heading>
                </Box>
                <VStack className="flex-1">
                  <Heading size="md" className="line-clamp-2">
                    {addProduct?.name}
                  </Heading>
                  <Text size="sm" className="text-slate-500">
                    {addProduct?.code}
                  </Text>
                </VStack>
                <HStack space="sm">
                  <Heading size="md">
                    Rp {addProduct?.purchasePrice.toLocaleString("id-ID")}
                  </Heading>
                </HStack>
              </HStack>
            </HStack>
            <VStack space="lg" className="px-4">
              <HStack
                space="md"
                className="w-full justify-between items-center"
              >
                <Pressable
                  className="items-center justify-center size-16 rounded-lg border border-primary-500 bg-background-0 active:bg-primary-300"
                  disabled={quantity <= 0}
                  onPress={() => {
                    const currentQuantity = quantity;

                    if (currentQuantity && currentQuantity > 0) {
                      form.setValue("quantity", currentQuantity - 1);
                    }
                  }}
                >
                  <Heading size="2xl" className="text-primary-500">
                    -
                  </Heading>
                </Pressable>
                <Controller
                  name="quantity"
                  control={form.control}
                  render={({
                    field: { onChange, onBlur, value },
                    fieldState: { error },
                  }) => (
                    <FormControl
                      isRequired
                      isInvalid={!!error}
                      className="w-44 h-full"
                    >
                      <Input className="flex-1 border-transparent data-[focus=true]:border-transparent bg-transparent">
                        <InputField
                          value={value.toString()}
                          autoComplete="off"
                          onChangeText={(text) => onChange(Number(text) || 0)}
                          onBlur={onBlur}
                          keyboardType="numeric"
                          className="text-4xl text-center font-bold border-none"
                        />
                      </Input>
                    </FormControl>
                  )}
                />
                <Pressable
                  className="items-center justify-center size-16 rounded-lg border border-primary-500 bg-background-0 active:bg-primary-300"
                  onPress={() => {
                    const currentQuantity = quantity;

                    form.setValue("quantity", currentQuantity + 1);
                  }}
                >
                  <Heading size="2xl" className="text-primary-500">
                    +
                  </Heading>
                </Pressable>
              </HStack>
              <VStack space="lg">
                <Controller
                  name="purchasePrice"
                  control={form.control}
                  render={({
                    field: { onChange, onBlur, value },
                    fieldState: { error },
                  }) => (
                    <FormControl isRequired isInvalid={!!error}>
                      <FormControlLabel>
                        <FormControlLabelText>Harga Beli</FormControlLabelText>
                      </FormControlLabel>
                      <Input className="h-12 rounded-lg">
                        <InputField
                          value={value.toString()}
                          autoComplete="off"
                          placeholder="Masukkan harga beli"
                          className="text-center font-bold text-xl"
                          keyboardType="numeric"
                          onChangeText={(text) => onChange(Number(text) || 0)}
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
                  name="addNote"
                  control={form.control}
                  render={({
                    field: { onChange, onBlur, value },
                    fieldState: { error },
                  }) => (
                    <FormControl isInvalid={!!error}>
                      <Checkbox
                        value={value.toString()}
                        isChecked={value}
                        size="md"
                        onChange={(v) => {
                          onChange(v);
                          if (!v) form.setValue("note", "");
                        }}
                        onBlur={onBlur}
                      >
                        <CheckboxIndicator>
                          <CheckboxIcon as={CheckIcon} />
                        </CheckboxIndicator>
                        <CheckboxLabel>Tambah catatan</CheckboxLabel>
                      </Checkbox>
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
                {isAddNoteChecked && (
                  <Controller
                    name="note"
                    control={form.control}
                    render={({
                      field: { onChange, onBlur, value },
                      fieldState: { error },
                    }) => (
                      <FormControl isInvalid={!!error}>
                        <FormControlLabel>
                          <FormControlLabelText>Catatan</FormControlLabelText>
                        </FormControlLabel>
                        <Textarea size="md">
                          <TextareaInput
                            value={value}
                            autoComplete="off"
                            placeholder="Masukkan catatan"
                            onChangeText={onChange}
                            onBlur={onBlur}
                          />
                        </Textarea>
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
              </VStack>
            </VStack>
            <HStack space="md" className="w-full p-4">
              <Pressable
                className="flex-1 items-center justify-center h-12 px-4 rounded-lg border border-error-500 bg-error-100 active:bg-error-200"
                onPress={() => setAddProduct(null)}
              >
                <Text size="lg" className="text-error-500 font-bold">
                  BATAL
                </Text>
              </Pressable>
              <Pressable
                className="flex-1 items-center justify-center h-12 px-4 rounded-lg bg-primary-500 active:bg-primary-500/90"
                onPress={form.handleSubmit(onSubmit)}
              >
                <Text size="lg" className="text-white font-bold">
                  SIMPAN
                </Text>
              </Pressable>
            </HStack>
            {cart.some((s) => s.product.id === addProduct?.id) && (
              <HStack space="md" className="w-full p-4 pt-0">
                <Pressable
                  className="flex-1 items-center justify-center h-12 px-4 rounded-lg border border-error-500 bg-error-500 active:bg-error-400"
                  onPress={() => {
                    setAddProduct(null);
                    removeCartItem(addProduct?.id || "");
                  }}
                >
                  <Text size="lg" className="text-typography-0 font-bold">
                    HAPUS
                  </Text>
                </Pressable>
              </HStack>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
