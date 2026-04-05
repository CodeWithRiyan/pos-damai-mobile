import { CheckboxGroup, HStack, SearchIcon, Text } from '@/components/ui';
import { FormControl, FormControlError, FormControlErrorText } from '@/components/ui/form-control';
import { Grid, GridItem } from '@/components/ui/grid';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import SelectModal from '@/components/ui/select/select-modal';
import { VStack } from '@/components/ui/vstack';
import { usePaymentTypes } from '@/hooks/use-payment-type';
import { useUsers } from '@/hooks/use-user';
import { zodResolver } from '@hookform/resolvers/zod';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { Pressable, View } from 'react-native';
import z from 'zod';

// ─── Schema ────────────────────────────────────────────────────────────────

const transactionFilterSchema = z
  .object({
    search: z.string(),
    userId: z.string(),
    paymentTypeNames: z.array(z.string()),
    dateType: z.enum(['TODAY', 'THIS_WEEK', 'THIS_MONTH', 'THIS_YEAR', 'CUSTOM']),
    startDate: z.date(),
    endDate: z.date(),
  })
  .refine(
    (data) => {
      if (data.dateType !== 'CUSTOM') return true;
      return !dayjs(data.endDate).isBefore(dayjs(data.startDate), 'day');
    },
    {
      message: 'Tanggal selesai tidak boleh sebelum tanggal mulai',
      path: ['endDate'],
    },
  );

export type TransactionFilterFormValues = z.infer<typeof transactionFilterSchema>;

export const transactionFilterInitialValues: TransactionFilterFormValues = {
  search: '',
  userId: '',
  paymentTypeNames: [],
  dateType: 'TODAY',
  startDate: new Date(),
  endDate: new Date(),
};

// ─── Date Type Chips ────────────────────────────────────────────────────────

const DATE_TYPE_OPTIONS = [
  { value: 'TODAY', label: 'Hari ini' },
  { value: 'THIS_WEEK', label: 'Minggu ini' },
  { value: 'THIS_MONTH', label: 'Bulan ini' },
  { value: 'THIS_YEAR', label: 'Tahun ini' },
  { value: 'CUSTOM', label: 'Custom' },
] as const;

// ─── Section Label ──────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text className="text-xs font-semibold text-typography-400 uppercase tracking-wider mb-1">
      {children}
    </Text>
  );
}

// ─── Divider ────────────────────────────────────────────────────────────────

