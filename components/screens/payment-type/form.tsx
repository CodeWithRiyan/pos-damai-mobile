import {
  Heading,
  HStack,
  Icon,
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Pressable,
  Radio,
  RadioGroup,
  RadioLabel,
  Text,
} from '@/components/ui';
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
} from '@/components/ui/form-control';
import { Input, InputField } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { VStack } from '@/components/ui/vstack';
import { showErrorToast, showSuccessToast, showToast } from '@/utils/toast';
import {
  useCreatePaymentType,
  usePaymentTypes,
  useUpdatePaymentType,
  refetchPaymentTypeById,
} from '@/hooks/use-payment-type';
import { usePaymentTypeStore } from '@/stores/payment-type';
import { zodResolver } from '@hookform/resolvers/zod';
import { Percent } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { CalcType, DEFAULT_PAYMENT_TYPE } from '@/constants';
import z from 'zod';

export default function PaymentTypeForm() {
  const { open, setOpen, data: dataPaymentType } = usePaymentTypeStore();
  const toast = useToast();

  const paymentTypeSchema = z
    .object({
      name: z.string().min(1, 'Nama Pembayaran wajib diisi.'),
      commission: z.number(),
      commissionType: z.enum(['FLAT', 'PERCENTAGE']),
      minimalAmount: z.number(),
    })
    .superRefine((data, ctx) => {
      if (data.commission > 0 && !data.minimalAmount) {
        ctx.addIssue({
          code: 'custom',
          message: 'Jumlah minimal pembayaran wajib diisi.',
          path: ['minimalAmount'],
        });
      }
    });

  type PaymentTypeFormValues = z.infer<typeof paymentTypeSchema>;

  const initialValues: PaymentTypeFormValues = {
    name: '',
    commission: 0,
    commissionType: CalcType.PERCENTAGE,
    minimalAmount: 0,
  };

  const form = useForm<PaymentTypeFormValues>({
    resolver: zodResolver(paymentTypeSchema),
    defaultValues: initialValues,
  });

  const [commisionInput, setCommisionInput] = useState<string>('');
  const { refetch: refetchPaymentTypes } = usePaymentTypes();

  const createMutation = useCreatePaymentType();
  const updateMutation = useUpdatePaymentType();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const onRefetch = useCallback(() => {
    refetchPaymentTypes();
  }, [refetchPaymentTypes]);

  useEffect(() => {
    if (dataPaymentType) {
      refetchPaymentTypeById(dataPaymentType.id).then((freshData) => {
        if (freshData) {
          setCommisionInput(freshData.commission.toString());
          form.reset({
            name: freshData.name,
            commission: freshData.commission,
            commissionType: freshData.commissionType || CalcType.PERCENTAGE,
            minimalAmount: freshData.minimalAmount,
          });
        }
      });
    } else {
      setCommisionInput('');
      form.reset(initialValues);
    }
  }, [dataPaymentType, form]);

  const onSubmit: SubmitHandler<PaymentTypeFormValues> = (data: PaymentTypeFormValues) => {
    if (dataPaymentType && dataPaymentType.name === DEFAULT_PAYMENT_TYPE) {
      showToast(toast, {
        action: 'error',
        message: 'Pembayaran default tidak dapat diubah',
      });
      return;
    }
    if (dataPaymentType) {
      updateMutation.mutate(
        {
          id: dataPaymentType.id,
          ...data,
        },
        {
          onSuccess: (updatedData) => {
            showSuccessToast(toast, 'Jenis pembayaran berhasil diperbarui');
            usePaymentTypeStore.getState().incrementVersion();
            if (usePaymentTypeStore.getState().onSuccess) {
              usePaymentTypeStore.getState().onSuccess!(updatedData as any);
            }
            form.reset(initialValues);
            onRefetch();
            setOpen(false);
          },
          onError: (error) => showErrorToast(toast, error),
        },
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: (newData) => {
          showSuccessToast(toast, 'Jenis pembayaran berhasil ditambahkan');
          usePaymentTypeStore.getState().incrementVersion();
          if (usePaymentTypeStore.getState().onSuccess) {
            usePaymentTypeStore.getState().onSuccess!(newData);
          }
          form.reset(initialValues);
          onRefetch();
          setOpen(false);
        },
        onError: (error) => showErrorToast(toast, error),
      });
    }
  };

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
      <ModalContent className="p-0 max-h-[90%]">
        <ModalHeader className="p-4 border-b border-background-300">
          <Heading size="md" className="text-center flex-1">
            {dataPaymentType ? 'EDIT JENIS PEMBAYARAN' : 'TAMBAH JENIS PEMBAYARAN'}
          </Heading>
        </ModalHeader>
        <ModalBody className="m-0" showsVerticalScrollIndicator={false}>
          <VStack space="lg" className="p-4">
            <Controller
              name="name"
              control={form.control}
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <FormControl isRequired isInvalid={!!error}>
                  <FormControlLabel>
                    <FormControlLabelText>Nama Pembayaran</FormControlLabelText>
                  </FormControlLabel>
                  <Input>
                    <InputField
                      value={value}
                      autoComplete="name"
                      placeholder="Masukkan nama pembayaran"
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
              name="commission"
              control={form.control}
              render={({
                field: { onChange, onBlur, value: _commissionValue },
                fieldState: { error },
              }) => (
                <FormControl isInvalid={!!error} className="flex-1">
                  <FormControlLabel>
                    <FormControlLabelText>Komisi</FormControlLabelText>
                  </FormControlLabel>
                  <HStack space="md">
                    <Input className="flex-1">
                      <InputField
                        value={commisionInput}
                        autoComplete="off"
                        onChangeText={(text) => {
                          if (/^\d*\.?\d*$/.test(text)) {
                            setCommisionInput(text);
                          }
                        }}
                        onBlur={() => {
                          const numValue = parseFloat(commisionInput) || 0;
                          onChange(numValue);
                          setCommisionInput(numValue.toString());

                          onBlur();
                        }}
                        placeholder="Masukkan komisi"
                        keyboardType="numbers-and-punctuation"
                      />
                    </Input>
                    <Controller
                      name="commissionType"
                      control={form.control}
                      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                        <FormControl isRequired isInvalid={!!error}>
                          <RadioGroup
                            value={value}
                            onChange={onChange}
                            onBlur={onBlur}
                            className="flex-row gap-2"
                          >
                            <Radio
                              value="PERCENTAGE"
                              size="md"
                              isInvalid={false}
                              isDisabled={false}
                              className={`size-10 border rounded-sm flex items-center justify-center${
                                value === 'PERCENTAGE'
                                  ? ' bg-primary-200 text-primary-500 border-primary-500'
                                  : ' bg-background-100 border-background-300'
                              }`}
                            >
                              <RadioLabel>
                                <Icon as={Percent} />
                              </RadioLabel>
                            </Radio>
                            <Radio
                              value="FLAT"
                              size="md"
                              isInvalid={false}
                              isDisabled={false}
                              className={`size-10 border rounded-sm flex items-center justify-center${
                                value === 'FLAT'
                                  ? ' bg-primary-200 text-primary-500 border-primary-500'
                                  : ' bg-background-100 border-background-300'
                              }`}
                            >
                              <RadioLabel className="font-bold">Rp</RadioLabel>
                            </Radio>
                          </RadioGroup>
                        </FormControl>
                      )}
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
            <Controller
              name="minimalAmount"
              control={form.control}
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <FormControl isInvalid={!!error} className="flex-1">
                  <FormControlLabel>
                    <FormControlLabelText>Jumlah Minimal Pembayaran</FormControlLabelText>
                  </FormControlLabel>
                  <Input>
                    <InputField
                      value={value.toString()}
                      keyboardType="numeric"
                      placeholder="Masukkan jumlah minimal pembayaran"
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
              className="w-full flex px-4 h-10 items-center justify-center rounded-sm bg-primary-500 active:bg-primary-500/90"
              onPress={form.handleSubmit(onSubmit)}
              disabled={isLoading}
            >
              {isLoading ? (
                <Spinner size="small" color="#FFFFFF" />
              ) : (
                <Text size="sm" className="text-typography-0 font-bold">
                  {!dataPaymentType ? 'SIMPAN' : 'PERBARUI'}
                </Text>
              )}
            </Pressable>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
