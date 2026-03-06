import AreaChart from "@/components/area-chart";
import FilterAccordion from "@/components/filter-accordion";
import Header from "@/components/header";
import {
  Heading,
  HStack,
  Input,
  InputField,
  InputIcon,
  InputSlot,
  Pressable,
  Radio,
  RadioGroup,
  RadioLabel,
  SearchIcon,
  Text,
  VStack,
} from "@/components/ui";
import { Box } from "@/components/ui/box";
import { Grid, GridItem } from "@/components/ui/grid";
import { Spinner } from "@/components/ui/spinner";
import { useTransactions } from "@/lib/api/transactions";
import { formatDisplayRefId } from "@/lib/utils/reference";
import classNames from "classnames";
import dayjs from "dayjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView } from "react-native";
import TransactionFilter, {
  TransactionFilterFormValues,
  transactionFilterInitialValues,
} from "./filter";

// TODO: buat tabel "chart-category" untuk mengelola tabulasi chart di setiap module
interface ChartCategory {
  name: string;
  code: string;
  type: string;
  module: string;
}

const dummyChartCategoryData: ChartCategory[] = [
  {
    name: "Total Transaksi",
    code: "totalTransaction",
    type: "fixed",
    module: "sales-report",
  },
  {
    name: "Pendapatan",
    code: "gmv",
    type: "currency",
    module: "sales-report",
  },
  {
    name: "Keuntungan",
    code: "profit",
    type: "currency",
    module: "sales-report",
  },
];

// TODO: Ganti dengan data real
interface TransactionChart {
  date: string;
  totalTransaction: number;
  gmv: number;
  profit: number;
}

// TODO: gunakan hook untuk mendapatkan data chart
// jangan lupa terapkan transactionFilter juga kedalam hook chart
const monthlyChartData: TransactionChart[] = [
  // Minggu 1: Puncak Gajian
  {
    date: "2025-11-01T00:00:00.000Z",
    totalTransaction: 65,
    gmv: 3500000,
    profit: 420000,
  },
  {
    date: "2025-11-02T00:00:00.000Z",
    totalTransaction: 70,
    gmv: 4100000,
    profit: 492000,
  },
  {
    date: "2025-11-03T00:00:00.000Z",
    totalTransaction: 55,
    gmv: 2800000,
    profit: 336000,
  },
  {
    date: "2025-11-04T00:00:00.000Z",
    totalTransaction: 48,
    gmv: 2400000,
    profit: 288000,
  },
  {
    date: "2025-11-05T00:00:00.000Z",
    totalTransaction: 50,
    gmv: 2550000,
    profit: 306000,
  },
  {
    date: "2025-11-06T00:00:00.000Z",
    totalTransaction: 45,
    gmv: 2300000,
    profit: 276000,
  },
  {
    date: "2025-11-07T00:00:00.000Z",
    totalTransaction: 52,
    gmv: 2700000,
    profit: 324000,
  },

  // Minggu 2: Stabil
  {
    date: "2025-11-08T00:00:00.000Z",
    totalTransaction: 58,
    gmv: 3100000,
    profit: 372000,
  },
  {
    date: "2025-11-09T00:00:00.000Z",
    totalTransaction: 54,
    gmv: 2900000,
    profit: 348000,
  },
  {
    date: "2025-11-10T00:00:00.000Z",
    totalTransaction: 30,
    gmv: 1500000,
    profit: 180000,
  },
  {
    date: "2025-11-11T00:00:00.000Z",
    totalTransaction: 28,
    gmv: 1400000,
    profit: 168000,
  },
  {
    date: "2025-11-12T00:00:00.000Z",
    totalTransaction: 32,
    gmv: 1650000,
    profit: 198000,
  },
  {
    date: "2025-11-13T00:00:00.000Z",
    totalTransaction: 31,
    gmv: 1550000,
    profit: 186000,
  },
  {
    date: "2025-11-14T00:00:00.000Z",
    totalTransaction: 38,
    gmv: 1900000,
    profit: 228000,
  },

  // Minggu 3: Pertengahan Bulan
  {
    date: "2025-11-15T00:00:00.000Z",
    totalTransaction: 50,
    gmv: 2600000,
    profit: 312000,
  },
  {
    date: "2025-11-16T00:00:00.000Z",
    totalTransaction: 48,
    gmv: 2450000,
    profit: 294000,
  },
  {
    date: "2025-11-17T00:00:00.000Z",
    totalTransaction: 25,
    gmv: 1200000,
    profit: 144000,
  },
  {
    date: "2025-11-18T00:00:00.000Z",
    totalTransaction: 24,
    gmv: 1150000,
    profit: 138000,
  },
  {
    date: "2025-11-19T00:00:00.000Z",
    totalTransaction: 27,
    gmv: 1300000,
    profit: 156000,
  },
  {
    date: "2025-11-20T00:00:00.000Z",
    totalTransaction: 26,
    gmv: 1250000,
    profit: 150000,
  },
  {
    date: "2025-11-21T00:00:00.000Z",
    totalTransaction: 30,
    gmv: 1500000,
    profit: 180000,
  },

  // Minggu 4: Tanggal Tua
  {
    date: "2025-11-22T00:00:00.000Z",
    totalTransaction: 42,
    gmv: 2100000,
    profit: 252000,
  },
  {
    date: "2025-11-23T00:00:00.000Z",
    totalTransaction: 40,
    gmv: 2000000,
    profit: 240000,
  },
  {
    date: "2025-11-24T00:00:00.000Z",
    totalTransaction: 20,
    gmv: 950000,
    profit: 114000,
  },
  {
    date: "2025-11-25T00:00:00.000Z",
    totalTransaction: 18,
    gmv: 850000,
    profit: 102000,
  },
  {
    date: "2025-11-26T00:00:00.000Z",
    totalTransaction: 22,
    gmv: 1000000,
    profit: 120000,
  },
  {
    date: "2025-11-27T00:00:00.000Z",
    totalTransaction: 21,
    gmv: 980000,
    profit: 117600,
  },
  {
    date: "2025-11-28T00:00:00.000Z",
    totalTransaction: 25,
    gmv: 1200000,
    profit: 144000,
  },
  {
    date: "2025-11-29T00:00:00.000Z",
    totalTransaction: 45,
    gmv: 2300000,
    profit: 276000,
  },
  {
    date: "2025-11-30T00:00:00.000Z",
    totalTransaction: 48,
    gmv: 2500000,
    profit: 300000,
  },
];

