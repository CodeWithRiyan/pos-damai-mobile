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
import { useSuppliers } from "@/lib/api/suppliers";
// import {
//   CreatePurchasingDTO,
//   UpdatePurchasingDTO,
//   useCreatePurchasing,
//   useUpdatePurchasing,
//   usePurchasing,
// } from "@/lib/api/purchasing";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { ScrollView } from "react-native";
import { z } from "zod";
// import { usePurchasing } from "@/lib/api/purchasing";
import InputVirtualKeyboard from "@/components/ui/input-virtual-keyboard";
import { usePurchasingStore } from "@/stores/purchasing";
import DateTimePicker from "@react-native-community/datetimepicker";
import dayjs from "dayjs";
import { Check } from "lucide-react-native";

export default function PurchasingCheckoutForm() {
  const router = useRouter();

  const { cartTotal, resetCart } = usePurchasingStore();

  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [showTransactionDatePicker, setShowTransactionDatePicker] =
    useState(false);

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
      note: z.string(),
    })
    .superRefine((data, ctx) => {
      if (parseFloat(data.totalPaid) < data.totalPurchase) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Total pembayaran tidak boleh kurang dari total pembelian",
        });
      }
      if (data.transactionDate === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Tanggal transaksi harus diisi",
        });
      }
      if (data.isPayable && data.dueDate === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Tanggal jatuh tempo harus diisi",
        });
      }
    });

  type PurchasingFormValues = z.infer<typeof purchasingSchema>;

  const initialValues: PurchasingFormValues = {
    totalPurchase: 0,
    totalPaid: "",
    transactionDate: null,
    supplierId: "",
    isPayable: false,
    dueDate: null,
    isCashdrawer: false,
    note: "",
  };

  const form = useForm<PurchasingFormValues>({
    resolver: zodResolver(purchasingSchema),
    defaultValues: initialValues,
  });

  const totalPaid = form.watch("totalPaid");
  const isPayable = form.watch("isPayable");

  const { data: suppliers = [] } = useSuppliers();
  // const { data: purchasings = [], refetch: refetchPurchasings } = usePurchasing(purchasingId);
  // const createMutation = useCreatePurchasing();
  // const updateMutation = useUpdatePurchasing();

  const isLoading = false; //createMutation.isPending || updateMutation.isPending;

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
    } else {
      form.reset(initialValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, cartTotal]);

  const onRefetch = () => {};

  const handleCancel = () => {
    router.back();
  };

  const onSubmit: SubmitHandler<PurchasingFormValues> = (
    data: PurchasingFormValues,
  ) => {
    handleCancel();
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
        header="CHECKOUT"
        isGoBack
        action={
          <HStack space="sm" className="pr-4">
            <Pressable
              className="size-10 items-center justify-center"
              onPress={form.handleSubmit(onSubmit)}
            >
              <Icon as={Check} size="xl" color="#FDFBF9" />
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
                        className="border border-background-300 rounded px-3 py-2"
                      >
                        <Text>
                          {value instanceof Date
                            ? dayjs(value).format("DD/MM/YYYY")
                            : "Tanggal Transaksi"}
                        </Text>
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
                      <Select onValueChange={onChange} onBlur={onBlur}>
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
                          <SelectContent className="px-0">
                            <SelectDragIndicatorWrapper>
                              <SelectDragIndicator />
                            </SelectDragIndicatorWrapper>
                            {suppliers.map((supplier) => (
                              <SelectItem
                                key={supplier.id}
                                label={supplier.name}
                                value={supplier.id}
                                textStyle={{ className: "capitalize flex-1" }}
                                className="px-4 py-4"
                              />
                            ))}
                          </SelectContent>
                        </SelectPortal>
                      </Select>
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
                      <FormControl
                        isRequired
                        isInvalid={!!error}
                        className="flex-1"
                      >
                        <Pressable
                          onPress={() => setShowDueDatePicker(true)}
                          className="border border-background-300 rounded px-3 py-2"
                        >
                          <Text>
                            {value instanceof Date
                              ? dayjs(value).format("DD/MM/YYYY")
                              : "Tanggal Jatuh Tempo"}
                          </Text>
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
