import Header from "@/components/header";
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  Heading,
  HStack,
  Icon,
  Pressable,
  Textarea,
  TextareaInput,
  Toast,
  ToastTitle,
  useToast,
  VStack,
} from "@/components/ui";
import { getErrorMessage } from "@/lib/api/client";
// import { CreateTransactionDTO, useCreateTransaction } from "@/lib/api/transaction";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { ScrollView } from "react-native";
import { z } from "zod";
// import { useTransaction } from "@/lib/api/transaction";
import InputVirtualKeyboard from "@/components/ui/input-virtual-keyboard";
import SelectModal from "@/components/ui/select/select-modal";
import { useCurrentUser } from "@/lib/api/auth";
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
        code: z.ZodIssueCode.custom,
        message: "Total pembayaran tidak boleh kurang dari total pembelian",
        path: ["totalPaid"],
      });
    }
  });

export type TransactionFormValues = z.infer<typeof transactionSchema>;

// TODO: Replace with real data
export const paymentTypes = [
  { label: "Cash", value: "1" },
  { label: "Transfer", value: "2" },
  { label: "Qris", value: "3" },
  { label: "EDC", value: "4" },
  { label: "E-Wallet", value: "5" },
];

export default function TransactionCheckoutForm() {
  const router = useRouter();

  const { data: user } = useCurrentUser();
  const { customer, cart, cartTotal, status, setCheckoutData } =
    useTransactionStore();
  const { setOpen: setPaymentTypeOpen } = usePaymentTypeStore();
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

  const toast = useToast();

  const showErrorToast = (error: unknown) => {
    toast.show({
      placement: "top",
      render: ({ id }) => {
        const toastId = "toast-" + id;
        return (
          <Toast nativeID={toastId} action="error" variant="solid">
            <ToastTitle>{getErrorMessage(error)}</ToastTitle>
          </Toast>
        );
      },
    });
  };

  useEffect(() => {
    if (cartTotal) {
      form.setValue("totalPurchase", cartTotal);
      form.setValue("status", status);
    } else {
      form.reset(initialValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, cartTotal]);

  useEffect(() => {
    if (form.formState.errors.totalPaid) {
      toast.show({
        placement: "top",
        render: ({ id }) => (
          <Toast nativeID={`toast-${id}`} action="error" variant="solid">
            <ToastTitle>{form.formState.errors.totalPaid?.message}</ToastTitle>
          </Toast>
        ),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.formState.errors.totalPaid]);

  // TODO: mutation checkout transaction
  const onSubmit: SubmitHandler<TransactionFormValues> = (
    data: TransactionFormValues,
  ) => {
    // const submissionData: CreateTransactionDTO = {
    //   ...data,
    //   items: cart.map((item) => ({
    //     product: {
    //       id: item.product.id,
    //       purchasePrice: item.product.purchasePrice,
    //     },
    //     tempSellPrice: item.tempSellPrice,
    //     quantity: item.quantity,
    //     note: item.note,
    //   })),
    // };
    // createMutation.mutate(submissionData, {
    //   onSuccess: (responseData) => {
    setCheckoutData({
      ...data,
      id: "1", //responseData.id,
      referenceNumber: "", //responseData.localRefId || "",
      transactionDate: new Date(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdById: user?.id || "",
      createdByName: user?.name || "",
      updatedById: user?.id || "",
      updatedByName: user?.name || "",
      customerId: customer?.id || "",
      items: cart,
      totalItems: cartTotal,
    });
    if (data.status === "DRAFT") {
      router.replace("/(main)/transaction");
    } else {
      router.replace("/(main)/transaction/success");
    }
    //   },
    //   onError: (error) => {
    //     showErrorToast(error);
    //   },
    // });
    // if (transactionId && transaction) {
    //   const updateData: UpdateTransactionDTO = {
    //     ...data,
    //     id: transaction.id,
    //     password: transaction.password || undefined,
    //   };
    //   updateMutation.mutate(updateData, {
    //     onSuccess: () => {
    //       onRefetch();
    //       handleCancel();
    //       toast.show({
    //         placement: "top",
    //         render: ({ id }) => (
    //           <Toast nativeID={`toast-${id}`} action="success" variant="solid">
    //             <ToastTitle>Transaksi pembelian barang berhasil</ToastTitle>
    //           </Toast>
    //         ),
    //       });
    //     },
    //     onError: (error) => {
    //       showErrorToast(error);
    //     },
    //   });
    // } else {
    //   const { isActive, ...restData } = data;
    //   const createData: CreateTransactionDTO = restData;
    //   createMutation.mutate(createData, {
    //     onSuccess: () => {
    //       onRefetch();
    //       handleCancel();
    //       toast.show({
    //         placement: "top",
    //         render: ({ id }) => (
    //           <Toast nativeID={`toast-${id}`} action="success" variant="solid">
    //             <ToastTitle>Transaksi pembelian barang berhasil</ToastTitle>
    //           </Toast>
    //         ),
    //       });
    //     },
    //     onError: (error) => {
    //       showErrorToast(error);
    //     },
    //   });
    // }
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
              onPress={form.handleSubmit(onSubmit)}
            >
              <Icon as={Check} size="md" color="#3d2117" />
            </Pressable>
          </HStack>
        }
      />
      <HStack className="flex-1 bg-white">
        <VStack className="flex-1 border-r border-gray-300">
          <ScrollView className="flex-1">
            <VStack className="flex-1">
              <HStack className="justify-center p-6">
                <Heading size="3xl" className="font-bold">
                  {`Rp ${form.getValues("totalPurchase").toLocaleString("id-ID")}`}
                </Heading>
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
                          onChange={onChange}
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
        <VStack className="flex-1">
          <ScrollView className="flex-1">
            <VStack className="flex-1">
              <HStack className="justify-center p-6">
                <Heading size="3xl" className="font-bold">
                  Rp{" "}
                  {totalPaid
                    ? parseFloat(totalPaid).toLocaleString("id-ID")
                    : "0"}
                </Heading>
              </HStack>
              <InputVirtualKeyboard
                nominal={totalPaid}
                onChange={(value) => form.setValue("totalPaid", value)}
              />
            </VStack>
          </ScrollView>
        </VStack>
      </HStack>
    </VStack>
  );
}
