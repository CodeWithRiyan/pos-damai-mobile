import {
  Box,
  Checkbox,
  CheckboxIcon,
  CheckboxIndicator,
  CheckboxLabel,
  CheckIcon,
  CircleIcon,
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
  Radio,
  RadioGroup,
  RadioIcon,
  RadioIndicator,
  RadioLabel,
  Text,
  Textarea,
  TextareaInput,
  Toast,
  ToastTitle,
  useToast,
  VStack,
} from "@/components/ui";
import { findSellPrice } from "@/lib/price";
import { useTransactionStore } from "@/stores/transaction";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import z from "zod";

export default function PopupAddProduct() {
  const toast = useToast();
  const {
    customer,
    addProduct,
    addProductVariantId,
    cart,
    setAddProduct,
    addCartItem,
  } = useTransactionStore();

  const currentProductInCart = addProductVariantId
    ? cart.find(
        (item) =>
          item.product.id === addProduct?.id &&
          item.variant?.id === addProductVariantId,
      )
    : !addProductVariantId && addProduct?.type !== "MULTIUNIT"
      ? cart.find((item) => item.product.id === addProduct?.id)
      : undefined;

  const variantUnitOptions =
    addProduct?.variants.map((item) => ({
      label: item.name,
      value: item.id,
    })) || [];

  const addProductSchema = z
    .object({
      variantUnitId: z.string().nullable(),
      quantity: z.number().min(0.001, "Jumlah harus minimal 0.001"),
      isTempSellPrice: z.boolean(),
      tempSellPrice: z.number(),
      addNote: z.boolean(),
      note: z.string(),
    })
    .superRefine((data, ctx) => {
      if (
        data.isTempSellPrice &&
        data.tempSellPrice <
          (currentProductInCart?.product.purchasePrice || 0) &&
        currentProductInCart?.product.type !== "MULTIUNIT"
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Harga sementara tidak boleh kurang dari harga beli",
          path: ["tempSellPrice"],
        });
      }
    });

  type AddProductFormValues = z.infer<typeof addProductSchema>;

  const initialValues: AddProductFormValues = {
    variantUnitId:
      addProduct?.variants.find((item) => item.netto === 1)?.id || "",
    quantity: 1,
    addNote: false,
    isTempSellPrice: false,
    tempSellPrice: 0,
    note: "",
  };

  const form = useForm<AddProductFormValues>({
    resolver: zodResolver(addProductSchema),
    defaultValues: initialValues,
  });

  const quantity = form.watch("quantity");
  const isTempSellPriceChecked = form.watch("isTempSellPrice");
  const tempSellPrice = form.watch("tempSellPrice");
  const isAddNoteChecked = form.watch("addNote");
  const variantUnitId = form.watch("variantUnitId");

  const showValidationError = (message?: string) => {
    toast.show({
      placement: "top",
      render: ({ id }) => {
        const toastId = "toast-" + id;
        return (
          <Toast nativeID={toastId} action="error" variant="solid">
            <ToastTitle>{message || "Terjadi kesalahan"}</ToastTitle>
          </Toast>
        );
      },
    });
  };

  useEffect(() => {
    if (currentProductInCart) {
      form.reset({
        quantity: currentProductInCart?.quantity || 1,
        isTempSellPrice: !!currentProductInCart?.tempSellPrice,
        tempSellPrice: currentProductInCart?.tempSellPrice || 0,
        addNote: !!currentProductInCart?.note,
        note: currentProductInCart?.note || "",
        variantUnitId:
          addProductVariantId ||
          addProduct?.variants.find((item) => item.netto === 1)?.id ||
          null,
      });
      console.log(
        "variantUnitId",
        addProduct?.variants.find((item) => item.netto === 1)?.id,
      );
    } else {
      form.reset(initialValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, currentProductInCart, addProductVariantId, addProduct]);

  const onSubmit: SubmitHandler<AddProductFormValues> = (
    data: AddProductFormValues,
  ) => {
    if (
      addProduct?.type === "MULTIUNIT" &&
      !!(customer?.category !== "WHOLESALE") &&
      !data.variantUnitId
    ) {
      toast.show({
        placement: "top",
        render: ({ id }) => {
          const toastId = "toast-" + id;
          return (
            <Toast nativeID={toastId} action="error" variant="solid">
              <ToastTitle>Unit belum dipilih</ToastTitle>
            </Toast>
          );
        },
      });
      return;
    }
    if (addProduct) {
      addCartItem({
        product: addProduct,
        quantity: data.quantity,
        tempSellPrice: data.isTempSellPrice ? data.tempSellPrice : undefined,
        note: data.addNote ? data.note : undefined,
        variant: addProduct.variants.find(
          (item) => item.id === data.variantUnitId,
        ),
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
          <VStack space="md" className="py-4">
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
                    {`Rp ${(
                      tempSellPrice ||
                      findSellPrice({
                        sellPrices: addProduct?.sellPrices || [],
                        type: customer?.category,
                        quantity: quantity || 0,
                        unitVariant: addProduct?.variants.find(
                          (f) => f.id === variantUnitId,
                        ),
                      })
                    ).toLocaleString("id-ID")}`}
                  </Heading>
                </HStack>
              </HStack>
            </HStack>
            <VStack space="lg" className="px-4">
              {addProduct?.type === "MULTIUNIT" &&
                customer?.category !== "WHOLESALE" && (
                  <Controller
                    name="variantUnitId"
                    control={form.control}
                    render={({ field: { onChange, value } }) => (
                      <FormControl>
                        <FormControlLabel>
                          <FormControlLabelText>
                            Pilih Unit
                          </FormControlLabelText>
                        </FormControlLabel>
                        <RadioGroup value={value || ""} onChange={onChange}>
                          <VStack space="sm">
                            {variantUnitOptions.map((variant: any) => (
                              <Radio
                                key={variant.value}
                                value={variant.value}
                                size="md"
                              >
                                <RadioIndicator>
                                  <RadioIcon as={CircleIcon} />
                                </RadioIndicator>
                                <RadioLabel>{variant.label}</RadioLabel>
                              </Radio>
                            ))}
                          </VStack>
                        </RadioGroup>
                      </FormControl>
                    )}
                  />
                )}
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
                          onChangeText={(text) => {
                            onChange(Number(text) || 0);
                          }}
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
                  name="isTempSellPrice"
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
                          form.setValue("tempSellPrice", 0);
                        }}
                        onBlur={onBlur}
                      >
                        <CheckboxIndicator>
                          <CheckboxIcon as={CheckIcon} />
                        </CheckboxIndicator>
                        <CheckboxLabel>Gunakan Harga Sementara</CheckboxLabel>
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
                {isTempSellPriceChecked && (
                  <Controller
                    name="tempSellPrice"
                    control={form.control}
                    render={({
                      field: { onChange, onBlur, value },
                      fieldState: { error },
                    }) => (
                      <FormControl isInvalid={!!error}>
                        <FormControlLabel>
                          <FormControlLabelText>
                            Harga Sementara
                          </FormControlLabelText>
                        </FormControlLabel>
                        <Input>
                          <InputField
                            value={value.toString()}
                            autoComplete="off"
                            onChangeText={(text) => onChange(Number(text) || 0)}
                            onBlur={onBlur}
                            placeholder="Masukkan harga sementara"
                            keyboardType="numeric"
                          />
                        </Input>
                        {error && (
                          <FormControlError>
                            <FormControlErrorText className="text-red-500">
                              {error.message}
                            </FormControlErrorText>
                          </FormControlError>
                        )}
                      </FormControl>
                    )}
                  />
                )}
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
            <HStack space="md" className="w-full pt-2 px-4">
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
                onPress={form.handleSubmit(onSubmit, (errors) => {
                  if (errors.quantity)
                    showValidationError(errors.quantity.message);
                  else if (errors.tempSellPrice)
                    showValidationError(errors.tempSellPrice.message);
                })}
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
