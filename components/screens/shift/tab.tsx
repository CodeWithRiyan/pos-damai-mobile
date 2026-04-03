import Header from '@/components/header';
import { HStack, Pressable, Text, VStack } from '@/components/ui';
import { Badge, BadgeText } from '@/components/ui/badge';
import { useCurrentShift } from '@/hooks/use-shift';
import classNames from 'classnames';
import { useRouter } from 'expo-router';
import { useState } from 'react';

export default function ShiftTabs() {
  const { data: currentShift } = useCurrentShift();
  const router = useRouter();
  const [tabActive, setTabActive] = useState<string>('current');

  return (
    <VStack className="w-full bg-white">
      <Header header="SHIFT" />
      <HStack className="w-full bg-gray-100">
        <Pressable
          className={classNames(
            'flex-1 flex-row gap-4 items-center justify-center py-3',
            tabActive === 'current' && 'border-b-2 border-primary-500 bg-gray-200/50',
          )}
          onPress={() => {
            router.replace('/(main)/shift/(tab)/current');
            setTabActive('current');
          }}
        >
          <Text className="text-sm text-typography-700 font-bold">SAAT INI</Text>
          {currentShift && (
            <Badge size="sm" variant="solid" action="success">
              <BadgeText className="text-xs font-bold">AKTIF</BadgeText>
            </Badge>
          )}
        </Pressable>
        <Pressable
          className={classNames(
            'flex-1 flex-row gap-4 items-center justify-center py-3',
            tabActive === 'history' && 'border-b-2 border-primary-500 bg-gray-200/50',
          )}
          onPress={() => {
            router.replace('/(main)/shift/(tab)/history');
            setTabActive('history');
          }}
        >
          <Text className="text-sm text-typography-700 font-bold">RIWAYAT</Text>
        </Pressable>
      </HStack>
    </VStack>
  );
}
