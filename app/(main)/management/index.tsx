import Header from "@/components/header";
import { Box, Text, VStack } from "@/components/ui";
import { Pressable } from "@/components/ui/pressable";
import {
  SolarIconLinear,
  SolarIconLinearProps,
} from "@/components/ui/solar-icon-wrapper";
import { Link } from "expo-router";
import { ScrollView } from "react-native";

export default function ManagementScreen() {
  const managementItems: {
    label: string;
    href: string;
    icon: SolarIconLinearProps["name"];
  }[] = [
    {
      label: "Produk, Kategori dan Brand",
      href: "/management/product-category-brand",
      icon: "Box",
    },
    // { label: "Diskon", href: "/management/discount", icon: "TicketSale" },
    {
      label: "Pelanggan dan Supplier",
      href: "/management/customer-supplier",
      icon: "Card2",
    },
    {
      label: "Hutang dan Piutang",
      href: "/management/payable-receivable",
      icon: "NotebookBookmark",
    },
    {
      label: "Stock Opname",
      href: "/management/stock-opname",
      icon: "ArchiveCheck",
    },
    { label: "Retur", href: "/management/return", icon: "History" },
    {
      label: "Jenis Pembayaran",
      href: "/management/payment-type",
      icon: "Banknote2",
    },
    {
      label: "Karyawan dan Role",
      href: "/management/role-user",
      icon: "UsersGroupTwoRounded",
    },
  ];

  return (
    <Box className="flex-1 bg-white">
      <Header header="MANAJEMEN" />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <VStack>
          {managementItems.map((item, index) => (
            <Link href={item.href as any} key={item.href} asChild>
              <Pressable className="flex-row items-center gap-4 p-4 border-bottom bg--white active:bg-gray-50">
                <SolarIconLinear
                  name={item.icon}
                  size={20}
                  className="text-gray-700"
                />
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
