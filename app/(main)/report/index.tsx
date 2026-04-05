import Header from '@/components/header';
import { Box, Text, VStack } from '@/components/ui';
import { Pressable } from '@/components/ui/pressable';
import { SolarIconLinear, SolarIconLinearProps } from '@/components/ui/solar-icon-wrapper';
import { Link } from 'expo-router';
import { ScrollView } from 'react-native';

export default function ReportScreen() {
  const reportItems: {
    label: string;
    href: string;
    icon: SolarIconLinearProps['name'];
  }[] = [
    {
      label: 'Laporan Shift',
      href: '/report/shift',
      icon: 'Chart',
    },
    {
      label: 'Laporan Laba Rugi',
      href: '/report/profit-loss',
      icon: 'Chart',
    },
    {
      label: 'Laporan Arus Kas',
      href: '/report/cashflow',
      icon: 'Chart',
    },
    {
      label: "Laporan Setor Tunai",
      href: "/report/cash-deposit",
      icon: "Chart",
    },
    {
      label: 'Laporan Keuangan Kasir',
      href: '/report/cashier',
      icon: 'Chart',
    },
    {
      label: 'Laporan Penjualan',
      href: '/report/sales',
      icon: 'Chart',
    },
    {
      label: 'Laporan Pembelian',
      href: '/report/purchasing',
      icon: 'Chart',
    },
    {
      label: 'Laporan Stok Opname',
      href: '/report/stock-opname',
      icon: 'Chart',
    },
    {
      label: 'Laporan Hutang Piutang',
      href: '/report/payable-receivable',
      icon: 'Chart',
    },
    {
      label: 'Laporan Pelanggan',
      href: '/report/customer',
      icon: 'Chart',
    },
    {
      label: 'Laporan Inventaris',
      href: '/report/inventory',
      icon: 'Chart',
    },
  ];

  return (
    <Box className="flex-1 bg-white">
      <Header header="LAPORAN" />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <VStack>
          {reportItems.map((item) => (
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
