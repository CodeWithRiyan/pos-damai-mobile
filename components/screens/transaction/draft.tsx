import Header from "@/components/header";
import {
  Box,
  Heading,
  HStack,
  Icon,
  Pressable,
  Spinner,
  Text,
  VStack,
} from "@/components/ui";
import type { Transaction } from "@/lib/api/transactions";
import { useTransactions } from "@/lib/api/transactions";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { useTransactionStore } from "@/stores/transaction";
import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { eq, like, and } from "drizzle-orm";
import { useRouter } from "expo-router";
import { Trash2 } from "lucide-react-native";
import { ScrollView } from "react-native";

export default function TransactionDraft() {
  const router = useRouter();
  const { data: transactions, isLoading } = useTransactions();
  const { addCartItem, resetCart, setStatus, setPurchaseId } =
    useTransactionStore();
  const queryClient = useQueryClient();

  // Filter only DRAFT status
  const drafts = transactions?.filter((t) => t.status === "DRAFT") || [];

  const handleContinueDraft = async (transactionId: string) => {
    // We need to fetch the full detail of the transaction to get items
    const detail = await queryClient.fetchQuery<Transaction | undefined>({
      queryKey: ["transactions", transactionId],
      queryFn: async () => {
        return queryClient.ensureQueryData<Transaction | undefined>({
          queryKey: ["transactions", transactionId],
        });
      },
    });

    if (detail && detail.items) {
      resetCart();
      for (const item of detail.items) {
        // Fetch full product data to ensure all required fields (stock, etc) are present
        const productResult = await db
          .select()
          .from(schema.products)
          .where(eq(schema.products.id, item.productId))
          .limit(1);

        if (productResult.length > 0) {
          const fullProduct = productResult[0];
          // Get prices for this product
          const prices = await db
            .select()
            .from(schema.productPrices)
            .where(eq(schema.productPrices.productId, fullProduct.id));
          
          addCartItem({
            product: {
              ...fullProduct,
              sellPrices: prices,
              variants: [],
              code: fullProduct.barcode,
            } as any,
            tempSellPrice:
              item.sellPrice || prices?.[0]?.price || 0,
            quantity: item.quantity,
          });
        }
      }
      setStatus("DRAFT");
      setPurchaseId(detail.id);
      router.replace("/(main)/transaction");
    }
  };

  const handleDeleteDraft = async (transactionId: string) => {
    await db.transaction(async (tx) => {
      // 1. Get local_ref_id to cleanup transactions
      const existing = await tx
        .select()
        .from(schema.transactions)
        .where(eq(schema.transactions.id, transactionId))
        .limit(1);

      if (existing.length > 0) {
        const refId = existing[0].local_ref_id;
        // 2. Delete transactions efficiently
        if (refId) {
          await tx
            .delete(schema.inventoryTransactions)
            .where(
              and(
                eq(schema.inventoryTransactions.organizationId, existing[0].organizationId),
                like(schema.inventoryTransactions.local_ref_id, `${refId}_%`)
              )
            );
        }
      }

      // 3. Delete transaction
      await tx
        .delete(schema.transactions)
        .where(eq(schema.transactions.id, transactionId));
    });

    queryClient.invalidateQueries({ queryKey: ["transactions"] });
  };

  if (isLoading) {
    return (
      <VStack className="flex-1 bg-white">
        <Header header="DRAFT TRANSAKSI" isGoBack />
        <Box className="flex-1 justify-center items-center">
          <Spinner size="large" />
        </Box>
      </VStack>
    );
  }

  return (
    <VStack className="flex-1 bg-white">
      <Header header="DRAFT TRANSAKSI" isGoBack />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {drafts.length === 0 ? (
          <Box className="flex-1 justify-center items-center py-10">
            <Text className="text-gray-500">Tidak ada draft transaksi</Text>
          </Box>
        ) : (
          drafts.map((draft) => {
            const date = draft.createdAt ? dayjs(draft.createdAt) : dayjs();
            return (
              <Box
                key={draft.id}
                className="flex-row items-center gap-4 py-4 px-10 bg-background-0 border-b border-background-300"
              >
                <Pressable
                  className="flex-1 flex-row items-center gap-4"
                  onPress={() => handleContinueDraft(draft.id)}
                >
                  <HStack space="xl" className="items-center flex-1">
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
                            Estimasi Total
                          </Text>
                          <Text className="font-bold">
                            Rp {draft.totalAmount.toLocaleString("id-ID")}
                          </Text>
                        </VStack>
                        <VStack>
                          <Text className="text-typography-400 text-xs">
                            Pelanggan
                          </Text>
                          <Text className="font-bold">
                            {draft.customerName}
                          </Text>
                        </VStack>
                      </HStack>
                      <HStack className="justify-between">
                        <Text className="text-typography-400 font-bold">
                          Ref: {draft.local_ref_id || draft.id}
                        </Text>
                      </HStack>
                    </VStack>
                    <Text className="text-typography-400 text-lg">›</Text>
                  </HStack>
                </Pressable>
                <Pressable
                  className="p-2 rounded-full bg-red-100 active:bg-red-200 ml-2"
                  onPress={() => handleDeleteDraft(draft.id)}
                >
                  <Icon as={Trash2} size="md" color="#ef4444" />
                </Pressable>
              </Box>
            );
          })
        )}
      </ScrollView>
    </VStack>
  );
}
