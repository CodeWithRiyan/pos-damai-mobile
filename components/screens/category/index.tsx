import { useActionDrawer } from "@/components/action-drawer";
import Header from "@/components/header";
import { useBulkDeleteEntity } from "@/hooks/use-bulk-delete-entity";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { SolarIconBold } from "@/components/ui/solar-icon-wrapper";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { Toast, ToastTitle, useToast } from "@/components/ui/toast";
import { VStack } from "@/components/ui/vstack";
import {
  Category,
  useBulkDeleteCategory,
  useCapitalValueByCategory,
  useCategories,
  useCreateCategory,
  useProductCountsByCategory,
} from "@/lib/api/categories";
import { getErrorMessage } from "@/lib/api/client";
import { bulkDeleteConfirm } from "@/lib/utils/delete-confirm";
import { exportCategories, importCategories } from "@/lib/utils/excel";
import { showErrorToast } from "@/lib/utils/toast";
import { useCategoryStore } from "@/stores/category";
import { useItemSelection } from "@/hooks/use-item-selection";
import { useRouter } from "expo-router";
import { SearchIcon } from "lucide-react-native";
import React from "react";
import { FlatList } from "react-native";

export default function CategoryList() {
  const { setOpen, setData } = useCategoryStore();
  const { showActionDrawer, hideActionDrawer } = useActionDrawer();
  const router = useRouter();
  const { data, isLoading, refetch } = useCategories();
  const { data: productCounts, refetch: refetchCounts } =
    useProductCountsByCategory();
  const { data: capitalValues } = useCapitalValueByCategory();
  const { selectedItems, handleItemPress, clearSelection, isSelected, hasSelection } = useItemSelection<Category>();

  const categories = data || [];

  const deleteMutation = useBulkDeleteCategory();
  const { triggerBulkDelete, isBulkDeleting } = useBulkDeleteEntity({
    successMessage: "Kategori berhasil dihapus",
    deleteMutation,
    onSuccess: () => refetch(),
    clearSelection,
  });
  const createMutation = useCreateCategory();
  const toast = useToast();

  const handleExport = async () => {
    hideActionDrawer();
    try {
      await exportCategories(categories);
    } catch (e) {
      toast.show({
        placement: "top",
        render: ({ id }) => (
          <Toast nativeID={`toast-${id}`} action="error" variant="solid">
            <ToastTitle>{getErrorMessage(e)}</ToastTitle>
          </Toast>
        ),
      });
    }
  };

  const handleImport = async () => {
    hideActionDrawer();
    try {
      const dtos = await importCategories();
      if (!dtos) return;
      let successCount = 0;
      for (const dto of dtos) {
        try {
          await createMutation.mutateAsync(dto);
          successCount++;
        } catch {}
      }
      refetch();
      refetchCounts();
      toast.show({
        placement: "top",
        render: ({ id }) => (
          <Toast nativeID={`toast-${id}`} action="success" variant="solid">
            <ToastTitle>{`${successCount} kategori berhasil diimpor`}</ToastTitle>
          </Toast>
        ),
      });
    } catch (e) {
      showErrorToast(toast, e);
    }
  };

  const handleAdd = () => {
    clearSelection();
    setData(null);
    setOpen(true, () => {
      refetch();
      refetchCounts();
    });
  };

  if (isLoading) {
    return (
      <Box className="flex-1 justify-center items-center">
        <Spinner size="large" />
      </Box>
    );
  }

  return (
    <Box className="flex-1 bg-white">
      <Header
        header="KATEGORI"
        isGoBack
        selectedItemsLength={selectedItems?.length}
        selectedItemsSuffixLabel="Kategori terpilih"
        onCancelSelectedItems={() => clearSelection()}
        action={
          <HStack space="sm" className="w-[72px]">
            {hasSelection ? (
              isBulkDeleting ? (
                <Box className="p-6">
                  <Spinner size="small" color="#FFFFFF" />
                </Box>
              ) : (
                <Pressable
                  className="p-6"
                  onPress={() => triggerBulkDelete(bulkDeleteConfirm("kategori", selectedItems))}
                >
                  <SolarIconBold name="TrashBin2" size={20} color="#FDFBF9" />
                </Pressable>
              )
            ) : (
              <Pressable
                className="p-6"
                onPress={() => {
                  showActionDrawer({
                    actions: [
                      {
                        label: "Export Data",
                        icon: "Export",
                        onPress: handleExport,
                      },
                      {
                        label: "Import Data",
                        icon: "Import",
                        onPress: handleImport,
                      },
                    ],
                  });
                }}
              >
                <SolarIconBold
                  name="MenuDots"
                  size={20}
                  color="#FDFBF9"
                  style={{ transform: [{ rotate: "90deg" }] }}
                />
              </Pressable>
            )}
          </HStack>
        }
      />
      <Box className="flex-1 bg-white">
        <VStack className="flex-1">
          <HStack
            space="sm"
            className="p-4 shadow-lg bg-background-0 items-center"
          >
            <Input className="flex-1 border border-background-300 rounded-lg h-10">
              <InputSlot className="pl-3">
                <InputIcon as={SearchIcon} />
              </InputSlot>
              <InputField placeholder="Cari nama kategori" />
            </Input>
          </HStack>
          <FlatList
            data={categories}
            className="flex-1"
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                className={`p-4 rounded-sm border-b border-gray-300 active:bg-gray-100 ${
                  isSelected(item)
                    ? "bg-gray-100"
                    : ""
                }`}
                onPress={() => {
                  if (hasSelection) {
                    handleItemPress(item);
                  } else {
                    router.navigate(
                      `/(main)/management/product-category-brand/category/detail/${item.id}`,
                    );
                    clearSelection();
                  }
                }}
                onLongPress={() => handleItemPress(item)}
              >
                <HStack className="justify-between items-center">
                  <VStack>
                    <Heading size="sm">{item.name}</Heading>
                    <HStack space="sm">
                      <Badge size="sm" variant="solid" action="muted">
                        <BadgeText className="text-xs">
                          Total Produk: {productCounts?.[item.id] ?? 0}
                        </BadgeText>
                      </Badge>
                    </HStack>
                    <Text size="xs" className="text-slate-500">
                      Poin Retail: {item.retailPoint ?? 0} | Poin Grosir:{" "}
                      {item.wholesalePoint ?? 0}
                    </Text>
                  </VStack>
                  <VStack className="items-end">
                    <Text className="text-brand-primary text-sm font-bold">
                      Nilai Modal
                    </Text>
                    <Text size="xs">
                      Rp{" "}
                      {(capitalValues?.[item.id] ?? 0).toLocaleString(
                        "id-ID",
                      )}
                    </Text>
                  </VStack>
                </HStack>
              </Pressable>
            )}
            ListEmptyComponent={
              <Box className="p-8 items-center">
                <Text className="text-slate-400 italic">
                  Tidak ada category
                </Text>
              </Box>
            }
          />
          <HStack className="w-full p-4">
            <Button
              size="sm"
              className="w-full rounded-sm bg-brand-primary active:bg-brand-primary/90"
              onPress={handleAdd}
            >
              <ButtonText className="text-white">TAMBAH KATEGORI</ButtonText>
            </Button>
          </HStack>
        </VStack>
      </Box>
    </Box>
  );
}
