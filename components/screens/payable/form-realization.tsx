import Header from "@/components/header";
import {
  Checkbox,
  CheckboxIcon,
  CheckboxIndicator,
  CheckboxLabel,
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
  HStack,
  Icon,
  Input,
  InputField,
  InputSlot,
  Pressable,
  Text,
  Textarea,
  TextareaInput,
  Toast,
  ToastTitle,
  useToast,
  VStack,
} from "@/components/ui";
import { getErrorMessage } from "@/lib/api/client";
// import {
//   CreatePayableRealizationDTO,
//   UpdatePayableRealizationDTO,
//   useCreatePayableRealization,
//   useUpdatePayableRealization,
//   usePayableRealization,
//   usePayableRealizationList,
// } from "@/lib/api/payable";
import SelectModal from "@/components/ui/select/select-modal";
import { SolarIconBoldDuotone } from "@/components/ui/solar-icon-wrapper";
import { usePaymentTypeStore } from "@/stores/payment-type";
import { zodResolver } from "@hookform/resolvers/zod";
import DateTimePicker from "@react-native-community/datetimepicker";
import dayjs from "dayjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CalendarIcon, CheckIcon, PlusIcon } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { ScrollView } from "react-native";
import { z } from "zod";
import { dataPayable } from ".";
import { paymentTypes } from "../transaction/checkout";

