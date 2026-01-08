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
import { useDeleteUser, useUser, useUsers } from "@/lib/api/users";
import dayjs from "dayjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView } from "react-native";

export default function UserDetail() {
  const { showPopUpConfirm, hidePopUpConfirm } = usePopUpConfirm();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const userId = id as string;

  const { sm } = useBreakpoint();
  const [showActionsheet, setShowActionsheet] = useState<boolean>(false);

  const { refetch: refetchUsers } = useUsers();
  const { data: user, refetch: refetchUser } = useUser(userId || "");
  const deleteMutation = useDeleteUser();
  const toast = useToast();

  const onRefetch = () => {
    refetchUsers();
    refetchUser();
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
      title: "HAPUS KARYAWAN",
      icon: "warning",
      description: (
        <Text className="text-slate-500">
          {`Apakah Anda yakin ingin menghapus karyawan `}
          <Text className="font-bold text-slate-900">{user?.username}</Text>
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
    if (!user) return;

    deleteMutation.mutate(user.id, {
      onSuccess: () => {
        hidePopUpConfirm();
        onRefetch();
        setShowActionsheet(false);
        router.back();

        toast.show({
          placement: "top",
          render: ({ id }) => (
            <Toast nativeID={`toast-${id}`} action="success" variant="solid">
              <ToastTitle>Karyawan berhasil dihapus</ToastTitle>
            </Toast>
          ),
        });
      },
      onError: (error) => {
        showErrorToast(error);
        hidePopUpConfirm();
        setShowActionsheet(false);
      },
    });
  };

  return (
    <VStack className="flex-1 bg-white">
      <Header
        header="DETAIL KARYAWAN"
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
        <Box className="p-4 border-b border-background-300 flex-row flex-wrap gap-y-4">
          <VStack className={`${sm ? "w-1/2" : "w-full"}`}>
            <Text className="text-gray-500 font-bold">Nama</Text>
            <Text>
              {user?.firstName || "-"}
            </Text>
          </VStack>
          <VStack className={`${sm ? "w-1/2" : "w-full"}`}>
            <Text className="text-gray-500 font-bold">Role</Text>
            <Text>{user?.roles?.[0]?.role?.name || "-"}</Text>
          </VStack>
          <VStack className={`${sm ? "w-1/2" : "w-full"}`}>
            <Text className="text-gray-500 font-bold">Username</Text>
            <Text>{user?.username}</Text>
          </VStack>
          <VStack className={`${sm ? "w-1/2" : "w-full"}`}>
            <Text className="text-gray-500 font-bold">
              Tanggal Terakhir Login
            </Text>
            <Text>
              {user?.lastLoginAt
                ? dayjs(user?.lastLoginAt).format("DD MMMM YYYY")
                : "-"}
            </Text>
          </VStack>
        </Box>
      </ScrollView>

      <Actionsheet isOpen={showActionsheet} onClose={() => setShowActionsheet(false)}>
        <ActionsheetBackdrop />
        <ActionsheetContent className="px-0">
          <ActionsheetDragIndicatorWrapper className="pb-4 pt-2">
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>

          <ActionsheetItem
            onPress={() => {
              router.navigate(
                `/(main)/management/role-user/user/edit/${user?.id}`
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
