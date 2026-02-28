import Header from "@/components/header";
import { Box, Text, VStack } from "@/components/ui";
import { Pressable } from "@/components/ui/pressable";
import {
  SolarIconLinear,
  SolarIconLinearProps,
} from "@/components/ui/solar-icon-wrapper";
import { Link } from "expo-router";
import { ScrollView } from "react-native";
import { usePermission } from "@/hooks/use-permission";
import React, { useMemo } from "react";

export default function ManagementScreen() {
  const { hasPermission, hasAnyPermission } = usePermission();

  const managementItems = useMemo(() => {
    const items: {
      label: string;
      href: string;
      icon: SolarIconLinearProps["name"];
      requiredPermission?: string | string[];
    }[] = [
      {
        label: "Produk, Kategori dan Brand",
        href: "/management/product-category-brand",
        icon: "Box",
        requiredPermission: ["products:read", "categories:read", "brands:read"],
      },
      {
        label: "Pelanggan dan Supplier",
        href: "/management/customer-supplier",
        icon: "Card2",
        requiredPermission: ["customers:read", "suppliers:read"],
      },
      {
        label: "Hutang dan Piutang",
        href: "/management/payable-receivable",
        icon: "NotebookBookmark",
        requiredPermission: ["payables:read", "receivables:read"],
      },
      {
        label: "Perubahan Stock",
        href: "/management/stock-changes",
        icon: "ArchiveCheck",
        requiredPermission: "inventory:read",
      },
      {
        label: "Retur",
        href: "/management/return",
        icon: "History",
        requiredPermission: "returns:read",
      },
      {
        label: "Jenis Pembayaran",
        href: "/management/payment-type",
        icon: "Banknote2",
        requiredPermission: "payment-types:read",
      },
      {
        label: "Karyawan dan Role",
        href: "/management/role-user",
        icon: "UsersGroupTwoRounded",
        requiredPermission: ["users:read", "roles:read"],
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
