import {
  Button,
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
  Pressable,
  Text,
  VStack,
} from "@/components/ui";
import SelectModal from "@/components/ui/select/select-modal";
import { useCashDrawers } from "@/lib/api/cashdrawers";
import { useCurrentShift, useLastShift, useStartShift } from "@/lib/api/shifts";
import { useCashDrawerStore } from "@/stores/cashdrawer";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckIcon, PlusIcon } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { ScrollView } from "react-native";
import z from "zod";

const shiftSchema = z.object({
  cashdrawerId: z.string().min(1, "Cashdrawer harus dipilih"),
  isUseLastBalance: z.boolean(),
  initialBalance: z
    .number()
    .min(0, "Saldo awal harus lebih besar atau sama dengan 0"),
  note: z.string().optional(),
});

export type ShiftFormValues = z.infer<typeof shiftSchema>;

export default function CurrentShift() {
  const [selectedCashDrawerId, setSelectedCashDrawerId] = useState<string>();
  const { data: cashDrawers, refetch: refetchCashDrawers } = useCashDrawers();
  const startShiftMutation = useStartShift();
  const { data: lastShift } = useLastShift(selectedCashDrawerId);
  const { isLoading } = useCurrentShift();
  const { setOpen: setOpenCashDrawer, setData: setDataCashDrawer } =
    useCashDrawerStore();

  const initialValues: ShiftFormValues = {
    cashdrawerId: "",
    isUseLastBalance: false,
    initialBalance: 0,
    note: "",
  };

  const form = useForm<ShiftFormValues>({
    resolver: zodResolver(shiftSchema),
    defaultValues: initialValues,
  });

  const isUseLastBalance = form.watch("isUseLastBalance");

  useEffect(() => {
    if (isUseLastBalance && lastShift?.finalBalance) {
      form.setValue("initialBalance", lastShift.finalBalance);
    } else if (!isUseLastBalance) {
      form.setValue("initialBalance", 0);
    }
  }, [isUseLastBalance, lastShift, form]);

  const onSubmit: SubmitHandler<ShiftFormValues> = async (data) => {
    try {
      if (!data.cashdrawerId) {
        console.error("No cash drawer selected");
        return;
      }

      await startShiftMutation.mutateAsync({
        cashDrawerId: data.cashdrawerId,
        initialBalance: data.initialBalance,
        note: data.note,
      });
    } catch (error) {
      console.error("Error starting shift:", error);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <VStack className="flex-1 bg-white items-center justify-center">
        <Text>Loading...</Text>
      </VStack>
    );
  }

  // Otherwise, show the start shift form
  return (
    <VStack className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <VStack space="md" className="p-4">
          <Controller
            control={form.control}
            name="cashdrawerId"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <FormControl isRequired isInvalid={!!error}>
                <FormControlLabel>
                  <FormControlLabelText>Cashdrawer</FormControlLabelText>
                </FormControlLabel>
                <HStack space="md">
                  <SelectModal
                    value={value}
                    placeholder="Pilih Cashdrawer"
                    showSearch={false}
                    options={
                      cashDrawers?.map((cd) => ({
                        label: cd.name,
                        value: cd.id,
                      })) || []
                    }
                    className="flex-1"
                    onChange={(val) => {
                      onChange(val);
                      setSelectedCashDrawerId(val || undefined);
                    }}
                  />
                  <Pressable
                    className="size-10 rounded-full bg-primary-500 items-center justify-center"
                    onPress={() => {
                      setDataCashDrawer(null);
                      setOpenCashDrawer(true, (newCashDrawer) => {
                        form.setValue("cashdrawerId", newCashDrawer.id);
                        refetchCashDrawers();
                      });
                    }}
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
            name="isUseLastBalance"
            control={form.control}
            render={({
              field: { onChange, onBlur, value },
              fieldState: { error },
            }) => (
              <FormControl isInvalid={!!error}>
                <Checkbox
                  value={value.toString()}
                  isChecked={value}
                  size="md"
                  onChange={(v) => {
                    onChange(v);
                  }}
                  onBlur={onBlur}
                  isDisabled={!selectedCashDrawerId}
                >
                  <CheckboxIndicator>
                    <CheckboxIcon as={CheckIcon} />
                  </CheckboxIndicator>
                  <CheckboxLabel>Masukkan Saldo Shift Terakhir</CheckboxLabel>
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
            name="initialBalance"
            control={form.control}
            render={({
              field: { onChange, onBlur, value },
              fieldState: { error },
            }) => (
              <FormControl
                isRequired
                isInvalid={!!error}
                isDisabled={isUseLastBalance}
                className="flex-1"
              >
                <FormControlLabel>
                  <FormControlLabelText>Saldo Awal</FormControlLabelText>
                </FormControlLabel>
                <Input>
                  <InputField
                    value={value?.toString() || ""}
                    onChangeText={(text) => {
                      onChange(Number(text) || 0);
                    }}
                    onBlur={onBlur}
                    placeholder="0"
                    keyboardType="numeric"
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
      </ScrollView>
      <HStack className="w-full p-4">
        <Button
          size="sm"
          className="w-full rounded-sm bg-brand-primary active:bg-brand-primary/90"
          onPress={form.handleSubmit(onSubmit)}
        >
          <Text size="sm" className="text-typography-0 font-bold">
            BUKA SHIFT
          </Text>
        </Button>
      </HStack>
    </VStack>
  );
}
