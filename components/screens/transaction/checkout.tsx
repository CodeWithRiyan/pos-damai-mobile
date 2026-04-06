import Header from '@/components/header';
import {
  Checkbox,
  CheckboxIcon,
  CheckboxIndicator,
  CheckboxLabel,
  FormControl,
  FormControlError,
  FormControlErrorText,
  Heading,
  HStack,
  Icon,
  Pressable,
  Spinner,
  Text,
  Textarea,
  TextareaInput,
  useToast,
  VStack,
} from '@/components/ui';
import { showErrorToast, showSuccessToast, showToast } from '@/utils/toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { ScrollView } from 'react-native';
import { z } from 'zod';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import InputVirtualKeyboard from '@/components/ui/input-virtual-keyboard';
import SelectModal from '@/components/ui/select/select-modal';
import { useCurrentUser } from '@/hooks/use-auth';

import { SolarIconBoldDuotone } from '@/components/ui/solar-icon-wrapper';
import { useCustomer } from '@/hooks/use-customer';
import { useCreateFinance } from '@/hooks/use-finance';
import { usePaymentTypes } from '@/hooks/use-payment-type';
import { useTransactionReturn } from '@/hooks/use-return-transaction';
import { useCreateTransaction, useTransaction } from '@/hooks/use-transaction';
import { useCreateReceivable } from '@/hooks/use-receivable';
import { CalcType, FinanceType, Status, DEFAULT_PAYMENT_TYPE } from '@/constants';
import { findSellPrice, getDiscountedPrice, isDiscountActive } from '@/utils/price';
import { usePaymentTypeStore } from '@/stores/payment-type';
import { useProductStore } from '@/stores/product';
import { useTransactionStore } from '@/stores/transaction';
import classNames from 'classnames';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CalendarIcon, Check, CheckIcon, PlusIcon } from 'lucide-react-native';

import { formatNumber, formatRp } from '@/utils/format';
// Payment types are now loaded from the database via usePaymentTypes hook

