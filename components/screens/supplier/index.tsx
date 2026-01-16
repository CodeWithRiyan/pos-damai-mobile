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
// import { useBulkDeleteSupplier, Supplier, useSuppliers } from "@/lib/api/suppliers";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView } from "react-native";

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string
}

export const dataSuppliers: Supplier[] = [
  {
    id: "1",
    name: "Supplier 1",
    phone: "123456789",
    address: "Address 1"
  },
  {
    id: "2",
    name: "Supplier 2",
    phone: "123456789",
    address: "Address 2"
  },
  {
    id: "3",
    name: "Supplier 3",
    phone: "123456789",
    address: "Address 3"
  },
];

export default function SupplierList() {
  const { showPopUpConfirm, hidePopUpConfirm } = usePopUpConfirm();
  const router = useRouter();
  // const { data, isLoading, refetch } = useSuppliers();
  const [selectedItems, setSelectedItems] = useState<any[] | null>(null);

  const suppliers = dataSuppliers || [];

  // const deleteMutation = useBulkDeleteSupplier();
  const toast = useToast();

  const handlePress = (data: Supplier) => {
    if (selectedItems?.some((r) => r.id === data.id)) {
      setSelectedItems(selectedItems.filter((r) => r.id !== data.id));
      return;
    }
    if (!selectedItems) {
      setSelectedItems([data]);
      return;
    }

    setSelectedItems([...selectedItems, data]);
  };

  const showErrorToast = (error: unknown) => {
    toast.show({
      placement: "top",
      render: ({ id }) => {
        const toastId = "toast-" + id;
        return (
          <Toast nativeID={toastId} action="error" variant="solid">
            <ToastTitle>{getErrorMessage(error)}</ToastTitle>
          </Toast>
        );
      },
    });
  };

  const handleAdd = () => {
    setSelectedItems(null);
    router.push("/(main)/management/customer-supplier/supplier/add");
  };

  const handleDeletePress = () => {
    const supplierIds = selectedItems?.map((m) => m.id) || [];

    showPopUpConfirm({
      title: "HAPUS SUPPLIER",
      icon: "warning",
      description: (
        <Text className="text-slate-500">
          {`Apakah Anda yakin ingin menghapus `}
          <Text className="font-bold text-slate-900">{supplierIds?.length}</Text>
          {` supplier? Tindakan ini tidak dapat dibatalkan.`}
        </Text>
      ),
      showClose: true,
      okText: "HAPUS",
      closeText: "BATAL",
      okVariant: "destructive",
      onOk: () => confirmDelete(supplierIds),
      // loading: deleteMutation.isPending,
    });
  };

  const confirmDelete = async (supplierIds: string[]) => {
    if (!supplierIds.length) return;

    // deleteMutation.mutate(
    //   { ids: supplierIds },
    //   {
    //     onSuccess: () => {
    //       setSelectedItems(null);
    //       hidePopUpConfirm();
    //       refetch();

    //       toast.show({
    //         placement: "top",
    //         render: ({ id }) => (
    //           <Toast nativeID={`toast-${id}`} action="success" variant="solid">
    //             <ToastTitle>Supplier berhasil dihapus</ToastTitle>
    //           </Toast>
    //         ),
    //       });
    //     },
    //     onError: (error) => {
    //       showErrorToast(error);
    //       hidePopUpConfirm();
    //     },
    //   }
    // );
  };

  // if (isLoading) {
  //   return (
  //     <Box className="flex-1 justify-center items-center">
  //       <Spinner size="large" />
  //     </Box>
  //   );
  // }

  return (
    <Box className="flex-1 bg-white">
      <Header
        header="SUPPLIER"
        isGoBack
        selectedItemsLength={selectedItems?.length}
        selectedItemsSuffixLabel="Produk terpilih"
        onCancelSelectedItems={() => setSelectedItems(null)}
        action={
          <HStack space="sm" className="w-[72px]">
            {!!selectedItems?.length ? (
              // deleteMutation.isPending
              false ? (
                <Box className="p-6">
                  <Spinner size="small" color="#FFFFFF" />
                </Box>
              ) : (
                <Pressable className="p-6" onPress={() => handleDeletePress()}>
                  <SolarIconBold name="TrashBin2" size={20} color="#FDFBF9" />
                </Pressable>
              )
            ) : (
              <Pressable className="p-6" onPress={() => {}}>
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
        <VStack space="lg" className="flex-1">
          <ScrollView className="flex-1">
            <VStack>
              {suppliers?.map((supplier) => (
                <Pressable
                  key={supplier.id}
                  className={`p-4 rounded-sm border-b border-gray-300 active:bg-gray-100 ${
                    selectedItems?.some((r) => r.id === supplier.id)
                      ? "bg-gray-100"
                      : ""
                  }`}
                  onPress={() => {
                    if (!!selectedItems?.length) {
                      handlePress(supplier);
                    } else {
                      router.navigate(
                        `/(main)/management/customer-supplier/supplier/detail/${supplier.id}`
                      );
                      setSelectedItems(null);
                    }
                  }}
                  onLongPress={() => handlePress(supplier)}
                >
                  <HStack className="justify-between items-center">
                    <HStack space="md" className="items-center">
                      <Box className="w-10 h-10 rounded-md bg-brand-secondary/20 items-center justify-center">
                        <Text className="text-brand-primary font-bold">
                          {supplier.name.substring(0, 1).toUpperCase()}
                        </Text>
                      </Box>
                      <VStack>
                        <Heading size="sm">{supplier.name}</Heading>
                      </VStack>
                    </HStack>
                  </HStack>
                </Pressable>
              ))}
              {suppliers?.length === 0 && (
                <Box className="p-8 items-center">
                  <Text className="text-slate-400 italic">
                    No suppliers found
                  </Text>
                </Box>
              )}
            </VStack>
          </ScrollView>
          <HStack className="w-full p-4">
            <Button
              size="sm"
              className="w-full rounded-sm bg-brand-primary active:bg-brand-primary/90"
              onPress={handleAdd}
            >
              <ButtonText className="text-white">TAMBAH SUPPLIER</ButtonText>
            </Button>
          </HStack>
        </VStack>
      </Box>
    </Box>
  );
}
