import Header from '@/components/header';
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
  Spinner,
  Text,
  Textarea,
  TextareaInput,
  useToast,
  VStack,
} from '@/components/ui';
import SelectModal from '@/components/ui/select/select-modal';
import { showErrorToast, showSuccessToast, showToast } from '@/utils/toast';
import { usePaymentTypes } from '@/hooks/use-payment-type';
import { useCreateReceivableRealization, useReceivableDetail } from '@/hooks/use-receivable';
import { usePaymentTypeStore } from '@/stores/payment-type';
import { zodResolver } from '@hookform/resolvers/zod';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CalendarIcon, CheckIcon, PlusIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { ScrollView } from 'react-native';
import { z } from 'zod';

import { formatRp } from '@/utils/format';
export default function ReceivableRealizationForm() {
  const { setOpen: setPaymentTypeOpen } = usePaymentTypeStore();

  const router = useRouter();
  const params = useLocalSearchParams();

  const action = params.actionRealization as string;
  const isAdd = action === 'add';
  const receivableIds = (params.receivableIds as string)?.split('-') || [];
  const receivableId = receivableIds[0] || '';

  // Fetch receivable details to get remaining balance
  const { data: receivableDetail } = useReceivableDetail(receivableId);

  const totalReceivable = receivableDetail?.nominal || 0;
  const totalRealization = receivableDetail?.totalRealization || 0;
  const remainingBalance = totalReceivable - totalRealization;

  const receivableRealizationSchema = z.object({
    nominal: z
      .number()
      .min(1, 'Nominal wajib diisi.')
      .max(
        remainingBalance,
        `Nominal tidak boleh melebihi sisa piutang (${formatRp(remainingBalance)})`,
      ),
    payOff: z.boolean(),
    realizationDate: z.date(),
    paymentTypeId: z.string().min(1, 'Metode pembayaran harus dipilih'),
    note: z.string(),
  });

  type ReceivableRealizationFormValues = z.infer<typeof receivableRealizationSchema>;

  const initialValues: ReceivableRealizationFormValues = {
    nominal: 0,
    payOff: false,
    realizationDate: new Date(),
    paymentTypeId: '',
    note: '',
  };

  const form = useForm<ReceivableRealizationFormValues>({
    resolver: zodResolver(receivableRealizationSchema),
    defaultValues: initialValues,
  });

  const [showRealizationDatePicker, setShowRealizationDatePicker] = useState<boolean>(false);

  const { data: paymentMethods = [] } = usePaymentTypes();
  const createMutation = useCreateReceivableRealization();

  const isLoading = createMutation.isPending;

  const toast = useToast();

  const onSubmit: SubmitHandler<ReceivableRealizationFormValues> = async (
    data: ReceivableRealizationFormValues,
  ) => {
    if (receivableIds.length === 1) {
      createMutation.mutate(
        {
          receivableId: receivableIds[0],
          nominal: data.nominal,
          paymentMethodId: data.paymentTypeId,
          realizationDate: data.realizationDate,
          note: data.note,
        },
        {
          onSuccess: () => {
            showSuccessToast(toast, 'Penerimaan berhasil disimpan');
            router.back();
          },
          onError: (error) => showErrorToast(toast, error),
        },
      );
    } else {
      showToast(toast, { action: 'info', message: 'Bulk receipt logic coming soon' });
    }
  };

  return (
    <VStack className="flex-1 bg-white">
      <Header header={isAdd ? 'REALISASI PIUTANG' : 'EDIT REALISASI PIUTANG'} isGoBack />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <VStack space="lg" className="p-4">
          <VStack space="sm">
            <Text className="text-gray-500 text-sm">Total Transaksi</Text>
            <Text className="text-sm font-bold">{receivableIds?.length}</Text>
          </VStack>

          <Controller
            name="nominal"
            control={form.control}
            disabled={!isAdd}
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
                    onChangeText={(text) => {
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
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <FormControl isInvalid={!!error}>
                <Checkbox
                  value={value.toString()}
                  isChecked={value}
                  size="md"
                  onChange={(v) => {
                    onChange(v);
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
                  <FormControlLabelText>Tanggal Pembayaran</FormControlLabelText>
                </FormControlLabel>
                <Pressable
                  onPress={() => setShowRealizationDatePicker(true)}
                  className={`border border-background-300 rounded px-3 py-2${error ? ' border-red-500' : ''}`}
                >
                  <HStack className="items-center justify-between">
                    <Text>
                      {value instanceof Date ? dayjs(value).format('DD/MM/YYYY') : 'Pilih tanggal'}
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
                    options={paymentMethods.map((pm) => ({
                      label: pm.name,
                      value: pm.id,
                    }))}
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
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
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
          className="w-full rounded-sm h-10 flex justify-center items-center bg-primary-500 border border-primary-500"
          disabled={isLoading}
          onPress={form.handleSubmit(onSubmit)}
        >
          {isLoading ? (
            <Spinner size="small" color="#FFFFFF" />
          ) : (
            <Text size="sm" className="text-typography-0 font-bold">
              SIMPAN
            </Text>
          )}
        </Pressable>
      </HStack>
    </VStack>
  );
}
