import Header from "@/components/header";
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
import { getErrorMessage } from "@/lib/api/client";
import { CreatePurchasingDTO, useCreatePurchasing } from "@/lib/api/purchasing";
import { useSuppliers } from "@/lib/api/suppliers";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { ScrollView } from "react-native";
import { z } from "zod";
// import { usePurchasing } from "@/lib/api/purchasing";
import { usePopUpConfirm } from "@/components/pop-up-confirm";
import InputVirtualKeyboard from "@/components/ui/input-virtual-keyboard";
import SelectModal from "@/components/ui/select/select-modal";
import { useCurrentUser } from "@/lib/api/auth";
import { usePaymentTypes } from "@/lib/api/payment-types";
import { usePaymentTypeStore } from "@/stores/payment-type";
import { usePurchasingStore } from "@/stores/purchasing";
import DateTimePicker from "@react-native-community/datetimepicker";
import dayjs from "dayjs";
import { ArrowRight, CalendarIcon, Check, PlusIcon } from "lucide-react-native";

const purchasingSchema = z
  .object({
    totalPurchase: z
      .number()
      .min(0, "Total pembelian harus lebih besar atau sama dengan 0"),
    totalPaid: z.string(),
    supplierId: z.string().min(1, "Supplier harus dipilih"),
    isPayable: z.boolean(),
    transactionDate: z.date().nullable(),
    dueDate: z.date().nullable(),
    isCashdrawer: z.boolean(),
    status: z.string(),
    paymentMethodId: z.string().min(1, "Metode pembayaran harus dipilih"),
    note: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.transactionDate === null) {
      ctx.addIssue({
        code: "custom",
        message: "Tanggal transaksi harus diisi",
        path: ["transactionDate"],
      });
    }
    if (data.isPayable && data.dueDate === null) {
      ctx.addIssue({
        code: "custom",
        message: "Tanggal jatuh tempo harus diisi",
        path: ["dueDate"],
      });
    }
  });

export type PurchasingFormValues = z.infer<typeof purchasingSchema>;

