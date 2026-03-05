import { HStack, Pressable, SearchIcon, Text } from "@/components/ui";
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
} from "@/components/ui/form-control";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import SelectModal from "@/components/ui/select/select-modal";
import { VStack } from "@/components/ui/vstack";
import { useUsers } from "@/lib/api/users";
import { zodResolver } from "@hookform/resolvers/zod";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import z from "zod";

const transactionFilterSchema = z.object({
  search: z.string(),
  userId: z.string(),
  paymentTypeId: z.array(z.string()),
  dateType: z.enum(["TODAY", "THIS_WEEK", "THIS_MONTH", "THIS_YEAR", "CUSTOM"]),
  startDate: z.date(),
  endDate: z.date(),
});

type TransactionFilterFormValues = z.infer<typeof transactionFilterSchema>;

const initialValues: TransactionFilterFormValues = {
  search: "",
  userId: "",
  paymentTypeId: [],
  dateType: "TODAY",
  startDate: new Date(),
  endDate: new Date(),
};

export default function TransactionFilter() {
  // State untuk mengontrol visibility date picker
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const { data: users, refetch: refetchUsers } = useUsers();

  const isLoading = false;

  const dateTypeOptions = [
    {
      value: "TODAY",
      label: "Hari ini",
    },
    {
      value: "THIS_WEEK",
      label: "Minggu ini",
    },
    {
      value: "THIS_MONTH",
      label: "Bulan ini",
    },
    {
      value: "THIS_YEAR",
      label: "Tahun ini",
    },
    {
      value: "CUSTOM",
      label: "Pilih tanggal",
    },
  ];

  const form = useForm<TransactionFilterFormValues>({
    resolver: zodResolver(transactionFilterSchema),
    defaultValues: initialValues,
  });
  const dateType = form.watch("dateType");

  const onSubmit: SubmitHandler<TransactionFilterFormValues> = (
    data: TransactionFilterFormValues,
  ) => {
    console.log(data);
  };

  return (
    <VStack space="lg">
      <Controller
        name="search"
        control={form.control}
        render={({
          field: { onChange, onBlur, value },
          fieldState: { error },
        }) => (
          <FormControl isRequired isInvalid={!!error}>
            <Input className="w-full border border-background-300 rounded-lg h-10">
              <InputSlot className="pl-3">
                <InputIcon as={SearchIcon} />
              </InputSlot>
              <InputField
                value={value}
                autoComplete="name"
                placeholder="Cari no transaksi atau nama customer"
                onChangeText={onChange}
                onBlur={onBlur}
              />
            </Input>
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
        name="userId"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <FormControl isRequired isInvalid={!!error}>
            <SelectModal
              value={value}
              placeholder="Pilih Karyawan"
              showSearch={false}
              options={
                users?.map((cd) => ({
                  label: cd.firstName,
                  value: cd.id,
                })) || []
              }
              className="w-full"
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
        control={form.control}
        name="dateType"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <FormControl isRequired isInvalid={!!error}>
            <SelectModal
              value={value}
              showSearch={false}
              options={dateTypeOptions}
              className="w-full"
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
      {dateType === "CUSTOM" && (
        <HStack space="md">
          <Controller
            name="startDate"
            control={form.control}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <FormControl isRequired isInvalid={!!error} className="flex-1">
                <Pressable
                  onPress={() => setShowStartDatePicker(true)}
                  className="border border-background-300 rounded px-3 py-2"
                >
                  <Text>
                    {value instanceof Date
                      ? value.toLocaleDateString("id-ID")
                      : "Pilih tanggal mulai"}
                  </Text>
                </Pressable>
                {showStartDatePicker && (
                  <DateTimePicker
                    mode="date"
                    value={value instanceof Date ? value : new Date()}
                    onChange={(event, selectedDate) => {
                      setShowStartDatePicker(false);
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
            name="endDate"
            control={form.control}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <FormControl isRequired isInvalid={!!error} className="flex-1">
                <Pressable
                  onPress={() => setShowEndDatePicker(true)}
                  className="border border-background-300 rounded px-3 py-2"
                >
                  <Text>
                    {value instanceof Date
                      ? value.toLocaleDateString("id-ID")
                      : "Pilih tanggal selesai"}
                  </Text>
                </Pressable>
                {showEndDatePicker && (
                  <DateTimePicker
                    mode="date"
                    value={value instanceof Date ? value : new Date()}
                    onChange={(event, selectedDate) => {
                      setShowEndDatePicker(false);
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
        </HStack>
      )}
      <HStack className="w-full justify-end gap-4">
        <Pressable
          className="flex-1 rounded-md h-10 flex justify-center items-center bg-error-200 border border-error-500"
          disabled={isLoading}
        >
          <Text size="sm" className="text-error-500 font-bold">
            RESET
          </Text>
        </Pressable>
        <Pressable
          className="flex-1 rounded-md h-10 flex justify-center items-center bg-primary-500 border border-primary-500"
          disabled={isLoading}
          onPress={form.handleSubmit(onSubmit)}
        >
          <Text size="sm" className="text-typography-0 font-bold">
            TERAPKAN
          </Text>
        </Pressable>
      </HStack>
    </VStack>
  );
}
