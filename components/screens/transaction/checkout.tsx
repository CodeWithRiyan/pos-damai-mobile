import Header from "@/components/header";
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  Heading,
  HStack,
  Icon,
  Pressable,
  Spinner,
  Text,
  Textarea,
  TextareaInput,
  Toast,
  ToastTitle,
  useToast,
  VStack,
} from "@/components/ui";
// import { CreateTransactionDTO, useCreateTransaction } from "@/lib/api/transaction";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { ScrollView } from "react-native";
import { z } from "zod";
// import { useTransaction } from "@/lib/api/transaction";
import InputVirtualKeyboard from "@/components/ui/input-virtual-keyboard";
import SelectModal from "@/components/ui/select/select-modal";
import { useCurrentUser } from "@/lib/api/auth";

import { usePaymentTypes } from "@/lib/api/payment-types";
import { useCreateTransaction } from "@/lib/api/transactions";
import { findSellPrice } from "@/lib/price";
import { usePaymentTypeStore } from "@/stores/payment-type";
import { useTransactionStore } from "@/stores/transaction";
import { useRouter } from "expo-router";
import { Check, PlusIcon } from "lucide-react-native";

const transactionSchema = z
  .object({
    totalPurchase: z
      .number()
      .min(0, "Total pembelian harus lebih besar atau sama dengan 0"),
    totalPaid: z.string(),
    isCashdrawer: z.boolean(),
    status: z.string(),
    paymentTypeId: z.string().min(1, "Metode pembayaran harus dipilih"),
    note: z.string(),
  })
  .superRefine((data, ctx) => {
    if (
      data.status === "COMPLETED" &&
      parseFloat(data.totalPaid || "0") < data.totalPurchase
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Total pembayaran tidak boleh kurang dari total pembelian",
        path: ["totalPaid"],
      });
    }
  });

export type TransactionFormValues = z.infer<typeof transactionSchema>;

// Payment types are now loaded from the database via usePaymentTypes hook

