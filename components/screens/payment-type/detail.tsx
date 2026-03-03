import { useActionDrawer } from "@/components/action-drawer";
import Header from "@/components/header";
import { usePopUpConfirm } from "@/components/pop-up-confirm";
import {
    Box,
    Spinner,
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
    useDeletePaymentType,
    usePaymentType,
    usePaymentTypes,
    useSetDefaultPaymentType,
} from "@/lib/api/payment-types";
import { usePaymentTypeStore } from "@/stores/payment-type";
import classNames from "classnames";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView } from "react-native";

export default function PaymentTypeDetail() {
  const { setOpen, setData } = usePaymentTypeStore();
  const { showPopUpConfirm, hidePopUpConfirm } = usePopUpConfirm();
  const { showActionDrawer, hideActionDrawer } = useActionDrawer();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const paymentTypeId = id as string;

  const { refetch: refetchPaymentTypes } = usePaymentTypes();
  const { data: paymentType, refetch: refetchPaymentType } = usePaymentType(
    paymentTypeId || "",
  );
  const deleteMutation = useDeletePaymentType();
  const setDefaultMutation = useSetDefaultPaymentType();

  const isLoading = deleteMutation.isPending || setDefaultMutation.isPending;
  const toast = useToast();

  const onRefetch = () => {
    refetchPaymentTypes();
    refetchPaymentType();
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
      title: "HAPUS JENIS PEMBAYARAN",
      icon: "warning",
      description: (
        <Text className="text-slate-500">
          {`Apakah Anda yakin ingin menghapus jenis pembayaran `}
          <Text className="font-bold text-slate-900">{paymentType?.name}</Text>
          {` ? Tindakan ini tidak dapat dibatalkan.`}
        </Text>
      ),
      showClose: true,
      okText: "HAPUS",
      closeText: "BATAL",
      okVariant: "destructive",
      onOk: () => confirmDelete(),
      loading: isLoading,
    });
  };

  const confirmDelete = async () => {
    if (!paymentType) return;

    deleteMutation.mutate(paymentType.id, {
      onSuccess: () => {
        hidePopUpConfirm();
        onRefetch();
        router.back();

        toast.show({
          placement: "top",
          render: ({ id }) => (
            <Toast nativeID={`toast-${id}`} action="success" variant="solid">
              <ToastTitle>Jenis pembayaran berhasil dihapus</ToastTitle>
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
            setOpen(true);
            setData(paymentType);
            hideActionDrawer();
          },
        },
        {
          label: "Hapus",
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
        header="DETAIL JENIS PEMBAYARAN"
        action={
          isLoading ? (
            <Box className="p-6">
              <Spinner size="small" color="#FFFFFF" />
            </Box>
          ) : (
            <Pressable className="p-6" onPress={handleAction}>
              <SolarIconBold
                name="MenuDots"
                size={20}
                color="#FDFBF9"
                style={{ transform: [{ rotate: "90deg" }] }}
              />
            </Pressable>
          )
        }
        isGoBack
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <VStack>
          <Box className="w-full flex-row flex-wrap gap-y-4 p-4 border-b border-background-300">
            <VStack className="w-1/2 pr-4">
              <Text className="text-gray-500">Jenis Pembayaran</Text>
              <Text className="font-bold">{paymentType?.name}</Text>
            </VStack>
            <VStack className="w-1/2 pr-4">
              <Text className="text-gray-500">Komisi</Text>
              <Text className="font-bold">
                {paymentType?.commissionType === "FLAT"
                  ? `Rp ${paymentType?.commission?.toLocaleString("id-ID") || "-"}`
                  : `${paymentType?.commission || "-"}%`}
              </Text>
            </VStack>
            <VStack className="w-1/2 pr-4">
              <Text className="text-gray-500">Jumlah Minimal</Text>
              <Text className="font-bold">
                {paymentType?.minimalAmount || "-"}
              </Text>
            </VStack>
          </Box>
        </VStack>
      </ScrollView>
      <VStack space="md" className="w-full p-4">
        <Pressable
          className={classNames(
            "w-full rounded-sm h-10 flex justify-center items-center bg-background-0 border border-brand-primary",
            !paymentType?.isDefault && "bg-brand-primary",
          )}
          disabled={paymentType?.isDefault || setDefaultMutation.isPending}
          onPress={() => {
            if (paymentType?.id) {
              setDefaultMutation.mutate(paymentType.id, {
                onSuccess: () => {
                  toast.show({
                    placement: "top",
                    render: ({ id }) => (
                      <Toast
                        nativeID={`toast-${id}`}
                        action="success"
                        variant="solid"
                      >
                        <ToastTitle>Berhasil diatur sebagai default</ToastTitle>
                      </Toast>
                    ),
                  });
                  onRefetch();
                },
                onError: showErrorToast,
              });
            }
          }}
        >
          <Text
            size="sm"
            className={classNames(
              "text-brand-primary font-bold",
              !paymentType?.isDefault && "text-white",
            )}
          >
            {paymentType?.isDefault
              ? "DEFAULT PEMBAYARAN"
              : "JADIKAN DEFAULT PEMBAYARAN"}
          </Text>
        </Pressable>
      </VStack>
    </VStack>
  );
}
