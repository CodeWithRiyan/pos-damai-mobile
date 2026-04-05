import Header from "@/components/header";
import { Heading, HStack, Pressable, Text, VStack } from "@/components/ui";
import { Box } from "@/components/ui/box";
import { Spinner } from "@/components/ui/spinner";
import dayjs from "dayjs";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";

import { Grid, GridItem } from "@/components/ui/grid";
import SelectModal from "@/components/ui/select/select-modal";
import { formatNumber } from "@/utils/format";
import { ScrollView } from "react-native";

interface ProfitLossReport {
  id: string;
  local_ref_id: string | null;
  saleAmount: number;
  purchaseAmount: number;
  otherIncomeAmount: number;
  otherExpensesAmount: number;
  date: Date;
  transactions: ProfitLossTransactionItems[];
  organizationId: string;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface ProfitLossTransactionItems {
  id: string;
  transactionId: string; // TODO: ini akan digunakan oleh FE untuk redirect ke struk sesuai dengan tipe transaksi.
  date: Date;
  transactionType: "SALE" | "PURCHASE" | "OTHER_INCOME" | "OTHER_EXPENSE";
  amount: number;
}

export const _dummyReports: ProfitLossReport[] = [
  {
    id: "1",
    local_ref_id: "PLR-001",
    saleAmount: 100000,
    purchaseAmount: 18000,
    otherIncomeAmount: 0,
    otherExpensesAmount: 10000,
    date: new Date(),
    transactions: [
      {
        id: "1",
        transactionId: "T-001",
        date: new Date(),
        transactionType: "SALE",
        amount: 100000,
      },
      {
        id: "2",
        transactionId: "T-002",
        date: new Date(),
        transactionType: "PURCHASE",
        amount: 18000,
      },
      {
        id: "3",
        transactionId: "T-003",
        date: new Date(),
        transactionType: "OTHER_EXPENSE",
        amount: 10000,
      },
    ],
    organizationId: "org-123",
    createdBy: null,
    updatedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default function ProfitLossReport() {
  const header = "LAPORAN LABA RUGI";
  const router = useRouter();

  const [dateType, setDateType] = useState<string | null>("TODAY");

  const reports = _dummyReports;
  const isLoading = false;

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

  const {
    totalSaleAmount,
    totalPurchaseAmount,
    totalOtherIncomeAmount,
    totalOtherExpensesAmount,
    totalNetProfit,
  } = useMemo(() => {
    let totalSaleAmount = 0;
    let totalPurchaseAmount = 0;
    let totalOtherIncomeAmount = 0;
    let totalOtherExpensesAmount = 0;

    reports.forEach((report) => {
      totalSaleAmount += report.saleAmount;
      totalPurchaseAmount += report.purchaseAmount;
      totalOtherIncomeAmount += report.otherIncomeAmount;
      totalOtherExpensesAmount += report.otherExpensesAmount;
    });

    const totalNetProfit =
      totalSaleAmount +
      totalOtherIncomeAmount -
      totalPurchaseAmount -
      totalOtherExpensesAmount;

    return {
      totalSaleAmount,
      totalPurchaseAmount,
      totalOtherIncomeAmount,
      totalOtherExpensesAmount,
      totalNetProfit,
    };
  }, [reports]);

  const optionsDates = [
    {
      label: "Hari ini",
      value: "TODAY",
    },
    {
      label: "Kemarin",
      value: "YESTERDAY",
    },
    {
      label: "Minggu ini",
      value: "THIS_WEEK",
    },
    {
      label: "Bulan ini",
      value: "THIS_MONTH",
    },
    {
      label: "Bulan lalu",
      value: "LAST_MONTH",
    },
    {
      label: "Tahun ini",
      value: "THIS_YEAR",
    },
    {
      label: "Tahun lalu",
      value: "LAST_YEAR",
    },
  ];

  return (
    <VStack className="flex-1 bg-white">
      <Header header={header} isGoBack />
      <VStack space="md" className="flex-1 p-4 items-center">
        <SelectModal
          value={dateType || "TODAY"}
          placeholder="Pilih Tanggal"
          options={optionsDates}
          className="w-full"
          showSearch={false}
          onChange={setDateType}
        />
        <ScrollView showsVerticalScrollIndicator={false}>
          <VStack space="lg">
            <Grid
              _extra={{ className: "grid-cols-2" }}
              className="p-4 border border-background-300 rounded-lg"
            >
              <GridItem _extra={{ className: "col-span-1" }}>
                <VStack space="md">
                  <VStack>
                    <Text className="text-sm">Total Pemasukan</Text>
                    <Heading size="xl" className="text-success-500">
                      Rp{" "}
                      {formatNumber(totalSaleAmount + totalOtherIncomeAmount)}
                    </Heading>
                  </VStack>
                  <VStack>
                    <Text className="text-sm">Penjualan</Text>
                    <Heading size="lg" className="text-success-500">
                      Rp {formatNumber(totalSaleAmount)}
                    </Heading>
                  </VStack>
                  <VStack>
                    <Text className="text-sm">Pemasukan Lain</Text>
                    <Heading size="lg" className="text-success-500">
                      Rp {formatNumber(totalOtherIncomeAmount)}
                    </Heading>
                  </VStack>
                </VStack>
              </GridItem>
              <GridItem _extra={{ className: "col-span-1" }}>
                <VStack space="md">
                  <VStack className="items-end">
                    <Text className="text-sm">Total Pengeluaran</Text>
                    <Heading size="xl" className="text-error-500">
                      Rp{" "}
                      {formatNumber(
                        totalPurchaseAmount + totalOtherExpensesAmount,
                      )}
                    </Heading>
                  </VStack>
                  <VStack className="items-end">
                    <Text className="text-sm">Pembelian</Text>
                    <Heading size="lg" className="text-error-500">
                      Rp {formatNumber(totalPurchaseAmount)}
                    </Heading>
                  </VStack>
                  <VStack className="items-end">
                    <Text className="text-sm">Pengeluaran Lain</Text>
                    <Heading size="lg" className="text-error-500">
                      Rp {formatNumber(totalOtherExpensesAmount)}
                    </Heading>
                  </VStack>
                </VStack>
              </GridItem>
            </Grid>
            <VStack className="px-4 py-6 bg-background-50 items-center rounded-lg">
              <Heading size="3xl">Rp {formatNumber(totalNetProfit)}</Heading>
              <Text className="text-sm text-typography-500">Laba Bersih</Text>
            </VStack>
            {!reports.length && (
              <Box className="flex-1 justify-center items-center py-10">
                <Text className="text-gray-500">
                  Belum ada histori transaksi
                </Text>
              </Box>
            )}
            {!!reports.length &&
              reports.map((report) => {
                const date = report.createdAt
                  ? dayjs(report.createdAt)
                  : dayjs();
                return (
                  <Pressable
                    key={report.id}
                    className="flex-row items-center gap-4 py-4 px-10 bg-background-0 active:bg-background-50 border-b border-background-300"
                    onPress={() =>
                      router.navigate({
                        pathname: "/(main)/report/profit-loss/[id]",
                        params: { id: report.id },
                      })
                    }
                  >
                    <HStack space="xl" className="items-center">
                      <VStack>
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
                        <Heading size="md">{`${report.transactions.length} Transaksi`}</Heading>
                      </VStack>
                      <Grid
                        _extra={{ className: "grid-cols-2" }}
                        className="flex-1"
                      >
                        <GridItem _extra={{ className: "col-span-1" }}>
                          <VStack>
                            <Text className="text-typography-400 text-xs">
                              Penjualan
                            </Text>
                            <Text className="font-bold">
                              Rp {formatNumber(report.saleAmount ?? 0)}
                            </Text>
                          </VStack>
                        </GridItem>
                        <GridItem _extra={{ className: "col-span-1" }}>
                          <VStack>
                            <Text className="text-typography-400 text-xs">
                              Pembelian
                            </Text>
                            <Text className="font-bold">
                              Rp {formatNumber(report.purchaseAmount ?? 0)}
                            </Text>
                          </VStack>
                        </GridItem>
                        <GridItem _extra={{ className: "col-span-1" }}>
                          <VStack>
                            <Text className="text-typography-400 text-xs">
                              Pemasukkan Lain
                            </Text>
                            <Text className="font-bold">
                              Rp {formatNumber(report.otherIncomeAmount ?? 0)}
                            </Text>
                          </VStack>
                        </GridItem>
                        <GridItem _extra={{ className: "col-span-1" }}>
                          <VStack>
                            <Text className="text-typography-400 text-xs">
                              Pengeluaran Lain
                            </Text>
                            <Text className="font-bold">
                              Rp {formatNumber(report.otherExpensesAmount ?? 0)}
                            </Text>
                          </VStack>
                        </GridItem>
                      </Grid>
                      <Text className="text-typography-400 text-lg">›</Text>
                    </HStack>
                  </Pressable>
                );
              })}
          </VStack>
        </ScrollView>
      </VStack>
    </VStack>
  );
}
