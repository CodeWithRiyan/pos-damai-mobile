import Header from '@/components/header';
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
  Icon,
  Input,
  InputField,
  InputSlot,
  Spinner,
  Text,
  Textarea,
  TextareaInput,
} from '@/components/ui';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Radio, RadioGroup, RadioLabel } from '@/components/ui/radio';
import SelectModal from '@/components/ui/select/select-modal';
import { SolarIconBold } from '@/components/ui/solar-icon-wrapper';
import { useToast } from '@/components/ui/toast';
import { VStack } from '@/components/ui/vstack';
import { useCreateFinance, useFinance } from '@/hooks/use-finance';
import { useFinanceStore } from '@/stores/finance';
import { zodResolver } from '@hookform/resolvers/zod';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CalendarIcon } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { ScrollView } from 'react-native';
import { FinanceType, Status } from '@/constants';
import z from 'zod';
import { showToast } from '@/utils/toast';

// Dummy data removed

const financeSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSES']),
  expensesType: z.string(), // "STORE_EXPENSES" || "SUPPLIES" || "EQUIPMENT"
  nominal: z.number().min(1, 'Nominal wajib diisi.'),
  transactionDate: z.date(),
  note: z.string(),
});

export type FinanceFormValues = z.infer<typeof financeSchema>;

export const expensesTypeOptions = [
  {
    label: 'Bayar Hutang',
    value: 'PAYABLE_REALIZATION',
  },
  {
    label: 'Beli Barang',
    value: 'SUPPLIES',
  },
  {
    label: 'Perlengkapan',
    value: 'EQUIPMENT_1',
  },
  {
    label: 'Peralatan',
    value: 'EQUIPMENT_2',
  },
];

