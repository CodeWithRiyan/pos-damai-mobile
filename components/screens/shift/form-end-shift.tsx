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
  FormControlHelper,
  FormControlHelperText,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { Input, InputField, InputSlot } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { VStack } from "@/components/ui/vstack";
import { showErrorToast, showSuccessToast } from "@/lib/utils/toast";
import { useCurrentShift, useEndShift } from "@/lib/api/shifts";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import React from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import z from "zod";

export default function EndShiftForm({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const { data: currentShift } = useCurrentShift();
  const endShiftMutation = useEndShift();

  const endShiftSchema = z.object({
    actualBalance: z.number().min(1, "Saldo Akhir wajib diisi"),
    note: z.string().min(1, "Catatan wajib diisi."),
  });

  type EndShiftFormValues = z.infer<typeof endShiftSchema>;

  const initialValues: EndShiftFormValues = {
    actualBalance: 0,
    note: "",
  };

  const form = useForm<EndShiftFormValues>({
    resolver: zodResolver(endShiftSchema),
    defaultValues: initialValues,
  });

  const onSubmit: SubmitHandler<EndShiftFormValues> = (
    data: EndShiftFormValues,
  ) => {
    endShiftMutation.mutate(
      {
        id: currentShift?.id || "",
        finalBalance: data.actualBalance,
        note: data.note,
      },
      {
        onSuccess: (newEndShift) => {
          showSuccessToast(toast, "Shift Telah Berakhir");
          form.reset(initialValues);
          setOpen(false);
          router.push(`/shift/detail/${newEndShift.id}`);
        },
        onError: (error: unknown) => {
          showErrorToast(toast, error);
        },
      },
    );
  };

  const isLoading = endShiftMutation.isPending;

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
            AKHIRI SHIFT
          </Heading>
        </ModalHeader>
        <ModalBody className="m-0" showsVerticalScrollIndicator={false}>
          <VStack space="lg" className="p-4">
            <Controller
              name="actualBalance"
              control={form.control}
              render={({
                field: { onChange, onBlur, value },
                fieldState: { error },
              }) => (
                <FormControl isRequired isInvalid={!!error}>
                  <FormControlLabel>
                    <FormControlLabelText>
                      Masukkan Saldo Akhir Diterima
                    </FormControlLabelText>
                  </FormControlLabel>
                  <FormControlHelper>
                    <FormControlHelperText>
                      *Akan menjadi nilai akhir di cashdrawer
                    </FormControlHelperText>
                  </FormControlHelper>
                  <Input className="h-16">
                    <InputSlot className="h-full aspect-square items-center justify-center bg-gray-100">
                      <Text className="text-2xl font-bold">Rp</Text>
                    </InputSlot>
                    <InputField
                      value={value.toString()}
                      autoComplete="off"
                      className="text-3xl text-center font-bold"
                      keyboardType="numeric"
                      placeholder="Masukkan penerimaan aktual"
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
              name="note"
              control={form.control}
              render={({
                field: { onChange, onBlur, value },
                fieldState: { error },
              }) => (
                <FormControl isRequired isInvalid={!!error}>
                  <FormControlLabel>
                    <FormControlLabelText>
                      Tambahkan Catatan Singkat
                    </FormControlLabelText>
                  </FormControlLabel>
                  <Textarea className="flex-1">
                    <TextareaInput
                      value={value}
                      autoComplete="off"
                      placeholder="Masukkan catatan"
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