export default function TransactionCheckoutForm() {
  const searchParams = useLocalSearchParams<{
    returnCustomerId: string;
    returnId: string;
  }>();
  const { returnCustomerId, returnId } = searchParams;
  const router = useRouter();

  const { data: returnCustomer } = useCustomer(returnCustomerId);
  const { data: returnData } = useTransactionReturn(returnId || '');
  const { data: user } = useCurrentUser();
  const { data: paymentTypesData } = usePaymentTypes();
  const {
    customer,
    employee,
    cart,
    cartTotal,
    status,
    transactionId,
    setCheckoutData,
    resetCart,
    setCustomer,
    setEmployee,
  } = useTransactionStore();
  const { setOpen: setPaymentTypeOpen } = usePaymentTypeStore();
  const { data: transaction, isLoading: isLoadingTransaction } = useTransaction(
    transactionId || '',
  );

  // Map payment types to select options
  const defaultPaymentOption = {
    label:
      DEFAULT_PAYMENT_TYPE.charAt(0).toUpperCase() + DEFAULT_PAYMENT_TYPE.slice(1).toLowerCase(),
    value: DEFAULT_PAYMENT_TYPE,
  };
  const paymentTypes =
    paymentTypesData && paymentTypesData.length > 0
      ? [
          defaultPaymentOption,
          ...paymentTypesData
            .filter((pt) => pt.id !== DEFAULT_PAYMENT_TYPE)
            .map((pt) => ({ label: pt.name, value: pt.id })),
        ]
      : [defaultPaymentOption];
  // const createMutation = useCreateTransaction();

  const transactionSchema = z
    .object({
      totalPurchase: z.number().min(0, 'Total pembelian harus lebih besar atau sama dengan 0'),
      totalPaid: z.string(),
      status: z.string(),
      paymentTypeId: z.string(),
      note: z.string(),
    })
    .superRefine((data, ctx) => {
      if (!returnCustomerId && data.paymentTypeId.length < 1) {
        ctx.addIssue({
          code: 'custom',
          message: 'Metode pembayaran harus dipilih',
          path: ['paymentTypeId'],
        });
      }
    })
    .superRefine((data, ctx) => {
      if (
        data.status === Status.COMPLETED &&
        !returnCustomerId &&
        Number(data.totalPaid || '0') < data.totalPurchase &&
        !isHutang
      ) {
        ctx.addIssue({
          code: 'custom',
          message: 'Total pembayaran tidak boleh kurang dari total pembelian',
          path: ['totalPaid'],
        });
      }
      if (
        data.status === Status.COMPLETED &&
        returnCustomerId &&
        Number(data.totalPaid || '0') + (returnData?.totalAmount || 0) < data.totalPurchase
      ) {
        ctx.addIssue({
          code: 'custom',
          message: 'Pembayaran tidak boleh kurang dari nominal kekurangan',
          path: ['totalPaid'],
        });
      }
    });

  type TransactionFormValues = z.infer<typeof transactionSchema>;

  const initialValues: TransactionFormValues = {
    totalPurchase: 0,
    totalPaid: '',
    status: Status.DRAFT,
    paymentTypeId: '',
    note: '',
  };

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: initialValues,
  });

  const totalPaid = form.watch('totalPaid');
  const paymentTypeId = form.watch('paymentTypeId');
  const totalPurchase = form.watch('totalPurchase');

  const { grandTotal, commission, totalDiscount } = useMemo(() => {
    let comm = 0;
    const pt = paymentTypesData?.find((p) => p.id === paymentTypeId);
    if (pt && cartTotal) {
      comm =
        pt.commissionType === CalcType.PERCENTAGE
          ? (cartTotal * pt.commission) / 100
          : pt.commission;
    }

    const discount = cart.reduce((sum, item) => {
      if (item.tempSellPrice) return sum;
      const unitPrice = findSellPrice({
        sellPrices: item.product.sellPrices,
        type: customer?.category,
        quantity: item.quantity,
        unitVariant: item.variant,
      });
      if (!isDiscountActive(item.product.discount)) return sum;
      const discountedPrice = getDiscountedPrice(unitPrice, item.product.discount);
      return sum + (unitPrice - discountedPrice);
    }, 0);

    return {
      commission: Math.round(comm),
      grandTotal: Math.round(cartTotal + comm),
      totalDiscount: Math.round(discount),
    };
  }, [cartTotal, paymentTypesData, paymentTypeId, cart, customer]);

  useEffect(() => {
    if (cartTotal) {
      form.setValue('status', status);
      if (!transaction) {
        if (paymentTypesData && paymentTypesData.length > 0) {
          const defaultPaymentType =
            paymentTypesData.find(
              (pt) => pt.isDefault || pt.name.toLowerCase() === DEFAULT_PAYMENT_TYPE.toLowerCase(),
            )?.id || paymentTypesData[0].id;
          form.setValue('paymentTypeId', defaultPaymentType);
        } else {
          form.setValue('paymentTypeId', DEFAULT_PAYMENT_TYPE);
        }
      }
      if (transaction) {
        form.setValue('note', transaction.note || '');
      }
    }
  }, [form, cartTotal, status, paymentTypesData, transaction]);

  useEffect(() => {
    form.setValue('totalPurchase', grandTotal);
  }, [form, grandTotal]);

  useEffect(() => {
    if (returnCustomer && returnData) {
      const totalPaid = returnData.totalAmount - grandTotal;

      // Return item exchange always uses cash payment
      const cashPaymentType = paymentTypesData?.find(
        (pt) => pt.name.toLowerCase() === 'cash' || pt.name.toLowerCase() === 'tunai',
      );
      form.setValue('paymentTypeId', cashPaymentType?.id || paymentTypesData?.[0]?.id || '');
      form.setValue('totalPaid', totalPaid > 0 ? totalPaid.toString() : '0');
    }
  }, [form, grandTotal, paymentTypesData, returnCustomer, returnData]);

  const toast = useToast();
  const createTransactionMutation = useCreateTransaction();
  const createFinanceMutation = useCreateFinance();
  const createReceivableMutation = useCreateReceivable();

  // Hutang state
  const [isHutang, setIsHutang] = useState(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [dueDate, setDueDate] = useState(() => {
    const defaultDue = new Date();
    defaultDue.setDate(defaultDue.getDate() + 30);
    return defaultDue;
  });

  // Only show hutang option when employee is selected
  const showHutangOption = !!employee && status === Status.COMPLETED && !returnCustomerId;

  const isLoading =
    isLoadingTransaction ||
    createTransactionMutation.isPending ||
    createFinanceMutation.isPending ||
    createReceivableMutation.isPending;
  const excessAndLackAmount = (returnData?.totalAmount || 0) - totalPurchase;

  const showValidationError = (message?: string) => {
    showToast(toast, { action: 'error', message: message || 'Terjadi kesalahan validasi' });
  };

  const onSubmit: SubmitHandler<TransactionFormValues> = async (data: TransactionFormValues) => {
    try {
      // When hutang is checked, set totalPaid to 0
      const finalTotalPaid = isHutang
        ? 0
        : !returnCustomerId
          ? Number(data.totalPaid || '0')
          : Number(data.totalPaid || '0') + (returnData?.totalAmount || 0);

      const submissionData = {
        id: transactionId || undefined,
        totalAmount: grandTotal,
        totalPaid: finalTotalPaid,
        commission: commission,
        paymentTypeName:
          paymentTypesData?.find((p) => p.id === data.paymentTypeId)?.name || DEFAULT_PAYMENT_TYPE,
        paymentTypeCommission:
          paymentTypesData?.find((p) => p.id === data.paymentTypeId)?.commission || 0,
        paymentTypeCommissionType:
          paymentTypesData?.find((p) => p.id === data.paymentTypeId)?.commissionType ||
          'PERCENTAGE',
        paymentTypeMinimalAmount:
          paymentTypesData?.find((p) => p.id === data.paymentTypeId)?.minimalAmount || 0,
        customerId: employee ? undefined : customer?.id || '',
        customerName: employee ? undefined : customer?.name || undefined,
        customerCode: employee ? undefined : (customer?.code ?? undefined),
        customerPhone: employee ? undefined : (customer?.phone ?? undefined),
        customerAddress: employee ? undefined : (customer?.address ?? undefined),
        customerCategory: customer?.category || 'RETAIL',
        employeeId: employee?.id,
        employeeName: employee?.name || undefined,
        returnId: returnId || undefined,
        transactionDate: new Date(),
        status: status,
        note: data.note || '',
        items: cart.map((item) => {
          const variantData = item.variant;
          return {
            product: {
              id: item.product.originalId || item.product.id,
              discount: item.product.discount,
              categoryId: item.product.categoryId,
              categoryName: item.product.category?.name,
              barcode: item.product.barcode ?? undefined,
              brandId: item.product.brandId ?? undefined,
              brandName: item.product.brand?.name,
              unit: item.product.unit ?? undefined,
            },
            variant: variantData
              ? {
                  id: variantData.id,
                  name: variantData.name,
                  code: variantData.code,
                  netto: variantData.netto ?? undefined,
                }
              : undefined,
            quantity: item.quantity,
            tempSellPrice:
              item.tempSellPrice ||
              findSellPrice({
                sellPrices: item.product.sellPrices,
                type: customer?.category,
                quantity: item.quantity,
                unitVariant: item.variant,
              }),
            isManualPrice: !!item.tempSellPrice,
            note: item.note,
            productName: item.product.name,
            itemNote: item.note,
          };
        }),
      };

      const result = await createTransactionMutation.mutateAsync(submissionData);

      if (result.id) {
        useTransactionStore.getState().incrementVersion();
        if (result.status === Status.COMPLETED) {
          useProductStore.getState().incrementVersion();
        }
        // Create receivable if hutang is checked
        if (isHutang && employee) {
          await createReceivableMutation.mutateAsync({
            userId: employee.id,
            nominal: grandTotal,
            dueDate: dueDate,
            note: `Piutang dari Karyawan ${employee.username} pada tanggal ${dayjs().format('DD/MM/YYYY')}`,
            transactionId: result.id,
          });
        }

        setCheckoutData({
          id: result.id,
          referenceNumber: result.local_ref_id || '',
          createdById: user?.id || '',
          createdByName: user?.name || '',
          createdAt: new Date().toISOString(),
          updatedById: user?.id || '',
          updatedByName: user?.name || '',
          updatedAt: new Date().toISOString(),
          items: cart,
          totalItems: cartTotal,
          totalPaid: data.totalPaid,
          customerId: customer?.id || '',
          employeeId: employee?.id,
          transactionDate: new Date(),
          status: status,
          note: data.note || '',
        });

        if (status === Status.DRAFT) {
          router.push('/(main)/transaction');
        } else {
          if (returnId) {
            createFinance();
            router.replace(
              `/(main)/management/return/transaction/receipt/${returnId}?isSuccess=true`,
            );
          } else {
            router.replace(`/(main)/transaction/receipt/${result.id}?isSuccess=true`);
          }
        }
        resetCart();
        setCustomer(null);
        setEmployee(null);
      }
    } catch (error) {
      console.error('[onSubmit] Error creating transaction:', error);
    }
  };

  const createFinance = () => {
    createFinanceMutation.mutate(
      {
        type: excessAndLackAmount > 0 ? FinanceType.EXPENSES : FinanceType.INCOME,
        expensesType: excessAndLackAmount > 0 ? 'OTHER_EXPENSES' : undefined,
        transactionDate: new Date(),
        nominal: Math.abs(excessAndLackAmount),
        note: `Retur Ref: ${returnData?.local_ref_id}`,
        inputToCashdrawer: true,
        status: Status.COMPLETED,
      },
      {
        onSuccess: (_responseData) => {
          showSuccessToast(toast, 'Berhasil Tukar Barang');
          form.reset(initialValues);
        },
        onError: (error) => {
          showErrorToast(toast, `Gagal menyimpan: ${error.message}`);
        },
      },
    );
  };

  return (
    <VStack className="flex-1 bg-white">
      <Header
        header={status === Status.DRAFT ? 'SIMPAN DRAFT' : 'CHECKOUT'}
        isGoBack
        onGoBack={() => router.push('/(main)/transaction')}
        action={
          <HStack space="md" className="pr-4">
            <Pressable
              className="size-10 items-center justify-center border-primary-500 border rounded-lg bg-primary-100 active:bg-primary-200"
              disabled={isLoading}
              onPress={form.handleSubmit(onSubmit, (errors) => {
                if (errors.totalPaid) showValidationError(errors.totalPaid.message);
                else if (errors.paymentTypeId) showValidationError(errors.paymentTypeId.message);
              })}
            >
              {isLoading ? (
                <Spinner size="small" color="#3d2117" />
              ) : (
                <Icon as={Check} size="md" color="#3d2117" />
              )}
            </Pressable>
          </HStack>
        }
      />
      <HStack className="flex-1 bg-white">
        <VStack className="flex-1 border-r border-gray-300">
          <ScrollView className="flex-1">
            <VStack className="flex-1">
              {(customer || employee) && (
                <HStack space="sm" className="px-4 py-3 bg-primary-100">
                  <HStack space="sm" className="items-center">
                    <SolarIconBoldDuotone
                      name="UserCircle"
                      size={24}
                      color={employee ? '#f59e0b' : '#3b82f6'}
                    />
                    <VStack>
                      <Text className="text-primary-500 font-bold">
                        {employee ? employee.name : customer?.name}
                      </Text>
                      <Text className="text-typography-500 text-sm font-bold">
                        {employee ? `Karyawan - ${employee.username}` : customer?.code}
                      </Text>
                    </VStack>
                  </HStack>
                  {customer && !employee && (
                    <VStack className="flex-1 items-end">
                      <Text className="text-typography-500 text-sm font-bold">
                        {!returnCustomerId ? 'Poin' : 'Total Retur'}
                      </Text>
                      <Text
                        className={classNames(
                          'text-sm font-bold text-success-500',
                          returnCustomerId && 'text-error-500',
                        )}
                      >
                        {!returnCustomerId
                          ? formatNumber(customer.points ?? 0)
                          : formatRp(returnData?.totalAmount || 0)}
                      </Text>
                    </VStack>
                  )}
                </HStack>
              )}
              <HStack className="justify-center p-6 flex-col items-center">
                <Text className="text-typography-600 mb-2 font-bold">Total Tagihan</Text>
                <Heading size="3xl" className="font-bold text-center">
                  {formatRp(totalPurchase)}
                </Heading>
                {totalDiscount > 0 && (
                  <Text className="text-success-600 mt-2 font-bold">
                    {`Total Diskon Rp ${formatNumber(totalDiscount)}`}
                  </Text>
                )}
                {commission > 0 && (
                  <Text className="text-warning-600 mt-2 font-bold">
                    {`*Termasuk tambahan biaya Rp ${formatNumber(commission)}`}
                  </Text>
                )}
              </HStack>
              <VStack space="lg" className="p-4">
                {!!returnCustomerId && (
                  <HStack
                    space="sm"
                    className={classNames(
                      'px-4 py-3 rounded-md bg-success-100 border border-success-500',
                      excessAndLackAmount < 0 && 'bg-error-100 border-error-500',
                    )}
                  >
                    <Text className="text-typography-800 font-bold flex-1">
                      {excessAndLackAmount > 0 ? 'Kelebihan' : 'Kekurangan'}
                    </Text>
                    <Text
                      className={classNames(
                        'text-success-500 font-bold',
                        excessAndLackAmount < 0 && 'text-error-500',
                      )}
                    >
                      {formatRp(Math.abs(excessAndLackAmount))}
                    </Text>
                  </HStack>
                )}
                {!returnCustomerId && (
                  <Controller
                    control={form.control}
                    name="paymentTypeId"
                    render={({ field: { onChange, value }, fieldState: { error } }) => (
                      <FormControl isRequired isInvalid={!!error}>
                        <HStack space="md">
                          <SelectModal
                            value={value}
                            placeholder="Metode Pembayaran"
                            options={paymentTypes}
                            className="flex-1"
                            onChange={(v) => {
                              onChange(v);
                            }}
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
                )}
                {showHutangOption && (
                  <Checkbox
                    value={isHutang.toString()}
                    isChecked={isHutang}
                    size="md"
                    onChange={(checked) => setIsHutang(checked)}
                  >
                    <CheckboxIndicator>
                      <CheckboxIcon as={CheckIcon} />
                    </CheckboxIndicator>
                    <CheckboxLabel>Piutang</CheckboxLabel>
                  </Checkbox>
                )}
                {isHutang && showHutangOption && (
                  <FormControl className="flex-1">
                    <Pressable
                      onPress={() => setShowDueDatePicker(true)}
                      className="border border-background-300 rounded px-3 py-2"
                    >
                      <HStack className="items-center justify-between">
                        <Text>
                          {dayjs(dueDate).format('DD/MM/YYYY')}
                        </Text>
                        <Icon as={CalendarIcon} size="md" className="mr-2" />
                      </HStack>
                    </Pressable>
                    {showDueDatePicker && (
                      <DateTimePicker
                        mode="date"
                        display="spinner"
                        value={dueDate}
                        minimumDate={new Date()}
                        onChange={(event, selectedDate) => {
                          setShowDueDatePicker(false);
                          if (event.type === 'set' && selectedDate) {
                            setDueDate(selectedDate);
                          }
                        }}
                      />
                    )}
                  </FormControl>
                )}
                <Controller
                  name="note"
                  control={form.control}
                  render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
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
                          <FormControlErrorText>{error.message}</FormControlErrorText>
                        </FormControlError>
                      )}
                    </FormControl>
                  )}
                />
              </VStack>
            </VStack>
          </ScrollView>
        </VStack>
        {status === Status.COMPLETED && excessAndLackAmount < 0 && !isHutang && (
          <VStack className="flex-1">
            <ScrollView className="flex-1">
              <VStack className="flex-1">
                <HStack className="justify-center p-6 flex-col items-center">
                  <Heading size="3xl" className="font-bold">
                    Rp {totalPaid ? formatNumber(parseFloat(totalPaid)) : '0'}
                  </Heading>
                  {Number(totalPaid) > form.getValues('totalPurchase') && (
                    <Text className="text-success-500 font-bold mt-2">
                      Kembalian: {formatRp(Number(totalPaid) - form.getValues('totalPurchase'))}
                    </Text>
                  )}
                </HStack>
                <InputVirtualKeyboard
                  nominal={totalPaid}
                  exactChange={
                    !returnId ? grandTotal.toString() : Math.abs(excessAndLackAmount).toString()
                  }
                  onChange={(value) => form.setValue('totalPaid', value)}
                />
              </VStack>
            </ScrollView>
          </VStack>
        )}
      </HStack>
    </VStack>
  );
}
