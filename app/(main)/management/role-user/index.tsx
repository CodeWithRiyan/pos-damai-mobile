import Header from '@/components/header';
import { Box, Text, VStack } from '@/components/ui';
import { Pressable } from '@/components/ui/pressable';
import { SolarIconLinear, SolarIconLinearProps } from '@/components/ui/solar-icon-wrapper';
import { Link } from 'expo-router';
import { ScrollView } from 'react-native';

export default function UserRoleScreen() {
  const userRoleItems: {
    label: string;
    href: string;
    icon: SolarIconLinearProps['name'];
  }[] = [
    {
      label: 'Karyawan',
      href: '/management/role-user/user',
      icon: 'UsersGroupTwoRounded',
    },
    {
      label: 'Role',
      href: '/management/role-user/role',
      icon: 'KeyMinimalisticSquare2',
    },
  ];

  return (
    <Box className="flex-1 bg-white">
      <Header header="KARYAWAN DAN ROLE" isGoBack />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <VStack>
          {userRoleItems.map((item) => (
            <Link href={item.href as any} key={item.href} asChild>
              <Pressable className="flex-row items-center gap-4 p-4 border-bottom bg--white active:bg-gray-50">
                <SolarIconLinear name={item.icon} size={20} className="text-gray-700" />
                <Text className="font-medium text-gray-700 flex-1">{item.label}</Text>
                <Text className="text-gray-400 text-lg">›</Text>
              </Pressable>
            </Link>
          ))}
        </VStack>
      </ScrollView>
    </Box>
  );
}
