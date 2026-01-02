import { useSidebarStore } from "@/stores/sidebar";
import React from "react";
import { View } from "react-native";
import { Icon, MenuIcon, Text, ThreeDotsIcon } from "./ui";
import { Pressable } from "./ui/pressable";

export default function Header({
  header,
  action,
}: {
  header?: React.ReactNode;
  action?: React.ReactNode;
}) {
  const { setShowDrawer } = useSidebarStore((state) => state);
  return (
    <View className="bg-brand-primary w-full flex flex-row justify-between items-center">
      <Pressable onPress={() => setShowDrawer(true)} className="p-6">
        <Icon
          as={MenuIcon}
          size="xl"
          className="text-brand-primary-forground"
        />
      </Pressable>
      <Text className="text-brand-primary-forground font-bold">{header}</Text>
      {action ? action : <Icon as={ThreeDotsIcon} className="p-6" />}
    </View>
  );
}
