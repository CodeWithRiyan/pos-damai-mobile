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
} from "@/components/ui";
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { Input, InputField } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Toast, ToastTitle, useToast } from "@/components/ui/toast";
import { VStack } from "@/components/ui/vstack";
// import {
//   usePaymentTypes,
//   usePaymentType,
//   useCreatePaymentType,
//   useUpdatePaymentType,
// } from "@/lib/api/payment-types";
import { getErrorMessage } from "@/lib/api/client";
import { usePaymentTypeStore } from "@/stores/payment-type";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import z from "zod";

export default function PaymentTypeForm() {
  const { open, setOpen, data: dataPaymentType } = usePaymentTypeStore();
  const toast = useToast();

  const paymentTypeSchema = z
    .object({
      name: z.string().min(1, "Nama Pembayaran wajib diisi."),
      commission: z.number(),
      minimalAmount: z.number(),
    })
    .superRefine((data, ctx) => {
      if (data.commission > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Jumlah minimal pembayaran wajib diisi.",
          path: ["minimalAmount"],
        });
      }
    });

  type PaymentTypeFormValues = z.infer<typeof paymentTypeSchema>;

  const initialValues: PaymentTypeFormValues = {
    name: "",
    commission: 0,
    minimalAmount: 0,
  };

  const form = useForm<PaymentTypeFormValues>({
    resolver: zodResolver(paymentTypeSchema),
    defaultValues: initialValues,
  });

  // const { refetch: refetchPaymentTypes } = usePaymentTypes();
  // const { refetch: refetchPaymentType } = usePaymentType(dataPaymentType?.id || "");

  // const createMutation = useCreatePaymentType();
  // const updateMutation = useUpdatePaymentType();

  const isLoading = false; //createMutation.isPending || updateMutation.isPending;

  // TODO: refetch setelah onSubmit
  const onRefetch = () => {
    // refetchCategorie();
    // if (dataPaymentType) refetchPaymentType();
  };

  useEffect(() => {
    if (dataPaymentType) {
      form.reset({
        name: dataPaymentType.name,
        commission: dataPaymentType.commission,
        minimalAmount: dataPaymentType.minimalAmount,
      });
    } else {
      form.reset(initialValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataPaymentType, form]);

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

  // TODO: Eksekusi createMutation.mutate dan updateMutation.mutate di onSubmit
  const onSubmit: SubmitHandler<PaymentTypeFormValues> = (
    data: PaymentTypeFormValues,
  ) => {};

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
            {dataPaymentType
              ? "EDIT JENIS PEMBAYARAN"
              : "TAMBAH JENIS PEMBAYARAN"}
          </Heading>
        </ModalHeader>
        <ModalBody className="m-0" showsVerticalScrollIndicator={false}>
          <VStack space="lg" className="p-4">
            <Controller
              name="name"
              control={form.control}
              render={({
                field: { onChange, onBlur, value },
                fieldState: { error },
              }) => (
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
                name="commission"
                control={form.control}
                render={({
                  field: { onChange, onBlur, value },
                  fieldState: { error },
                }) => (
                  <FormControl isInvalid={!!error} className="flex-1">
                    <FormControlLabel>
                      <FormControlLabelText>Komisi</FormControlLabelText>
                    </FormControlLabel>
                    <Input>
                      <InputField
                        value={value.toString()}
                        keyboardType="numeric"
                        placeholder="Masukkan komisi"
                        onChangeText={(text) => {
                          const num = parseFloat(text) || 0;
                          onChange(num);
                        }}
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
                name="minimalAmount"
                control={form.control}
                render={({
                  field: { onChange, onBlur, value },
                  fieldState: { error },
                }) => (
                  <FormControl isInvalid={!!error} className="flex-1">
                    <FormControlLabel>
                      <FormControlLabelText>
                        Jumlah Minimal Pembayaran
                      </FormControlLabelText>
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
        <ModalFooter className="p-4 pt-0">
          <HStack space="md">
            <Pressable
              className="w-full flex px-4 h-9 items-center justify-center rounded-sm bg-primary-500 active:bg-primary-500/90"
              onPress={form.handleSubmit(onSubmit)}
              disabled={isLoading}
            >
              {isLoading ? (
                <Spinner size="small" color="#FFFFFF" />
              ) : (
                <Text size="sm" className="text-typography-0 font-bold">
                  {!dataPaymentType ? "SIMPAN" : "PERBARUI"}
                </Text>
              )}
            </Pressable>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
