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
import { Role, useBulkDeleteRole, useRoles } from "@/lib/api/roles";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView } from "react-native";

export default function RoleList() {
  const { showPopUpConfirm, hidePopUpConfirm } = usePopUpConfirm();
  const router = useRouter();
  const { data, isLoading, refetch } = useRoles();
  const [selectedItems, setSelectedItems] = useState<Role[] | null>(null);

  const roles = data || [];

  const deleteMutation = useBulkDeleteRole();
  const toast = useToast();

  const handleRolePress = (role: Role) => {
    if (selectedItems?.some((r) => r.id === role.id)) {
      setSelectedItems(selectedItems.filter((r) => r.id !== role.id));
      return;
    }
    if (!selectedItems) {
      setSelectedItems([role]);
      return;
    }

    setSelectedItems([...selectedItems, role]);
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
    router.push("/(main)/management/role-user/role/add");
  };

  const handleDeletePress = () => {
    const roleIds = selectedItems?.map((m) => m.id) || [];

    showPopUpConfirm({
      title: "HAPUS ROLE",
      icon: "warning",
      description: (
        <Text className="text-slate-500">
          {`Apakah Anda yakin ingin menghapus `}
          <Text className="font-bold text-slate-900">{roleIds?.length}</Text>
          {` role? Tindakan ini tidak dapat dibatalkan.`}
        </Text>
      ),
      showClose: true,
      okText: "HAPUS",
      closeText: "BATAL",
      okVariant: "destructive",
      onOk: () => confirmDelete(roleIds),
      loading: deleteMutation.isPending,
    });
  };

  const confirmDelete = async (roleIds: string[]) => {
    if (!roleIds.length) return;

    deleteMutation.mutate(
      { ids: roleIds },
      {
        onSuccess: () => {
          setSelectedItems(null);
          hidePopUpConfirm();
          refetch();

          toast.show({
            placement: "top",
            render: ({ id }) => (
              <Toast nativeID={`toast-${id}`} action="success" variant="solid">
                <ToastTitle>Role berhasil dihapus</ToastTitle>
              </Toast>
            ),
          });
        },
        onError: (error) => {
          console.log("roleIds", roleIds);
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
        header="ROLE"
        isGoBack
        selectedItemsLength={selectedItems?.length}
        selectedItemsSuffixLabel="Role terpilih"
        onCancelSelectedItems={() => setSelectedItems(null)}
        action={
          <HStack space="sm" className="w-[72px]">
            {!!selectedItems?.length ? (
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
              {roles.map((role) => (
                <Pressable
                  key={role.id}
                  className={`p-4 rounded-sm border-b border-gray-300 active:bg-gray-100 ${
                    selectedItems?.some((r) => r.id === role.id)
                      ? "bg-gray-100"
                      : ""
                  }`}
                  onPress={() => {
                    if (!!selectedItems?.length) {
                      handleRolePress(role);
                    } else {
                      router.navigate(
                        `/(main)/management/role-user/role/detail/${role.id}`
                      );
                      setSelectedItems(null);
                    }
                  }}
                  onLongPress={() => handleRolePress(role)}
                >
                  <HStack className="justify-between items-center">
                    <VStack className="flex-1">
                      <Heading size="sm">{role.name}</Heading>
                      {role.description && (
                        <Text size="xs" className="text-slate-400 mt-0.5">
                          {role.description}
                        </Text>
                      )}
                    </VStack>
                    <VStack className="items-end">
                      <Text size="xs" className="text-brand-primary text-sm font-bold">
                        User Aktif
                      </Text>
                      <Text size="xs">-</Text>
                    </VStack>
                  </HStack>
                </Pressable>
              ))}
              {roles?.length === 0 && (
                <Box className="p-8 items-center">
                  <Text className="text-slate-400 italic">No roles found</Text>
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
              <ButtonText className="text-white">TAMBAH ROLE</ButtonText>
            </Button>
          </HStack>
        </VStack>
      </Box>
    </Box>
  );
}
