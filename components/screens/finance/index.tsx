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
  Icon,
  Input,
  InputField,
  InputSlot,
  Text,
  Textarea,
  TextareaInput,
} from "@/components/ui";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { SolarIconBold } from "@/components/ui/solar-icon-wrapper";
import { VStack } from "@/components/ui/vstack";
// import { useBulkDeleteFinance, Finance, useFinance } from "@/lib/api/finance";
import { Radio, RadioGroup, RadioLabel } from "@/components/ui/radio";
import SelectModal from "@/components/ui/select/select-modal";
import { zodResolver } from "@hookform/resolvers/zod";
import DateTimePicker from "@react-native-community/datetimepicker";
import dayjs from "dayjs";
import { useRouter } from "expo-router";
import { CalendarIcon, CheckIcon } from "lucide-react-native";
import React, { useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { ScrollView } from "react-native";
import z from "zod";

export type Finance = {
  id: string;
  local_ref_id: string;
  nominal: number;
  type: "INCOME" | "EXPENSES";
  expensesType?: "STORE_EXPENSES" | "SUPPLIES" | "EQUIPMENT";
  transactionDate: Date;
  status: "DRAFT" | "COMPLETED";
  createdByName: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  note: string;
};

export const dummyData: Finance[] = [
  {
    id: "1",
    local_ref_id: "ref_1",
    nominal: 50000,
    type: "INCOME",
    transactionDate: new Date(),
    status: "COMPLETED",
    createdByName: "John Doe",
    createdById: "1",
    createdAt: new Date(),
    updatedAt: new Date(),
    note: "Bagi Hasil Parkir",
  },
  {
    id: "2",
    local_ref_id: "ref_2",
    nominal: 50000,
    type: "INCOME",
    transactionDate: new Date(),
    status: "DRAFT",
    createdByName: "John Doe",
    createdById: "1",
    createdAt: new Date(),
    updatedAt: new Date(),
    note: "Bagi Hasil Parkir",
  },
  {
    id: "3",
    local_ref_id: "ref_3",
    nominal: 50000,
    type: "EXPENSES",
    transactionDate: new Date(),
    status: "COMPLETED",
    createdByName: "John Doe",
    createdById: "1",
    createdAt: new Date(),
    updatedAt: new Date(),
    note: "BAYAR WIFI",
  },
  {
    id: "4",
    local_ref_id: "ref_4",
    nominal: 900000,
    type: "EXPENSES",
    expensesType: "EQUIPMENT",
    transactionDate: new Date(),
    status: "COMPLETED",
    createdByName: "Jane Doe",
    createdById: "2",
    createdAt: new Date(),
    updatedAt: new Date(),
    note: "Beli Rak Baru",
  },
];

const financeSchema = z.object({
  type: z.string(), // "INCOME" || "EXPENSES"
  expensesType: z.string(), // "STORE_EXPENSES" || "SUPPLIES" || "EQUIPMENT"
  nominal: z.number().min(1, "Nominal wajib diisi."),
  transactionDate: z.date(),
  note: z.string().min(1, "Catatan wajib diisi."),
  inputToCashdrawer: z.boolean(),
});

export type FinanceFormValues = z.infer<typeof financeSchema>;

export const expensesTypeOptions = [
  {
    label: "Store Expenses",
    value: "STORE_EXPENSES",
  },
  {
    label: "Supplies",
    value: "SUPPLIES",
  },
  {
    label: "Equipment",
    value: "EQUIPMENT",
  },
];

export default function FinanceTransaction() {
  const router = useRouter();
  const [showTransactionDatePicker, setShowTransactionDatePicker] =
    useState(false);

  const initialValues: FinanceFormValues = {
    type: "INCOME",
    expensesType: "STORE_EXPENSES",
    nominal: 0,
    transactionDate: new Date(),
    note: "",
    inputToCashdrawer: false,
  };

  const form = useForm<FinanceFormValues>({
    resolver: zodResolver(financeSchema),
    defaultValues: initialValues,
  });

  // TODO: Simpan transaksi dan pindah ke screen success
  const onSubmit: SubmitHandler<FinanceFormValues> = (
    data: FinanceFormValues,
  ) => {
    console.log(data);
    router.navigate("/(main)/finance/success");
  };

  return (
    <Box className="flex-1 bg-white">
      <Header
        header="KEUANGAN"
        action={
          <HStack space="sm" className="pr-4">
            <Pressable
              className="size-10 items-center justify-center"
              onPress={() => router.navigate("/(main)/finance/draft")}
            >
              <SolarIconBold name="ClipboardList" size={20} color="#FDFBF9" />
            </Pressable>
            <Pressable
              className="size-10 items-center justify-center"
              onPress={() => router.navigate("/(main)/finance/history")}
            >
              <SolarIconBold name="History" size={20} color="#FDFBF9" />
            </Pressable>
          </HStack>
        }
      />
      <HStack className="flex-1 bg-white">
        <VStack className="flex-1 border-r border-gray-300">
          <ScrollView className="flex-1">
            <VStack space="lg" className="p-4">
              <Controller
                name="type"
                control={form.control}
                render={({
                  field: { onChange, onBlur, value },
                  fieldState: { error },
                }) => (
                  <FormControl isRequired isInvalid={!!error}>
                    <FormControlLabel>
                      <FormControlLabelText>Transaksi</FormControlLabelText>
                    </FormControlLabel>
                    <RadioGroup
                      value={value}
                      onChange={onChange}
                      onBlur={onBlur}
                      className="flex-row gap-2"
                    >
                      <Radio
                        value="INCOME"
                        isInvalid={false}
                        isDisabled={false}
                        className={`flex-1 h-16 border rounded-sm flex items-center justify-center${
                          value === "INCOME"
                            ? " bg-success-100 border-success-500"
                            : " bg-background-100 border-background-300"
                        }`}
                      >
                        <RadioLabel>
                          <Text
                            className={`text-lg font-bold${value === "INCOME" ? " text-success-500" : ""}`}
                          >
                            Pemasukan
                          </Text>
                        </RadioLabel>
                      </Radio>
                      <Radio
                        value="EXPENSES"
                        isInvalid={false}
                        isDisabled={false}
                        className={`flex-1 h-16 border rounded-sm flex items-center justify-center${
                          value === "EXPENSES"
                            ? " bg-error-100 border-error-500"
                            : " bg-background-100 border-background-300"
                        }`}
                      >
                        <RadioLabel>
                          <Text
                            className={`text-lg font-bold${value === "EXPENSES" ? " text-error-500" : ""}`}
                          >
                            Pengeluaran
                          </Text>
                        </RadioLabel>
                      </Radio>
                    </RadioGroup>
                  </FormControl>
                )}
              />
              {/* TODO: Pilih jenis pengeluaran hanya muncul pada role admin */}
              <Controller
                control={form.control}
                name="expensesType"
                render={({
                  field: { onChange, value },
                  fieldState: { error },
                }) => (
                  <FormControl isRequired isInvalid={!!error}>
                    <FormControlLabel>
                      <FormControlLabelText>
                        Jenis Pengeluaran
                      </FormControlLabelText>
                    </FormControlLabel>
                    <HStack space="md">
                      <SelectModal
                        value={value}
                        placeholder="Pilih Jenis Pengeluaran"
                        showSearch={false}
                        options={expensesTypeOptions}
                        className="flex-1"
                        onChange={onChange}
                      />
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
                name="nominal"
                control={form.control}
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
                    <FormControlLabel>
                      <FormControlLabelText>
                        Tanggal Transaksi
                      </FormControlLabelText>
                    </FormControlLabel>
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
                name="note"
                control={form.control}
                render={({
                  field: { onChange, onBlur, value },
                  fieldState: { error },
                }) => (
                  <FormControl isRequired isInvalid={!!error}>
                    <FormControlLabel>
                      <FormControlLabelText>Catatan</FormControlLabelText>
                    </FormControlLabel>
                    <Textarea size="md">
                      <TextareaInput
                        value={value}
                        autoComplete="off"
                        placeholder="Catatan"
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
              {/* TODO: inputToCashdrawer tidak muncul di role admin */}
              <Controller
                name="inputToCashdrawer"
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
                      <CheckboxLabel>Masukkan kedalam cashdrawer</CheckboxLabel>
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
              <HStack space="md" className="w-full py-4">
                <Pressable
                  className="flex-1 flex-row items-center justify-center h-12 px-4 rounded-lg bg-primary-500 active:bg-primary-500/90"
                  onPress={form.handleSubmit(onSubmit)}
                >
                  <Text size="lg" className="text-white font-bold">
                    SIMPAN
                  </Text>
                </Pressable>
                <Pressable
                  className="items-center justify-center size-12 rounded-lg border border-primary-500 bg-background-0 active:bg-primary-300"
                  onPress={() => {}} // TODO: simpan transaksi keuangan kedalam draft
                >
                  <SolarIconBold
                    name="ClipboardAdd"
                    size={28}
                    color="#3d2117"
                  />
                </Pressable>
              </HStack>
            </VStack>
          </ScrollView>
        </VStack>
      </HStack>
    </Box>
  );
}
