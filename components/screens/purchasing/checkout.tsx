import Header from "@/components/header";
import {
  Checkbox,
  CheckboxIcon,
  CheckboxIndicator,
  CheckboxLabel,
  CheckIcon,
  ChevronDownIcon,
  FormControl,
  FormControlError,
  FormControlErrorText,
  Heading,
  HStack,
  Icon,
  Pressable,
  Select,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicator,
  SelectDragIndicatorWrapper,
  SelectIcon,
  SelectInput,
  SelectItem,
  SelectPortal,
  SelectTrigger,
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
import { useEffect, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { ScrollView } from "react-native";
import { z } from "zod";
// import { usePurchasing } from "@/lib/api/purchasing";
import InputVirtualKeyboard from "@/components/ui/input-virtual-keyboard";
import { useCurrentUser } from "@/lib/api/auth";
import { usePurchasingStore } from "@/stores/purchasing";
import DateTimePicker from "@react-native-community/datetimepicker";
import dayjs from "dayjs";
import { CalendarIcon, Check, PlusIcon } from "lucide-react-native";

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
    if (data.transactionDate === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Tanggal transaksi harus diisi",
        path: ["transactionDate"],
      });
    }
    if (data.isPayable && data.dueDate === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Tanggal jatuh tempo harus diisi",
        path: ["dueDate"],
      });
    }
  });

export type PurchasingFormValues = z.infer<typeof purchasingSchema>;

export default function PurchasingCheckoutForm() {
  const router = useRouter();

  const { data: user } = useCurrentUser();
  const { cart, cartTotal, status, setCheckoutData } = usePurchasingStore();

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
    note: "",
  };

  const form = useForm<PurchasingFormValues>({
    resolver: zodResolver(purchasingSchema),
    defaultValues: initialValues,
  });

  const totalPaid = form.watch("totalPaid");
  const isPayable = form.watch("isPayable");
  const { data: suppliers = [] } = useSuppliers();
  const createMutation = useCreatePurchasing();

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

  const onSubmit: SubmitHandler<PurchasingFormValues> = (
    data: PurchasingFormValues,
  ) => {
    const submissionData: CreatePurchasingDTO = {
      ...data,
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
          referenceNumber: responseData.localRefId || "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdById: user?.id || "",
          createdByName: user?.name || "",
          updatedById: user?.id || "",
          updatedByName: user?.name || "",
          items: cart,
        });

        if (data.status === "DRAFT") {
          router.replace("/(main)/purchasing");
        } else {
          router.replace("/(main)/purchasing/success");
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
                    field: { onChange, onBlur, value },
                    fieldState: { error },
                  }) => (
                    <FormControl isRequired isInvalid={!!error}>
                      <HStack space="md">
                        <Select
                          onValueChange={onChange}
                          onBlur={onBlur}
                          className="flex-1"
                        >
                          <SelectTrigger>
                            <SelectInput
                              value={
                                suppliers.find(
                                  (supplier) => supplier.id === value,
                                )?.name
                              }
                              placeholder="Supplier"
                              className="flex-1 capitalize"
                            />
                            <SelectIcon className="mr-3" as={ChevronDownIcon} />
                          </SelectTrigger>
                          <SelectPortal>
                            <SelectBackdrop />
                            <SelectContent>
                              <SelectDragIndicatorWrapper>
                                <SelectDragIndicator />
                              </SelectDragIndicatorWrapper>
                              <VStack className="pt-5 pb-8">
                                {suppliers.map((supplier) => (
                                  <SelectItem
                                    key={supplier.id}
                                    label={supplier.name}
                                    value={supplier.id}
                                    textStyle={{
                                      className: "capitalize flex-1",
                                    }}
                                    className="px-4 py-4"
                                  />
                                ))}
                              </VStack>
                            </SelectContent>
                          </SelectPortal>
                        </Select>
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
                            minimumDate={new Date()}
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
