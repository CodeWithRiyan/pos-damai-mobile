import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useCurrentUser, useLogout } from '@/lib/api/auth';
import { Link, usePathname, useRouter } from 'expo-router';
import React from 'react';
import { Pressable } from 'react-native';

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user } = useCurrentUser();
  const role = user?.roles?.[0];
  const { mutate: logout } = useLogout();

  const handleLogout = () => {
    logout(undefined, {
      onSuccess: () => {
        router.replace('/login');
      },
    });
  };

  const menuItems = [
    { label: 'Dashboard', icon: 'house.fill', href: '/' },
    { label: 'Roles', icon: 'person.2.fill', href: '/roles' },
    { label: 'Users', icon: 'person.3.fill', href: '/users' },
  ];

  return (
    <Box className="w-64 h-full bg-brand-accent border-r border-slate-200 p-4">
      <VStack space="xl" className="h-full">
        {/* Profile Section */}
        <VStack space="xs" className="mb-4">
          <Heading size="md" className="text-brand-primary truncate">{user?.selectedOrganization?.name || 'POS DAMAI'}</Heading>
          <Box className="bg-brand-secondary/20 px-2 py-0.5 rounded self-start">
            <Text size="xs" className="text-brand-primary font-bold uppercase tracking-wider">
              {role?.name || 'No Role'}
            </Text>
          </Box>
        </VStack>

        <Box className="h-px bg-slate-200" />

        {/* User Info */}
        <HStack space="md" className="items-center py-2">
           <Box className="w-10 h-10 rounded-full bg-slate-200 items-center justify-center">
             <IconSymbol name="person.fill" size={20} color="#64748b" />
           </Box>
           <VStack>
             <Text size="sm" className="font-bold truncate">{user?.firstName || user?.id || 'Unknown User'}</Text>
             <Text size="xs" className="text-slate-500 truncate">{user?.email || 'No email'}</Text>
           </VStack>
        </HStack>

        <Box className="h-px bg-slate-200" />

        {/* Navigation */}
        <VStack space="sm" className="flex-1 mt-4">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link href={item.href as any} key={item.href} asChild>
                <Pressable
                  className={`flex-row items-center p-3 rounded-xl gap-3 ${
                    isActive ? 'bg-brand-primary' : 'active:bg-slate-200'
                  }`}
                >
                  <IconSymbol 
                    name={item.icon as any} 
                    size={20} 
                    color={isActive ? '#fff' : '#64748b'} 
                  />
                  <Text className={`font-medium ${isActive ? 'text-white' : 'text-slate-600'}`}>
                    {item.label}
                  </Text>
                </Pressable>
              </Link>
            );
          })}
        </VStack>

        {/* Logout */}
        <Button 
          variant="outline" 
          action="negative" 
          className="mt-auto border-none" 
          onPress={handleLogout}
        >
          <IconSymbol name="rectangle.portrait.and.arrow.right" size={18} color="#ef4444" />
          <ButtonText className="text-red-500">Logout</ButtonText>
        </Button>
      </VStack>
    </Box>
  );
}
