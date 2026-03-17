import {
  Box,
  FormControl,
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
  VStack,
} from "@/components/ui";
import { useStockOpnameStore } from "@/stores/stock-opname";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import z from "zod";

export default function PopupAddStockOpname() {
  const {
    addProduct,
    addProductVariantId,
    cart,
    setAddProduct,
    addCartItem,
    removeCartItem,
  } = useStockOpnameStore();

  const product = cart.find(
    (item) =>
      item.product.id === addProduct?.id &&
      item.variant?.id === addProductVariantId,
  );

  const addStockOpnameSchema = z.object({
    variantUnitId: z.string().nullable(),
    physicalStock: z
      .number()
      .min(0, { message: "Stok fisik tidak boleh kurang dari 0" }),
  });

  type AddStockOpnameFormValues = z.infer<typeof addStockOpnameSchema>;

  const initialValues: AddStockOpnameFormValues = {
    variantUnitId: null,
    physicalStock: 0,
  };

  const form = useForm<AddStockOpnameFormValues>({
    resolver: zodResolver(addStockOpnameSchema),
    defaultValues: initialValues,
  });

  const physicalStock = form.watch("physicalStock");

  useEffect(() => {
    if (addProduct && product) {
      form.reset({
        physicalStock: product.physicalStock || 0,
        variantUnitId: product.variant?.id || null,
      });
    } else {
      form.reset({
        ...initialValues,
        variantUnitId: addProductVariantId || null,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, addProduct]);

  const onSubmit: SubmitHandler<AddStockOpnameFormValues> = (
    data: AddStockOpnameFormValues,
  ) => {
    if (addProduct) {
      addCartItem({
        product: addProduct,
        variant: addProduct.variants.find((v) => v.id === data.variantUnitId),
        physicalStock: data.physicalStock,
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
            STOK FISIK
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
              <HStack
                space="md"
                className="w-full justify-between items-center"
              >
                <Pressable
                  className="items-center justify-center size-16 rounded-lg border border-primary-500 bg-background-0 active:bg-primary-300"
                  disabled={physicalStock <= 0}
                  onPress={() => {
                    const currentPhysicalStock = physicalStock;

                    if (currentPhysicalStock && currentPhysicalStock > 0) {
                      form.setValue("physicalStock", currentPhysicalStock - 1);
                    }
                  }}
                >
                  <Heading size="2xl" className="text-primary-500">
                    -
                  </Heading>
                </Pressable>
                <Controller
                  name="physicalStock"
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
                          onChangeText={(text: string) => {
                            const val = text.replace(",", ".");
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
                    const currentPhysicalStock = physicalStock;

                    form.setValue("physicalStock", currentPhysicalStock + 1);
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
                  removeCartItem(
                    addProduct?.id || "",
                    addProductVariantId || undefined,
                  );
                  setAddProduct(null);
                }}
              >
                <Text size="lg" className="text-error-500 font-bold">
                  HAPUS
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
