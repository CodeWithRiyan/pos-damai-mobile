import { useSidebarStore } from "@/stores/sidebar";
import { useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";
import {
  ArrowLeftIcon,
  CloseIcon,
  Heading,
  HStack,
  Icon,
  MenuIcon,
  Text,
  VStack,
} from "./ui";
import { Pressable } from "./ui/pressable";

export default function Header({
  header,
  subHeader,
  action,
  isGoBack = false,
  onGoBack,
  selectedItemsLength,
  selectedItemsSuffixLabel,
  selectedItemsPosition = "left",
  onCancelSelectedItems,
}: {
  header?: React.ReactNode;
  subHeader?: React.ReactNode;
  action?: React.ReactNode;
  isGoBack?: boolean;
  onGoBack?: () => void;
  selectedItemsLength?: number;
  selectedItemsSuffixLabel?: string;
  selectedItemsPosition?: "left" | "right";
  onCancelSelectedItems?: () => void;
}) {
  const { setShowDrawer } = useSidebarStore((state) => state);
  const router = useRouter();
  const goBack = () => {
    if (onGoBack) {
      onGoBack();
    } else {
      router.back();
    }
  };
  const isCanGoBack = router.canGoBack();

  const CancelSelectedItems = () => {
    return (
      <HStack
        className={`items-center p-3${selectedItemsPosition === "right" ? " flex-row-reverse" : ""}`}
      >
        <Pressable onPress={() => onCancelSelectedItems?.()} className="p-3">
          <Icon as={CloseIcon} size="xl" className="text-typography-0" />
        </Pressable>
        <Heading
          size="sm"
          className="text-typography-0"
        >{`${selectedItemsLength}${
          selectedItemsSuffixLabel
            ? ` ${selectedItemsSuffixLabel}`
            : " Item terpilih"
        }`}</Heading>
      </HStack>
    );
  };

  return (
    <View className="relative bg-primary-500 w-full flex flex-row justify-between items-center">
      {selectedItemsPosition === "left" && selectedItemsLength ? (
        <CancelSelectedItems />
      ) : (
        <Pressable
          onPress={() => {
            if (isCanGoBack && isGoBack) {
              goBack();
            } else {
              setShowDrawer(true);
            }
          }}
          className="p-6"
        >
          {isCanGoBack && isGoBack ? (
            <Icon as={ArrowLeftIcon} size="xl" className="text-typography-0" />
          ) : (
            <Icon as={MenuIcon} size="xl" className="text-typography-0" />
          )}
        </Pressable>
      )}
      <HStack
        space="sm"
        className="absolute inset-0 justify-center items-center"
      >
        <VStack className="justify-center items-center">
          <Heading size="sm" className="text-typography-0">
            {header}
          </Heading>
          {subHeader && (
            <Text className="text-typography-0 text-xs">{subHeader}</Text>
          )}
        </VStack>
      </HStack>
      {selectedItemsPosition === "right" && selectedItemsLength ? (
        <CancelSelectedItems />
      ) : (
        action
      )}
    </View>
  );
}
