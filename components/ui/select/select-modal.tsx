import { tva, VariantProps } from "@gluestack-ui/utils/nativewind-utils";
import { CheckIcon, ChevronDown, SearchIcon } from "lucide-react-native";
import { useState } from "react";
import { HStack } from "../hstack";
import { Icon } from "../icon";
import { Input, InputField, InputIcon, InputSlot } from "../input";
import {
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalContent,
  ModalHeader,
} from "../modal";
import { Pressable } from "../pressable";
import { Text } from "../text";
import { VStack } from "../vstack";

const selectTriggerStyle = tva({
  base: "border border-background-300 rounded px-3 flex-row items-center justify-between overflow-hidden data-[hover=true]:border-outline-400 data-[focus=true]:border-primary-700 data-[disabled=true]:opacity-40 data-[disabled=true]:data-[hover=true]:border-background-300",
  variants: {
    size: {
      xl: "h-12",
      lg: "h-11",
      md: "h-10",
      sm: "h-9",
    },
    variant: {
      underlined:
        "border-0 border-b rounded-none data-[hover=true]:border-primary-700 data-[focus=true]:border-primary-700 data-[focus=true]:web:shadow-[inset_0_-1px_0_0] data-[focus=true]:web:shadow-primary-700 data-[invalid=true]:border-error-600 data-[invalid=true]:web:shadow-error-600",
      outline:
        "data-[focus=true]:border-primary-700 data-[focus=true]:web:shadow-[inset_0_0_0_1px] data-[focus=true]:data-[hover=true]:web:shadow-primary-600 data-[invalid=true]:web:shadow-[inset_0_0_0_1px] data-[invalid=true]:border-error-600 data-[invalid=true]:web:shadow-error-600 data-[invalid=true]:data-[hover=true]:border-error-600",
      rounded:
        "rounded-full data-[focus=true]:border-primary-700 data-[focus=true]:web:shadow-[inset_0_0_0_1px] data-[focus=true]:web:shadow-primary-700 data-[invalid=true]:border-error-600 data-[invalid=true]:web:shadow-error-600",
    },
  },
});

export default function SelectModal({
  header = "PILIH",
  value,
  options,
  placeholder,
  searchPlaceholder = "Cari",
  className,
  size = "md",
  variant = "outline",
  showSearch = true,
  onChange,
}: {
  header?: string;
  value: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  searchPlaceholder?: string;
  showSearch?: boolean;
  onChange: (v: string) => void;
} & VariantProps<typeof selectTriggerStyle>) {
  const [open, setOpen] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        className={selectTriggerStyle({
          class: className,
          size,
          variant,
        })}
      >
        <Text className={!value ? "text-background-400" : undefined}>
          {value ? options.find((o) => o.value === value)?.label : placeholder}
        </Text>
        <Icon
          as={ChevronDown}
          className={!value ? "text-background-400" : undefined}
        />
      </Pressable>
      <Modal
        isOpen={open}
        onClose={() => {
          setOpen(false);
          setSearch("");
        }}
        size="md"
      >
        <ModalBackdrop />
        <ModalContent className="p-0 max-h-[90%]">
          <ModalHeader
            className={`p-4 border-b border-background-300${!showSearch ? " hidden" : ""}`}
          >
            <HStack space="sm" className="flex-1 items-center">
              <Input className="flex-1 border border-background-300 rounded-lg h-10">
                <InputSlot className="pl-3">
                  <InputIcon as={SearchIcon} />
                </InputSlot>
                <InputField
                  placeholder={searchPlaceholder}
                  onChangeText={(v) => setSearch(v)}
                />
              </Input>
            </HStack>
          </ModalHeader>
          <ModalBody className="m-0" showsVerticalScrollIndicator={false}>
            <VStack>
              {!!filteredOptions.length ? (
                filteredOptions.map((option) => (
                  <Pressable
                    key={option.value}
                    className={`w-full flex-row items-center p-4 rounded-sm data-[disabled=true]:opacity-40 data-[disabled=true]:web:pointer-events-auto data-[disabled=true]:web:cursor-not-allowed hover:bg-background-50 active:bg-background-100 data-[focus=true]:bg-background-100 web:data-[focus-visible=true]:bg-background-100 data-[checked=true]:bg-background-100${
                      option.value === value ? " bg-background-100" : ""
                    }`}
                    onPress={() => {
                      onChange(option.value);
                      setOpen(false);
                      setSearch("");
                    }}
                  >
                    <Text className="flex-1 text-lg text-typography-700 font-normal font-body tracking-md text-left mx-2">
                      {option.label}
                    </Text>
                    {option.value === value && (
                      <Icon as={CheckIcon} className="text-primary-500" />
                    )}
                  </Pressable>
                ))
              ) : (
                <Text className="text-lg text-typography-500 text-center p-10">
                  Tidak ada data
                </Text>
              )}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
