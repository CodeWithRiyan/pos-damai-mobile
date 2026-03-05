import { useActionDrawer } from "@/components/action-drawer";
import Header from "@/components/header";
import { usePopUpConfirm } from "@/components/pop-up-confirm";
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
import { getErrorMessage } from "@/lib/api/client";
import {
  CustomerWithStats,
  useBulkDeleteCustomer,
  useCreateCustomer,
  useCustomers,
} from "@/lib/api/customers";
import { exportCustomers, importCustomers } from "@/lib/utils/excel";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { ScrollView } from "react-native";

export default function CustomerList({ isReport }: { isReport?: boolean }) {
  const { showPopUpConfirm, hidePopUpConfirm } = usePopUpConfirm();
  const { showActionDrawer, hideActionDrawer } = useActionDrawer();
  const router = useRouter();
  const { data, isLoading, refetch } = useCustomers();
  const [selectedItems, setSelectedItems] = useState<CustomerWithStats[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const customers = data || [];

  const deleteMutation = useBulkDeleteCustomer();
  const createMutation = useCreateCustomer();
  const toast = useToast();

  const handleExport = async () => {
    hideActionDrawer();
    try {
      await exportCustomers(customers);
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
      const dtos = await importCustomers();
      if (!dtos) return;
      let successCount = 0;
      for (const dto of dtos) {
        try {
          await createMutation.mutateAsync(dto);
          successCount++;
        } catch {}
      }
      refetch();
      toast.show({
        placement: "top",
        render: ({ id }) => (
          <Toast nativeID={`toast-${id}`} action="success" variant="solid">
            <ToastTitle>{`${successCount} pelanggan berhasil diimpor`}</ToastTitle>
          </Toast>
        ),
      });
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

  const handleItemPress = (item: CustomerWithStats) => {
    if (selectedItems?.some((r) => r.id === item.id)) {
      setSelectedItems(selectedItems.filter((r) => r.id !== item.id));
      return;
    }
    if (!selectedItems) {
      setSelectedItems([item]);
      return;
    }
    setSelectedItems([...selectedItems, item]);
  };

  const showErrorToast = (error: unknown) => {
    toast.show({
      placement: "top",
      render: ({ id }) => (
        <Toast nativeID={"toast-" + id} action="error" variant="solid">
          <ToastTitle>{getErrorMessage(error)}</ToastTitle>
        </Toast>
      ),
    });
  };

  const handleAdd = () => {
    setSelectedItems(null);
    router.push("/(main)/management/customer-supplier/customer/add");
  };

  const handleDeletePress = () => {
    const ids = selectedItems?.map((m) => m.id) || [];

    showPopUpConfirm({
      title: "HAPUS PELANGGAN",
      icon: "warning",
      description: (
        <Text className="text-slate-500">
          {`Apakah Anda yakin ingin menghapus `}
          <Text className="font-bold text-slate-900">{ids?.length}</Text>
          {` pelanggan? Tindakan ini tidak dapat dibatalkan.`}
        </Text>
      ),
      showClose: true,
      okText: "HAPUS",
      closeText: "BATAL",
      okVariant: "destructive",
      onOk: () => confirmDelete(ids),
      loading: deleteMutation.isPending,
    });
  };

  const confirmDelete = async (ids: string[]) => {
    if (!ids.length) return;

    deleteMutation.mutate(
      { ids },
      {
        onSuccess: () => {
          setSelectedItems(null);
          hidePopUpConfirm();
          refetch();

          toast.show({
            placement: "top",
            render: ({ id }) => (
              <Toast nativeID={`toast-${id}`} action="success" variant="solid">
                <ToastTitle>Pelanggan berhasil dihapus</ToastTitle>
              </Toast>
            ),
          });
        },
        onError: (error) => {
          showErrorToast(error);
          hidePopUpConfirm();
        },
      },
    );
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
        header={isReport ? "LAPORAN PELANGGAN" : "PELANGGAN"}
        isGoBack
        selectedItemsLength={selectedItems?.length}
        selectedItemsSuffixLabel="Produk terpilih"
        onCancelSelectedItems={() => setSelectedItems(null)}
        action={
          !isReport && (
            <HStack space="sm" className="w-[72px]">
              {!!selectedItems?.length ? (
                deleteMutation.isPending ? (
                  <Box className="p-6">
                    <Spinner size="small" color="#FFFFFF" />
                  </Box>
                ) : (
                  <Pressable
                    className="p-6"
                    onPress={() => handleDeletePress()}
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
          )
        }
      />
      <Box className="flex-1 bg-white">
        <VStack space="lg" className="flex-1">
          <ScrollView className="flex-1">
            <VStack>
              {customers.map((item) => (
                <Pressable
                  key={item.id}
                  className={`p-4 rounded-sm border-b border-gray-300 active:bg-gray-100 ${
                    selectedItems?.some((r) => r.id === item.id)
                      ? "bg-gray-100"
                      : ""
                  }`}
                  onPress={() => {
                    if (!!selectedItems?.length) {
                      handleItemPress(item);
                    } else {
                      router.navigate(
                        `/(main)/management/customer-supplier/customer/detail/${item.id}` as any,
                      );
                      setSelectedItems(null);
                    }
                  }}
                  onLongPress={() => !isReport && handleItemPress(item)}
                >
                  <HStack className="justify-between items-center">
                    <HStack space="md" className="items-center">
                      <Box className="w-10 h-10 rounded-md bg-brand-secondary/20 items-center justify-center">
                        <Text className="text-brand-primary font-bold">
                          {item.name.substring(0, 1).toUpperCase()}
                        </Text>
                      </Box>
                      <VStack>
                        <Heading size="sm">{item.name}</Heading>
                        <Text size="xs" className="text-slate-500">
                          {item.code}
                        </Text>
                      </VStack>
                    </HStack>
                    <VStack className="items-end">
                      <Text className="text-brand-primary text-sm font-bold">
                        {item.points || 0} Poin
                      </Text>
                      <Text className="text-xs">Total Transaksi: {item.totalTransactions || 0}</Text>
                      <Text className="text-xs">Total Omset: Rp {(item.totalRevenue || 0).toLocaleString('id-ID')}</Text>
                      <Text className="text-xs">Total Keuntungan: Rp {(item.totalProfit || 0).toLocaleString('id-ID')}</Text>

                    </VStack>
                  </HStack>
                </Pressable>
              ))}
              {customers?.length === 0 && (
                <Box className="p-8 items-center">
                  <Text className="text-slate-400 italic">
                    Tidak ada pelanggan
                  </Text>
                </Box>
              )}
            </VStack>
          </ScrollView>
          {!isReport && (
            <HStack className="w-full p-4">
              <Button
                size="sm"
                className="w-full rounded-sm bg-brand-primary active:bg-brand-primary/90"
                onPress={handleAdd}
              >
                <ButtonText className="text-white">TAMBAH PELANGGAN</ButtonText>
              </Button>
            </HStack>
          )}
        </VStack>
      </Box>
    </Box>
  );
}
