import Header from "@/components/header";
import { usePopUpConfirm } from "@/components/pop-up-confirm";
import {
  Box,
  HStack,
  Text,
  Toast,
  ToastTitle,
  useToast,
  VStack,
} from "@/components/ui";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
  ActionsheetItem,
  ActionsheetItemText,
} from "@/components/ui/actionsheet";
import { Pressable } from "@/components/ui/pressable";
import { SolarIconBold } from "@/components/ui/solar-icon-wrapper";
import useBreakpoint from "@/hooks/use-breakpoint";
import { getErrorMessage } from "@/lib/api/client";
// import { useDeleteSupplier, useSupplier, useSuppliers } from "@/lib/api/suppliers";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView } from "react-native";
import { dataSuppliers } from ".";

export default function SupplierDetail() {
  const { showPopUpConfirm, hidePopUpConfirm } = usePopUpConfirm();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const supplierId = id as string;

  const { sm } = useBreakpoint();
  const [showActionsheet, setShowActionsheet] = useState<boolean>(false);

  // const { refetch: refetchSuppliers } = useSuppliers();
  // const { data: supplier, refetch: refetchSupplier } = useSupplier(supplierId || "");
  // const deleteMutation = useDeleteSupplier();
  const supplier = dataSuppliers.find((r) => r.id === supplierId);
  const toast = useToast();

  const onRefetch = () => {
    // refetchSuppliers();
    // refetchSupplier();
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

  const handleDeletePress = () => {
    showPopUpConfirm({
      title: "HAPUS PRODUK",
      icon: "warning",
      description: (
        <Text className="text-slate-500">
          {`Apakah Anda yakin ingin menghapus produk `}
          <Text className="font-bold text-slate-900">{supplier?.name}</Text>
          {` ? Tindakan ini tidak dapat dibatalkan.`}
        </Text>
      ),
      showClose: true,
      okText: "HAPUS",
      closeText: "BATAL",
      okVariant: "destructive",
      onOk: () => confirmDelete(),
      // loading: deleteMutation.isPending,
    });
  };

  const confirmDelete = async () => {
    if (!supplier) return;

    // deleteMutation.mutate(supplier.id, {
    //   onSuccess: () => {
    //     hidePopUpConfirm();
    //     onRefetch();
    //     setShowActionsheet(false);
    //     router.back();

    //     toast.show({
    //       placement: "top",
    //       render: ({ id }) => (
    //         <Toast nativeID={`toast-${id}`} action="success" variant="solid">
    //           <ToastTitle>Produk berhasil dihapus</ToastTitle>
    //         </Toast>
    //       ),
    //     });
    //   },
    //   onError: (error) => {
    //     showErrorToast(error);
    //     hidePopUpConfirm();
    //     setShowActionsheet(false);
    //   },
    // });
  };

  return (
    <VStack className="flex-1 bg-white">
      <Header
        header="DETAIL SUPPLIER"
        action={
          <HStack space="sm">
            <Pressable className="p-6" onPress={() => setShowActionsheet(true)}>
              <SolarIconBold
                name="MenuDots"
                size={20}
                color="#FDFBF9"
                style={{ transform: [{ rotate: "90deg" }] }}
              />
            </Pressable>
          </HStack>
        }
        isGoBack
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <VStack>
          <Box className="w-full flex-row flex-wrap gap-y-4 p-4 border-b border-background-300">
            <VStack className="w-1/2 pr-4">
              <Text className="text-gray-500">Name</Text>
              <Text className="font-bold">{supplier?.name || "-"}</Text>
            </VStack>
            <VStack className="w-1/2 pr-4">
              <Text className="text-gray-500">No. Handphone</Text>
              <Text className="font-bold">{supplier?.phone || "-"}</Text>
            </VStack>
            <VStack className="w-1/2 pr-4">
              <Text className="text-gray-500">Alamat</Text>
              <Text className="font-bold">
                {supplier?.address || "-"}
              </Text>
            </VStack>
          </Box>
        </VStack>
      </ScrollView>

      <VStack space="md" className="w-full p-4">
        <Pressable className="w-full rounded-sm h-10 flex justify-center items-center bg-primary-500 border border-primary-500">
          <Text className="text-typography-0 font-bold">RIWAYAT TRANSAKSI</Text>
        </Pressable>
        <Pressable className="w-full rounded-sm h-10 flex justify-center items-center bg-background-0 border border-primary-500">
          <Text className="text-brand-primary font-bold">RIWAYAT HUTANG</Text>
        </Pressable>
      </VStack>

      <Actionsheet
        isOpen={showActionsheet}
        onClose={() => setShowActionsheet(false)}
      >
        <ActionsheetBackdrop />
        <ActionsheetContent className="px-0">
          <ActionsheetDragIndicatorWrapper className="pb-4 pt-2">
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>

          <ActionsheetItem
            onPress={() => {
              router.navigate(
                `/(main)/management/customer-supplier/supplier/edit/${supplier?.id}`
              );
              setShowActionsheet(false);
            }}
          >
            <HStack className="w-full justify-between items-center px-4 py-2">
              <ActionsheetItemText className="font-bold">
                Edit
              </ActionsheetItemText>
              <SolarIconBold name="Pen" size={16} />
            </HStack>
          </ActionsheetItem>

          <ActionsheetItem
            onPress={() => {
              handleDeletePress();
            }}
          >
            <HStack className="w-full justify-between items-center px-4 py-2">
              <ActionsheetItemText className="font-bold text-red-500">
                Delete
              </ActionsheetItemText>
              <SolarIconBold name="TrashBin2" size={16} color="#ef4444" />
            </HStack>
          </ActionsheetItem>
        </ActionsheetContent>
      </Actionsheet>
    </VStack>
  );
}
