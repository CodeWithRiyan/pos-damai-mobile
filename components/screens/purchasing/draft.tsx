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
import { usePurchases, fetchPurchase } from "@/lib/api/purchasing";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { usePurchasingStore } from "@/stores/purchasing";
import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { eq } from "drizzle-orm";
import { useRouter } from "expo-router";
import { Trash2 } from "lucide-react-native";
import { ScrollView } from "react-native";

export default function PurchasingDraft() {
  const router = useRouter();
  const { data: purchases, isLoading } = usePurchases();
  const { addCartItem, resetCart, setStatus, setPurchaseId } =
    usePurchasingStore();
  const queryClient = useQueryClient();

  // Filter only DRAFT status
  const drafts = purchases?.filter((p) => p.status === "DRAFT") || [];

  const handleContinueDraft = async (purchaseId: string) => {
    // We need to fetch the full detail of the purchase to get items
    const detail = await fetchPurchase(purchaseId);

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
          addCartItem({
            product: productResult[0] as any,
            newPurchasePrice:
              item.purchasePrice || productResult[0].purchasePrice || 0,
            quantity: item.quantity,
          });
        }
      }
      setStatus("DRAFT");
      setPurchaseId(detail.id);
      router.replace("/(main)/purchasing");
    }
  };

  const handleDeleteDraft = async (purchaseId: string) => {
    await db.transaction(async (tx) => {
      // 1. Get local_ref_id to cleanup transactions
      const existing = await tx
        .select()
        .from(schema.purchases)
        .where(eq(schema.purchases.id, purchaseId))
        .limit(1);

      if (existing.length > 0) {
        const refId = existing[0].local_ref_id;
        // 2. Delete transactions
        if (refId) {
          const transactions = await tx
            .select()
            .from(schema.inventoryTransactions)
            .where(
              eq(
                schema.inventoryTransactions.organizationId,
                existing[0].organizationId,
              ),
            );

          const filtered = transactions.filter((t) =>
            t.local_ref_id?.startsWith(refId),
          );
          for (const t of filtered) {
            await tx
              .delete(schema.inventoryTransactions)
              .where(eq(schema.inventoryTransactions.id, t.id));
          }
        }
      }

      // 3. Delete purchase
      await tx
        .delete(schema.purchases)
        .where(eq(schema.purchases.id, purchaseId));
    });

    queryClient.invalidateQueries({ queryKey: ["purchases"] });
  };

  if (isLoading) {
    return (
      <VStack className="flex-1 bg-white">
        <Header header="DRAFT PEMBELIAN" isGoBack />
        <Box className="flex-1 justify-center items-center">
          <Spinner size="large" />
        </Box>
      </VStack>
    );
  }

  return (
    <VStack className="flex-1 bg-white">
      <Header header="DRAFT PEMBELIAN" isGoBack />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {drafts.length === 0 ? (
          <Box className="flex-1 justify-center items-center py-10">
            <Text className="text-gray-500">Tidak ada draft pembelian</Text>
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
                            Supplier
                          </Text>
                          <Text className="font-bold">
                            {draft.supplierName}
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
