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
      },
    });
  };

  const menuItems = [
    { label: "Dashboard", icon: "house.fill", href: "/" },
    { label: "Manajemen", icon: "house.fill", href: "/management" },
    { label: "Transaksi Penjualan", icon: "house.fill", href: "/transaction" },
    { label: "Pembelian Barang", icon: "house.fill", href: "/purchase" },
    { label: "Keuangan", icon: "house.fill", href: "/finance" },
    { label: "Laporan", icon: "house.fill", href: "/report" },
    { label: "Pengaturan", icon: "house.fill", href: "/settings" },
  ];

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
        <DrawerBackdrop />
        <DrawerContent>
          <DrawerHeader className="relative">
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
                    {user?.firstName || user?.id || "Unknown User"}
                  </Text>
                  <Text size="xs" className="text-slate-500 truncate">
                    {role?.name || "No Role"}
                  </Text>
                </VStack>
              </HStack>
            </VStack>
            <Pressable
              onPress={() => {
                setShowDrawer(false);
              }}
              className="fixed top-6 right-6"
            >
              <Icon as={CloseIcon} />
            </Pressable>
          </DrawerHeader>
          <DrawerBody>
            {/* Navigation */}
            <VStack space="sm" className="">
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
                    >
                      <IconSymbol
                        name={item.icon as any}
                        size={20}
                        color={isActive ? "#fff" : "#64748b"}
                      />
                      <Text
                        className={`font-medium ${
                          isActive ? "text-white" : "text-slate-600"
                        }`}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  </Link>
                );
              })}
              {/* Logout */}
              <Pressable
                className="flex-row items-center p-3 rounded-xl gap-3 bg-gray-50"
                onPress={handleLogout}
              >
                <IconSymbol
                  name="rectangle.portrait.and.arrow.right"
                  size={18}
                  className="text-red-500"
                />
                <Text className="text-red-500">Logout</Text>
              </Pressable>
            </VStack>
          </DrawerBody>
          <DrawerFooter className="fixed bottom-0"></DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
