import {
  Button,
  ButtonText,
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
  VStack,
} from "@/components/ui";
import SelectModal from "@/components/ui/select/select-modal";
import { useUsers } from "@/lib/api/users";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckIcon, PlusIcon } from "lucide-react-native";
import { Controller, useForm } from "react-hook-form";
import { ScrollView } from "react-native";
import z from "zod";

const shiftSchema = z.object({
  cashdrawerId: z.string().min(1, "Supplier harus dipilih"),
  isUseLastBalance: z.boolean(),
  initialBalance: z
    .number()
    .min(0, "Total pembelian harus lebih besar atau sama dengan 0"),
});

export type ShiftFormValues = z.infer<typeof shiftSchema>;

export default function CurrentShift() {
  const { data: users } = useUsers();

  const initialValues: ShiftFormValues = {
    cashdrawerId: "",
    isUseLastBalance: false,
    initialBalance: 0,
  };

  const form = useForm<ShiftFormValues>({
    resolver: zodResolver(shiftSchema),
    defaultValues: initialValues,
  });

  const isUseLastBalance = form.watch("isUseLastBalance");

  const handleSubmit = (values: ShiftFormValues) => {
    console.log(values);
  };
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
                    options={[
                      {
                        label: "Cashdrawer 1",
                        value: "1",
                      },
                      {
                        label: "Cashdrawer 2",
                        value: "2",
                      },
                    ]}
                    className="flex-1"
                    onChange={onChange}
                  />
                  <Pressable
                    className="size-10 rounded-full bg-primary-500 items-center justify-center"
                    onPress={() => {}}
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
                    if (!v) form.setValue("initialBalance", 0); //TODO: set initialBalance to last cashdrawer balance
                  }}
                  onBlur={onBlur}
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
          onPress={form.handleSubmit(handleSubmit)}
        >
          <ButtonText className="text-white">MULAI SHIFT</ButtonText>
        </Button>
      </HStack>
    </VStack>
  );
}
