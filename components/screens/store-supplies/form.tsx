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
import { Toast, ToastTitle, useToast } from "@/components/ui/toast";
import { VStack } from "@/components/ui/vstack";
// import { useCreateStoreSupplies } from "@/lib/api/store-supplies";
import { getErrorMessage } from "@/lib/api/client";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { useStoreSuppliesStore } from "@/stores/store-supplies";
import { zodResolver } from "@hookform/resolvers/zod";
import { and, eq } from "drizzle-orm";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import z from "zod";

interface StoreSuppliesConfirmFormProps {
  date: Date;
}

export default function StoreSuppliesConfirmForm({
  date,
}: StoreSuppliesConfirmFormProps) {
  const { openConfirm, setOpenConfirm, resetCart, cart } =
    useStoreSuppliesStore();
  const router = useRouter();
  const toast = useToast();
  const [summary, setSummary] = useState({ totalGain: 0, totalLoss: 0 });

  const stockOpnameSchema = z.object({
    note: z.string(),
  });

  type StoreSuppliesFormValues = z.infer<typeof stockOpnameSchema>;

  const initialValues: StoreSuppliesFormValues = {
    note: "",
  };

  const form = useForm<StoreSuppliesFormValues>({
    resolver: zodResolver(stockOpnameSchema),
    defaultValues: initialValues,
  });

  // TODO: uncomment jika sudah dibuatkan servicenya
  // const createMutation = useCreateStoreSupplies();
  const isLoading = false; //createMutation.isPending;

  useEffect(() => {
    const calculateSummary = async () => {
      let gain = 0;
      let loss = 0;

      for (const item of cart) {
        const transactions = await db
          .select()
          .from(schema.inventoryTransactions)
          .where(
            and(
              eq(schema.inventoryTransactions.productId, item.product.id),
              eq(schema.inventoryTransactions.status, "COMPLETED"),
            ),
          );

        const currentStock = transactions.reduce(
          (sum, t) => sum + t.quantity,
          0,
        );
        const difference = item.quantity - currentStock;
        const purchasePrice = item.product.purchasePrice || 0;
        const impact = difference * purchasePrice;

        if (impact > 0) gain += impact;
        if (impact < 0) loss += Math.abs(impact);
      }

      setSummary({ totalGain: gain, totalLoss: loss });
    };

    if (openConfirm && cart.length > 0) {
      void calculateSummary();
    }
  }, [openConfirm, cart]);

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

  const onSubmit: SubmitHandler<StoreSuppliesFormValues> = (
    data: StoreSuppliesFormValues,
  ) => {
    const submissionData = {
      date: date,
      note: data.note,
      items: (cart || []).map((item: any) => ({
        product: { id: item.product.id, name: item.product.name },
        physicalStock: item.physicalStock,
      })),
    };

    // TODO: uncomment jika sudah dibuatkan servicenya
    // createMutation.mutate(submissionData, {
    //   onSuccess: () => {
    //     showSuccessToast("Kebutuhan Toko berhasil disimpan");
    //     setOpenConfirm(false);
    //     resetCart();
    //     router.back();
    //   },
    //   onError: showErrorToast,
    // });
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
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
            <VStack space="sm" className="bg-background-50 p-3 rounded-lg">
              <HStack className="justify-between">
                <Text className="text-slate-500">Tanggal:</Text>
                <Text className="font-bold">
                  {date.toLocaleDateString("id-ID")}
                </Text>
              </HStack>
            </VStack>

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
              Pastikan Anda / Karyawan Anda tidak melakukan transaksi apapun,
              karena proses ini akan mempengaruhi riwayat stok barang anda!
            </Text>
            <Text className="font-bold">
              Apakah anda yakin untuk menyimpan data Kebutuhan Toko?
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
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
