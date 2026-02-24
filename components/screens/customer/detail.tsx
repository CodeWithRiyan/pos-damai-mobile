import { useActionDrawer } from "@/components/action-drawer";
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
import { Pressable } from "@/components/ui/pressable";
import { SolarIconBold } from "@/components/ui/solar-icon-wrapper";
import { getErrorMessage } from "@/lib/api/client";
import {
  useCustomer,
  useCustomers,
  useDeleteCustomer,
} from "@/lib/api/customers";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView } from "react-native";

export default function CustomerDetail() {
  const { showPopUpConfirm, hidePopUpConfirm } = usePopUpConfirm();
  const { showActionDrawer, hideActionDrawer } = useActionDrawer();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const customerId = id as string;

  const { refetch: refetchCustomers } = useCustomers();
  const { data: customer, refetch: refetchCustomer } = useCustomer(
    customerId || "",
  );
  const deleteMutation = useDeleteCustomer();
  const toast = useToast();

  const helperCategory = (category = "") => {
    return category === "RETAIL" ? "RETAIL" : "GROSIR";
  };

  const onRefetch = () => {
    refetchCustomers();
    refetchCustomer();
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
      title: "HAPUS PELANGGAN",
      icon: "warning",
      description: (
        <Text className="text-slate-500">
          {`Apakah Anda yakin ingin menghapus pelanggan `}
          <Text className="font-bold text-slate-900">{customer?.name}</Text>
          {` ? Tindakan ini tidak dapat dibatalkan.`}
        </Text>
      ),
      showClose: true,
      okText: "HAPUS",
      closeText: "BATAL",
      okVariant: "destructive",
      onOk: () => confirmDelete(),
      loading: deleteMutation.isPending,
    });
  };

  const confirmDelete = async () => {
    if (!customer) return;

    deleteMutation.mutate(customer.id, {
      onSuccess: () => {
        hidePopUpConfirm();
        onRefetch();
        router.back();

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
    });
  };

  const handleAction = () => {
    showActionDrawer({
      actions: [
        {
          label: "Edit",
          icon: "Pen",
          onPress: () => {
            router.navigate(
              `/(main)/management/customer-supplier/customer/edit/${customer?.id}`,
            );
            hideActionDrawer();
          },
        },
        {
          label: "Delete",
          icon: "TrashBin2",
          theme: "red",
          onPress: () => {
            handleDeletePress();
            hideActionDrawer();
          },
        },
      ],
    });
  };

  return (
    <VStack className="flex-1 bg-white">
      <Header
        header="DETAIL CUSTOMER"
        action={
          <HStack space="sm">
            <Pressable className="p-6" onPress={handleAction}>
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
              <Text className="font-bold">{customer?.name || "-"}</Text>
            </VStack>
            <VStack className="w-1/2 pr-4">
              <Text className="text-gray-500">Kode</Text>
              <Text className="font-bold">{customer?.code || "-"}</Text>
            </VStack>
            <VStack className="w-1/2 pr-4">
              <Text className="text-gray-500">Kategori</Text>
              <Text className="font-bold">
                {helperCategory(customer?.category)}
              </Text>
            </VStack>
            <VStack className="w-1/2 pr-4">
              <Text className="text-gray-500">No. Handphone</Text>
              <Text className="font-bold">{customer?.phone || "-"}</Text>
            </VStack>
            <VStack className="w-1/2 pr-4">
              <Text className="text-gray-500">Alamat</Text>
              <Text className="font-bold">{customer?.address || "-"}</Text>
            </VStack>
          </Box>
          <Box className="w-full flex-row flex-wrap gap-y-4 p-4 border-b border-background-300">
            <VStack className="w-1/2 pr-4">
              <Text className="text-gray-500">Poin</Text>
              <Text className="font-bold">{customer?.points || 0}</Text>
            </VStack>
            <VStack className="w-1/2 pr-4">
              <Text className="text-gray-500">Total Transaksi</Text>
              <Text className="font-bold">
                {customer?.totalTransactions || 0}
              </Text>
            </VStack>
            <VStack className="w-1/2 pr-4">
              <Text className="text-gray-500">Total Omset</Text>
              <Text className="font-bold">
                Rp {(customer?.totalOmset || 0).toLocaleString("id-ID")}
              </Text>
            </VStack>
            <VStack className="w-1/2 pr-4">
              <Text className="text-gray-500">Total Keuntungan</Text>
              <Text className="font-bold">
                Rp {(customer?.totalKeuntungan || 0).toLocaleString("id-ID")}
              </Text>
            </VStack>
          </Box>
        </VStack>
      </ScrollView>

      <VStack space="md" className="w-full p-4">
        <Pressable
          className="w-full rounded-sm h-10 flex justify-center items-center bg-primary-500 border border-primary-500"
          onPress={() => {
            router.navigate(
              `/(main)/transaction/history?customerId=${customer?.id}`,
            );
          }}
        >
          <Text size="sm" className="text-typography-0 font-bold">
            RIWAYAT TRANSAKSI
          </Text>
        </Pressable>
      </VStack>
    </VStack>
  );
}
