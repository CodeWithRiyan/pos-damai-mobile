import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import useBreakpoint from "@/hooks/use-breakpoint";
import { useCurrentUser, useLogout } from "@/lib/api/auth";
import { useSidebarStore } from "@/stores/sidebar";
import { Link, usePathname, useRouter } from "expo-router";
import React from "react";
import { CloseIcon, Icon } from "./ui";
import {
  Drawer,
  DrawerBackdrop,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
} from "./ui/drawer";
import { Pressable } from "./ui/pressable";
import {
  SolarIconBoldDuotone,
  SolarIconBoldDuotoneProps,
} from "./ui/solar-icon-wrapper";

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user } = useCurrentUser();
  const role = user?.roles?.[0];
  const { mutate: logout } = useLogout();
  const { showDrawer, setShowDrawer } = useSidebarStore((state) => state);
  const { sm } = useBreakpoint();

  const handleLogout = () => {
    logout(undefined, {
      onSuccess: () => {
        router.replace("/login");
        setShowDrawer(false);
      },
    });
  };

  const menuItems: {
    label: string;
    icon: SolarIconBoldDuotoneProps["name"];
    href: string;
  }[] = [
    { label: "Dashboard", icon: "Widget5", href: "/" },
    { label: "Manajemen", icon: "Database", href: "/management" },
    { label: "Transaksi Penjualan", icon: "Plain", href: "/transaction" },
    { label: "Pembelian Barang", icon: "Cart3", href: "/purchase" },
    { label: "Keuangan", icon: "WalletMoney", href: "/finance" },
    { label: "Shift", icon: "WatchSquareMinimalistic", href: "/shift/current" },
    { label: "Laporan", icon: "PieChart2", href: "/report" },
    { label: "Pengaturan", icon: "Settings", href: "/settings" },
  ];
  console.log("user: ", user)
  return (
    <>
      <Drawer
        isOpen={showDrawer}
        size={sm ? "md" : "full"}
        anchor="left"
        onClose={() => {
          setShowDrawer(false);
        }}
      >
        <DrawerBackdrop className="bg-black/10" />
        <DrawerContent className="relative">
          <Box className="absolute top-6 inset-x-6 items-end">
            <Pressable
              onPress={() => {
                setShowDrawer(false);
              }}
            >
              <Icon as={CloseIcon} />
            </Pressable>
          </Box>
          <DrawerHeader>
            <VStack space="xs">
              <Heading size="md" className="text-brand-primary truncate">
                POS DAMAI
              </Heading>
              <HStack space="md" className="items-center py-2">
                <Box className="w-10 h-10 rounded-full bg-slate-200 items-center justify-center">
                  <IconSymbol name="person.fill" size={20} color="#64748b" />
                </Box>
                <VStack>
                  <Text size="sm" className="font-bold truncate">
                    {user?.name || user?.id || "Unknown User"}
                  </Text>
                  <Text size="xs" className="text-slate-500 truncate">
                    {role?.name || "No Role"}
                  </Text>
                </VStack>
              </HStack>
            </VStack>
          </DrawerHeader>
          <DrawerBody className="flex-1" showsVerticalScrollIndicator={false}>
            {/* Navigation */}
            <VStack space="sm" className="flex-1">
              {menuItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));

                return (
                  <Link href={item.href as any} key={item.href} asChild>
                    <Pressable
                      className={`flex-row items-center p-3 rounded-xl gap-3 ${
                        isActive ? "bg-brand-primary" : "active:bg-slate-200"
                      }`}
                      onPress={() => {
                        setShowDrawer(false);
                      }}
                    >
                      <SolarIconBoldDuotone
                        name={item.icon}
                        size={20}
                        className={
                          isActive
                            ? "text-brand-primary-forground"
                            : "text-slate-500"
                        }
                      />

                      <Text
                        className={`font-medium ${
                          isActive
                            ? "text-brand-primary-forground"
                            : "text-slate-500"
                        }`}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  </Link>
                );
              })}
            </VStack>
          </DrawerBody>
          <DrawerFooter>
            {/* Logout */}
            <Pressable
              className="flex-row flex-1 items-center p-3 rounded-xl gap-3 bg-gray-50"
              onPress={handleLogout}
            >
              <IconSymbol
                name="rectangle.portrait.and.arrow.right"
                size={18}
                className="text-red-500"
              />
              <Text className="text-red-500">Logout</Text>
            </Pressable>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
