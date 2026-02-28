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
  Spinner,
  Text,
  Textarea,
  TextareaInput,
} from "@/components/ui";
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { Radio, RadioGroup, RadioLabel } from "@/components/ui/radio";
import { Toast, ToastTitle, useToast } from "@/components/ui/toast";
import { VStack } from "@/components/ui/vstack";
// import {
//   useReturnPurchasing,
//   useCreateReturnPurchasing,
//   useUpdateReturnPurchasing,
// } from "@/lib/api/return-purchasing";
import { getErrorMessage } from "@/lib/api/client";
import { usePurchase } from "@/lib/api/purchasing";
import { useCreatePurchaseReturn } from "@/lib/api/return-purchasing";
import { useReturnPurchasingStore } from "@/stores/return-purchasing";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import z from "zod";

export default function ReturnPurchasingConfirmForm() {
  const { purchaseId, supplierId } = useLocalSearchParams<{
    purchaseId: string;
    supplierId: string;
  }>();
  const { data: purchase } = usePurchase(purchaseId || "");
  const { cart, openConfirm, setOpenConfirm, resetCart } =
    useReturnPurchasingStore();
  const router = useRouter();
  const toast = useToast();
  const createMutation = useCreatePurchaseReturn();
  const isLoading = createMutation.isPending;

  const returnPurchaseSchema = z.object({
    reason: z.string().min(1, "Alasan wajib diisi."),
    returnType: z.string().min(1, "Tipe Retur wajib diisi."),
  });

  type ReturnPurchasingFormValues = z.infer<typeof returnPurchaseSchema>;

  const initialValues: ReturnPurchasingFormValues = {
    reason: "",
    returnType: "CASH",
  };

  const form = useForm<ReturnPurchasingFormValues>({
    resolver: zodResolver(returnPurchaseSchema),
    defaultValues: initialValues,
  });

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

  const onSubmit: SubmitHandler<ReturnPurchasingFormValues> = (
    data: ReturnPurchasingFormValues,
  ) => {
    const totalAmount = cart.reduce(
      (acc, item) => acc + item.quantity * (item.product.purchasePrice || 0),
      0,
    );

    const returnData = {
      supplierId: purchase?.supplierId || supplierId || "",
      totalAmount,
      returnType: data.returnType as "CASH" | "ITEM",
      note: data.reason, // Map 'reason' from form to 'note' in database
      items: cart.map((item) => ({
        productId: item.product.id,
        productName: item.product.name || "",
        quantity: item.quantity,
        purchasePrice: item.product.purchasePrice || 0,
      })),
    };

    createMutation.mutate(returnData, {
      onSuccess: (data) => {
        showSuccessToast("Retur berhasil disimpan");
        setOpenConfirm(false);
        router.navigate(
          `/(main)/management/return/purchasing/receipt/${data.id}`,
        );
        resetCart();
        form.reset(initialValues);
      },
      onError: showErrorToast,
    });
  };

  return (
    <Modal
      isOpen={openConfirm}
      onClose={() => {
        setOpenConfirm(false);
        form.reset(initialValues);
      }}
      size="md"
    >
      <ModalBackdrop />
      <ModalContent className="p-0 max-h-[90%]">
        <ModalHeader className="p-4 border-b border-background-300">
          <Heading size="md" className="text-center flex-1">
            KONFIRMASI
          </Heading>
        </ModalHeader>
        <ModalBody className="m-0">
          <VStack space="lg" className="p-4">
            <Controller
              name="returnType"
              control={form.control}
              render={({
                field: { onChange, onBlur, value },
                fieldState: { error },
              }) => (
                <FormControl isRequired isInvalid={!!error}>
                  <FormControlLabel>
                    <FormControlLabelText>
                      Tipe Pengembalian
                    </FormControlLabelText>
                  </FormControlLabel>
                  <RadioGroup
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    className="flex-row gap-2"
                  >
                    <Radio
                      value="CASH"
                      size="md"
                      isInvalid={false}
                      isDisabled={false}
                      className={`flex-1 h-12 border rounded-md flex items-center justify-center${
                        value === "CASH"
                          ? " bg-primary-200 text-primary-500 border-primary-500"
                          : " bg-background-100 border-background-300"
                      }`}
                    >
                      <RadioLabel className="font-bold">UANG</RadioLabel>
                    </Radio>
                    <Radio
                      value="ITEM"
                      size="md"
                      isInvalid={false}
                      isDisabled={false}
                      className={`flex-1 h-12 border rounded-md flex items-center justify-center${
                        value === "ITEM"
                          ? " bg-primary-200 text-primary-500 border-primary-500"
                          : " bg-background-100 border-background-300"
                      }`}
                    >
                      <RadioLabel className="font-bold">
                        TUKAR BARANG
                      </RadioLabel>
                    </Radio>
                  </RadioGroup>
                </FormControl>
              )}
            />
            <Controller
              name="reason"
              control={form.control}
              render={({
                field: { onChange, onBlur, value },
                fieldState: { error },
              }) => (
                <FormControl isRequired isInvalid={!!error}>
                  <FormControlLabel>
                    <FormControlLabelText>Berikan Alasan</FormControlLabelText>
                  </FormControlLabel>
                  <Textarea
                    size="md"
                    className={error ? "border-error-500" : undefined}
                  >
                    <TextareaInput
                      value={value}
                      autoComplete="off"
                      placeholder="Tulis Alasan Disini..."
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
          </VStack>
        </ModalBody>
        <ModalFooter>
          <HStack space="md" className="w-full p-4">
            <Pressable
              className="flex-1 items-center justify-center h-12 px-4 rounded-lg border border-error-500 bg-error-100 active:bg-error-200"
              onPress={() => {
                setOpenConfirm(false);
              }}
            >
              <Text size="lg" className="text-error-500 font-bold">
                BATAL
              </Text>
            </Pressable>
            <Pressable
              className="flex-1 items-center justify-center h-12 px-4 rounded-lg bg-primary-500 active:bg-primary-500/90"
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
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
