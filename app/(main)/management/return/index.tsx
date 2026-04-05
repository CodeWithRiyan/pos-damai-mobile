import Header from '@/components/header';
import { Box, Text, VStack } from '@/components/ui';
import { Pressable } from '@/components/ui/pressable';
import { SolarIconLinear, SolarIconLinearProps } from '@/components/ui/solar-icon-wrapper';
import { usePermission } from '@/hooks/use-permission';
import { Link } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView } from 'react-native';

export default function ReturnScreen() {
  const { hasPermission, hasAnyPermission } = usePermission();

  const returnItems = useMemo(() => {
    const items: {
      label: string;
      href: string;
      icon: SolarIconLinearProps['name'];
      requiredPermission?: string | string[];
    }[] = [
      {
        label: 'Pembelian Barang',
        href: '/management/return/purchasing',
        icon: 'Cart3',
        requiredPermission: 'returns:read-supplier',
      },
      {
        label: 'Transaksi Penjualan',
        href: '/management/return/transaction',
        icon: 'Plain',
        requiredPermission: 'returns:read-customer',
      },
    ];

    return items.filter((item) => {
      if (!item.requiredPermission) return true;
      if (Array.isArray(item.requiredPermission)) {
        return hasAnyPermission(item.requiredPermission);
      }
      return hasPermission(item.requiredPermission);
    });
  }, [hasPermission, hasAnyPermission]);

  return (
    <Box className="flex-1 bg-white">
      <Header header="RETUR" isGoBack />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <VStack>
          {returnItems.map((item) => (
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
