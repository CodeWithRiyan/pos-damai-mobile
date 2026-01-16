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
  MenuIcon
} from "./ui";
import { Pressable } from "./ui/pressable";

export default function Header({
  header,
  action,
  isGoBack = false,
  selectedItemsLength,
  selectedItemsSuffixLabel,
  onCancelSelectedItems,
}: {
  header?: React.ReactNode;
  action?: React.ReactNode;
  isGoBack?: boolean;
  selectedItemsLength?: number;
  selectedItemsSuffixLabel?: string;
  onCancelSelectedItems?: () => void;
}) {
  const { setShowDrawer } = useSidebarStore((state) => state);
  const router = useRouter();
  const goBack = () => router.back();
  const isCanGoBack = router.canGoBack();

  return (
    <View className="relative bg-primary-500 w-full flex flex-row justify-between items-center">
      {selectedItemsLength && onCancelSelectedItems ? (
        <HStack className="items-center p-3">
          <Pressable onPress={() => onCancelSelectedItems?.()} className="p-3">
            <Icon as={CloseIcon} size="xl" className="text-typography-0" />
          </Pressable>
          <Heading size="sm" className="text-typography-0">{`${selectedItemsLength}${
            selectedItemsSuffixLabel
              ? ` ${selectedItemsSuffixLabel}`
              : " Item terpilih"
          }`}</Heading>
        </HStack>
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
        <Heading size="sm" className="text-typography-0">{header}</Heading>
      </HStack>
      {action}
    </View>
  );
}
