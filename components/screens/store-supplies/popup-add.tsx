import {
  Box,
  CircleIcon,
  FormControl,
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
  VStack,
} from '@/components/ui';
import { ProductType } from '@/lib/constants';
import { useStoreSuppliesStore } from '@/stores/store-supplies';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import z from 'zod';

export default function PopupAddStoreSupplies() {
  const { addProduct, addProductVariantId, cart, setAddProduct, addCartItem, removeCartItem } =
    useStoreSuppliesStore();

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

  const addStoreSuppliesSchema = z.object({
    variantUnitId: z.string().nullable(),
    quantity: z.number().min(0, { message: 'Jumlah tidak boleh kurang dari 0' }),
  });

  type AddStoreSuppliesFormValues = z.infer<typeof addStoreSuppliesSchema>;

  const initialValues: AddStoreSuppliesFormValues = {
    variantUnitId: null,
    quantity: 0,
  };

  const form = useForm<AddStoreSuppliesFormValues>({
    resolver: zodResolver(addStoreSuppliesSchema),
    defaultValues: initialValues,
  });

  const quantity = form.watch('quantity');

  useEffect(() => {
    if (addProduct && currentProductInCart) {
      form.reset({
        quantity: currentProductInCart.quantity || 0,
        variantUnitId: currentProductInCart.variant?.id || null,
      });
    } else {
      form.reset({
        ...initialValues,
        variantUnitId: addProductVariantId || null,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, addProduct, addProductVariantId, currentProductInCart]);

  const onSubmit: SubmitHandler<AddStoreSuppliesFormValues> = (
    data: AddStoreSuppliesFormValues,
  ) => {
    if (addProduct?.type === ProductType.MULTIUNIT) {
      const selectedVariant = addProduct.variants.find((item) => item.id === data.variantUnitId);

      if (!selectedVariant) return;

      const selectedNetto = selectedVariant.netto;

      if (!selectedNetto) {
        addCartItem({
          product: addProduct,
          quantity: data.quantity,
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
          variant,
        });
      }

      setAddProduct(null);
      return;
    }

    if (addProduct) {
      addCartItem({
        product: addProduct,
        variant: addProduct.variants.find((v) => v.id === data.variantUnitId),
        quantity: data.quantity,
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
            JUMLAH DIAMBIL
          </Heading>
        </ModalHeader>
        <ModalBody className="m-0">
          <VStack space="md">
            <HStack className="justify-between items-center px-4 py-2 rounded-sm border-b border-gray-300">
              <HStack space="md" className="items-center">
                <Box className="size-16 rounded-lg bg-primary-200 items-center justify-center">
                  <Heading className="text-primary-500 capitalize font-bold">
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
                <VStack className="items-end">
                  <Text size="sm" className="text-slate-500">
                    Stok Sistem
                  </Text>
                  <Heading size="md">{addProduct?.stock}</Heading>
                </VStack>
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
                          onChangeText={(text: string) => {
                            const val = text.replace(',', '.');
                            onChange(val);
                          }}
                          onBlur={() => {
                            onChange(Number(value) || 0);
                            onBlur();
                          }}
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
            </VStack>
            <HStack space="md" className="w-full p-4">
              <Pressable
                className="flex-1 items-center justify-center h-12 px-4 rounded-lg border border-error-500 bg-error-100 active:bg-error-200"
                onPress={() => {
                  setAddProduct(null);
                }}
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