export default function FinanceTransaction() {
  const router = useRouter();
  const { draftId } = useLocalSearchParams();
  const { data: draftData } = useFinance(draftId as string);

  const toast = useToast();
  const [showTransactionDatePicker, setShowTransactionDatePicker] = useState(false);

  const createMutation = useCreateFinance();
  const isLoading = createMutation.isPending;

  const initialValues: FinanceFormValues = {
    type: FinanceType.INCOME,
    expensesType: '',
    nominal: 0,
    transactionDate: new Date(),
    note: '',
  };

  const form = useForm<FinanceFormValues>({
    resolver: zodResolver(financeSchema),
    defaultValues: initialValues,
  });

  useEffect(() => {
    if (draftData && draftData.status === Status.DRAFT) {
      let expType = draftData.expensesType || '';
      let parsedNote = draftData.note || '';
      if (expType === 'EQUIPMENT') {
        if (parsedNote.startsWith('Perlengkapan: ')) {
          expType = 'EQUIPMENT_1';
          parsedNote = parsedNote.replace('Perlengkapan: ', '');
        } else if (parsedNote.startsWith('Perlengkapan')) {
          expType = 'EQUIPMENT_1';
          parsedNote = parsedNote.replace('Perlengkapan', '');
        } else if (parsedNote.startsWith('Peralatan: ')) {
          expType = 'EQUIPMENT_2';
          parsedNote = parsedNote.replace('Peralatan: ', '');
        } else if (parsedNote.startsWith('Peralatan')) {
          expType = 'EQUIPMENT_2';
          parsedNote = parsedNote.replace('Peralatan', '');
        }
      }
      form.reset({
        type: draftData.type,
        expensesType: expType,
        nominal: draftData.nominal,
        transactionDate: draftData.transactionDate,
        note: parsedNote,
      });
    }
  }, [draftData, form]);

  const onSubmit: SubmitHandler<FinanceFormValues> = (data: FinanceFormValues) => {
    handleSave(data, Status.COMPLETED);
  };

  const onSaveDraft = () => {
    const data = form.getValues();
    handleSave(data, Status.DRAFT);
  };

  const handleSave = (data: FinanceFormValues, status: 'DRAFT' | 'COMPLETED') => {
    const isEquipment = data.expensesType.includes('EQUIPMENT');
    createMutation.mutate(
      {
        id: (draftId as string) || undefined,
        ...data,
        expensesType: isEquipment ? 'EQUIPMENT' : data.expensesType,
        nominal: data.nominal,
        inputToCashdrawer: status === Status.COMPLETED,
        note: !isEquipment
          ? data.note
          : `${data.expensesType.includes('1') ? 'Perlengkapan' : 'Peralatan'}${data.note ? `: ${data.note}` : ''}`,
        status,
      },
      {
        onSuccess: (responseData) => {
          useFinanceStore.getState().incrementVersion();
          showToast(toast, {
            action: 'success',
            message:
              status === Status.COMPLETED
                ? 'Transaksi berhasil disimpan'
                : 'Draft berhasil disimpan',
            placement: 'top',
          });

          if (status === Status.COMPLETED) {
            router.replace(`/(main)/finance/receipt/${responseData.id}`);
          } else {
            router.navigate('/(main)/finance/draft');
          }
          form.reset(initialValues);
        },
        onError: (error) => {
          showToast(toast, {
            action: 'error',
            message: error.message || 'Terjadi kesalahan saat menyimpan transaksi',
            placement: 'top',
          });
        },
      },
    );
  };

  return (
    <Box className="flex-1 bg-white">
      <Header
        header="KEUANGAN"
        action={
          <HStack space="sm" className="pr-4">
            <Pressable
              className="size-10 items-center justify-center"
              onPress={() => router.navigate('/(main)/finance/draft')}
            >
              <SolarIconBold name="ClipboardList" size={20} color="#FDFBF9" />
            </Pressable>
            <Pressable
              className="size-10 items-center justify-center"
              onPress={() => router.navigate('/(main)/finance/history')}
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
                render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
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
                          value === 'INCOME'
                            ? ' bg-success-100 border-success-500'
                            : ' bg-background-100 border-background-300'
                        }`}
                      >
                        <RadioLabel>
                          <Text
                            className={`text-lg font-bold${value === 'INCOME' ? ' text-success-500' : ''}`}
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
                          value === 'EXPENSES'
                            ? ' bg-error-100 border-error-500'
                            : ' bg-background-100 border-background-300'
                        }`}
                      >
                        <RadioLabel>
                          <Text
                            className={`text-lg font-bold${value === 'EXPENSES' ? ' text-error-500' : ''}`}
                          >
                            Pengeluaran
                          </Text>
                        </RadioLabel>
                      </Radio>
                    </RadioGroup>
                  </FormControl>
                )}
              />
              {form.watch('type') === FinanceType.EXPENSES && (
                <Controller
                  control={form.control}
                  name="expensesType"
                  render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <FormControl isRequired isInvalid={!!error}>
                      <FormControlLabel>
                        <FormControlLabelText>Jenis Pengeluaran</FormControlLabelText>
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
                          <FormControlErrorText>{error.message}</FormControlErrorText>
                        </FormControlError>
                      )}
                    </FormControl>
                  )}
                />
              )}
              <Controller
                name="nominal"
                control={form.control}
                render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
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
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <FormControl isRequired isInvalid={!!error} className="flex-1">
                    <FormControlLabel>
                      <FormControlLabelText>Tanggal Transaksi</FormControlLabelText>
                    </FormControlLabel>
                    <Pressable
                      onPress={() => setShowTransactionDatePicker(true)}
                      className={`border border-background-300 rounded px-3 py-2${error ? ' border-red-500' : ''}`}
                    >
                      <HStack className="items-center justify-between">
                        <Text>
                          {value instanceof Date
                            ? dayjs(value).format('DD/MM/YYYY')
                            : 'Tanggal Transaksi'}
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
              <Controller
                name="note"
                control={form.control}
                render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
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
                        <FormControlErrorText>{error.message}</FormControlErrorText>
                      </FormControlError>
                    )}
                  </FormControl>
                )}
              />
              <HStack space="md" className="w-full py-4">
                <Pressable
                  className="flex-1 flex-row items-center justify-center h-12 px-4 rounded-lg bg-primary-500 active:bg-primary-500/90 disabled:opacity-50"
                  onPress={form.handleSubmit(onSubmit)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Spinner size="small" color="#FFFFFF" />
                  ) : (
                    <Text size="sm" className="text-typography-0 font-bold">
                      SIMPAN
                    </Text>
                  )}
                </Pressable>
                <Pressable
                  className="items-center justify-center size-12 rounded-lg border border-primary-500 bg-background-0 active:bg-primary-300 disabled:opacity-50"
                  onPress={onSaveDraft}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Spinner size="small" color="#FFFFFF" />
                  ) : (
                    <SolarIconBold name="ClipboardAdd" size={28} color="#3d2117" />
                  )}
                </Pressable>
              </HStack>
            </VStack>
          </ScrollView>
        </VStack>
      </HStack>
    </Box>
  );
}
