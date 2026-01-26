import Header from "@/components/header";
import { usePopUpConfirm } from "@/components/pop-up-confirm";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import {
  SolarIconBold,
  SolarIconLinear,
} from "@/components/ui/solar-icon-wrapper";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { Toast, ToastTitle, useToast } from "@/components/ui/toast";
import { VStack } from "@/components/ui/vstack";
// import {
//   PaymentType,
//   useBulkDeletePaymentType,
//   usePaymentTypes,
//   useProductCountsByPaymentType,
// } from "@/lib/api/payment-types";
import { getErrorMessage } from "@/lib/api/client";
import { PaymentType, usePaymentTypeStore } from "@/stores/payment-type";
import { useRouter } from "expo-router";
import { SearchIcon } from "lucide-react-native";
import React, { useState } from "react";
import { ScrollView } from "react-native";

const data: PaymentType[] = [
  {
    id: "1",
    name: "Cash",
    commission: 0,
    minimalAmount: 0,
  },
  {
    id: "2",
    name: "Transfer",
    commission: 0,
    minimalAmount: 0,
  },
  {
    id: "3",
    name: "Qris",
    commission: 0,
    minimalAmount: 0,
  },
  {
    id: "4",
    name: "EDC",
    commission: 0,
    minimalAmount: 0,
  },
  {
    id: "5",
    name: "E-Wallet",
    commission: 0,
    minimalAmount: 0,
  },
];
export default function PaymentTypeList() {
  const { setOpen, setData } = usePaymentTypeStore();
  const { showPopUpConfirm, hidePopUpConfirm } = usePopUpConfirm();
  const router = useRouter();
  // const { data, isLoading: isLoadingPaymentTypes, refetch } = usePaymentTypes();
  // const { data: productCounts, refetch: refetchCounts } =
  //   useProductCountsByPaymentType();
  // const deleteMutation = useBulkDeletePaymentType();
  const [selectedItems, setSelectedItems] = useState<PaymentType[] | null>(
    null,
  );

  const isLoading = false; // isLoadingPaymentTypes || deleteMutation.isLoading;
  const paymentTypes = data || [];

  const toast = useToast();

  const handleItemPress = (item: PaymentType) => {
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
    setData(null);
    setOpen(true, () => {
      // refetch();
      // refetchCounts();
    });
  };

  const handleDeletePress = () => {
    const ids = selectedItems?.map((m) => m.id) || [];

    showPopUpConfirm({
      title: "HAPUS JENIS PEMBAYARAN",
      icon: "warning",
      description: (
        <Text className="text-slate-500">
          {`Apakah Anda yakin ingin menghapus `}
          <Text className="font-bold text-slate-900">{ids?.length}</Text>
          {` jenis pembayaran? Tindakan ini tidak dapat dibatalkan.`}
        </Text>
      ),
      showClose: true,
      okText: "HAPUS",
      closeText: "BATAL",
      okVariant: "destructive",
      onOk: () => confirmDelete(ids),
      // loading: deleteMutation.isPending,
    });
  };

  const confirmDelete = async (ids: string[]) => {
    if (!ids.length) return;

    // deleteMutation.mutate(
    //   { ids },
    //   {
    //     onSuccess: () => {
    //       setSelectedItems(null);
    //       hidePopUpConfirm();
    //       refetch();

    //       toast.show({
    //         placement: "top",
    //         render: ({ id }) => (
    //           <Toast nativeID={`toast-${id}`} action="success" variant="solid">
    //             <ToastTitle>Jenis pembayaran berhasil dihapus</ToastTitle>
    //           </Toast>
    //         ),
    //       });
    //     },
    //     onError: (error) => {
    //       showErrorToast(error);
    //       hidePopUpConfirm();
    //     },
    //   },
    // );
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
        header="JENIS PEMBAYARAN"
        isGoBack
        selectedItemsLength={selectedItems?.length}
        selectedItemsSuffixLabel="Jenis pembayaran terpilih"
        onCancelSelectedItems={() => setSelectedItems(null)}
        action={
          <HStack space="sm" className="w-[72px]">
            {!!selectedItems?.length ? (
              isLoading ? (
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
        <VStack className="flex-1">
          <HStack
            space="sm"
            className="p-4 shadow-lg bg-background-0 items-center"
          >
            <Pressable
              className="size-10 items-center justify-center"
              onPress={() => {}}
            >
              <SolarIconLinear name="Bell" size={20} color="#3d2117" />
            </Pressable>
            <Pressable
              className="size-10 items-center justify-center"
              onPress={() => {}}
            >
              <SolarIconLinear name="Filter" size={20} color="#3d2117" />
            </Pressable>
            <Input className="flex-1 border border-background-300 rounded-lg h-10">
              <InputSlot className="pl-3">
                <InputIcon as={SearchIcon} />
              </InputSlot>
              <InputField placeholder="Cari nama pembayaran" />
            </Input>
          </HStack>
          <ScrollView className="flex-1">
            <VStack>
              {paymentTypes.map((item) => (
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
                        `/(main)/management/payment-type/detail/${item.id}`,
                      );
                      setSelectedItems(null);
                    }
                  }}
                  onLongPress={() => handleItemPress(item)}
                >
                  <HStack className="justify-between items-center">
                    <VStack>
                      <Heading size="sm">{item.name}</Heading>
                    </VStack>
                    <VStack className="items-end">
                      <Text className="text-brand-primary text-sm font-bold">
                        Komisi
                      </Text>
                      <VStack className="items-end">
                        <Text size="xs">
                          Rp {item.commission.toLocaleString("id-ID")}
                        </Text>
                        <Badge size="sm" variant="solid" action="muted">
                          <BadgeText className="text-xs">
                            Minimal: Rp{" "}
                            {item.minimalAmount.toLocaleString("id-ID")}
                          </BadgeText>
                        </Badge>
                      </VStack>
                    </VStack>
                  </HStack>
                </Pressable>
              ))}
              {paymentTypes?.length === 0 && (
                <Box className="p-8 items-center">
                  <Text className="text-slate-400 italic">
                    Tidak ada paymentType
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
              <ButtonText className="text-white">
                TAMBAH JENIS PEMBAYARAN
              </ButtonText>
            </Button>
          </HStack>
        </VStack>
      </Box>
    </Box>
  );
}