export default function TransactionHistory({
  isReport,
  showSearch = true,
}: {
  isReport?: boolean;
  showSearch?: boolean;
}) {
  const { customerId } = useLocalSearchParams<{ customerId: string }>();
  const header =
    isReport && !customerId ? "LAPORAN PENJUALAN" : "RIWAYAT TRANSAKSI";
  const router = useRouter();

  const [transactionFilter, setTransactionFilter] =
    useState<TransactionFilterFormValues>(transactionFilterInitialValues);
  const [chartCategory, setChartCategory] = useState("totalTransaction");
  const { data: allTransactions, isLoading } = useTransactions({
    ...transactionFilter, // TODO: tambahkan property yang ada di transactionFilter ke dalam argument useTransactions
    customerId,
  });
  const [searchQuery, setSearchQuery] = useState("");

  const chartCategoryOptions = dummyChartCategoryData.map((item) => ({
    ...item,
    value: (monthlyChartData as { [key: string]: any }[]).reduce(
      (a, b) => a + b[item.code],
      0,
    ),
  }));

  const chartData = monthlyChartData.map((d) => ({
    value:
      chartCategory === "totalTransaction"
        ? d.totalTransaction
        : chartCategory === "GMV"
          ? d.gmv
          : d.profit,
    label: dayjs(d.date).format("DD"),
    pointerLabel: dayjs(d.date).format("DD MMM YYYY"),
    pointerValue:
      chartCategory === "totalTransaction"
        ? d.totalTransaction.toLocaleString("id-ID")
        : chartCategory === "GMV"
          ? `Rp ${d.gmv.toLocaleString("id-ID")}`
          : `Rp ${d.profit.toLocaleString("id-ID")}`,
  }));

  const transactions =
    allTransactions?.filter(
      (t) =>
        t.status === "COMPLETED" &&
        ((formatDisplayRefId(t.local_ref_id) || t.id)
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
          t.customerName?.toLowerCase().includes(searchQuery.toLowerCase())),
    ) || [];

  if (isLoading) {
    return (
      <VStack className="flex-1 bg-white">
        <Header header={header} isGoBack />
        <Box className="flex-1 justify-center items-center">
          <Spinner size="large" />
        </Box>
      </VStack>
    );
  }

  return (
    <VStack className="flex-1 bg-white">
      <Header header={header} isGoBack />
      <VStack space="md" className="p-4 shadow-lg bg-background-0 items-center">
        {showSearch && (
          <Input className="w-full border border-background-300 rounded-lg h-10">
            <InputSlot className="pl-3">
              <InputIcon as={SearchIcon} />
            </InputSlot>
            <InputField
              placeholder={`Cari no transaksi${!customerId ? " atau nama pelanggan" : ""}`}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </Input>
        )}
        <FilterAccordion title="Filter Laporan Penjualan">
          <TransactionFilter onFilter={setTransactionFilter} />
        </FilterAccordion>
      </VStack>
      <Grid _extra={{ className: "grid-cols-2" }} className="flex-1">
        {isReport && (
          <GridItem _extra={{ className: "col-span-1" }}>
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              <VStack space="md" className="p-4">
                <RadioGroup
                  value={chartCategory}
                  onChange={setChartCategory}
                  className="w-full flex-row gap-2"
                >
                  {chartCategoryOptions.map((o) => (
                    <Radio
                      key={o.code}
                      value={o.code}
                      size="md"
                      isInvalid={false}
                      isDisabled={false}
                      className={classNames(
                        "flex-1 py-2 border rounded-md flex items-center justify-center bg-primary-500",
                        chartCategory === o.code &&
                          "bg-primary-500/80 border-primary-500/80 text-white",
                      )}
                    >
                      <RadioLabel>
                        <VStack className="items-center">
                          <Text className="text-sm text-white">{o.name}</Text>
                          <Text className="text-sm text-white">{`${o.type === "currency" ? "Rp " : ""}${o.value.toLocaleString("id-ID")}`}</Text>
                        </VStack>
                      </RadioLabel>
                    </Radio>
                  ))}
                </RadioGroup>
                <AreaChart data={chartData} />
              </VStack>
            </ScrollView>
          </GridItem>
        )}
        <GridItem
          _extra={{ className: isReport ? "col-span-1" : "col-span-2" }}
        >
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {!transactions || transactions.length === 0 ? (
              <Box className="flex-1 justify-center items-center py-10">
                <Text className="text-gray-500">
                  Belum ada histori transaksi
                </Text>
              </Box>
            ) : (
              transactions.map((transaction) => {
                const date = transaction.createdAt
                  ? dayjs(transaction.createdAt)
                  : dayjs();
                return (
                  <Pressable
                    key={transaction.id}
                    className="flex-row items-center gap-4 py-4 px-10 bg-background-0 active:bg-background-50 border-b border-background-300"
                    onPress={() =>
                      router.navigate({
                        pathname: "/(main)/transaction/receipt/[id]",
                        params: { id: transaction.id },
                      })
                    }
                  >
                    <HStack space="xl" className="items-center">
                      <VStack>
                        <Text className="text-typography-500 font-bold">
                          {date.format("HH:mm:ss")}
                        </Text>
                        <HStack space="sm" className="items-center">
                          <Heading size="4xl">{date.format("DD")}</Heading>
                          <VStack>
                            <Text className="text-typography-500 font-bold">
                              {date.format("MMM")}
                            </Text>
                            <Text className="text-typography-500 font-bold">
                              {date.format("YYYY")}
                            </Text>
                          </VStack>
                        </HStack>
                      </VStack>
                      <VStack space="sm" className="flex-1">
                        <HStack className="justify-between">
                          <VStack>
                            <Text className="text-typography-400 text-xs">
                              Total
                            </Text>
                            <Text className="font-bold">
                              Rp{" "}
                              {transaction.totalAmount.toLocaleString("id-ID")}
                            </Text>
                          </VStack>
                          <VStack>
                            <Text className="text-typography-400 text-xs">
                              Pelanggan
                            </Text>
                            <Text className="font-bold">
                              {transaction.customerName}
                            </Text>
                          </VStack>
                          <VStack>
                            <Text className="text-typography-400 text-xs">
                              Pembayaran
                            </Text>
                            <Text className="font-bold">
                              {transaction.paymentTypeName}
                            </Text>
                          </VStack>
                        </HStack>
                        <HStack className="justify-between">
                          <Text className="text-typography-400 font-bold">
                            No:{" "}
                            {formatDisplayRefId(transaction.local_ref_id) ||
                              transaction.id}
                          </Text>
                        </HStack>
                      </VStack>
                      <Text className="text-typography-400 text-lg">›</Text>
                    </HStack>
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </GridItem>
      </Grid>
    </VStack>
  );
}