export default function PurchasingCheckoutForm() {
  const { showPopUpConfirm, hidePopUpConfirm } = usePopUpConfirm();
  const router = useRouter();

  const { data: user } = useCurrentUser();
  const { cart, cartTotal, status, setCheckoutData, resetCart, purchaseId } =
    usePurchasingStore();
  const { data: paymentTypesData } = usePaymentTypes();
  const { setOpen: setPaymentTypeOpen } = usePaymentTypeStore();

  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [showTransactionDatePicker, setShowTransactionDatePicker] =
    useState(false);

  const initialValues: PurchasingFormValues = {
    totalPurchase: 0,
    totalPaid: "",
    transactionDate: null,
    supplierId: "",
    isPayable: false,
    dueDate: null,
    isCashdrawer: false,
    status: "DRAFT",
    paymentMethodId: "",
    note: "",
  };

  const form = useForm<PurchasingFormValues>({
    resolver: zodResolver(purchasingSchema),
    defaultValues: initialValues,
  });

  const transactionDate = form.watch("transactionDate");
  const totalPaid = form.watch("totalPaid");
  const isPayable = form.watch("isPayable");
  const paymentMethodId = form.watch("paymentMethodId");
  const { data: suppliers = [] } = useSuppliers();
  const createMutation = useCreatePurchasing();
  const isLoading = createMutation.isPending;

  const { grandTotal, commission } = useMemo(() => {
    let comm = 0;
    const pt = paymentTypesData?.find((p) => p.id === paymentMethodId);
    if (pt && cartTotal) {
      comm =
        pt.commissionType === "PERCENTAGE"
          ? (cartTotal * pt.commission) / 100
          : pt.commission;
    }
    return { commission: comm, grandTotal: cartTotal + comm };
  }, [cartTotal, paymentTypesData, paymentMethodId]);

  const paymentTypes =
    paymentTypesData?.map((pt) => ({
      label: pt.name,
      value: pt.id,
    })) || [];

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
      form.setValue("status", status);
      if (!paymentMethodId && paymentTypesData && paymentTypesData.length > 0) {
        const defaultPaymentType =
          paymentTypesData?.find((pt) => pt.isDefault)?.id ||
          paymentTypesData?.find(
            (pt) =>
              pt.name.toLowerCase() === "cash" ||
              pt.name.toLowerCase() === "tunai",
          )?.id ||
          "";
        form.setValue("paymentMethodId", defaultPaymentType);
      }
    } else {
      form.reset(initialValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, cartTotal, paymentTypesData, status, paymentMethodId]);

  useEffect(() => {
    form.setValue("totalPurchase", grandTotal);
  }, [form, grandTotal]);

  const onSubmit: SubmitHandler<PurchasingFormValues> = (
    data: PurchasingFormValues,
  ) => {
    if (
      data.status === "COMPLETED" &&
      Number(data.totalPaid) < data.totalPurchase &&
      !isPayable
    ) {
      toast.show({
        placement: "top",
        render: ({ id }) => (
          <Toast nativeID={`toast-${id}`} action="error" variant="solid">
            <ToastTitle>
              Total pembayaran tidak boleh kurang dari total pembelian
            </ToastTitle>
          </Toast>
        ),
      });
    } else if (
      data.status === "COMPLETED" &&
      Number(data.totalPaid) < data.totalPurchase &&
      isPayable
    ) {
      showPopUpConfirm({
        title: `APAKAH INI TRANSAKSI HUTANG?`,
        icon: "warning",
        description: (
          <Text className="text-slate-500">
            <Text>{`Pembayaran senilai `}</Text>
            <Text className="font-bold text-slate-900">{`Rp ${data.totalPaid ? Number(data.totalPaid).toLocaleString("id-ID") : 0}`}</Text>
            <Text>{` akan digunakan sebagai DP. Apakah transaksi akan dilanjutkan?`}</Text>
          </Text>
        ),
        showClose: true,
        okText: "OKE",
        closeText: "BATAL",
        okVariant: "solid",
        closeVariant: "destructive",
        onOk: () => {
          hidePopUpConfirm();
          goSubmit(data);
        },
      });
    } else {
      goSubmit(data);
    }
  };

  const goSubmit = (data: PurchasingFormValues) => {
    const submissionData: CreatePurchasingDTO = {
      ...data,
      id: purchaseId || undefined,
      totalPaid: Number(data.totalPaid),
      items: cart.map((item) => ({
        product: {
          id: item.product.id,
          purchasePrice: item.product.purchasePrice,
        },
        newPurchasePrice: item.newPurchasePrice,
        quantity: item.quantity,
        note: item.note,
      })),
    };

    createMutation.mutate(submissionData, {
      onSuccess: (responseData) => {
        setCheckoutData({
          ...data,
          id: responseData.id,
          referenceNumber: responseData.local_ref_id || "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdById: user?.id || "",
          createdByName: user?.name || "",
          updatedById: user?.id || "",
          updatedByName: user?.name || "",
          items: cart,
        });
        const changedProductPrice = cart.filter(
          (item) => item.newPurchasePrice !== item.product.purchasePrice,
        );
        if (data.status === "DRAFT") {
          router.replace("/(main)/purchasing");
          resetCart();
          setCheckoutData(null);
        } else {
          router.replace(
            `/(main)/purchasing/success/${responseData.id}` as any,
          );
          if (!!changedProductPrice.length) {
            showPopUpConfirm({
              title: `ADA PERUBAHAN HARGA BELI`,
              icon: "warning",
              description: (
                <VStack space="sm">
                  <Text className="text-slate-500">
                    Harga Beli berubah pada beberapa produk. Apakah Anda ingin
                    menyesuaikan Harga Jual?
                  </Text>
                  {changedProductPrice.map((item) => (
                    <HStack
                      key={item.product.id}
                      space="sm"
                      className="items-center"
                    >
                      <Box className="w-2 h-2 rounded-full bg-slate-500" />
                      <Text className="text-slate-500 font-bold">
                        {item.product.name}
                      </Text>
                      <Text className="font-bold text-slate-500">
                        {`Rp ${item.product.purchasePrice.toLocaleString("id-ID")}`}
                      </Text>
                      <Icon as={ArrowRight} className="text-slate-500" />
                      <Text
                        className={`font-bold${item.newPurchasePrice < item.product.purchasePrice ? " text-success-500" : " text-error-500"}`}
                      >
                        {`Rp ${item.newPurchasePrice.toLocaleString("id-ID")}`}
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              ),
              showClose: true,
              okText: "UBAH HARGA",
              closeText: "NANTI SAJA",
              okVariant: "solid",
              closeVariant: "destructive",
              onOk: () => {
                router.replace(
                  "/(main)/management/product-category-brand/product",
                );
                resetCart();
                setCheckoutData(null);
              },
            });
          }
        }
      },
      onError: (error) => {
        showErrorToast(error);
      },
    });

    // if (purchasingId && purchasing) {
    //   const updateData: UpdatePurchasingDTO = {
    //     ...data,
    //     id: purchasing.id,
    //     password: purchasing.password || undefined,
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
    //   const createData: CreatePurchasingDTO = restData;
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
              {isLoading ? (
                <Spinner size="small" color="#FFFFFF" />
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
                  {`Rp ${form.getValues("totalPurchase").toLocaleString("id-ID")}`}
                </Heading>
                {commission > 0 && (
                  <Text className="text-warning-600 mt-2 font-bold">
                    *Termasuk tambahan biaya Rp{" "}
                    {commission.toLocaleString("id-ID")}
                  </Text>
                )}
              </HStack>
              <VStack space="lg" className="p-4">
                <Controller
                  name="transactionDate"
                  control={form.control}
                  render={({
                    field: { onChange, value },
                    fieldState: { error },
                  }) => (
                    <FormControl
                      isRequired
                      isInvalid={!!error}
                      className="flex-1"
                    >
                      <Pressable
                        onPress={() => setShowTransactionDatePicker(true)}
                        className={`border border-background-300 rounded px-3 py-2${error ? " border-red-500" : ""}`}
                      >
                        <HStack className="items-center justify-between">
                          <Text>
                            {value instanceof Date
                              ? dayjs(value).format("DD/MM/YYYY")
                              : "Tanggal Transaksi"}
                          </Text>
                          <Icon as={CalendarIcon} size="md" className="mr-2" />
                        </HStack>
                      </Pressable>
                      {showTransactionDatePicker && (
                        <DateTimePicker
                          mode="date"
                          value={value instanceof Date ? value : new Date()}
                          maximumDate={new Date()}
                          onChange={(event, selectedDate) => {
                            setShowTransactionDatePicker(false);
                            if (event.type === "set" && selectedDate) {
                              onChange(selectedDate);
                            }
                          }}
                        />
                      )}
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
                  control={form.control}
                  name="supplierId"
                  render={({
                    field: { onChange, value },
                    fieldState: { error },
                  }) => (
                    <FormControl isRequired isInvalid={!!error}>
                      <HStack space="md">
                        <SelectModal
                          value={value}
                          placeholder="Pilih Supplier"
                          searchPlaceholder="Cari Supplier"
                          options={suppliers.map((sup) => ({
                            label: sup.name,
                            value: sup.id,
                          }))}
                          className="flex-1"
                          onChange={onChange}
                        />
                        <Pressable
                          className="size-10 rounded-full bg-primary-500 items-center justify-center"
                          onPress={() =>
                            router.navigate(
                              "/(main)/management/customer-supplier/supplier/add",
                            )
                          }
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
                {status === "COMPLETED" && (
                  <Controller
                    name="isPayable"
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
                          <CheckboxLabel>Hutang</CheckboxLabel>
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
                )}
                {isPayable && (
                  <Controller
                    name="dueDate"
                    control={form.control}
                    render={({
                      field: { onChange, value },
                      fieldState: { error },
                    }) => (
                      <FormControl isInvalid={!!error} className="flex-1">
                        <Pressable
                          onPress={() => setShowDueDatePicker(true)}
                          className={`border border-background-300 rounded px-3 py-2${error ? " border-red-500" : ""}`}
                        >
                          <HStack className="items-center justify-between">
                            <Text>
                              {value instanceof Date
                                ? dayjs(value).format("DD/MM/YYYY")
                                : "Tanggal Jatuh Tempo"}
                            </Text>
                            <Icon
                              as={CalendarIcon}
                              size="md"
                              className="mr-2"
                            />
                          </HStack>
                        </Pressable>
                        {showDueDatePicker && (
                          <DateTimePicker
                            mode="date"
                            value={value instanceof Date ? value : new Date()}
                            minimumDate={transactionDate || new Date()}
                            onChange={(event, selectedDate) => {
                              setShowDueDatePicker(false);
                              if (event.type === "set" && selectedDate) {
                                onChange(selectedDate);
                              }
                            }}
                          />
                        )}
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
                <Controller
                  control={form.control}
                  name="paymentMethodId"
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
                  {Number(totalPaid) > form.getValues("totalPurchase") &&
                    !form.getValues("isPayable") && (
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
