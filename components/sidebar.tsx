import { useAuthStore } from '@/stores/auth';
import { Box } from '@/components/ui/box';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import useBreakpoint from '@/hooks/use-breakpoint';
import { useLogout } from '@/hooks/use-auth';
import { useSidebarStore } from '@/stores/sidebar';
import { Link, LinkProps, usePathname, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { usePermission } from '@/hooks/use-permission';
import { CloseIcon, Icon } from './ui';
import {
  Drawer,
  DrawerBackdrop,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
} from './ui/drawer';
import { Pressable } from './ui/pressable';
import { SolarIconBoldDuotone, SolarIconBoldDuotoneProps } from './ui/solar-icon-wrapper';

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { profile } = useAuthStore(); // Assuming useAuthStore is where profile is
  const role = profile?.roles?.[0];
  const { mutate: logout } = useLogout();
  const { showDrawer, setShowDrawer } = useSidebarStore((state) => state);
  const { sm } = useBreakpoint();
  const { hasPermission, hasAnyPermission } = usePermission();

  const handleLogout = () => {
    logout(undefined, {
      onSuccess: () => {
        router.replace('/login');
        setShowDrawer(false);
      },
    });
  };

  const menuItems = useMemo(() => {
    const items: {
      label: string;
      icon: SolarIconBoldDuotoneProps['name'];
      href: LinkProps['href'];
      requiredPermission?: string | string[];
    }[] = [
      { label: 'Dashboard', icon: 'Widget5', href: '/' },
      {
        label: 'Manajemen',
        icon: 'Database',
        href: '/management',
        requiredPermission: [
          'products:read',
          'products:categories-read',
          'products:brands-read',
          'customers:read',
          'suppliers:read',
          'roles:read',
          'users:read',
          'payables:read',
          'receivables:read',
          'stock:inventory-read',
          'stock:opname-read',
          'returns:read-customer',
          'returns:read-supplier',
          'payment-types:read',
          'discounts:read',
        ],
      },
      {
        label: 'Pembelian Barang',
        icon: 'Cart3',
        href: '/purchasing',
        requiredPermission: 'purchases:read',
      },
      {
        label: 'Transaksi Penjualan',
        icon: 'Plain',
        href: '/transaction',
        requiredPermission: 'transactions:read',
      },
      {
        label: 'Keuangan',
        icon: 'WalletMoney',
        href: '/finance',
        requiredPermission: 'finances:read',
      },
      {
        label: 'Shift',
        icon: 'WatchSquareMinimalistic',
        href: '/shift/current',
        requiredPermission: 'shifts:read',
      },
      {
        label: 'Laporan',
        icon: 'PieChart2',
        href: '/report',
        requiredPermission: 'reports:read',
      },
      { label: 'Pengaturan', icon: 'Settings', href: '/setting', requiredPermission: 'settings:read' },
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
    <>
      <Drawer
        isOpen={showDrawer}
        size={sm ? 'md' : 'full'}
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
                    {profile?.name || profile?.id || 'Unknown User'}
                  </Text>
                  <Text size="xs" className="text-slate-500 truncate">
                    {role?.name || 'No Role'}
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
                  (item.href !== '/' && pathname.startsWith(item.href as string));

                return (
                  <Link href={item.href} key={item.label} asChild>
                    <Pressable
                      className={`flex-row items-center p-3 rounded-xl gap-3 ${
                        isActive ? 'bg-brand-primary' : 'active:bg-slate-200'
                      }`}
                      onPress={() => {
                        setShowDrawer(false);
                      }}
                    >
                      <SolarIconBoldDuotone
                        name={item.icon}
                        size={20}
                        color={isActive ? '#FDFBF9' : '#64748b'}
                      />

                      <Text
                        className={`font-medium ${
                          isActive ? 'text-brand-primary-forground' : 'text-slate-500'
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
          <DrawerFooter className="gap-2">
            {/* Logout */}
            <Pressable
              className="flex-row items-center p-3 rounded-xl gap-3 bg-gray-50 flex-1"
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
