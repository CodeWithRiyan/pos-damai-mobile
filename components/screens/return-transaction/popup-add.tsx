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
  useToast,
  VStack,
} from '@/components/ui';
import { Input, InputField } from '@/components/ui/input';
import { useReturnTransactionStore } from '@/stores/return-transaction';
import { showToast } from '@/utils/toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import z from 'zod';

import { ProductType } from '@/constants';
import { formatNumber } from '@/utils/format';
export default function PopupAddProduct() {
  const toast = useToast();
  const { addProduct, addProductVariantId, cart, setAddProduct, addCartItem, removeCartItem } =
    useReturnTransactionStore();

  const currentProductInCart = addProductVariantId
    ? cart.find(
        (item) => item.product.id === addProduct?.id && item.variant?.id === addProductVariantId,
      )
    : !addProductVariantId && addProduct?.type !== ProductType.MULTIUNIT
      ? cart.find((item) => item.product.id === addProduct?.id)
      : undefined;

  const variantUnitOptions =
    addProduct?.variants.map((item) => ({
      label: item.name,
      value: item.id,
    })) || [];

  const addProductSchema = z.object({
    variantUnitId: z.string().nullable(),
    quantity: z.number().min(1, 'Jumlah harus minimal 1'),
    addNote: z.boolean(),
    note: z.string(),
  });

  type AddProductFormValues = z.infer<typeof addProductSchema>;

  const initialValues: AddProductFormValues = {
    variantUnitId: null,
    quantity: 1,
    addNote: false,
    note: '',
  };

  const form = useForm<AddProductFormValues>({
    resolver: zodResolver(addProductSchema),
    defaultValues: initialValues,
  });

  const quantity = form.watch('quantity');
  const isAddNoteChecked = form.watch('addNote');

  useEffect(() => {
    if (form.formState.errors.quantity) {
      showToast(toast, {
        action: 'error',
        message: form.formState.errors.quantity.message || 'Jumlah tidak valid',
        placement: 'top',
      });
    }
  }, [form.formState.errors.quantity]);

  useEffect(() => {
    if (addProduct && currentProductInCart) {
      form.reset({
        quantity: currentProductInCart.quantity || 0,
        variantUnitId: currentProductInCart.variant?.id || null,
        addNote: !!currentProductInCart.note,
        note: currentProductInCart.note || '',
      });
    } else {
      form.reset({
        ...initialValues,
        variantUnitId: addProductVariantId || null,
      });
    }
  }, [form, addProduct, addProductVariantId, currentProductInCart]);

  const onSubmit: SubmitHandler<AddProductFormValues> = (data: AddProductFormValues) => {
    if (addProduct?.type === ProductType.MULTIUNIT) {
      const selectedVariant = addProduct.variants.find((item) => item.id === data.variantUnitId);

      if (!selectedVariant) return;

      const selectedNetto = selectedVariant.netto || 0;

      if (!selectedNetto) {
        addCartItem({
          product: addProduct,
          quantity: data.quantity,
          sellPrice: addProduct.lastSellPrice
            ? addProduct.lastSellPrice * selectedNetto
            : addProduct.sellPrices?.[0]?.price * selectedNetto,
          note: data.addNote ? data.note : undefined,
          variant: selectedVariant,
        });
        setAddProduct(null);
        return;
      }

      // Sort variants by their netto from largest to smallest
      const sortedVariants = [...addProduct.variants]
        .filter((v) => v.netto != null)
        .sort((a, b) => (b.netto ?? 0) - (a.netto ?? 0));

      // Decompose totalNetto into available variant-quantity pairs (greedy)
      const decompose = (
        remaining: number,
        variants: typeof sortedVariants,
      ): { variant: (typeof sortedVariants)[0]; quantity: number }[] => {
        const result: {
          variant: (typeof sortedVariants)[0];
          quantity: number;
        }[] = [];

        let rem = remaining;
        for (const variant of variants) {
          const netto = variant.netto!;
          if (netto > rem + 0.0001) continue;

          const qty = Math.floor(rem / netto);
          if (qty > 0) {
            result.push({ variant, quantity: qty });
            rem = parseFloat((rem - qty * netto).toFixed(10));
          }

          if (rem < 0.0001) break;
        }

        return result;
      };

      const totalNetto = parseFloat((selectedNetto * data.quantity).toFixed(10));
      const decomposed = decompose(totalNetto, sortedVariants);

      // Remove the variant being edited from cart first
      removeCartItem(addProduct.id, selectedVariant.id);

      for (const { variant, quantity } of decomposed) {
        const existingItem = cart.find(
          (item) => item.product.id === addProduct.id && item.variant?.id === variant.id,
        );

        // Prevent double-counting for the variant being edited
        const existingQty =
          existingItem && variant.id !== selectedVariant.id ? existingItem.quantity : 0;

        const finalQty = existingQty + quantity;
        addCartItem({
          product: addProduct,
          quantity: finalQty,
          sellPrice: addProduct.lastSellPrice
            ? addProduct.lastSellPrice * (variant.netto || 0)
            : addProduct.sellPrices?.[0]?.price * (variant.netto || 0) || 0,
          note: data.addNote ? data.note : undefined,
          variant,
        });
      }

      setAddProduct(null);
      return;
    }

    if (addProduct) {
      addCartItem({
        product: addProduct,
        quantity: data.quantity,
        sellPrice: addProduct.lastSellPrice ?? addProduct.sellPrices?.[0]?.price ?? 0,
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
        <ModalBody className="m-0" showsVerticalScrollIndicator={false}>
          <VStack space="md">
            <HStack className="justify-between items-center px-4 py-2 rounded-sm border-b border-gray-300">
              <HStack space="md" className="items-center">
                <Box className="size-16 rounded-lg bg-primary-200 items-center justify-center">
                  <Heading className="text-primary-500 font-bold">
                    {addProduct?.name?.charAt(0)}
                  </Heading>
                </Box>
                <VStack className="flex-1">
                  <Heading size="md" className="line-clamp-2">
                    {addProduct?.name}
                  </Heading>
                </VStack>
                <HStack space="sm">
                  <Heading size="md">
                    Rp{' '}
                    {formatNumber(
                      addProduct?.lastSellPrice ?? addProduct?.sellPrices?.[0]?.price ?? 0,
                    )}
                  </Heading>
                </HStack>
              </HStack>
            </HStack>
            <VStack space="lg" className="px-4">
              {addProduct?.type === ProductType.MULTIUNIT && (
                <Controller
                  name="variantUnitId"
                  control={form.control}
                  render={({ field: { onChange, value } }) => (
                    <FormControl>
                      <FormControlLabel>
                        <FormControlLabelText>Pilih Unit</FormControlLabelText>
                      </FormControlLabel>
                      <RadioGroup
                        value={value || ''}
                        onChange={(v) => {
                          const variant = cart?.find((f) => f.variant?.id === v);
                          onChange(v);
                          form.setValue('quantity', variant?.quantity || 1);
                        }}
                      >
                        <VStack space="sm">
                          {variantUnitOptions.map((variant) => (
                            <Radio key={variant.value} value={variant.value} size="md">
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
              <HStack space="md" className="w-full justify-between items-center">
                <Pressable
                  className="items-center justify-center size-16 rounded-lg border border-primary-500 bg-background-0 active:bg-primary-300"
                  disabled={quantity <= 0}
                  onPress={() => {
                    const currentQuantity = quantity;

                    if (currentQuantity && currentQuantity > 0) {
                      form.setValue('quantity', currentQuantity - 1);
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
                  render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                    <FormControl isRequired isInvalid={!!error} className="w-44 h-full">
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
                    form.setValue('quantity', currentQuantity + 1);
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
                  render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                    <FormControl isInvalid={!!error}>
                      <Checkbox
                        value={value.toString()}
                        isChecked={value}
                        size="md"
                        onChange={(v) => {
                          onChange(v);
                          if (!v) form.setValue('note', '');
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
                          <FormControlErrorText>{error.message}</FormControlErrorText>
                        </FormControlError>
                      )}
                    </FormControl>
                  )}
                />
                {isAddNoteChecked && (
                  <Controller
                    name="note"
                    control={form.control}
                    render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
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
                            <FormControlErrorText>{error.message}</FormControlErrorText>
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
