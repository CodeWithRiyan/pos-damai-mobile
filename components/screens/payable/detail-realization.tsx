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
import {
  SolarIconBold,
  SolarIconBoldDuotone,
  SolarIconLinear,
} from "@/components/ui/solar-icon-wrapper";
import { getErrorMessage } from "@/lib/api/client";
// import { useDeletePayableRealization, usePayableRealization, usePayableRealizationList } from "@/lib/api/payableRealization";
import { Grid, GridItem } from "@/components/ui/grid";
import dayjs from "dayjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView } from "react-native";
import { dataPayable, Payable, PayableRealization } from ".";

export default function PayableRealizationDetail() {
  const { showPopUpConfirm, hidePopUpConfirm } = usePopUpConfirm();
  const { showActionDrawer, hideActionDrawer } = useActionDrawer();
  const router = useRouter();
  const params = useLocalSearchParams();
  const payableIds = params.payableIds as string;

  const supplierId = params.supplierId as string;
  const payableId = payableIds?.split("-")[0] || "";

  // const { refetch: refetchPayableRealizationList } = usePayableRealizationList();
  // const { data: payableRealization, refetch: refetchPayableRealization } = usePayableRealization(payableRealizationId || "");
  // const deleteMutation = useDeletePayableRealization();
  const payable: Payable | null =
    dataPayable.find((r) => r.id === payableId) || null;

  const payableRealizationList: PayableRealization[] =
    payable?.realizations || [];

  const isPayedOff = payable?.totalRealization === payable?.nominal;

  const toast = useToast();

  const onRefetch = () => {
    // refetchPayableRealizationList();
    // refetchPayableRealization();
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
      title: "HAPUS REALISASI HUTANG",
      icon: "warning",
      description: (
        <Text className="text-slate-500">
          {`Apakah Anda yakin ingin menghapus hutang ${payable?.supplier.name} tanggal `}
          <Text className="font-bold text-slate-900">
            {dayjs(payable?.createdAt).format("DD/MM/YYYY")}
          </Text>
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
    if (!payable) return;

    // deleteMutation.mutate(realization.id, {
    //   onSuccess: () => {
    //     hidePopUpConfirm();
    //     onRefetch();
    //     router.back();

    //     toast.show({
    //       placement: "top",
    //       render: ({ id }) => (
    //         <Toast nativeID={`toast-${id}`} action="success" variant="solid">
    //           <ToastTitle>Hutang berhasil dihapus</ToastTitle>
    //         </Toast>
    //       ),
    //     });
    //   },
    //   onError: (error) => {
    //     showErrorToast(error);
    //     hidePopUpConfirm();
    //   },
    // });
  };

  const handleAction = () => {
    showActionDrawer({
      actions: [
        {
          label: "Edit",
          icon: "Pen",
          onPress: () => {
            router.navigate(
              `/(main)/management/payable-receivable/payable/edit/${payable?.id}`,
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
        header="DETAIL REALISASI HUTANG"
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
        <VStack space="md" className="flex-1">
          <VStack space="sm" className="p-4">
            <HStack space="sm" className="items-center">
              <SolarIconBoldDuotone
                name="UserCircle"
                size={24}
                color="#3b82f6"
              />
              <Text className="text-primary-500 font-bold">
                {payable?.supplier.name}
              </Text>
            </HStack>
            <HStack space="xs" className="items-center">
              <Box
                className={`w-2 h-2 rounded-full${isPayedOff ? " bg-blue-500" : "bg-red-500"}`}
              />
              <Text size="xs" className="text-primary-500 text-sm font-bold">
                {isPayedOff ? "Lunas" : "Belum Lunas"}
              </Text>
            </HStack>
            <HStack space="lg" className="justify-between">
              <VStack className="flex-1">
                <Text className="text-gray-500 text-sm">Tanggal Transaksi</Text>
                <Text className="text-sm font-bold">
                  {dayjs(payable?.createdAt).format("DD/MM/YYYY HH:mm:ss")}
                </Text>
              </VStack>
              <VStack className="flex-1 items-end">
                <Text className="text-gray-500 text-sm">Jatuh Tempo</Text>
                <Text className="text-sm font-bold">
                  {dayjs(payable?.dueDate).format("DD/MM/YYYY HH:mm:ss")}
                </Text>
              </VStack>
            </HStack>
            <HStack space="lg" className="justify-between">
              <VStack className="flex-1">
                <Text className="text-gray-500 text-sm">Total</Text>
                <Text className="text-sm font-bold">{`Rp ${payable?.nominal?.toLocaleString("id-ID")}`}</Text>
              </VStack>
              <VStack className="flex-1 items-end">
                <Text className="text-gray-500 text-sm">Belum Dibayar</Text>
                <Text className="text-sm font-bold">
                  {`Rp ${(
                    (payable?.nominal || 0) - (payable?.totalRealization || 0)
                  ).toLocaleString("id-ID")}`}
                </Text>
              </VStack>
            </HStack>
          </VStack>
        </VStack>
        <VStack space="md" className="w-full px-4">
          <Pressable className="flex-row items-center justify-between gap-4 h-9 px-4 rounded-lg bg-background-0 border border-primary-500">
            <Text size="lg" className="text-sm text-primary-500 font-bold">
              Lihat detail struk
            </Text>
            <SolarIconLinear name="ArrowRight" size={20} color="#3d2117" />
          </Pressable>
        </VStack>
        <VStack>
          {payableRealizationList?.map((realization, index) => (
            <HStack key={realization.id} className="p-4">
              <HStack space="md" className="items-center">
                <Grid
                  _extra={{ className: "grid-cols-2" }}
                  className="relative border border-background-200 rounded-md bg-background-0 p-4 pt-10 gap-2"
                >
                  <GridItem
                    _extra={{ className: "col-span-3" }}
                    className="absolute top-0 left-0"
                  >
                    <Box className="absolute top-0 left-0 py-1 px-4 rounded-br-md bg-info-50">
                      <Text className="text-info-400 text-sm font-bold">{`Tgl Pembayaran: ${dayjs(realization.realizationDate).format("DD/MM/YYYY HH:mm")}`}</Text>
                    </Box>
                  </GridItem>
                  <GridItem
                    _extra={{
                      className: "col-span-1",
                    }}
                  >
                    <Text className="text-gray-500 text-sm">No.</Text>
                    <Text className="text-sm font-bold">{index + 1}</Text>
                  </GridItem>
                  <GridItem
                    _extra={{
                      className: "col-span-1",
                    }}
                  >
                    <Text className="text-gray-500 text-sm">Cicilan</Text>
                    <Text className="text-sm font-bold">
                      {`Rp ${realization.nominal.toLocaleString("id-ID")}`}
                    </Text>
                  </GridItem>
                  <GridItem
                    _extra={{
                      className: "col-span-2",
                    }}
                  >
                    <HStack space="md">
                      <Text className="text-gray-500 text-sm">Ref :</Text>
                      <Text className="text-sm font-bold">
                        {realization.ref}
                      </Text>
                    </HStack>
                    <HStack space="sm">
                      <Text className="text-gray-500 text-sm">Oleh :</Text>
                      <Text className="text-sm font-bold">
                        {realization.createdByName}
                      </Text>
                    </HStack>
                  </GridItem>
                  <GridItem _extra={{ className: "col-span-3" }}>
                    <Pressable
                      className="h-8 w-8 rounded-md items-center justify-center border border-background-200"
                      onPress={() => {
                        router.navigate(
                          `/(main)/management/payable-receivable/payable/detail/${supplierId}/realization/edit/${realization.id}?payableIds=${payableId}`,
                        );
                      }}
                    >
                      <SolarIconLinear name="Pen" size={16} color="#3d2117" />
                    </Pressable>
                  </GridItem>
                </Grid>
              </HStack>
            </HStack>
          ))}
          {payableRealizationList?.length === 0 && (
            <Box className="p-8 items-center">
              <Text className="text-slate-400 italic">
                No payableRealization found
              </Text>
            </Box>
          )}
        </VStack>
      </ScrollView>

      <VStack space="md" className="w-full p-4">
        <Pressable
          className="w-full rounded-md h-9 flex justify-center items-center bg-primary-500 active:bg-primary-500/90"
          onPress={() => {
            router.navigate(
              `/(main)/management/payable-receivable/payable/detail/${supplierId}/realization/add?payableIds=${payableId}`,
            );
          }}
        >
          <Text size="sm" className="text-typography-0 font-bold">
            PEMBAYARAN
          </Text>
        </Pressable>
      </VStack>
    </VStack>
  );
}
