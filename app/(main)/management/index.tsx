import Header from "@/components/header";
import { Box, Icon, Text, ThreeDotsIcon, VStack } from "@/components/ui";
import { Pressable } from "@/components/ui/pressable";
import { useSidebarStore } from "@/stores/sidebar";
import { Link } from "expo-router";
import { ScrollView } from "react-native";

export default function ManagementScreen() {
  const { setShowDrawer } = useSidebarStore((state) => state);

  const managementItems = [
    {
      label: "Produk, Kategori dan Brand",
      href: "/management/product-category-brand",
    },
    { label: "Diskon", href: "/management/discount" },
    { label: "Pelanggan dan Suplier", href: "/management/customer-supplier" },
    { label: "Hutang dan Piutang", href: "/management/credit-debt" },
    { label: "Tipe Pembayaran", href: "/management/payment-type" },
    { label: "Stock Opname", href: "/management/stock-opname" },
    { label: "Karyawan dan Role", href: "/management/role-user" },
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
          {managementItems.map((item, index) => (
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