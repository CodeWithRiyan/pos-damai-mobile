import {
  Button,
  ButtonText,
  ChevronDownIcon,
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  HStack,
  Input,
  InputField,
  Pressable,
  Select,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicator,
  SelectDragIndicatorWrapper,
  SelectIcon,
  SelectInput,
  SelectItem,
  SelectPortal,
  SelectTrigger,
  Text,
  VStack,
} from "@/components/ui";
import { useUsers } from "@/lib/api/users";
import { useState } from "react";
import { ScrollView } from "react-native";

export default function CurrentShift() {
  const { data: users } = useUsers();
  const [userId, setUserId] = useState<string | null>(null);
  const [totalAmount, setTotalAmount] = useState<string | null>(null);
  return (
    <VStack className="flex-1">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <VStack space="md" className="p-4">
          <FormControl isRequired isInvalid>
            <FormControlLabel>
              <FormControlLabelText>Karyawan</FormControlLabelText>
            </FormControlLabel>
            <Select onValueChange={setUserId}>
              <SelectTrigger>
                <SelectInput
                  placeholder="Pilih Karyawan"
                  className="flex-1 capitalize"
                />
                <SelectIcon className="mr-3" as={ChevronDownIcon} />
              </SelectTrigger>
              <SelectPortal>
                <SelectBackdrop />
                <SelectContent>
                  <SelectDragIndicatorWrapper>
                    <SelectDragIndicator />
                  </SelectDragIndicatorWrapper>
                  {users?.map((role) => (
                    <SelectItem
                      key={role.id}
                      label={role.firstName}
                      value={role.id}
                      textStyle={{ className: "capitalize flex-1" }}
                      className="px-4 py-2"
                    />
                  ))}
                </SelectContent>
              </SelectPortal>
            </Select>
          </FormControl>

          <FormControl isRequired>
            <FormControlLabel>
              <FormControlLabelText>Saldo Awal</FormControlLabelText>
            </FormControlLabel>
            <Input>
              <InputField
                value={totalAmount || ""}
                onChangeText={setTotalAmount}
                placeholder="Masukkan Saldo Awal"
              />
            </Input>
          </FormControl>
          <Pressable>
            <Text className="text-sm text-blue-500 font-bold">
              Masukkan Saldo Shift Terakhir
            </Text>
          </Pressable>
        </VStack>
      </ScrollView>
      <HStack className="w-full p-4">
        <Button
          size="sm"
          className="w-full rounded-sm bg-brand-primary active:bg-brand-primary/90"
          onPress={() => {}}
        >
          <ButtonText className="text-white">MULAI SHIFT</ButtonText>
        </Button>
      </HStack>
    </VStack>
  );
}
