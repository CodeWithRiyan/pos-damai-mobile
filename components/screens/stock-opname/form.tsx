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
import { Toast, ToastTitle, useToast } from "@/components/ui/toast";
import { VStack } from "@/components/ui/vstack";
// import {
//   useStockOpname,
//   useCreateStockOpname,
//   useUpdateStockOpname,
// } from "@/lib/api/stock-opname";
import { getErrorMessage } from "@/lib/api/client";
import { useStockOpnameStore } from "@/stores/stock-opname";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import React from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import z from "zod";

export default function StockOpnameConfirmForm() {
  const { openConfirm, setOpenConfirm, resetCart } = useStockOpnameStore();
  const router = useRouter();
  const toast = useToast();

  const stockOpnameSchema = z.object({
    note: z.string(),
  });

  type StockOpnameFormValues = z.infer<typeof stockOpnameSchema>;

  const initialValues: StockOpnameFormValues = {
    note: "",
  };

  const form = useForm<StockOpnameFormValues>({
    resolver: zodResolver(stockOpnameSchema),
    defaultValues: initialValues,
  });

  // const createMutation = useCreateStockOpname();
  // const updateMutation = useUpdateStockOpname();

  const onRefetch = () => {
    // refetchStockOpname();
    // if (dataStockOpname) refetchStockOpname();
  };

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

  const onSubmit: SubmitHandler<StockOpnameFormValues> = (
    data: StockOpnameFormValues,
  ) => {
    setOpenConfirm(false);
    resetCart();
    router.back();
    // if (dataStockOpname) {
    //   updateMutation.mutate(
    //     { id: dataStockOpname.id, ...data },
    //     {
    //       onSuccess: () => {
    //         showSuccessToast("StockOpname berhasil diperbarui");
    //         onRefetch();
    //         form.reset(initialValues);
    //         setOpen(false);
    //       },
    //       onError: showErrorToast,
    //     },
    //   );
    // } else {
    //   createMutation.mutate(data, {
    //     onSuccess: () => {
    //       showSuccessToast("StockOpname berhasil ditambahkan");
    //       onRefetch();
    //       form.reset(initialValues);
    //       setOpen(false);
    //     },
    //     onError: showErrorToast,
    //   });
    // }
  };

  const isLoading = false; //createMutation.isPending || updateMutation.isPending;

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
              name="note"
              control={form.control}
              render={({
                field: { onChange, onBlur, value },
                fieldState: { error },
              }) => (
                <FormControl isInvalid={!!error}>
                  <FormControlLabel>
                    <FormControlLabelText>Keterangan</FormControlLabelText>
                  </FormControlLabel>
                  <Textarea size="md">
                    <TextareaInput
                      value={value}
                      autoComplete="off"
                      placeholder="Masukkan keterangan (opsional)"
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
            <Text className="text-typography-400 font-bold">
              1. Pastikan Anda / Karyawan Anda tidak melakukan transaksi apapun,
              karena proses ini akan mempengaruhi riwayat stok barang anda!
            </Text>
            <Text className="text-typography-400 font-bold">
              2. Segera lakukan Sinkronisasi di semua device setelah
              menyesuaikan stok.
            </Text>
            <Text className="font-bold">
              Apakah anda yakin untuk menyimpan data Stock Opname dan
              menyesuaikan stok fisik dengan stok barang saat ini?
            </Text>
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
              onPress={form.handleSubmit(onSubmit)}
            >
              <Text size="lg" className="text-white font-bold">
                SIMPAN
              </Text>
            </Pressable>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
