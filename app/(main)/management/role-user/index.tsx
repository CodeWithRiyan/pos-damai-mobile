import Header from "@/components/header";
import {
  Box,
  Icon,
  Text,
  ThreeDotsIcon,
  VStack
} from "@/components/ui";
import { Pressable } from "@/components/ui/pressable";
import { Link } from "expo-router";
import { ScrollView } from "react-native";

export default function UserRoleScreen() {
  const userRoleItems = [
    { label: "Role", href: "/management/role-user/role" },
    { label: "Karyawan", href: "/management/role-user/user" },
  ];

  return (
    <Box className="flex-1 bg-white">
      <Header
        header="MANAJEMEN"
        action={<Icon as={ThreeDotsIcon} className="p-6" />}
      />
      
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        <VStack>
          {userRoleItems.map((item, index) => (
            <Link href={item.href as any} key={item.href} asChild>
              <Pressable 
                className="flex-row items-center justify-between p-4 border-bottom bg--white active:bg-gray-50"
              >
                <Text className="font-medium text-gray-700 flex-1">
                  {item.label}
                </Text>
                <Text className="text-gray-400 text-lg">›</Text>
              </Pressable>
            </Link>
          ))}
        </VStack>
      </ScrollView>
    </Box>
  );
}
