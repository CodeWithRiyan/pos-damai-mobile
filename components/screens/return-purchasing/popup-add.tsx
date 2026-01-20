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
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalContent,
  ModalHeader,
  Pressable,
  Text,
  Textarea,
  TextareaInput,
  VStack
} from "@/components/ui";
import { useReturnPurchasingStore } from "@/stores/return-purchasing";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import z from "zod";

export default function PopupAddProduct() {
  const { addProduct, cart, setAddProduct, addCartItem } =
    useReturnPurchasingStore();

  const addProductSchema = z.object({
    quantity: z.number().min(1, "Jumlah harus minimal 1"),
    addNote: z.boolean(),
    note: z.string(),
  });

  type AddProductFormValues = z.infer<typeof addProductSchema>;

  const initialValues: AddProductFormValues = {
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

  useEffect(() => {
    if (addProduct) {
      form.reset({
        quantity:
          cart?.find((item) => item.product.id === addProduct.id)?.quantity ||
          0,
        addNote: cart?.find((item) => item.product.id === addProduct.id)?.note
          ? true
          : false,
        note:
          cart?.find((item) => item.product.id === addProduct.id)?.note || "",
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
            KEMBALIKAN PRODUK
          </Heading>
        </ModalHeader>
        <ModalBody className="m-0">
          <VStack space="md">
            <HStack className="justify-between items-center px-4 py-2 rounded-sm border-b border-gray-300">
              <HStack space="md" className="items-center">
                <Box className="size-16 rounded-lg bg-primary-200 items-center justify-center">
                  <Heading className="text-primary-500 font-bold">
                    {addProduct?.name.charAt(0)}
                  </Heading>
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
              <HStack className="w-full justify-between items-center">
                <Pressable
                  className="items-center justify-center size-16 rounded-lg border border-primary-500 bg-background-0 active:bg-primary-300"
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
                <Heading size="3xl" className="font-bold">
                  {quantity}
                </Heading>
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
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
