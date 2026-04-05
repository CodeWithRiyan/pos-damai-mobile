import {
  Heading,
  HStack,
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Pressable,
  Text,
} from '@/components/ui';
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
} from '@/components/ui/form-control';
import { Input, InputField, InputSlot } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { VStack } from '@/components/ui/vstack';
import { FinanceType, Status } from '@/constants';
import { useCreateFinance } from '@/hooks/use-finance';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import z from 'zod';

export default function CashDepositForm({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const toast = useToast();
  const createFinanceMutation = useCreateFinance();

  const cashDepositSchema = z.object({
    type: z.enum(['INCOME', 'EXPENSES']),
    expensesType: z.string(), // "STORE_EXPENSES" || "SUPPLIES" || "EQUIPMENT"
    transactionDate: z.date(),
    note: z.string(),
    nominal: z.number().min(1, 'Nominal wajib diisi.'),
  });

  type CashDepositFormValues = z.infer<typeof cashDepositSchema>;

  const initialValues: CashDepositFormValues = {
    type: FinanceType.EXPENSES,
    expensesType: 'CASH_DEPOSIT',
    transactionDate: new Date(),
    note: 'Setor Tunai',
    nominal: 0,
  };

  const form = useForm<CashDepositFormValues>({
    resolver: zodResolver(cashDepositSchema),
    defaultValues: initialValues,
  });

  const onSubmit: SubmitHandler<CashDepositFormValues> = (data: CashDepositFormValues) => {
    createFinanceMutation.mutate(
      {
        ...data,
        nominal: data.nominal,
        inputToCashdrawer: true,
        status: Status.COMPLETED,
      },
      {
        onSuccess: (_responseData) => {
          showSuccessToast(toast, 'Berhasil Setor Tunai');
          setOpen(false);
          form.reset(initialValues);
        },
        onError: (error) => {
          showErrorToast(toast, `Gagal menyimpan: ${error.message}`);
        },
      },
    );
  };

  const isLoading = createFinanceMutation.isPending;

  return (
    <Modal
      isOpen={open}
      onClose={() => {
        setOpen(false);
        form.reset(initialValues);
      }}
      size="md"
    >
      <ModalBackdrop />
      <ModalContent className="p-0">
        <ModalHeader className="p-4 border-b border-background-300">
          <Heading size="md" className="text-center flex-1">
            SETOR TUNAI
          </Heading>
        </ModalHeader>
        <ModalBody className="m-0" showsVerticalScrollIndicator={false}>
          <VStack space="lg" className="p-4">
            <Controller
              name="nominal"
              control={form.control}
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <FormControl isRequired isInvalid={!!error}>
                  <FormControlLabel>
                    <FormControlLabelText>Masukkan Nominal Setor</FormControlLabelText>
                  </FormControlLabel>
                  <Input className="h-16">
                    <InputSlot className="h-full aspect-square items-center justify-center bg-gray-100">
                      <Text className="text-2xl font-bold">Rp</Text>
                    </InputSlot>
                    <InputField
                      value={value.toString()}
                      autoComplete="off"
                      className="text-3xl text-center font-bold"
                      keyboardType="numeric"
                      placeholder="Masukkan nominal"
                      onChangeText={(text) => {
                        const num = parseFloat(text) || 0;
                        onChange(num);
                      }}
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
          </VStack>
        </ModalBody>
        <ModalFooter className="p-4 pt-0">
          <HStack space="md">
            <Pressable
              className="flex-1 flex px-4 h-10 items-center justify-center rounded-sm bg-background-100 active:bg-background-200"
              onPress={() => setOpen(false)}
              disabled={isLoading}
            >
              {isLoading ? (
                <Spinner size="small" color="#374151" />
              ) : (
                <Text size="sm" className="font-bold">
                  BATAL
                </Text>
              )}
            </Pressable>
            <Pressable
              className="flex-1 flex px-4 h-10 items-center justify-center rounded-sm bg-primary-500 active:bg-primary-500/90"
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
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
