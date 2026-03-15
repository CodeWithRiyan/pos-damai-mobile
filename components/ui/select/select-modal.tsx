import { tva, VariantProps } from "@gluestack-ui/utils/nativewind-utils";
import classNames from "classnames";
import {
  CheckIcon,
  ChevronDown,
  RefreshCcw,
  SearchIcon,
} from "lucide-react-native";
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
import { SolarIconBold, SolarIconBoldProps } from "../solar-icon-wrapper";
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

interface SelectModalOption {
  value: string;
  label: string;
  desc?: string;
  actions?: SelectAction[];
}

interface SelectAction {
  label: string;
  icon: SolarIconBoldProps["name"];
  onPress: () => void;
}

export default function SelectModal({
  header = "PILIH",
  value,
  options = [],
  optionsGroup,
  placeholder,
  searchPlaceholder = "Cari",
  className,
  size = "md",
  variant = "outline",
  showSearch = true,
  disabled = false,
  onChange,
}: {
  header?: string;
  value: string;
  options?: SelectModalOption[];
  optionsGroup?: {
    label: string;
    options: SelectModalOption[];
  }[];
  placeholder?: string;
  searchPlaceholder?: string;
  showSearch?: boolean;
  disabled?: boolean;
  onChange: (v: string | null) => void;
} & VariantProps<typeof selectTriggerStyle>) {
  const [open, setOpen] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(search.toLowerCase()),
  );

  const filteredOptionsGroup = optionsGroup?.map((group) => ({
    ...group,
    options: group.options.filter((option) =>
      option.label.toLowerCase().includes(search.toLowerCase()),
    ),
  }));

  const foundOption = optionsGroup
    ? optionsGroup.flatMap((g) => g.options).find((o) => o.value === value)
    : options.find((o) => o.value === value);
  const labelValue = foundOption?.label || placeholder;

  return (
    <>
      <Pressable
        onPress={() => !disabled && setOpen(true)}
        disabled={disabled}
        className={selectTriggerStyle({
          class: className,
          size,
          variant,
        })}
      >
        <Text className={!value ? "text-background-400" : undefined}>
          {labelValue}
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
              <Pressable
                onPress={() => {
                  setOpen(false);
                  setSearch("");
                  onChange(null);
                }}
                className="size-10 items-center justify-center"
              >
                <Icon as={RefreshCcw} />
              </Pressable>
            </HStack>
          </ModalHeader>
          <ModalBody className="m-0" showsVerticalScrollIndicator={false}>
            <VStack>
              {!!filteredOptions.length && !filteredOptionsGroup ? (
                filteredOptions.map((option) => (
                  <Pressable
                    key={option.value}
                    className={`w-full flex-row gap-4 items-center px-6 py-2 rounded-sm data-[disabled=true]:opacity-40 data-[disabled=true]:web:pointer-events-auto data-[disabled=true]:web:cursor-not-allowed hover:bg-background-50 active:bg-background-100 data-[focus=true]:bg-background-100 web:data-[focus-visible=true]:bg-background-100 data-[checked=true]:bg-background-100${
                      option.value === value ? " bg-background-100" : ""
                    }`}
                    onPress={() => {
                      onChange(option.value);
                      setOpen(false);
                      setSearch("");
                    }}
                  >
                    <VStack className="flex-1">
                      <Text className="flex-1 text-md leading-5 text-typography-700 font-normal font-body text-left mx-2">
                        {option.label}
                      </Text>
                      {option.desc ? (
                        <Text className="flex-1 text-sm leading-4 text-typography-500 font-normal font-body text-left mx-2">
                          {option.desc}
                        </Text>
                      ) : null}
                    </VStack>
                    {option.value === value && (
                      <Icon as={CheckIcon} className="text-primary-500" />
                    )}
                    {!!option.actions?.length && (
                      <HStack space="sm">
                        {option.actions?.map((act, i) => (
                          <Pressable
                            key={i}
                            onPress={act.onPress}
                            className="h-8 w-8 rounded-md items-center justify-center active:bg-background-100"
                          >
                            <SolarIconBold name={act.icon} size={16} />
                          </Pressable>
                        ))}
                      </HStack>
                    )}
                  </Pressable>
                ))
              ) : filteredOptionsGroup?.length ? (
                filteredOptionsGroup.map((group, groupIndex) => (
                  <VStack key={group.label}>
                    <Text
                      className={classNames(
                        "text-sm text-typography-700 font-bold font-body text-left p-4 pb-1",
                        groupIndex !== 0 && "border-t border-background-300",
                      )}
                    >
                      {group.label}
                    </Text>
                    {group.options.map((option) => (
                      <Pressable
                        key={option.value}
                        className={`w-full flex-row items-center px-6 py-2 rounded-sm data-[disabled=true]:opacity-40 data-[disabled=true]:web:pointer-events-auto data-[disabled=true]:web:cursor-not-allowed hover:bg-background-50 active:bg-background-100 data-[focus=true]:bg-background-100 web:data-[focus-visible=true]:bg-background-100 data-[checked=true]:bg-background-100${
                          option.value === value ? " bg-background-100" : ""
                        }`}
                        onPress={() => {
                          onChange(option.value);
                          setOpen(false);
                          setSearch("");
                        }}
                      >
                        <VStack className="flex-1">
                          <Text className="flex-1 text-md leading-5 text-typography-700 font-normal font-body text-left mx-2">
                            {option.label}
                          </Text>
                          {option.desc ? (
                            <Text className="flex-1 text-sm leading-4 text-typography-500 font-normal font-body text-left mx-2">
                              {option.desc}
                            </Text>
                          ) : null}
                        </VStack>
                        {option.value === value && (
                          <Icon as={CheckIcon} className="text-primary-500" />
                        )}
                      </Pressable>
                    ))}
                  </VStack>
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