export default function PayableRealizationForm() {
  const { setOpen: setPaymentTypeOpen } = usePaymentTypeStore();

  const router = useRouter();
  const params = useLocalSearchParams();

  const realizationId = params.realizationId as string;
  const action = params.actionRealization as string;
  const isAdd = action === "add";
  const payableIds = (params.payableIds as string).split("-") || [];

  const payableRealizationSchema = z.object({
    nominal: z.number().min(1, "Nominal wajib diisi."),
    payOff: z.boolean(),
    realizationDate: z.date().nullable(),
    paymentTypeId: z.string().min(1, "Metode pembayaran harus dipilih"),
    note: z.string(),
  });

  type PayableRealizationFormValues = z.infer<typeof payableRealizationSchema>;

  const initialValues: PayableRealizationFormValues = {
    nominal: 0,
    payOff: false,
    realizationDate: new Date(),
    paymentTypeId: "",
    note: "",
  };

  const form = useForm<PayableRealizationFormValues>({
    resolver: zodResolver(payableRealizationSchema),
    defaultValues: initialValues,
  });

  const [showRealizationDatePicker, setShowRealizationDatePicker] =
    useState<boolean>(false);

  // TODO: Panggil usePayableList dan usePayableRealization
  // const { refetch: refetchPayableRealizationList } = usePayableRealizationList();
  // const { data: payableRealization, refetch: refetchPayableRealization } = usePayableRealization(realizationId || "");
  const payableList = dataPayable.filter((f) => payableIds.includes(f.id));
  const payableRealization = !isAdd
    ? payableList?.[0]?.realizations?.find((f) => f.id === realizationId)
    : null;
  const totalPayable = payableList.reduce(
    (total, payable) => total + payable.nominal,
    0,
  );
  const totalRealization = payableList.reduce(
    (total, payable) => total + payable.totalRealization,
    0,
  );

  // TODO: Panggil useCreatePayableRealization dan useUpdatePayableRealization
  // const createMutation = useCreatePayableRealization();
  // const updateMutation = useUpdatePayableRealization();

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
    if (payableRealization) {
      form.reset({
        nominal: payableRealization.nominal,
        realizationDate: dayjs(payableRealization.realizationDate).toDate(),
        paymentTypeId: payableRealization.paymentTypeId,
        note: payableRealization.note,
      });
    } else {
      form.reset(initialValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, payableRealization]);

  const onRefetch = () => {};

  const handleCancel = () => {
    router.back();
  };

  // TODO: Eksekusi createMutation.mutate dan updateMutation.mutate di onSubmit
  const onSubmit: SubmitHandler<PayableRealizationFormValues> = (
    data: PayableRealizationFormValues,
  ) => {};

  return (
    <VStack className="flex-1 bg-white">
      <Header
        header={isAdd ? "REALISASI HUTANG" : "EDIT REALISASI HUTANG"}
        isGoBack
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <VStack space="lg" className="p-4">
          {payableIds?.length <= 1 ? (
            <HStack space="sm">
              <HStack space="sm" className="items-center">
                <SolarIconBoldDuotone
                  name="UserCircle"
                  size={24}
                  color="#3b82f6"
                />
                <Text className="text-primary-500 font-bold">
                  {payableList?.[0]?.supplier.name}
                </Text>
              </HStack>
              <VStack className="flex-1 items-end">
                <Text className="text-gray-500 text-sm">Belum Dibayar</Text>
                <Text className="text-sm font-bold text-error-500">
                  {`Rp ${(totalPayable - totalRealization).toLocaleString("id-ID")}`}
                </Text>
              </VStack>
            </HStack>
          ) : (
            <HStack space="sm" className="justify-between">
              <VStack space="sm">
                <HStack space="sm" className="items-center">
                  <SolarIconBoldDuotone
                    name="UserCircle"
                    size={24}
                    color="#3b82f6"
                  />
                  <Text className="text-primary-500 font-bold">
                    {payableList?.[0]?.supplier.name}
                  </Text>
                </HStack>
                <VStack className="flex-1">
                  <Text className="text-gray-500 text-sm">
                    Sisa yang harus dibayar
                  </Text>
                  <Text className="text-sm font-bold text-error-500">
                    {`Rp ${(totalPayable - totalRealization).toLocaleString("id-ID")}`}
                  </Text>
                </VStack>
                <Text className="text-gray-500 text-sm">
                  Transaksi dengan jatuh tempo paling awal akan dilunasi
                  terlebih dahulu.
                </Text>
              </VStack>
              <VStack className="flex-1 items-end">
                <Text className="text-gray-500 text-sm">Total Transaksi</Text>
                <Text className="text-sm font-bold">{payableIds?.length}</Text>
              </VStack>
            </HStack>
          )}
          <Controller
            name="nominal"
            control={form.control}
            disabled={!isAdd}
            render={({
              field: { onChange, onBlur, value },
              fieldState: { error },
            }) => (
              <FormControl isRequired isInvalid={!!error}>
                <FormControlLabel>
                  <FormControlLabelText>Nominal</FormControlLabelText>
                </FormControlLabel>
                <Input className="h-16">
                  <InputSlot className="h-full aspect-square items-center justify-center bg-gray-100">
                    <Text className="text-2xl font-bold">Rp</Text>
                  </InputSlot>
                  <InputField
                    value={value.toString()}
                    autoComplete="off"
                    className="text-3xl text-center text-typography-500 font-bold"
                    placeholder="Masukkan nominal"
                    keyboardType="numeric"
                    onChangeText={(text) => {
                      if (Number(text) > totalPayable - totalRealization) {
                        onChange(totalPayable - totalRealization || 0);

                        return;
                      }
                      onChange(Number(text) || 0);
                    }}
                    onBlur={onBlur}
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
          <Controller
            name="payOff"
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
                    if (v)
                      form.setValue("nominal", totalPayable - totalRealization);
                  }}
                  onBlur={onBlur}
                >
                  <CheckboxIndicator>
                    <CheckboxIcon as={CheckIcon} />
                  </CheckboxIndicator>
                  <CheckboxLabel>Lunasi</CheckboxLabel>
                </Checkbox>
                {error && (
                  <FormControlError>
                    <FormControlErrorText>{error.message}</FormControlErrorText>
                  </FormControlError>
                )}
              </FormControl>
            )}
          />
          <Controller
            name="realizationDate"
            control={form.control}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <FormControl isRequired isInvalid={!!error} className="flex-1">
                <FormControlLabel>
                  <FormControlLabelText>
                    Tanggal Pembayaran
                  </FormControlLabelText>
                </FormControlLabel>
                <Pressable
                  onPress={() => setShowRealizationDatePicker(true)}
                  className={`border border-background-300 rounded px-3 py-2${error ? " border-red-500" : ""}`}
                >
                  <HStack className="items-center justify-between">
                    <Text>
                      {value instanceof Date
                        ? dayjs(value).format("DD/MM/YYYY")
                        : "Pilih tanggal"}
                    </Text>
                    <Icon as={CalendarIcon} size="md" className="mr-2" />
                  </HStack>
                </Pressable>
                {showRealizationDatePicker && (
                  <DateTimePicker
                    mode="date"
                    value={value instanceof Date ? value : new Date()}
                    maximumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      setShowRealizationDatePicker(false);
                      if (event.type === "set" && selectedDate) {
                        onChange(selectedDate);
                      }
                    }}
                  />
                )}
                {error && (
                  <FormControlError>
                    <FormControlErrorText>{error.message}</FormControlErrorText>
                  </FormControlError>
                )}
              </FormControl>
            )}
          />
          <Controller
            control={form.control}
            name="paymentTypeId"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <FormControl isRequired isInvalid={!!error}>
                <FormControlLabel>
                  <FormControlLabelText>Metode Pembayaran</FormControlLabelText>
                </FormControlLabel>
                <HStack space="md">
                  <SelectModal
                    value={value}
                    placeholder="Pilih Metode Pembayaran"
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
                    <FormControlErrorText>{error.message}</FormControlErrorText>
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
                <FormControlLabel>
                  <FormControlLabelText>Keterangan</FormControlLabelText>
                </FormControlLabel>
                <Textarea size="md">
                  <TextareaInput
                    value={value}
                    autoComplete="off"
                    placeholder="Tulis keterangan"
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
        </VStack>
      </ScrollView>
      <HStack className="w-full p-4 border-t border-slate-200 justify-end gap-4">
        <Pressable
          className="w-full rounded-sm h-9 flex justify-center items-center bg-primary-500 border border-primary-500"
          disabled={isLoading}
          onPress={form.handleSubmit(onSubmit)}
        >
          <Text size="sm" className="text-typography-0 font-bold">
            {isLoading ? "MENYIMPAN..." : "SIMPAN"}
          </Text>
        </Pressable>
      </HStack>
    </VStack>
  );
}
