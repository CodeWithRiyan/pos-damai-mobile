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
import { useBulkDeleteUser, User, useUsers } from "@/lib/api/users";
import dayjs from "dayjs";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView } from "react-native";

export default function UserList() {
  const { showPopUpConfirm, hidePopUpConfirm } = usePopUpConfirm();
  const router = useRouter();
  const { data, isLoading, refetch } = useUsers();
  const [selectedUsers, setSelectedUsers] = useState<User[] | null>(null);

  const users = data || [];

  const deleteMutation = useBulkDeleteUser();
  const toast = useToast();

  const handleUserPress = (user: User) => {
    if (selectedUsers?.some((r) => r.id === user.id)) {
      setSelectedUsers(selectedUsers.filter((r) => r.id !== user.id));
      return;
    }
    if (!selectedUsers) {
      setSelectedUsers([user]);
      return;
    }

    setSelectedUsers([...selectedUsers, user]);
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

  const handleAddUser = () => {
    setSelectedUsers(null);
    router.push("/(main)/management/role-user/user/add");
  };

  const handleDeletePress = () => {
    const userIds = selectedUsers?.map((m) => m.id) || [];

    showPopUpConfirm({
      title: "HAPUS KARYAWAN",
      icon: "warning",
      description: (
        <Text className="text-slate-500">
          {`Apakah Anda yakin ingin menghapus `}
          <Text className="font-bold text-slate-900">{userIds?.length}</Text>
          {` karyawan? Tindakan ini tidak dapat dibatalkan.`}
        </Text>
      ),
      showClose: true,
      okText: "HAPUS",
      closeText: "BATAL",
      okVariant: "destructive",
      onOk: () => confirmDelete(userIds),
      loading: deleteMutation.isPending,
    });
  };

  const confirmDelete = async (userIds: string[]) => {
    if (!userIds.length) return;

    deleteMutation.mutate(
      { ids: userIds },
      {
        onSuccess: () => {
          setSelectedUsers(null);
          hidePopUpConfirm();
          refetch();

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
        },
      }
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
        header="KARYAWAN"
        isGoBack
        action={
          <HStack space="sm" className="w-[72px]">
            {!!selectedUsers?.length ? (
              deleteMutation.isPending ? (
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
              {users?.map((user) => (
                <Pressable
                  key={user.id}
                  className={`p-4 rounded-sm border-b border-gray-300 active:bg-gray-100 ${
                    selectedUsers?.some((r) => r.id === user.id)
                      ? "bg-gray-100"
                      : ""
                  }`}
                  onPress={() => {
                    if (!!selectedUsers?.length) {
                      handleUserPress(user);
                    } else {
                      router.navigate(
                        `/(main)/management/role-user/user/detail/${user.id}`
                      );
                      setSelectedUsers(null);
                    }
                  }}
                  onLongPress={() => handleUserPress(user)}
                >
                  <HStack className="justify-between items-center">
                    <HStack space="md" className="items-center">
                      <Box className="w-10 h-10 rounded-md bg-brand-secondary/20 items-center justify-center">
                        <Text className="text-brand-primary font-bold">
                          {(user.firstName || user.username)
                            .substring(0, 1)
                            .toUpperCase()}
                        </Text>
                      </Box>
                      <VStack>
                        <Heading size="sm">
                          {user.firstName || user.username}
                        </Heading>
                        <Text size="xs" className="text-slate-500">
                          {user.roles?.[0]?.role?.name || "No role"}
                        </Text>
                      </VStack>
                    </HStack>
                    <VStack className="items-end">
                      <Text className="text-brand-primary text-sm font-bold">
                        Aktifitas Terakhir
                      </Text>
                      <Text>
                        {user.lastLoginAt
                          ? dayjs(user.lastLoginAt).format(
                              "DD MMMM YYYY, HH:mm"
                            )
                          : "-"}
                      </Text>
                    </VStack>
                  </HStack>
                </Pressable>
              ))}
              {users?.length === 0 && (
                <Box className="p-8 items-center">
                  <Text className="text-slate-400 italic">No users found</Text>
                </Box>
              )}
            </VStack>
          </ScrollView>
          <HStack className="w-full p-4">
            <Button
              size="sm"
              className="w-full rounded-sm bg-brand-primary active:bg-brand-primary/90"
              onPress={handleAddUser}
            >
              <ButtonText className="text-white">TAMBAH KARYAWAN</ButtonText>
            </Button>
          </HStack>
        </VStack>
      </Box>
    </Box>
  );
}