export default function TransactionCheckoutForm() {
  const router = useRouter();

  const { data: user } = useCurrentUser();
  const { data: paymentTypesData } = usePaymentTypes();
  const {
    customer,
    cart,
    cartTotal,
    cartDiscountTotal,
    status,
    setCheckoutData,
    setCustomer,
  } = useTransactionStore();
  const { resetCart } = useTransactionStore();
  const { setOpen: setPaymentTypeOpen } = usePaymentTypeStore();

  // Map payment types to select options
  const paymentTypes =
    paymentTypesData?.map((pt) => ({
      label: pt.name,
      value: pt.id,
    })) || [];
  // const createMutation = useCreateTransaction();

  const initialValues: TransactionFormValues = {
    totalPurchase: 0,
    totalPaid: "",
    isCashdrawer: false,
    status: "DRAFT",
    paymentTypeId: "",
    note: "",
  };

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: initialValues,
  });

  const totalPaid = form.watch("totalPaid");
  const paymentTypeId = form.watch("paymentTypeId");
  const totalPurchase = form.watch("totalPurchase");

  const { grandTotal, commission } = useMemo(() => {
    let comm = 0;
    const pt = paymentTypesData?.find((p) => p.id === paymentTypeId);
    if (pt && cartTotal) {
      comm =
        pt.commissionType === "PERCENTAGE"
          ? (cartTotal * pt.commission) / 100
          : pt.commission;
    }
    return { commission: Number(comm), grandTotal: Number(cartTotal + comm) };
  }, [cartTotal, paymentTypesData, paymentTypeId]);

  useEffect(() => {
    if (cartTotal) {
      form.setValue("status", status);
      if (!paymentTypeId && paymentTypesData && paymentTypesData.length > 0) {
        const defaultPaymentType =
          paymentTypesData?.find((pt) => pt.isDefault)?.id ||
          paymentTypesData?.find(
            (pt) =>
              pt.name.toLowerCase() === "cash" ||
              pt.name.toLowerCase() === "tunai",
          )?.id ||
          "";
        form.setValue("paymentTypeId", defaultPaymentType);
      }
    }
  }, [form, cartTotal, status, paymentTypesData, paymentTypeId]);

  useEffect(() => {
    form.setValue("totalPurchase", grandTotal);
  }, [form, grandTotal]);

  const toast = useToast();
  const createTransactionMutation = useCreateTransaction();

  const isLoading = createTransactionMutation.isPending;

  const showValidationError = (message?: string) => {
    toast.show({
      placement: "top",
      render: ({ id }) => (
        <Toast nativeID={`toast-${id}`} action="error" variant="solid">
          <ToastTitle>{message || "Terjadi kesalahan validasi"}</ToastTitle>
        </Toast>
      ),
    });
  };

  const onSubmit: SubmitHandler<TransactionFormValues> = async (
    data: TransactionFormValues,
  ) => {
    try {
      const submissionData = {
        totalAmount: grandTotal,
        totalPaid: Number(data.totalPaid || "0") || 0,
        commission: commission,
        paymentTypeId: data.paymentTypeId,
        customerId: customer?.id || "",
        transactionDate: new Date(),
        status: status,
        note: data.note || "",
        items: cart.map((item) => {
          const variantData = item.variant;
          return {
            product: {
              id: item.product.originalId || item.product.id,
              discount: item.product.discount,
            },
            variant: variantData
              ? {
                  id: variantData.id,
                  name: variantData.name,
                  netto: variantData.netto,
                }
              : undefined,
            quantity: item.quantity,
            tempSellPrice:
              item.tempSellPrice ||
              findSellPrice({
                sellPrices: item.product.sellPrices,
                type: customer?.category,
                quantity: item.quantity,
                unitVariant: item.variant,
              }),
            isManualPrice: !!item.tempSellPrice,
            note: item.note,
          };
        }),
      };

      const result =
        await createTransactionMutation.mutateAsync(submissionData);

      if (result.id) {
        setCheckoutData({
          id: result.id,
          referenceNumber: result.local_ref_id || "",
          createdById: user?.id || "",
          createdByName: user?.name || "",
          createdAt: new Date().toISOString(),
          updatedById: user?.id || "",
          updatedByName: user?.name || "",
          updatedAt: new Date().toISOString(),
          items: cart,
          totalItems: cartTotal,
          totalPaid: data.totalPaid,
          customerId: customer?.id || "",
          transactionDate: new Date(),
          isCashdrawer: false,
          status: status,
          note: data.note || "",
        });

        if (status === "DRAFT") {
          router.push("/(main)/transaction");
        } else {
          router.replace(`/(main)/transaction/receipt/${result.id}`);
        }
        resetCart();
        setCustomer(null);
      }
    } catch (error) {
      console.error("[onSubmit] Error creating transaction:", error);
    }
  };

  return (
    <VStack className="flex-1 bg-white">
      <Header
        header={status === "DRAFT" ? "SIMPAN DRAFT" : "CHECKOUT"}
        isGoBack
        action={
          <HStack space="md" className="pr-4">
            <Pressable
              className="size-10 items-center justify-center border-primary-500 border rounded-lg bg-primary-100 active:bg-primary-200"
              disabled={isLoading}
              onPress={form.handleSubmit(onSubmit, (errors) => {
                if (errors.totalPaid)
                  showValidationError(errors.totalPaid.message);
                else if (errors.paymentTypeId)
                  showValidationError(errors.paymentTypeId.message);
              })}
            >
              {isLoading ? (
                <Spinner size="small" color="#3d2117" />
              ) : (
                <Icon as={Check} size="md" color="#3d2117" />
              )}
            </Pressable>
          </HStack>
        }
      />
      <HStack className="flex-1 bg-white">
        <VStack className="flex-1 border-r border-gray-300">
          <ScrollView className="flex-1">
            <VStack className="flex-1">
              <HStack className="justify-center p-6 flex-col items-center">
                <Text className="text-typography-600 mb-2 font-bold">
                  Total Tagihan
                </Text>
                <Heading size="3xl" className="font-bold text-center">
                  {`Rp ${totalPurchase.toLocaleString("id-ID")}`}
                </Heading>
                {commission > 0 && (
                  <Text className="text-warning-600 mt-2 font-bold">
                    *Termasuk tambahan biaya Rp{" "}
                    {commission.toLocaleString("id-ID")}
                  </Text>
                )}
                {cartDiscountTotal > 0 && (
                  <Text className="text-error-600 mt-2 font-bold">
                    **Diskon Rp {cartDiscountTotal.toLocaleString("id-ID")}
                  </Text>
                )}
              </HStack>
              <VStack space="lg" className="p-4">
                <Controller
                  control={form.control}
                  name="paymentTypeId"
                  render={({
                    field: { onChange, value },
                    fieldState: { error },
                  }) => (
                    <FormControl isRequired isInvalid={!!error}>
                      <HStack space="md">
                        <SelectModal
                          value={value}
                          placeholder="Metode Pembayaran"
                          options={paymentTypes}
                          className="flex-1"
                          onChange={(v) => {
                            onChange(v);
                          }}
                        />
                        <Pressable
                          className="size-10 rounded-full bg-primary-500 items-center justify-center"
                          onPress={() => setPaymentTypeOpen(true, () => {})}
                        >
                          <Icon as={PlusIcon} color="white" />
                        </Pressable>
                      </HStack>
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
                  name="note"
                  control={form.control}
                  render={({
                    field: { onChange, onBlur, value },
                    fieldState: { error },
                  }) => (
                    <FormControl isInvalid={!!error}>
                      <Textarea size="md">
                        <TextareaInput
                          value={value}
                          autoComplete="off"
                          placeholder="Keterangan"
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
              </VStack>
            </VStack>
          </ScrollView>
        </VStack>
        {status === "COMPLETED" && (
          <VStack className="flex-1">
            <ScrollView className="flex-1">
              <VStack className="flex-1">
                <HStack className="justify-center p-6 flex-col items-center">
                  <Heading size="3xl" className="font-bold">
                    Rp{" "}
                    {totalPaid
                      ? parseFloat(totalPaid).toLocaleString("id-ID")
                      : "0"}
                  </Heading>
                  {Number(totalPaid) > form.getValues("totalPurchase") && (
                    <Text className="text-success-500 font-bold mt-2">
                      Kembalian: Rp{" "}
                      {(
                        Number(totalPaid) - form.getValues("totalPurchase")
                      ).toLocaleString("id-ID")}
                    </Text>
                  )}
                </HStack>
                <InputVirtualKeyboard
                  nominal={totalPaid}
                  totalAmount={grandTotal.toString()}
                  onChange={(value) => form.setValue("totalPaid", value)}
                />
              </VStack>
            </ScrollView>
          </VStack>
        )}
      </HStack>
    </VStack>
  );
}
