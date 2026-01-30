import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { resetDb, initializeDb } from "@/lib/db";
import * as Updates from "expo-updates";
import { useRouter } from "expo-router";
import React from "react";
import { Alert, Pressable, ScrollView } from "react-native";

export default function SettingScreen() {
  const router = useRouter();

  const handleReset = () => {
    Alert.alert(
      "Reset Database",
      "Are you sure you want to delete all local data? This action cannot be undone and will require you to login again.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Everything",
          style: "destructive",
          onPress: async () => {
            try {
              await resetDb();
              await initializeDb();
              // Try to reload the bundle to ensure clean state
              try {
                await Updates.reloadAsync();
              } catch {
                // Fallback for development where reload might not work same way
                router.replace("/login");
              }
            } catch (error) {
              Alert.alert("Error", "Failed to reset database");
              console.error(error);
            }
          },
        },
      ]
    );
  };

  return (
    <Box className="flex-1 bg-gray-50 p-4">
      <VStack space="md" className="flex-1 max-w-2xl mx-auto w-full">
        <HStack className="items-center justify-between mb-4">
          <Heading size="xl">Settings</Heading>
        </HStack>

        <ScrollView showsVerticalScrollIndicator={false}>
          <VStack space="lg">
            {/* General Section (Placeholder) */}
            <VStack space="sm">
              <Text className="text-gray-500 font-medium ml-1">General</Text>
              <Box className="bg-white rounded-xl overflow-hidden border border-gray-100">
                <HStack className="p-4 items-center justify-between">
                  <HStack space="md" className="items-center">
                    <Box className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center">
                      <IconSymbol name="info.circle" size={18} className="text-blue-500" />
                    </Box>
                    <Text>App Version</Text>
                  </HStack>
                  <Text className="text-gray-500">1.0.0</Text>
                </HStack>
              </Box>
            </VStack>

            {/* Danger Zone */}
            <VStack space="sm">
              <Text className="text-red-500 font-medium ml-1">Danger Zone</Text>
              <Box className="bg-white rounded-xl overflow-hidden border border-red-100">
                <Pressable
                  className="p-4 flex-row items-center justify-between active:bg-red-50"
                  onPress={handleReset}
                >
                  <HStack space="md" className="items-center">
                    <Box className="w-8 h-8 rounded-full bg-red-50 items-center justify-center">
                      <IconSymbol name="trash" size={18} className="text-red-500" />
                    </Box>
                    <VStack>
                      <Text className="text-red-500 font-medium">Reset Database</Text>
                      <Text className="text-gray-500 text-sm">
                        Clear all local data and logout
                      </Text>
                    </VStack>
                  </HStack>
                  <IconSymbol name="chevron.right" size={16} className="text-gray-400" />
                </Pressable>
              </Box>
            </VStack>
          </VStack>
        </ScrollView>
      </VStack>
    </Box>
  );
}