function Divider() {
  return <View className="h-px bg-background-200 my-1" />;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function TransactionFilter({
  onFilter,
  filterValues,
}: {
  onFilter: (data: TransactionFilterFormValues) => void;
  filterValues: TransactionFilterFormValues;
}) {
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const { data: users } = useUsers();
  const { data: paymentTypes } = usePaymentTypes();

  const form = useForm<TransactionFilterFormValues>({
    resolver: zodResolver(transactionFilterSchema),
    defaultValues: transactionFilterInitialValues,
  });

  const dateType = form.watch('dateType');
  const startDate = form.watch('startDate');

  // Seed payment types on first load
  useEffect(() => {
    if (filterValues.paymentTypeNames.length === 0 && paymentTypes) {
      form.setValue(
        'paymentTypeNames',
        paymentTypes.map((pt) => pt.name),
      );
    }
  }, [filterValues.paymentTypeNames.length, form, paymentTypes]);

  // Sync external filterValues into form
  useEffect(() => {
    if (Object.values(filterValues).some((v) => v)) {
      form.reset(filterValues);
    }
  }, [filterValues, form]);

  // When startDate changes in CUSTOM mode, clamp endDate if needed
  useEffect(() => {
    if (dateType === 'CUSTOM') {
      const endDate = form.getValues('endDate');
      if (dayjs(endDate).isBefore(dayjs(startDate), 'day')) {
        form.setValue('endDate', startDate);
      }
    }
  }, [startDate, dateType, form]);

  const onSubmit: SubmitHandler<TransactionFilterFormValues> = (data) => {
    onFilter(data);
  };

  const handleReset = () => {
    form.reset(transactionFilterInitialValues);
    if (paymentTypes) {
      form.setValue(
        'paymentTypeNames',
        paymentTypes.map((pt) => pt.name),
      );
    }
    onFilter({
      ...transactionFilterInitialValues,
      paymentTypeNames: paymentTypes?.map((pt) => pt.name) ?? [],
    });
  };

  const selectedPaymentTypeNames = form.watch('paymentTypeNames');

  const allPaymentSelected = paymentTypes?.length === selectedPaymentTypeNames.length;

  const toggleSelectAllPaymentTypes = () => {
    if (allPaymentSelected) {
      form.setValue('paymentTypeNames', []);
    } else {
      form.setValue('paymentTypeNames', paymentTypes?.map((pt) => pt.name) ?? []);
    }
  };

  return (
    <VStack space="md" className="pb-16">
      {/* ── Search ── */}
      <Controller
        name="search"
        control={form.control}
        render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
          <FormControl isInvalid={!!error}>
            <Input className="w-full border border-background-300 rounded-lg h-10 bg-background-50">
              <InputSlot className="pl-3">
                <InputIcon as={SearchIcon} />
              </InputSlot>
              <InputField
                value={value}
                placeholder="Cari no. transaksi atau nama customer"
                onChangeText={onChange}
                onBlur={onBlur}
                returnKeyType="search"
                onSubmitEditing={form.handleSubmit(onSubmit)}
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

      <Divider />

      {/* ── Employee ── */}
      <VStack space="xs">
        <SectionLabel>Karyawan</SectionLabel>
        <Controller
          control={form.control}
          name="userId"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <FormControl isInvalid={!!error}>
              <SelectModal
                value={value}
                placeholder="Semua karyawan"
                showSearch={false}
                options={[
                  { label: 'Semua karyawan', value: '' },
                  ...(users?.map((u) => ({
                    label: u.firstName || u.name || u.username,
                    value: u.id,
                  })) ?? []),
                ]}
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
      </VStack>

      <Divider />

      {/* ── Payment Types ── */}
      <VStack space="xs">
        <HStack className="justify-between items-center mb-1">
          <SectionLabel>Metode Pembayaran</SectionLabel>
          <Pressable onPress={toggleSelectAllPaymentTypes}>
            <Text className="text-xs font-semibold text-primary-500">
              {allPaymentSelected ? 'Batal semua' : 'Pilih semua'}
            </Text>
          </Pressable>
        </HStack>
        <Controller
          control={form.control}
          name="paymentTypeNames"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <FormControl isInvalid={!!error}>
              <CheckboxGroup value={value} onChange={onChange}>
                <Grid _extra={{ className: 'grid-cols-4' }}>
                  {paymentTypes?.map((pt) => {
                    const isChecked = (value as string[]).includes(pt.name);
                    return (
                      <GridItem key={pt.id} _extra={{ className: 'col-span-2' }}>
                        <Pressable
                          onPress={() => {
                            const next = isChecked
                              ? (value as string[]).filter((name) => name !== pt.name)
                              : [...(value as string[]), pt.name];
                            onChange(next);
                          }}
                          className={[
                            'flex-row items-center gap-2 px-3 py-2 rounded-lg border mb-2 mr-2',
                            isChecked
                              ? 'bg-primary-50 border-primary-400'
                              : 'bg-background-50 border-background-300',
                          ].join(' ')}
                        >
                          {/* Custom checkbox dot */}
                          <View
                            className={[
                              'w-4 h-4 rounded-full border-2 items-center justify-center',
                              isChecked
                                ? 'border-primary-500 bg-primary-500'
                                : 'border-background-400 bg-white',
                            ].join(' ')}
                          >
                            {isChecked && <View className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </View>
                          <Text
                            className={[
                              'text-xs font-medium flex-1',
                              isChecked ? 'text-primary-700' : 'text-typography-500',
                            ].join(' ')}
                            numberOfLines={1}
                          >
                            {pt.name}
                          </Text>
                        </Pressable>
                      </GridItem>
                    );
                  })}
                </Grid>
              </CheckboxGroup>
              {error && (
                <FormControlError>
                  <FormControlErrorText>{error.message}</FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>
          )}
        />
      </VStack>

      <Divider />

      {/* ── Date Type ── */}
      <VStack space="xs">
        <SectionLabel>Periode</SectionLabel>
        <Controller
          control={form.control}
          name="dateType"
          render={({ field: { onChange, value } }) => (
            <HStack className="flex-wrap gap-2">
              {DATE_TYPE_OPTIONS.map((opt) => {
                const isActive = value === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => onChange(opt.value)}
                    className={[
                      'px-3 py-1.5 rounded-full border',
                      isActive
                        ? 'bg-primary-500 border-primary-500'
                        : 'bg-background-50 border-background-300',
                    ].join(' ')}
                  >
                    <Text
                      className={[
                        'text-xs font-semibold',
                        isActive ? 'text-white' : 'text-typography-500',
                      ].join(' ')}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </HStack>
          )}
        />
      </VStack>

      {/* ── Custom Date Range ── */}
      {dateType === 'CUSTOM' && (
        <HStack space="md">
          {/* Start Date */}
          <Controller
            name="startDate"
            control={form.control}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <FormControl isInvalid={!!error} className="flex-1">
                <SectionLabel>Dari</SectionLabel>
                <Pressable
                  onPress={() => setShowStartDatePicker(true)}
                  className={[
                    'border rounded-lg px-3 py-2.5 bg-background-50',
                    error ? 'border-error-500' : 'border-background-300',
                  ].join(' ')}
                >
                  <Text className="text-sm text-typography-700">
                    {value instanceof Date ? dayjs(value).format('DD MMM YYYY') : 'Pilih tanggal'}
                  </Text>
                </Pressable>
                {showStartDatePicker && (
                  <DateTimePicker
                    mode="date"
                    maximumDate={new Date()}
                    value={value instanceof Date ? value : new Date()}
                    onChange={(event, selectedDate) => {
                      setShowStartDatePicker(false);
                      if (event.type === 'set' && selectedDate) {
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

          {/* End Date */}
          <Controller
            name="endDate"
            control={form.control}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <FormControl isInvalid={!!error} className="flex-1">
                <SectionLabel>Sampai</SectionLabel>
                <Pressable
                  onPress={() => setShowEndDatePicker(true)}
                  className={[
                    'border rounded-lg px-3 py-2.5 bg-background-50',
                    error ? 'border-error-500' : 'border-background-300',
                  ].join(' ')}
                >
                  <Text className="text-sm text-typography-700">
                    {value instanceof Date ? dayjs(value).format('DD MMM YYYY') : 'Pilih tanggal'}
                  </Text>
                </Pressable>
                {showEndDatePicker && (
                  <DateTimePicker
                    mode="date"
                    minimumDate={startDate instanceof Date ? startDate : undefined}
                    maximumDate={new Date()}
                    value={value instanceof Date ? value : new Date()}
                    onChange={(event, selectedDate) => {
                      setShowEndDatePicker(false);
                      if (event.type === 'set' && selectedDate) {
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

      <Divider />

      {/* ── Actions ── */}
      <HStack space="md" className="pt-1">
        <Pressable
          className="flex-1 rounded-lg h-10 flex-row justify-center items-center bg-background-100 border border-background-300"
          onPress={handleReset}
        >
          <Text className="text-sm text-typography-600 font-semibold">Reset</Text>
        </Pressable>
        <Pressable
          className="flex-2 flex-[2] rounded-lg h-10 flex-row justify-center items-center bg-primary-500"
          onPress={form.handleSubmit(onSubmit)}
        >
          <Text className="text-sm text-white font-bold">Terapkan Filter</Text>
        </Pressable>
      </HStack>
    </VStack>
  );
}
