import { useState } from 'react';
import { BarChart as GiftedBarChart, barDataItem } from 'react-native-gifted-charts';
import { Box, HStack, Text, VStack } from './ui';

export default function BarChart({ data, spacing }: { data: barDataItem[]; spacing?: number }) {
  const [containerWidth, setContainerWidth] = useState(0);
  const customDataPoint = () => {
    return <Box className="w-2 h-2 rounded-full bg-primary-500" />;
  };

  const dataWithIndex = data.map((item, index) => ({
    ...item,
    customDataPoint: customDataPoint,
    index,
  }));

  if (!data || data.length === 0) {
    return (
      <Box className="flex-1 px-2 bg-white justify-center items-center py-20 min-h-[200px]">
        <Text className="text-typography-500">Belum ada data grafik</Text>
      </Box>
    );
  }

  const dynamicSpacing =
    data.length > 1 ? Math.max(0, (containerWidth - 100) / (data.length - 1)) : 0;

  const maxValue = Math.max(...data.map((d) => Number(d.value) || 0));
  const useMillions = maxValue >= 1000000;
  const useThousands = maxValue >= 1000;

  return (
    <Box
      className="flex-1 px-2 bg-white min-h-[200px]"
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width || 0)}
    >
      {(containerWidth || 0) > 0 && (
        <GiftedBarChart
          color="#3d2117"
          noOfSections={6}
          yAxisLabelWidth={60}
          yAxisTextStyle={{
            color: '#1f2937',
            fontSize: 10,
          }}
          formatYLabel={(label) => {
            const val = Number(label);
            if (useMillions) {
              return (val / 1000000).toFixed(1).replace(/\.0$/, '') + 'JT';
            }
            if (useThousands) {
              return (val / 1000).toFixed(0) + 'RB';
            }
            return val.toString();
          }}
          data={dataWithIndex}
          isAnimated
          backgroundColor="#ffffff"
          rulesColor="#e2e2e2"
          rulesType="solid"
          spacing={dataWithIndex.length > 10 ? spacing || 40 : dynamicSpacing}
          initialSpacing={10}
          endSpacing={0}
          yAxisColor="lightgray"
          xAxisColor="lightgray"
          pointerConfig={{
            activatePointersOnLongPress: true,
            pointerColor: 'blue',
            pointerLabelComponent: (
              items: {
                index: number;
                value: number;
                pointerLabel: string;
                pointerValue: string;
              }[],
            ) => {
              const item = items[0];
              const isFirst = item.index === 0;
              const isSecond = item.index === 1;
              const isLast = item.index === data.length - 1;

              let translateX = -44;
              if (isFirst) translateX = 8;
              if (isSecond) translateX = -32;
              if (isLast) translateX = -84;

              return (
                <VStack
                  style={{ transform: [{ translateX }] }}
                  className="w-32 rounded-lg bg-white border border-primary-500 overflow-hidden"
                >
                  <HStack className="justify-center items-center w-full h-6 bg-primary-500">
                    <Text className="text-xs text-white">{item.pointerLabel}</Text>
                  </HStack>
                  <HStack className="justify-center items-center w-full h-6">
                    <Text className="text-xs text-typography-800 font-bold">
                      {item.pointerValue}
                    </Text>
                  </HStack>
                </VStack>
              );
            },
          }}
        />
      )}
    </Box>
  );
}
