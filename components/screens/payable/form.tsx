import Header from "@/components/header";
import {
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
import SelectModal from "@/components/ui/select/select-modal";
import { getErrorMessage } from "@/lib/api/client";
import { useSuppliers } from "@/lib/api/suppliers";
// import {
//   CreatePayableDTO,
//   UpdatePayableDTO,
//   useCreatePayable,
//   useUpdatePayable,
//   usePayable,
//   usePayableList,
// } from "@/lib/api/payment";
import { zodResolver } from "@hookform/resolvers/zod";
import DateTimePicker from "@react-native-community/datetimepicker";
import dayjs from "dayjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CalendarIcon } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { ScrollView } from "react-native";
import { z } from "zod";
import { dataPayable } from ".";

export default function PayableForm() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const supplierId = params.supplierId as string;
  const action = params.action as string;
  const isAdd = action === "add";
  const payableId = supplierId;

  const payableSchema = z.object({
    nominal: z.number().min(1, "Nominal wajib diisi."),
    supplierId: z.string().min(1, "Supplier wajib diisi."),
    dueDate: z.date().nullable(),
    note: z.string(),
  });

  type PayableFormValues = z.infer<typeof payableSchema>;

  const initialValues: PayableFormValues = {
    nominal: 0,
    supplierId: "",
    dueDate: null,
    note: "",
  };

  const form = useForm<PayableFormValues>({
    resolver: zodResolver(payableSchema),
    defaultValues: initialValues,
  });

  const [showDueDatePicker, setShowDueDatePicker] = useState<boolean>(false);

  // TODO: Panggil usePayableList dan usePayable
  // const { refetch: refetchPayableList } = usePayableList();
  // const { data: payable, refetch: refetchPayable } = usePayable(payableId || "");
  const payable = dataPayable.find((item) => item.supplierId === supplierId);
  const { data: suppliers = [] } = useSuppliers();
  // TODO: Panggil useCreatePayable dan useUpdatePayable
  // const createMutation = useCreatePayable();
  // const updateMutation = useUpdatePayable();

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
    if (payableId && payable) {
      form.reset({
        ...payable,
        dueDate: new Date(payable.dueDate),
      });
    } else {
      form.reset(initialValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, payable, payableId]);

  // Gunakan refetch setelah submit success
  const onRefetch = () => {
    // refetchPayableList();
    // if (payableId) {
    //   refetchPayable();
    // }
  };

  const handleCancel = () => {
    router.back();
  };

  // TODO: Eksekusi createMutation.mutate dan updateMutation.mutate di onSubmit
  const onSubmit: SubmitHandler<PayableFormValues> = (
    data: PayableFormValues,
  ) => {};

  return (
    <VStack className="flex-1 bg-white">
      <Header header={isAdd ? "TAMBAH HUTANG" : "EDIT HUTANG"} isGoBack />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <VStack space="lg" className="p-4">
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
                    onChangeText={(text) => onChange(Number(text) || 0)}
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
            control={form.control}
            name="supplierId"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <FormControl isRequired isInvalid={!!error}>
                <FormControlLabel>
                  <FormControlLabelText>Supplier</FormControlLabelText>
                </FormControlLabel>
                <SelectModal
                  value={value}
                  placeholder="Supplier"
                  searchPlaceholder="Cari nama supplier"
                  options={suppliers.map((supplier) => ({
                    label: supplier.name,
                    value: supplier.id,
                  }))}
                  className="flex-1"
                  onChange={onChange}
                />
                {error && (
                  <FormControlError>
                    <FormControlErrorText>{error.message}</FormControlErrorText>
                  </FormControlError>
                )}
              </FormControl>
            )}
          />
          <Controller
            name="dueDate"
            control={form.control}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <FormControl isRequired isInvalid={!!error} className="flex-1">
                <FormControlLabel>
                  <FormControlLabelText>Jatuh Tempo</FormControlLabelText>
                </FormControlLabel>
                <Pressable
                  onPress={() => setShowDueDatePicker(true)}
                  className={`border border-background-300 rounded px-3 py-2${error ? " border-red-500" : ""}`}
                >
                  <HStack className="items-center justify-between">
                    <Text>
                      {value instanceof Date
                        ? dayjs(value).format("DD/MM/YYYY")
                        : "Jatuh Tempo"}
                    </Text>
                    <Icon as={CalendarIcon} size="md" className="mr-2" />
                  </HStack>
                </Pressable>
                {showDueDatePicker && (
                  <DateTimePicker
                    mode="date"
                    value={value instanceof Date ? value : new Date()}
                    maximumDate={new Date()}
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
