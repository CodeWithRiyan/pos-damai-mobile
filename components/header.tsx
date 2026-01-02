import { useSidebarStore } from "@/stores/sidebar";
import { useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";
import {
  ArrowLeftIcon,
  Icon,
  MenuIcon,
  Text,
  ThreeDotsIcon
} from "./ui";
import { Pressable } from "./ui/pressable";

export default function Header({
  header,
  action,
  isGoBack = false,
}: {
  header?: React.ReactNode;
  action?: React.ReactNode;
  isGoBack?: boolean;
}) {
  const { setShowDrawer } = useSidebarStore((state) => state);
  const router = useRouter();
  const goBack = () => router.back();

  return (
    <View className="bg-brand-primary w-full flex flex-row justify-between items-center">
      <Pressable
        onPress={() => {
          if (isGoBack) {
            goBack();
          } else {
            setShowDrawer(true);
          }
        }}
        className="p-6"
      >
        {isGoBack ? (
          <Icon
            as={ArrowLeftIcon}
            size="xl"
            className="text-brand-primary-forground"
          />
        ) : (
          <Icon
            as={MenuIcon}
            size="xl"
            className="text-brand-primary-forground"
          />
        )}
      </Pressable>
      <Text className="text-brand-primary-forground font-bold">{header}</Text>
      {action ? action : <Icon as={ThreeDotsIcon} className="p-6" />}
    </View>
  );
}
