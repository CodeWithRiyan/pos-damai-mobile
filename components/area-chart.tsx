import dayjs from "dayjs";
import { useState } from "react";
import { LineChart, lineDataItem } from "react-native-gifted-charts";
import { Box, HStack, Text, VStack } from "./ui";

export default function AreaChart({
  data,
  spacing,
}: {
  data: lineDataItem[];
  spacing?: number;
}) {
  const [containerWidth, setContainerWidth] = useState(0);
  const customDataPoint = () => {
    return <Box className="w-2 h-2 rounded-full bg-primary-500" />;
  };
  const customLabel = (val: string) => {
    return (
      <Box className="ml-3">
        <Text className="text-typography-800">{val}</Text>
      </Box>
    );
  };

  const chartData = [
    {
      value: 100,
      label: "2025-11-24",
      labelComponent: () => customLabel(dayjs("2025-11-24").format("DD")),
      customDataPoint: customDataPoint,
    },
    {
      value: 140,
      label: "2025-11-25",
      labelComponent: () => customLabel(dayjs("2025-11-25").format("DD")),
      customDataPoint: customDataPoint,
    },
    {
      value: 250,
      label: "2025-11-26",
      labelComponent: () => customLabel(dayjs("2025-11-26").format("DD")),
      customDataPoint: customDataPoint,
    },
    {
      value: 290,
      label: "2025-11-27",
      labelComponent: () => customLabel(dayjs("2025-11-27").format("DD")),
      customDataPoint: customDataPoint,
    },
    {
      value: 410,
      label: "2025-11-28",
      labelComponent: () => customLabel(dayjs("2025-11-28").format("DD")),
      customDataPoint: customDataPoint,
    },
    {
      value: 440,
      label: "2025-11-29",
      labelComponent: () => customLabel(dayjs("2025-11-29").format("DD")),
      customDataPoint: customDataPoint,
    },
    {
      value: 300,
      label: "2025-11-30",
      labelComponent: () => customLabel(dayjs("2025-11-30").format("DD")),
      customDataPoint: customDataPoint,
    },
    {
      value: 180,
      label: "2025-12-01",
      labelComponent: () => customLabel(dayjs("2025-12-01").format("DD")),
      customDataPoint: customDataPoint,
    },
    {
      value: 150,
      label: "2025-12-02",
      labelComponent: () => customLabel(dayjs("2025-12-02").format("DD")),
      customDataPoint: customDataPoint,
    },
    {
      value: 150,
      label: "2025-12-03",
      labelComponent: () => customLabel(dayjs("2025-12-03").format("DD")),
      customDataPoint: customDataPoint,
    },
    {
      value: 190,
      label: "2025-12-04",
      labelComponent: () => customLabel(dayjs("2025-12-04").format("DD")),
      customDataPoint: customDataPoint,
    },
  ];
  const dataWithIndex = data.map((item, index) => ({
    ...item,
    customDataPoint: customDataPoint,
    index,
  }));

  const dynamicSpacing = (containerWidth - 100) / (data.length - 1);

  return (
    <Box
      className="flex-1 px-2 bg-white"
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      <LineChart
        thickness={2}
        color="#3d2117"
        noOfSections={6}
        areaChart
        yAxisLabelWidth={60}
        yAxisTextStyle={{
          color: "#1f2937",
          fontSize: 10,
        }}
        formatYLabel={(label) => {
          const val = Number(label);
          if (val >= 1000000) {
            return (val / 1000000).toFixed(val % 1000000 === 0 ? 0 : 1) + "JT";
          }
          if (val >= 1000) {
            return (val / 1000).toFixed(0) + "RB";
          }
          return val.toString();
        }}
        data={dataWithIndex}
        startFillColor={"#3d2117"}
        endFillColor={"#3d2117"}
        startOpacity={1}
        endOpacity={0.5}
        animateOnDataChange
        backgroundColor="#ffffff"
        rulesColor="#e2e2e2"
        rulesType="solid"
        spacing={dataWithIndex.length > 10 ? spacing || 40 : dynamicSpacing}
        initialSpacing={10}
        endSpacing={0}
        yAxisColor="lightgray"
        xAxisColor="lightgray"
        dataPointsHeight={8}
        dataPointsWidth={8}
        pointerConfig={{
          activatePointersOnLongPress: true,
          pointerColor: "blue",
          pointerLabelComponent: (items: any) => {
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
                  <Text className="text-xs text-white">
                    {item.pointerLabel}
                  </Text>
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
    </Box>
  );
}
