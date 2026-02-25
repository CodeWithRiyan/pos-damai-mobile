import {
  CloseIcon,
  Heading,
  HStack,
  Icon,
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Pressable,
  Text,
} from "@/components/ui";
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { Input, InputField } from "@/components/ui/input";
import { Radio, RadioGroup, RadioLabel } from "@/components/ui/radio";
import { Spinner } from "@/components/ui/spinner";
import { Toast, ToastTitle, useToast } from "@/components/ui/toast";
import { VStack } from "@/components/ui/vstack";
import { getErrorMessage } from "@/lib/api/client";
import {
  useCreateDiscount,
  useDiscount,
  useDiscounts,
  useUpdateDiscount,
} from "@/lib/api/discounts";
import { useDiscountStore } from "@/stores/discount";
import { zodResolver } from "@hookform/resolvers/zod";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Percent } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import z from "zod";

export default function DiscountForm() {
  const { open, setOpen, data: dataDiscount } = useDiscountStore();
  const toast = useToast();
  const createMutation = useCreateDiscount();
  const updateMutation = useUpdateDiscount();

  // State untuk mengontrol visibility date picker
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const discountSchema = z.object({
    name: z.string().min(1, "Nama Discount wajib diisi."),
    nominal: z.number().min(1, "Nominal wajib diisi."),
    type: z.enum(["FLAT", "PERCENTAGE"]),
    startDate: z.date(),
    endDate: z.date(),
  });

  type DiscountFormValues = z.infer<typeof discountSchema>;

  const initialValues: DiscountFormValues = {
    name: "",
    nominal: 0,
    type: "PERCENTAGE",
    startDate: new Date(),
    endDate: new Date(),
  };

  const form = useForm<DiscountFormValues>({
    resolver: zodResolver(discountSchema),
    defaultValues: initialValues,
  });

  const { refetch: refetchDiscounts } = useDiscounts();
  const { refetch: refetchDiscount } = useDiscount(dataDiscount?.id || "");

  const onRefetch = () => {
    refetchDiscounts();
    if (dataDiscount) refetchDiscount();
  };

  useEffect(() => {
    if (dataDiscount) {
      form.reset({
        name: dataDiscount.name,
        nominal: dataDiscount.nominal,
        type: dataDiscount.type,
        startDate: dataDiscount.startDate
          ? new Date(dataDiscount.startDate)
          : new Date(),
        endDate: dataDiscount.endDate
          ? new Date(dataDiscount.endDate)
          : new Date(),
      });
    } else {
      form.reset(initialValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataDiscount, form]);

  const showSuccessToast = (message: string) => {
    toast.show({
      placement: "top",
      render: ({ id }) => (
        <Toast nativeID={`toast-${id}`} action="success" variant="solid">
          <ToastTitle>{message}</ToastTitle>
        </Toast>
      ),
    });
  };

  const showErrorToast = (error: unknown) => {
    toast.show({
      placement: "top",
      render: ({ id }) => (
        <Toast nativeID={`toast-${id}`} action="error" variant="solid">
          <ToastTitle>{getErrorMessage(error)}</ToastTitle>
        </Toast>
      ),
    });
  };

  const onSubmit: SubmitHandler<DiscountFormValues> = (
    data: DiscountFormValues,
  ) => {
    if (dataDiscount) {
      updateMutation.mutate(
        { ...data, id: dataDiscount.id },
        {
          onSuccess: () => {
            showSuccessToast("Diskon berhasil diperbarui");
            form.reset(initialValues);
            setOpen(false);
            onRefetch();
          },
          onError: (error: any) => {
            showErrorToast(error);
          },
        },
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: (newDiscount) => {
          showSuccessToast("Diskon berhasil ditambahkan");
          onRefetch();
          if (useDiscountStore.getState().onSuccess) {
            useDiscountStore.getState().onSuccess?.(newDiscount);
          }
          form.reset(initialValues);
          setOpen(false);
        },
        onError: (error: any) => {
          showErrorToast(error);
        },
      });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={open}
      onClose={() => {
        setOpen(false);
        form.reset(initialValues);
        setShowStartDatePicker(false);
        setShowEndDatePicker(false);
      }}
      size="md"
    >
      <ModalBackdrop />
      <ModalContent>
        <ModalHeader className="mb-4">
          <Heading size="md" className="text-center flex-1">
            {dataDiscount ? "EDIT DISKON" : "TAMBAH DISKON"}
          </Heading>
          <ModalCloseButton onPress={() => setOpen(false)}>
            <Icon as={CloseIcon} />
          </ModalCloseButton>
        </ModalHeader>
        <ModalBody>
          <VStack space="lg">
            <Controller
              name="name"
              control={form.control}
              render={({
                field: { onChange, onBlur, value },
                fieldState: { error },
              }) => (
                <FormControl isRequired isInvalid={!!error}>
                  <FormControlLabel>
                    <FormControlLabelText>Nama Diskon</FormControlLabelText>
                  </FormControlLabel>
                  <Input>
                    <InputField
                      value={value}
                      autoComplete="name"
                      placeholder="Masukkan nama diskon"
                      onChangeText={onChange}
                      onBlur={onBlur}
                    />
                  </Input>
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
                    <FormControlLabelText>Nominal Diskon</FormControlLabelText>
                  </FormControlLabel>
                  <HStack space="md">
                    <Input className="flex-1">
                      <InputField
                        value={value.toString()}
                        keyboardType="numeric"
                        placeholder="Masukkan nominal diskon"
                        onChangeText={(text) => {
                          const num = parseFloat(text) || 0;
                          onChange(num);
                        }}
                        onBlur={onBlur}
                      />
                    </Input>
                    <Controller
                      name="type"
                      control={form.control}
                      render={({
                        field: { onChange, onBlur, value },
                        fieldState: { error },
                      }) => (
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
                                value === "PERCENTAGE"
                                  ? " bg-primary-200 text-primary-500 border-primary-500"
                                  : " bg-background-100 border-background-300"
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
                                value === "FLAT"
                                  ? " bg-primary-200 text-primary-500 border-primary-500"
                                  : " bg-background-100 border-background-300"
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
                      <FormControlErrorText>
                        {error.message}
                      </FormControlErrorText>
                    </FormControlError>
                  )}
                </FormControl>
              )}
            />
            <HStack space="md">
              <Controller
                name="startDate"
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
                      <FormControlLabelText>Tanggal Mulai</FormControlLabelText>
                    </FormControlLabel>
                    <Pressable
                      onPress={() => setShowStartDatePicker(true)}
                      className="border border-background-300 rounded px-3 py-2"
                    >
                      <Text>
                        {value instanceof Date
                          ? value.toLocaleDateString("id-ID")
                          : "Pilih tanggal"}
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
                        <FormControlErrorText>
                          {error.message}
                        </FormControlErrorText>
                      </FormControlError>
                    )}
                  </FormControl>
                )}
              />
              <Controller
                name="endDate"
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
                        Tanggal Selesai
                      </FormControlLabelText>
                    </FormControlLabel>
                    <Pressable
                      onPress={() => setShowEndDatePicker(true)}
                      className="border border-background-300 rounded px-3 py-2"
                    >
                      <Text>
                        {value instanceof Date
                          ? value.toLocaleDateString("id-ID")
                          : "Pilih tanggal"}
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
                        <FormControlErrorText>
                          {error.message}
                        </FormControlErrorText>
                      </FormControlError>
                    )}
                  </FormControl>
                )}
              />
            </HStack>
          </VStack>
        </ModalBody>
        <ModalFooter>
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
                  {!dataDiscount ? "SIMPAN" : "PERBARUI"}
                </Text>
              )}
            </Pressable>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
